// Utility for storing and retrieving org context from localStorage.
// This data is collected during the briefing flow and injected into
// all archetype system prompts at call time.

const STORAGE_KEY = "edify_org_context";

export interface OrgContext {
  orgName: string;
  missionStatement: string;
  website?: string;
  annualBudget?: string;
  fullTimeStaff?: string;
  regularVolunteers?: string;
  orgType?: string;
  primaryServiceArea?: string;
  foundedYear?: string;
  programs?: Array<{
    name: string;
    description?: string;
    targetPopulation?: string;
  }>;
  goals?: string[];
  additionalContext?: string;
}

export function getOrgContext(): OrgContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OrgContext;
  } catch {
    return null;
  }
}

export function setOrgContext(context: OrgContext): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    // ignore quota errors
  }
}

export function clearOrgContext(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasOrgContext(): boolean {
  return Boolean(getOrgContext()?.orgName);
}

/**
 * Formats the org context into a string suitable for injection
 * into archetype system prompts.
 */
export function formatOrgContextForPrompt(ctx: OrgContext): string {
  const lines: string[] = [];

  lines.push(`Organization Name: ${ctx.orgName}`);

  if (ctx.missionStatement) {
    lines.push(`Mission: ${ctx.missionStatement}`);
  }

  if (ctx.orgType) {
    lines.push(`Type: ${ctx.orgType}`);
  }

  if (ctx.primaryServiceArea) {
    lines.push(`Service Area: ${ctx.primaryServiceArea}`);
  }

  if (ctx.annualBudget) {
    lines.push(`Annual Budget: ${ctx.annualBudget}`);
  }

  if (ctx.fullTimeStaff) {
    lines.push(`Full-Time Staff: ${ctx.fullTimeStaff}`);
  }

  if (ctx.regularVolunteers) {
    lines.push(`Regular Volunteers: ${ctx.regularVolunteers}`);
  }

  if (ctx.foundedYear) {
    lines.push(`Founded: ${ctx.foundedYear}`);
  }

  if (ctx.website) {
    lines.push(`Website: ${ctx.website}`);
  }

  if (ctx.programs && ctx.programs.length > 0) {
    lines.push("\nPrograms:");
    for (const program of ctx.programs) {
      if (program.name) {
        lines.push(`- ${program.name}${program.description ? `: ${program.description}` : ""}${program.targetPopulation ? ` (serves: ${program.targetPopulation})` : ""}`);
      }
    }
  }

  if (ctx.goals && ctx.goals.length > 0) {
    lines.push("\nCurrent Goals:");
    for (const goal of ctx.goals) {
      lines.push(`- ${goal}`);
    }
  }

  if (ctx.additionalContext) {
    lines.push(`\nAdditional Context: ${ctx.additionalContext}`);
  }

  return lines.join("\n");
}
