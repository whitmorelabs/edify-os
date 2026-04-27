/**
 * TEMPORARY DIAGNOSTIC ENDPOINT — added in PR (lopmon/skill-cap-diagnostic-2026-04-27)
 *
 * GET /api/admin/skill-cap-test
 *
 * Empirically determines the Anthropic Skills API cap for custom-uploaded plugin
 * skills by sending progressively larger lists of skill_ids in container.skills
 * and recording which sizes succeed vs. fail.
 *
 * Background:
 *   Z+Milo settled on a hard 8-skill cap during pre-built-skill debugging
 *   (commits ec73062, d1a1b25, 3e011de, 86d4bec). Pre-built skills (docx/xlsx/pptx/pdf)
 *   expand to ~5 internal sub-components each, which is why they hit the limit fast.
 *   Custom-uploaded plugin skills are 1:1 — no expansion — so the real cap for
 *   plugin-only requests may be higher than 8.
 *
 *   If max_supported >= 11, Marketing Director's 11 skills all fit and no
 *   dynamic-selection sprint is needed. If it's truly 8, we invest in
 *   priority-based dynamic selection.
 *
 * What it does:
 *   For each test size in [1, 4, 8, 12, 16, 20, 24, 32], sends a minimal
 *   client.beta.messages.create() call with the first N skill_ids from
 *   uploaded-ids.json. Records success/failure, duration, and error message.
 *   Stops testing after the first failure (all larger sizes would also fail).
 *
 * REMOVAL: Delete this file once we know the cap and decide whether to invest
 *   in dynamic skill selection. It is a one-off diagnostic tool, not a feature.
 *
 * Auth: session-cookie protected via getAuthContext(). Any authenticated member
 *   in a valid org can hit it — the org's own Anthropic key is used.
 */

import { NextResponse } from "next/server";
import { getAuthContext, createServiceRoleClient } from "@/lib/supabase/server";
import { getAnthropicClientForOrg } from "@/lib/anthropic";
import {
  SKILLS_BETA_HEADERS,
  CODE_EXECUTION_TOOL,
} from "@/lib/skills/registry";
// Loaded as a plain JSON import; cast to a string-keyed map of { skill_id }.
// Path: src/app/api/admin/skill-cap-test/ → up 5 dirs → apps/web/ → plugins/
import uploadedIdsRaw from "../../../../../plugins/uploaded-ids.json";

const uploadedIds = uploadedIdsRaw as Record<
  string,
  { skill_id: string; hash: string; uploaded_at: string } | undefined
>;

/** Sizes to probe in order. Stop on first failure. */
const TEST_SIZES = [1, 4, 8, 12, 16, 20, 24, 32] as const;

/** Per-attempt timeout in ms. If the API call hangs, we abort and treat it as an error. */
const ATTEMPT_TIMEOUT_MS = 30_000;

interface AttemptResult {
  size: number;
  ok: boolean;
  error: string | null;
  durationMs: number;
}

export async function GET() {
  // --- Auth gate ---
  const { user, orgId } = await getAuthContext();
  if (!user || !orgId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceRoleClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "database not configured" }, { status: 503 });
  }

  // --- Resolve the org's Anthropic client ---
  const clientResult = await getAnthropicClientForOrg(serviceClient, orgId);
  if ("error" in clientResult) return clientResult.error;
  const { client: anthropic } = clientResult;

  // --- Collect all uploaded plugin skill_ids ---
  const allSkillIds: string[] = Object.values(uploadedIds)
    .filter((entry): entry is { skill_id: string; hash: string; uploaded_at: string } => !!entry)
    .map((entry) => entry.skill_id);

  const totalSkillsInRepo = allSkillIds.length;

  // --- Run progressive tests ---
  const results: AttemptResult[] = [];
  let maxSupported = 0;
  let firstFailingSize: number | null = null;

  for (const size of TEST_SIZES) {
    // Take first N skill_ids (or fewer if repo has less than N)
    const skillIds = allSkillIds.slice(0, size);

    // If we don't have enough skills in the repo to fill this test size, skip
    // (we still report it so the caller knows we can't test that size)
    if (skillIds.length < size) {
      results.push({
        size,
        ok: false,
        error: `Only ${totalSkillsInRepo} skills in repo — cannot test size ${size}`,
        durationMs: 0,
      });
      // Not a real API failure — don't treat as firstFailingSize
      continue;
    }

    const container = {
      skills: skillIds.map((id) => ({ type: "custom" as const, skill_id: id })),
    };

    const start = Date.now();
    let ok = false;
    let errorMsg: string | null = null;

    try {
      // Wrap in a race against a per-attempt timeout so a hanging call doesn't
      // block the entire diagnostic for minutes.
      await Promise.race([
        anthropic.beta.messages.create({
          betas: [...SKILLS_BETA_HEADERS],
          model: "claude-haiku-4-5-20251001", // cheapest model — we don't need quality
          max_tokens: 16,
          messages: [{ role: "user", content: "Reply with the single word 'ok'." }],
          tools: [CODE_EXECUTION_TOOL] as unknown as Parameters<typeof anthropic.beta.messages.create>[0]["tools"],
          container,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timed out after ${ATTEMPT_TIMEOUT_MS}ms`)), ATTEMPT_TIMEOUT_MS)
        ),
      ]);
      ok = true;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : String(err);
    }

    const durationMs = Date.now() - start;
    results.push({ size, ok, error: errorMsg, durationMs });

    if (ok) {
      maxSupported = size;
    } else {
      // First real API failure — record it and stop probing larger sizes.
      if (firstFailingSize === null) {
        firstFailingSize = size;
      }
      break;
    }
  }

  // --- Build interpretation ---
  let interpretation: string;
  if (firstFailingSize === null) {
    // Every tested size succeeded (unlikely but possible if API is unlimited in this range)
    interpretation = `All tested sizes up to ${maxSupported} succeeded. The API cap is at least ${maxSupported} for custom-uploaded plugin skills.`;
  } else if (maxSupported === 0) {
    interpretation = `Even size 1 failed. Check that the skill_ids in uploaded-ids.json are still valid and the org's Anthropic key has Skills API access.`;
  } else if (maxSupported >= 11) {
    interpretation = `Custom plugin skills support at least ${maxSupported} items in container.skills. Marketing Director's 11 skills fit — no dynamic-selection sprint required. Consider raising the cap in run-archetype-turn.ts from 8 to ${maxSupported}.`;
  } else if (maxSupported === 8) {
    interpretation = `Custom plugin skills hit the same 8-item cap as pre-built skills. The cap appears to be API-level, not expansion-related. Proceed with the priority-based dynamic selection sprint for archetypes with more than 8 skills.`;
  } else {
    interpretation = `Custom plugin skills support up to ${maxSupported} items (fails at ${firstFailingSize}). Update the cap in run-archetype-turn.ts accordingly and decide whether dynamic selection is still needed for archetypes with more than ${maxSupported} skills.`;
  }

  return NextResponse.json({
    results,
    max_supported: maxSupported,
    first_failing_size: firstFailingSize,
    total_skills_in_repo: totalSkillsInRepo,
    interpretation,
  });
}
