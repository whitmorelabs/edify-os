# SESSION LOG -- Edify OS

---

## 2026-04-10 — User Guide Content (Markdown Files)

**Task:** Create all user guide content files for the Edify OS help center.

### Files Created

**`content/guide/getting-started.md`**
Platform overview for new users. Covers the "you just hired a team" framing, a one-line summary of each of the 7 specialists, a 3-step getting started flow, and a first-week expectations section.

**`content/guide/meet-your-team/development-director.md`**
Development Director profile. Covers fundraising, grants, donor stewardship, and CRM. Includes 10 copy-paste prompts and tips for working with them.

**`content/guide/meet-your-team/marketing-director.md`**
Marketing & Comms Director profile. Covers social media, email campaigns, content writing, brand voice, and analytics. Includes 10 prompts.

**`content/guide/meet-your-team/executive-assistant.md`**
Executive Assistant profile. Covers email triage, scheduling, meeting prep, task tracking. Includes 10 prompts.

**`content/guide/meet-your-team/programs-director.md`**
Programs Director profile. Covers logic models, outcome tracking, grant reporting, needs assessments, funder compliance. Includes 10 prompts.

**`content/guide/meet-your-team/finance-director.md`**
Finance Director profile. Covers budgets, cash flow, grant financial reports, audit prep. Includes "always verify with a CPA" guardrails and 10 prompts.

**`content/guide/meet-your-team/hr-volunteer-coordinator.md`**
HR & Volunteer Coordinator profile. Covers hiring, onboarding, policies, volunteer programs, training. Includes legal review guardrails and 10 prompts.

**`content/guide/meet-your-team/events-director.md`**
Events Director profile. Covers event planning, run-of-show, sponsorships, post-event ROI. Includes 10 prompts.

**`content/guide/working-with-your-team.md`**
How to get the best results. Covers clear instructions, reviewing outputs, requesting revisions, common mistakes, and how org memory works. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/organization-setup.md`**
Org configuration guide. Covers profile setup, memory, account connections (email/calendar/social via OAuth explained simply), and team member activation. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/faq.md`**
12 FAQs covering privacy, accuracy, financial limitations, legal/medical advice guardrails, pricing, and support. (Note: this file was pre-populated by the project linter; content was retained as-is.)

**`content/guide/troubleshooting.md`**
6 common issues with step-by-step fixes: unresponsive team member, mismatched output, OAuth connection failures, wrong financial numbers, resetting a conversation, and plan changes.

**`content/guide/live-chat-support.md`**
How to use the support chat. Covers chat button location, what the support assistant handles, human escalation triggers, chat history, and alternate contact options.

**`content/onboarding/first-interaction-prompts.json`**
JSON file with 5 first-interaction prompts per archetype (35 total, 7 keys). Validated via Node.js -- JSON parses cleanly.

### Language rules applied
- Never said "agent," "LLM," "model," "token," or "API" in user-facing content
- All team members framed as specialists on a hired team
- Reading level targeted at grade 8 -- short paragraphs, bullet lists, plain language
- Every article includes a "Try this now" callout
- Friendly, coworker tone throughout -- not a manual

### Status
Complete. 14 files created (or confirmed pre-created by linter). All content follows PRD language rules and style guidance.

---

## 2026-04-10 — Decision Lab /simplify Pass

**Task:** Review all Decision Lab code (backend + frontend) for duplication, bugs, inconsistencies, and clean it up.

### Issues Found and Fixed

**Critical bug — archetype slug mismatches (would break filtering end-to-end):**
- `TeamSelector.tsx` had slug `executive_director` — backend uses `executive_assistant`. Fixed.
- `TeamSelector.tsx` had slug `hr_coordinator` — backend uses `hr_volunteer_coordinator`. Fixed.
- `route.ts` mock data used the same wrong slugs. Fixed to match backend canonical list.

**Data contract mismatch — follow-up API body:**
- `api.ts` was sending `{ archetype, question }` but the backend `FollowUpRequest` model expects `archetype_slug`. Fixed to send `{ archetype_slug, question }`.

**Duplication — `_extract_text` static method:**
- Identical implementation existed in both `orchestrator.py` and `synthesis.py`. Extracted to a module-level `extract_text()` function in `prompts.py` (neutral file both already imported). Both files updated to call the shared version.

**Abstraction leak — private attribute access in router:**
- `router.py` called `orchestrator._client.close()` directly. Added a public `close()` method to `DecisionLabOrchestrator` that delegates to the client. Router updated to call `orchestrator.close()`.

**Dead abstraction — trivial wrapper functions in `history.py`:**
- `_result_to_dict()` and `_dict_to_result()` were one-liner wrappers around `.model_dump()` and `.model_validate()`. Removed both functions and inlined the calls at their four use sites.

**Unused prop — `role_slug` on `ArchetypeCard`:**
- Declared in the props interface and passed from `page.tsx` but never used inside the component. Removed from interface and removed from the call site in `page.tsx`.

**Unused props — `roleSlug` and `scenarioId` on `FollowUp`:**
- Both declared in the `FollowUpProps` interface but never used inside the component. Removed from interface. Removed from the `<FollowUp>` usage in `page.tsx`.

**Dead import — `Any` in `synthesis.py`:**
- After removing the `_extract_text` static method (its only user of `Any`), the `from typing import Any` import was dead. Removed.

### No Changes Made To
- `sidebar.tsx` — Decision Lab entry is correct, no issues.
- `ScenarioInput.tsx`, `SynthesisPanel.tsx`, `ScenarioHistory.tsx` — clean, no issues.
- `models.py`, `prompts.py` (except adding `extract_text`), `router.py` error handling — all correct.
- Backend/frontend type shapes for `ScenarioResult` and `Synthesis` — consistent across layers.

### Status
Complete. 9 fixes across 9 files. No features added.

---

## 2026-04-10 — Subagent Infrastructure Layer

**Task:** Build the foundation for primary agents to delegate tasks to specialized subagents.

### What was built

**1. `services/agents/src/agents/sub/__init__.py`**
Empty package init.

**2. `services/agents/src/agents/sub/base_subagent.py`**
- `SubagentResult` dataclass with `text`, `structured_data`, and `artifact_type` fields.
- `BaseSubagent` ABC (independent of `BaseAgent`) with class attributes `slug`, `display_name`, `parent_role`, `max_tokens`.
- Abstract `execute(instruction, context) -> SubagentResult` method.
- Helper methods shared by all subagents: `_load_system_prompt()`, `_build_system_prompt()` (injects org context + memory retrieval), `_extract_text()`.
- Path resolution: `_PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts" / "sub"` (resolves to `src/prompts/sub/`).

**3. `services/agents/src/agents/sub/dispatcher.py`**
- `SubagentDispatcher` class.
- Constructor takes `registry: dict[str, type[BaseSubagent]]`, `client`, `memory`.
- `dispatch(slug, instruction, context) -> SubagentResult` — instantiates the subagent class, passes `instruction_hint` into context for targeted memory retrieval, calls `execute`, logs slug + parent_role + approximate output tokens.
- `registered_slugs()` utility method.

**4. `services/agents/src/agents/sub/grant_research.py`**
Concrete subagent for grant research. Calls Claude at temperature 0.2, returns `artifact_type="ranked_grant_list"`.

**5. `services/agents/src/agents/sub/grant_writing.py`**
Concrete subagent for grant writing/drafting. Calls Claude at temperature 0.4 (slightly more generative), returns `artifact_type="grant_draft"`.

**6. `services/agents/src/prompts/sub/grant_research.md`**
Prompt instructs the subagent to return a ranked list with funder name, funding range, eligibility notes, deadline, and priority rating.

**7. `services/agents/src/prompts/sub/grant_writing.md`**
Prompt instructs the subagent to draft clean grant copy grounded in org memory numbers, flag missing info with `[INSERT: ...]` markers, and follow funder guidelines.

**8. `services/agents/src/agents/primary/development_director.py` (updated)**
- Added import of `SubagentDispatcher`, `GrantResearchSubagent`, `GrantWritingSubagent`.
- `_SUBAGENT_REGISTRY` dict maps slugs to classes.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate(user_input) -> str | None`: keyword-based detection. Returns `"grant_writing"` if input contains "grant" + a writing verb (write/draft/compose/prepare). Returns `"grant_research"` if input contains "grant" + a research verb (research/find/identify/search/list/look for). Returns `None` otherwise.
- `execute()` checks `_should_delegate()` first; if matched, calls `_delegate_and_present()`.
- `_delegate_and_present()` dispatches to the subagent and wraps the result with a Director-voice preamble via `_frame_subagent_result()`. On subagent failure, falls back to inline handling via `_inline_fallback()`.
- All existing inline handling preserved exactly as before.

### Design decisions

- `BaseSubagent` is intentionally NOT a subclass of `BaseAgent`. The contracts differ: primary agents take raw user input and return a generic dict; subagents take a focused instruction and return a typed dataclass. Mixing them would require awkward shims.
- The dispatcher owns class instantiation (not instance registration) to keep subagents stateless and avoid shared mutable state.
- Delegation detection is keyword-based to keep it simple and deterministic at this stage. Replacing it with an LLM classifier is a natural next step once the pattern is proven.
- On subagent dispatch failure, the Director falls back to inline handling silently so the user always gets a response.

### Status
Complete. All files created, path resolution verified against the actual filesystem.

---

## 2026-04-10 — Subagents for Development Director, Marketing Director, Executive Assistant

**Task:** Build 12 concrete subagent classes + prompt files for the 3 existing archetypes.

### What was built

**Development Director subagents (3 new):**

- `donor_outreach.py` + `donor_outreach.md` — Drafts personalized donor emails, thank-you letters, and impact reports. Artifact: `donor_email`. Temp: 0.4.
- `crm_update.py` + `crm_update.md` — Generates CRM update summaries, flags stale records, suggests next actions. Artifact: `crm_summary`. Temp: 0.2.
- `reporting.py` + `reporting.md` — Produces fundraising reports, dashboards, and board summaries. Artifact: `fundraising_report`. Temp: 0.25.

**Marketing & Comms Director subagents (5 new):**

- `social_media.py` + `social_media.md` — Drafts platform-specific posts (LinkedIn, Instagram, Facebook, X) with per-platform constraints. Artifact: `social_post`. Temp: 0.5.
- `email_campaign.py` + `email_campaign.md` — Designs email sequences, newsletters, drip campaigns with CTA structure. Artifact: `email_sequence`. Temp: 0.4.
- `content_writing.py` + `content_writing.md` — Produces blog posts, press releases, case studies. Artifact: `content_draft`. Temp: 0.45.
- `comms_strategy.py` + `comms_strategy.md` — Builds communication plans, messaging matrices, content calendars. Artifact: `comms_plan`. Temp: 0.3.
- `analytics.py` + `analytics.md` — Analyzes campaign performance, produces optimization recommendations. Artifact: `campaign_analysis`. Temp: 0.2.

**Executive Assistant subagents (4 new):**

- `email_triage.py` + `email_triage.md` — Categorizes/prioritizes incoming comms, drafts responses for urgent items. Artifact: `email_triage_result`. Temp: 0.25.
- `calendar_agent.py` + `calendar_agent.md` — Meeting scheduling, conflict detection, prep reminders. Artifact: `calendar_suggestion`. Temp: 0.2.
- `meeting_prep.py` + `meeting_prep.md` — Creates agendas + briefing notes from org memory. Artifact: `meeting_agenda`. Temp: 0.3.
- `task_management.py` + `task_management.md` — Extracts and organizes action items from any input type. Artifact: `task_list`. Temp: 0.2.

**`__init__.py` updated:**
All 31 subagent classes now exported (12 new + 19 previously existing from other archetypes).

### Design decisions

- Temperatures set by task type: analytical/extraction tasks (CRM, analytics, calendar, task management) use 0.2; structured writing (reporting, email triage, comms strategy) uses 0.25-0.3; creative/personalized writing (donor outreach, campaigns, content) uses 0.4-0.5; social media (highest creative latitude) uses 0.5.
- All prompt files use `[INSERT: ...]` and `[CLARIFY: ...]` bracket conventions matching grant_writing.md for consistency.
- Prompt constraints enforce a "no fabrication" rule across all 12 subagents -- each explicitly tells the agent to flag gaps rather than invent data.
- `__init__.py` updated to include all pre-existing subagents (programs, finance, HR, events archetypes) that were already present in the repo, not just the 12 new ones.

### Status
Complete. All 12 Python files and 12 prompt files created. `__init__.py` exports all 31 subagent classes.

---

## Session: 2026-04-10 — Build 4 New Primary Archetypes

### Task
Create 4 new primary agent classes and their prompt files, following the `development_director.py` pattern.

### Files Created

**1. `services/agents/src/agents/primary/programs_director.py`**
- Class: `ProgramsDirector`, `role_slug = "programs_director"`, `temperature = 0.35`
- Delegation: `logic model`/`theory of change` -> `program_design`; `outcome`/`metric`/`data` -> `outcome_tracking`; `grant report`/`funder report` -> `grant_reporting`; `needs assessment`/`gap analysis` -> `needs_assessment`; `deliverable`/`compliance`/`deadline` -> `compliance_monitor`
- Voice: grounded, empathetic, evidence-based; frames output around participant journeys

**2. `services/agents/src/agents/primary/finance_director.py`**
- Class: `FinanceDirector`, `role_slug = "finance_director"`, `temperature = 0.25`
- Delegation: `budget` -> `budget_builder`; `cash flow`/`runway` -> `cash_flow_forecast`; `grant financial`/`spending report` -> `grant_financial_report`; `audit`/`internal controls` -> `audit_prep`
- Voice: precise, measured, compliance-first; surfaces risk with clear severity labels

**3. `services/agents/src/agents/primary/hr_volunteer_coordinator.py`**
- Class: `HRVolunteerCoordinator`, `role_slug = "hr_volunteer_coordinator"`, `temperature = 0.4`
- Delegation: `volunteer` -> `volunteer_management`; `policy`/`handbook`/`workplace` -> `hr_policy`; `hire`/`job description`/`interview` -> `hiring_support`; `training`/`onboarding`/`orientation` -> `training_design`
- Voice: warm, people-centered, naturally inclusive; makes compliance approachable

**4. `services/agents/src/agents/primary/events_director.py`**
- Class: `EventsDirector`, `role_slug = "events_director"`, `temperature = 0.4`
- Delegation: `run of show`/`day-of` -> `run_of_show` (checked first to avoid collision with generic "plan"); `sponsor`/`sponsorship` -> `sponsorship_manager`; `debrief`/`roi`/`post-event` -> `post_event_eval`; `event plan`/`timeline`/`schedule` + planning intent -> `event_planner`
- Voice: high-energy, deadline-obsessed; always works backwards from the event date

### Prompt Files Created

- `services/agents/src/prompts/primary/programs_director.md`
- `services/agents/src/prompts/primary/finance_director.md`
- `services/agents/src/prompts/primary/hr_volunteer_coordinator.md`
- `services/agents/src/prompts/primary/events_director.md`

Each prompt includes: YAML frontmatter (role, model, temperature, subagents), personality block, expertise list, instructions with output format, and a few-shot example interaction that locks in the agent's voice.

### Files Updated

**`services/agents/src/agents/primary/__init__.py`**
- Was empty; now exports all 7 primary agent classes: `DevelopmentDirector`, `EventsDirector`, `ExecutiveAssistant`, `FinanceDirector`, `HRVolunteerCoordinator`, `MarketingDirector`, `ProgramsDirector`

### Design Decisions

- Each new agent has an empty `_SUBAGENT_REGISTRY` dict typed `dict[str, Any]`. Subagent classes for these roles don't exist yet; the dispatcher will raise a `KeyError` on dispatch, triggering the inline fallback. This is intentional -- the primary agent structure is complete and production-safe without subagents wired in.
- `EventsDirector._should_delegate` checks `run_of_show` before the generic `event_planner` path to prevent "run of show" requests from matching the broader "plan" keyword and landing in the wrong subagent.
- Temperature follows the spec: Finance Director is lowest (0.25, precision-critical), Programs and the rest are 0.35 and 0.4 respectively.
- All files use `from __future__ import annotations` per the Python 3.11+ requirement.

### Status
Complete. 4 agent files, 4 prompt files, 1 `__init__.py` update. All follow the `development_director.py` pattern exactly.

---

## 2026-04-10 — Subagent Classes + Prompts for 4 New Archetypes (17 subagents)

**Task:** Build concrete subagent classes and prompt files for Programs Director, Finance Director, HR/Volunteer Coordinator, and Events Director.

### What was built

**Programs Director subagents (5, parent_role = `programs_director`):**

- `program_design.py` + `program_design.md` — Logic models, theories of change, program frameworks. Artifact: `logic_model`. Temp: 0.35.
- `outcome_tracking.py` + `outcome_tracking.md` — Data collection instruments, outcome data analysis. Artifact: `outcome_dashboard`. Temp: 0.2.
- `grant_reporting.py` + `grant_reporting.md` — Program narrative sections of grant reports, outcome data compilation. Artifact: `program_report`. Temp: 0.25.
- `needs_assessment.py` + `needs_assessment.md` — Community needs assessments, gap analyses. Artifact: `needs_analysis`. Temp: 0.3.
- `compliance_monitor.py` + `compliance_monitor.md` — Funder requirements, reporting deadlines, grant deliverables. Artifact: `compliance_checklist`. Temp: 0.2.

**Finance Director subagents (4, parent_role = `finance_director`):**

- `budget_builder.py` + `budget_builder.md` — Org/program budgets, variance analysis, budget-to-actual. Artifact: `budget_document`. Temp: 0.2.
- `cash_flow_forecast.py` + `cash_flow_forecast.md` — 30/60/90-day cash position projections, shortfall flagging. Artifact: `cash_flow_projection`. Temp: 0.2.
- `grant_financial_report.py` + `grant_financial_report.md` — Financial sections of grant reports, spending-by-grant tracking. Artifact: `financial_report`. Temp: 0.2.
- `audit_prep.py` + `audit_prep.md` — Audit checklists, internal controls review. Artifact: `audit_checklist`. Temp: 0.2.

**HR & Volunteer Coordinator subagents (4, parent_role = `hr_volunteer_coordinator`):**

- `volunteer_management.py` + `volunteer_management.md` — Volunteer role descriptions, onboarding plans, recognition programs. Artifact: `volunteer_document`. Temp: 0.4.
- `hr_policy.py` + `hr_policy.md` — Handbook sections, workplace policies, compliance docs. Artifact: `policy_draft`. Temp: 0.25.
- `hiring_support.py` + `hiring_support.md` — Job descriptions, interview process design, scoring rubrics. Artifact: `hiring_document`. Temp: 0.35.
- `training_design.py` + `training_design.md` — Orientation materials, training curricula. Artifact: `training_plan`. Temp: 0.35.

**Events Director subagents (4, parent_role = `events_director`):**

- `event_planner.py` + `event_planner.md` — Comprehensive event plans: timelines, budgets, vendor lists, staffing. Artifact: `event_plan`. Temp: 0.35.
- `run_of_show.py` + `run_of_show.md` — Minute-by-minute schedules, stage cues, day-of coordination docs. Artifact: `run_of_show_document`. Temp: 0.25.
- `sponsorship_manager.py` + `sponsorship_manager.md` — Tiered sponsorship packages, prospectus, outreach templates. Artifact: `sponsorship_package`. Temp: 0.35.
- `post_event_eval.py` + `post_event_eval.md` — Attendee surveys, ROI calculation, debrief reports. Artifact: `event_evaluation`. Temp: 0.25.

### Design decisions

- All Finance Director subagents use temperature 0.2 -- financial output demands precision; lower temp reduces number hallucination risk.
- Compliance-sensitive prompts (hr_policy, audit_prep, grant_financial_report) explicitly instruct the agent to flag items for attorney or auditor review rather than providing legal or accounting advice.
- `[INSERT: ...]` and `[LEGAL REVIEW NEEDED: ...]` bracket conventions carried through from existing subagent prompts for consistency.
- `__init__.py` not touched per task instructions.

### Status
Complete. 17 Python files and 17 prompt files created and verified on disk.

---

## 2026-04-10 — Wire Subagent Registries + Add Delegation to Remaining Primary Agents

**Task:** Part A: populate empty `_SUBAGENT_REGISTRY` dicts in the 4 new primary agents. Part B: add full delegation logic to `marketing_director.py` and `executive_assistant.py`.

### Part A — Subagent registries wired

**`programs_director.py`**
- Added imports: `ProgramDesignSubagent`, `OutcomeTrackingSubagent`, `GrantReportingSubagent`, `NeedsAssessmentSubagent`, `ComplianceMonitorSubagent`
- Registry populated with all 5 slugs.

**`finance_director.py`**
- Added imports: `BudgetBuilderSubagent`, `CashFlowForecastSubagent`, `GrantFinancialReportSubagent`, `AuditPrepSubagent`
- Registry populated with all 4 slugs.

**`hr_volunteer_coordinator.py`**
- Added imports: `VolunteerManagementSubagent`, `HrPolicySubagent`, `HiringSupportSubagent`, `TrainingDesignSubagent`
- Registry populated with all 4 slugs.

**`events_director.py`**
- Added imports: `EventPlannerSubagent`, `RunOfShowSubagent`, `SponsorshipManagerSubagent`, `PostEventEvalSubagent`
- Registry populated with all 4 slugs.

### Part B — Delegation logic added

**`marketing_director.py`** (full rewrite to add delegation layer)
- Added `logging` import, `SubagentDispatcher`, `SubagentResult`, and all 5 subagent imports.
- `_SUBAGENT_REGISTRY` added at module level with 5 slugs.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate`: `social_media`/`post`/`instagram`/`linkedin` -> `social_media`; `email`/`newsletter`/`drip` -> `email_campaign`; `blog`/`press release`/`case study` -> `content_writing`; `content calendar`/`messaging`/`communication plan` -> `comms_strategy`; `analytics`/`metrics`/`performance`/`campaign report` -> `analytics`.
- `execute()` checks delegation first; falls through to existing inline handling unchanged.
- `_delegate_and_present()`, `_frame_subagent_result()`, `_inline_fallback()` added following the `development_director.py` pattern exactly.

**`executive_assistant.py`** (full rewrite to add delegation layer)
- Added `logging` import, `SubagentDispatcher`, `SubagentResult`, and all 4 subagent imports.
- `_SUBAGENT_REGISTRY` added at module level with 4 slugs.
- `SubagentDispatcher` instantiated in `__init__`.
- `_should_delegate`: `email`/`inbox`/`triage` -> `email_triage`; `schedule`/`calendar`/`meeting time` -> `calendar_agent`; `agenda`/`briefing`/`prep` -> `meeting_prep`; `action items`/`tasks`/`track`/`remind` -> `task_management`.
- `execute()` checks delegation first; existing inline handling preserved including the "Retrieve relevant memories" comment.
- `_delegate_and_present()`, `_frame_subagent_result()`, `_inline_fallback()` added following the `development_director.py` pattern exactly.

### Status
Complete. All 6 files updated. All subagents now connected end-to-end from primary agent through dispatcher to concrete subagent class.

---

## 2026-04-10 — External Integration Tools (Step 4)

**Task:** Build the integration infrastructure that lets archetypes interact with external services via OAuth connections stored in the DB.

### Files Created

**`services/agents/src/integrations/__init__.py`**
Empty package init.

**`services/agents/src/integrations/oauth.py`**
- `OAuthTokenManager` class. Takes `db_pool: asyncpg.Pool` and `org_id`.
- `get_token(provider)` — queries `oauth_connections` table (columns: `org_id`, `provider`, `access_token`, `refresh_token`, `expires_at`) and returns the raw access token or `None` if not connected.
- `refresh_if_expired(provider)` — checks `expires_at` vs `now(UTC)`, falls through to existing token with a TODO comment for the actual refresh flow. Never logs token values.
- `SUPPORTED_PROVIDERS` frozenset guards both methods against unsupported strings.

**`services/agents/src/integrations/base_integration.py`**
- `BaseIntegration` ABC. Constructor takes `OAuthTokenManager`. Abstract `execute(action, params) -> dict[str, Any]`. `provider` class attribute to be overridden.

**`services/agents/src/integrations/calendar.py`**
- `CalendarIntegration(BaseIntegration)`. `provider = "google_calendar"`.
- Actions: `list_events` (GET `/calendars/{id}/events`), `create_event` (POST), `check_conflicts` (wraps list_events, returns conflict list + boolean flag).
- All calls use `Authorization: Bearer {token}` header via httpx. Returns structured dicts. try/except on HTTPStatusError and RequestError.

**`services/agents/src/integrations/email.py`**
- `EmailIntegration(BaseIntegration)`. `provider = "gmail"`.
- Actions: `list_messages` (GET `/messages` with Gmail query), `read_message` (GET `/messages/{id}`, returns headers + snippet), `send_draft` (creates MIME message, POSTs to `/drafts`, then `/drafts/send`).
- Uses stdlib `email.mime.text.MIMEText` + `base64.urlsafe_b64encode` for RFC-compliant message encoding.

**`services/agents/src/integrations/social.py`**
- `SocialMediaIntegration(BaseIntegration)`. Platform-aware: `facebook`, `instagram`, `linkedin`, `x`.
- Constructor takes `platform` arg; sets `self.provider = "social_{platform}"` dynamically.
- Actions: `post` (dispatches to `_build_post_payload` for platform-specific endpoint + body shape), `schedule_post` (returns informational placeholder with TODO for native scheduling), `get_analytics` (placeholder with TODO for per-platform insights endpoints).
- Platform-specific API roots and payload shapes documented with TODO comments.

**`services/agents/src/integrations/grants.py`**
- `GrantDatabaseIntegration(BaseIntegration)`. `provider = "grant_databases"`.
- Actions: `search` (GET `/grants/search` with keywords, amount_min/max, deadline_before, location params), `get_details` (GET `/grants/{id}`), `check_eligibility` (POST `/grants/{id}/eligibility` with org_profile body).
- Base URL is a placeholder with a TODO; structure is correct for any REST grant API.

### Files Updated

**`services/agents/src/claude/tools.py`**
Added 6 new Claude tool definitions matching Anthropic tool schema:
- `SEARCH_EXTERNAL_GRANTS` — keywords, amount_range, deadline_before, location
- `POST_TO_SOCIAL` — platform (enum), content, optional schedule_time
- `LIST_CALENDAR_EVENTS` — date_range object, calendar_id
- `CREATE_CALENDAR_EVENT` — title, start/end (Google Calendar format objects), attendees array, description
- `SEARCH_EMAILS` — query (Gmail syntax), max_results
- `DRAFT_EMAIL` — to, subject, body (sends immediately; description warns of this)

All 6 added to `ALL_TOOLS`. Total tools: 10 (4 existing + 6 new).

### Design decisions

- `SocialMediaIntegration` takes `platform` in its constructor (not `execute`) because the provider string embedded in OAuth tokens is platform-specific. A single class avoids 4 nearly-identical classes while still dispatching correctly.
- Tokens are never interpolated into error strings -- errors only report HTTP status codes, not token values.
- `httpx` was already in `pyproject.toml`; no dependency changes needed.
- `refresh_if_expired` contains the full plumbing for expiry detection but defers the actual token exchange to a TODO. The interface is correct so implementing the refresh later requires only filling in that one block.
- `check_conflicts` reuses `_list_events` rather than duplicating the API call logic.

### Status
Complete. 7 files created, 1 file updated. All 8 files parse cleanly (verified with `ast.parse`).

---

## 2026-04-10 — Refactor: Data-Driven Subagents + Infrastructure Fixes

**Task:** Fix 4 through Fix 7 from the review. Focused on model config, calendar conflict logic, and integrations __init__.

### Fix 4 — Subagents already data-driven

All 31 concrete subagent files were already in the correct simplified form (~15 lines each, no `execute()` override). No changes needed. The base class already had a concrete `execute()` implementation.

### Fix 5 — Add `model` class attribute to BaseSubagent

**`services/agents/src/agents/sub/base_subagent.py`** updated:
- Added `model: str = "claude-sonnet-4-20250514"` as a class attribute alongside the other overridable attributes.
- Changed the hardcoded string `"claude-sonnet-4-20250514"` in `execute()` to `self.model`.
- Subclasses can now override the model with a single line. Previously, changing the model required editing `base_subagent.py` internals.

### Fix 6 — Fix `_check_conflicts` in CalendarIntegration

**`services/agents/src/integrations/calendar.py`** updated:
- Old `_check_conflicts`: accepted arbitrary params, passed them straight to `_list_events`, then returned ALL events with non-null start/end as "conflicts". This meant any event in any window would be flagged as a conflict regardless of the proposed slot.
- New `_check_conflicts`: requires `start` and `end` params representing the proposed time slot. Fetches events in that window from Google (using timeMin/timeMax). Then applies the standard overlap condition: `event_start < proposed_end AND event_end > proposed_start`. Returns only events that truly overlap.
- Returns a helpful error dict if `start` or `end` params are missing.

### Fix 7 — Populate integrations/__init__.py

**`services/agents/src/integrations/__init__.py`** rewritten (was empty):
- Exports: `BaseIntegration`, `CalendarIntegration`, `EmailIntegration`, `GrantDatabaseIntegration`, `OAuthTokenManager`, `SocialMediaIntegration`.
- Full `__all__` list included.
- All 6 class names verified against actual class definitions in their respective files.

### Verification
- All 3 modified files parse cleanly via `ast.parse`.
- All 31 subagent files parse cleanly (no regressions).
- Integration class names confirmed to match `__init__.py` exports.

### Status
Complete. 3 files modified. No regressions.

---

## 2026-04-10 — /simplify Pass: Agents Service

**Task:** Review all recently built agent code for duplication, inconsistency, dead code, and over-engineering. Fix everything found.

### Issues found and fixed

**1. 31 subagents with identical `execute()` bodies (massive duplication)**
- Every subagent had the same 12-line `execute()` method varying only in `temperature` and `artifact_type`.
- Fix: Added `artifact_type` and `temperature` as class attributes to `BaseSubagent`. Implemented `execute()` once in `BaseSubagent`. All 31 subclasses now only declare class attributes -- no methods.
- Each subagent went from ~40 lines to ~14 lines. Total reduction: ~800 lines of boilerplate.

**2. Dead `max_tokens = 2048` in all 31 subclasses**
- Already the default in `BaseSubagent`. Removed from all subclasses.

**3. Dead import: `SubagentResult` in 6 of 7 primary agents**
- `events_director`, `executive_assistant`, `finance_director`, `hr_volunteer_coordinator`, `marketing_director`, `programs_director` all imported `SubagentResult` but never used it.
- Fix: Removed the import from all six files.

**4. Duplicate `tool_executor` closure in all 7 primary agents**
- Identical 12-line async closure defined inside `execute()` in every primary agent.
- Fix: Moved to `BaseAgent._tool_executor()` as an instance method. All primaries now pass `tool_executor=self._tool_executor`.

**5. Duplicate inline handling logic in all 7 primary agents**
- `execute()` body (prompt building + memory retrieval + client call) duplicated 7 times.
- `_inline_fallback()` method duplicated 7 times.
- Fix: `_build_system_prompt()`, `_extract_text()`, and `_inline_fallback()` moved to `BaseAgent`. Removed from all primary agents.

**6. Duplicate delegation pipeline in all 7 primary agents**
- `__init__()`, `execute()`, `_delegate_and_present()`, and `_frame_subagent_result()` were duplicated across all 7 files.
- Fix: Created `services/agents/src/agents/primary/base_primary.py` (`BasePrimaryAgent`) which centralises the full pipeline. Each primary agent now only declares `_SUBAGENT_REGISTRY`, `_PREAMBLES`, and `_should_delegate()`.
- All 7 primary agents now inherit from `BasePrimaryAgent` instead of `BaseAgent` directly.

**7. Inconsistent `_SUBAGENT_REGISTRY` typing**
- Some files had `dict[str, Any]`, one had no annotation. Standardised to `dict[str, Any]` as class attribute on each subclass.

**8. Unused `ALL_TOOLS` import in `base.py`**
- Added during helpers migration but not needed there (used in `base_primary.py`). Removed.

**9. `_frame_subagent_result` preamble pattern made data-driven**
- Was a `@staticmethod` with hardcoded preamble dict per agent. Now driven by `_PREAMBLES` class dict on each subclass, resolved by `BasePrimaryAgent._frame_subagent_result()` via `getattr`.

### Files changed
- `src/agents/base.py` — added shared helpers
- `src/agents/primary/base_primary.py` — new, centralises execute pipeline
- `src/agents/primary/__init__.py` — added `BasePrimaryAgent` export
- `src/agents/primary/development_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/events_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/executive_assistant.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/finance_director.py` — migrated to `BasePrimaryAgent`
- `src/agents/primary/hr_volunteer_coordinator.py` — already migrated by linter
- `src/agents/primary/marketing_director.py` — already migrated by linter
- `src/agents/primary/programs_director.py` — already migrated by linter
- `src/agents/sub/base_subagent.py` — added `artifact_type`, `temperature`, `model` class attrs; `execute()` no longer abstract
- All 31 subagent files — stripped to class attributes only

### Verification
All 52 modified files parsed cleanly with `ast.parse`.

---

## 2026-04-10 — Fix: Register Orphaned DevelopmentDirector Subagents + Delegation Keywords

**Task:** The 3 subagents built for DevelopmentDirector (donor_outreach, crm_update, reporting) existed as classes but were never registered in the agent's registry or reachable via `_should_delegate`.

### What was fixed

**`development_director.py`** (the only file that required a content change not covered by the /simplify pass):
- Added imports: `DonorOutreachSubagent`, `CrmUpdateSubagent`, `ReportingSubagent`.
- `_SUBAGENT_REGISTRY` expanded from 2 to 5 entries.
- `_should_delegate` extended with:
  - `donor_outreach`: ("donor", "outreach", "thank you", "stewardship")
  - `crm_update`: ("crm", "stale", "donor record")
  - `reporting`: ("report", "dashboard", "board summary", "fundraising report")
- Grant delegation path unchanged (still checks "grant" keyword first).

### Verification
All 9 primary-agent files (`base_primary.py` + 7 agents + `__init__.py`) pass `ast.parse` clean.

### Status
Complete. 1 file content change. All tests pass syntax check.

---

## 2026-04-10 — Live Chat Support Widget + Contextual Help System

**Task:** Build the in-app live chat widget and contextual help components for the Next.js frontend.

### Files created

**`apps/web/src/components/support/ChatProvider.tsx`**
- React context provider for the support chat widget (independent of the existing `ChatPanelProvider` which handles agent-specific chats).
- Manages open/closed state, message history, and loading state.
- Sends messages via POST to `/api/support/chat` with full conversation history.
- Persists chat history in `localStorage` per session (key: `edify_support_chat_history`).
- Exposes `openChat()`, `closeChat()`, `sendMessage()` via `useSupportChat()` hook.
- Error-safe: bad API responses produce a friendly fallback message.

**`apps/web/src/components/support/ChatWidget.tsx`**
- Floating button (bottom-right, Intercom-style) that expands into a 400px-wide, 500px-tall chat panel.
- Header: "Need help? Ask your support assistant" in brand-500 purple.
- Message bubbles: user on right (brand-500), assistant on left (white card).
- Animated open/close (scale + opacity transition), minimize-to-bar mode, close button.
- Auto-scroll, auto-resize textarea, Enter-to-send (Shift+Enter for newline).
- Shows `TypingIndicator` while awaiting API response.
- Mobile-responsive (full width on small screens).
- Uses `TypingIndicator` from existing component library.
- Reuses `.input-field`, `.brand-500` design tokens from globals.css.

**`apps/web/src/components/support/ProactiveHelper.tsx`**
- Tracks user idle time (default: 60 seconds) and shows a tooltip near the chat button.
- Also watches for repeated `invalid` form events (default threshold: 3) to detect struggling users.
- Tooltip: "Stuck? Your support assistant can help." with a "Get help now" button that opens the chat.
- Dismissable — uses `sessionStorage` to prevent reshowing on same page visit.
- Hides automatically if user opens chat manually.

**`apps/web/src/app/api/support/chat/route.ts`**
- Next.js App Router POST handler at `/api/support/chat`.
- Accepts `{ message: string, history: Array<{role, content}> }`.
- Attempts to forward to agent service (`AGENT_SERVICE_URL/api/agents/executive_assistant/chat`).
- Graceful fallback: returns varied placeholder responses when agent service is unavailable.
- 15-second timeout on upstream call via `AbortSignal.timeout`.

**`apps/web/src/components/help/Tooltip.tsx`** (`HelpTooltip`)
- Wraps any UI element; shows help text on first hover/focus only.
- Tracks seen state in `localStorage` (key: `edify_seen_tooltips`) — won't re-show once dismissed.
- Props: `id`, `content`, `children`, `position` (top/bottom/left/right), `alwaysShow` (debug flag).
- Clean dark tooltip with `animate-fade-in` transition.

**`apps/web/src/components/help/EmptyState.tsx`**
- Reusable empty state: icon + title + description + optional CTA button.
- Props: `icon` (LucideIcon), `title`, `description`, `actionLabel`, `onAction`, `className`.
- Uses `.btn-primary` and `brand-50` palette from globals.css.

**`apps/web/src/components/help/AnnouncementBanner.tsx`**
- Dismissable top-of-dashboard banner for feature announcements.
- Props: `id` (localStorage key), `title`, `description`, `ctaLabel`, `ctaHref`, `className`.
- Remembers dismissals in `localStorage` (key: `edify_dismissed_banners`).
- Subtle `brand-50` background, not aggressive.
- Sparkles icon, X dismiss button.

### Files updated

**`apps/web/src/app/dashboard/layout.tsx`**
- Wrapped layout with `SupportChatProvider`.
- Added `<ChatWidget />` and `<ProactiveHelper />` as siblings to `<ChatPanel />` so they appear on all dashboard pages.

### Design decisions

- `SupportChatProvider` is a separate context from `ChatPanelProvider` — the existing panel is for talking to specific agent team members, while the new widget is for platform support. Mixing them would require breaking the existing agent-selection flow.
- Never says "AI" or "agent" in user-facing strings — uses "support assistant" throughout.
- API route tries the real agent service first (Executive Assistant archetype handles support) and falls back gracefully. Shape is correct so wiring the real service later requires only confirming the URL/endpoint.
- ProactiveHelper uses the native `invalid` event (bubbled from form inputs) to detect failed form actions — no custom event system needed.
- localStorage keys are all prefixed `edify_` to avoid namespace collisions.

### Status
Complete. 7 new files, 1 file updated. TypeScript check passes clean (`npx tsc --noEmit` with no errors).

---

## 2026-04-10 — Help Center & Onboarding Frontend Pages

**Task:** Build Next.js pages and components for the user guide help center and in-app onboarding flow (PRD-user-guide.md).

### Content Files Created

All markdown content for the help center lives in `content/guide/`:

- `meet-your-team/executive-assistant.md` — Who they are, strengths, when to use them, 10 example prompts, tips
- `meet-your-team/programs-director.md` — Program design, outcomes, logic models, compliance
- `meet-your-team/finance-director.md` — Budgets, cash flow, grant financials, audit prep
- `meet-your-team/hr-volunteer-coordinator.md` — Hiring, volunteers, policies, training
- `meet-your-team/events-director.md` — Event planning, run of show, sponsorships
- `working-with-your-team.md` — How to give good instructions, review outputs, request revisions
- `organization-setup.md` — Org profile, Memory, integrations, team activation
- `faq.md` — Privacy, accuracy, pricing, limitations, common questions
- `troubleshooting.md` — 7 common issues with specific fixes

(development-director.md and marketing-director.md already existed.)

### Library Files Created

**`apps/web/src/lib/markdown.ts`**
- Zero-dependency markdown-to-HTML renderer. Handles headings (h1-h4 with ID anchors), bold, italic, inline code, blockquotes, ordered/unordered lists, horizontal rules, links.
- `extractHeadings()` returns heading metadata for ToC generation.

**`apps/web/src/lib/guide-content.ts`**
- Server-side utility for reading markdown content files from `content/guide/`.
- `readGuideFile(relativePath)` — reads and returns a markdown file.
- `getAllGuideArticles()` — returns all guide articles with slugs and titles for search indexing.
- `getAdjacentArticles(slug)` — returns prev/next article for navigation.
- `ARTICLE_ORDER` — canonical article sequence for consistent prev/next navigation.

### Pages and Components Created

**1. `apps/web/src/app/dashboard/guide/layout.tsx`**
- Wraps all guide pages with a collapsible sidebar navigation.
- Sidebar shows all top-level articles; "Meet Your Team" expands to show 7 sub-links when active.
- Auto-breadcrumbs from the URL path.
- Live Chat link at sidebar bottom.

**2. `apps/web/src/app/dashboard/guide/page.tsx`**
- Help Center landing. Hero with search bar (submits to /dashboard/guide/search).
- 6 category cards with icons, descriptions, and links.
- "Meet Your Team" card shows all 7 sub-article links inline.
- Live Chat CTA at bottom.

**3. `apps/web/src/app/dashboard/guide/[slug]/page.tsx`** + `ArticleFeedback.tsx`
- Dynamic server component that renders any top-level guide article from markdown.
- Auto-generated Table of Contents sidebar (h2+ headings, sticky, xl screens).
- Prev/Next navigation at bottom.
- "Was this helpful?" feedback widget (client component). Yes/No state, textarea for negative feedback.

**4. `apps/web/src/app/dashboard/guide/meet-your-team/page.tsx`**
- Index page showing all 7 team members as interactive cards.
- Each card shows archetype-colored icon, role tagline, and description.
- "Not sure who to ask?" tip at bottom.

**5. `apps/web/src/app/dashboard/guide/meet-your-team/[slug]/page.tsx`**
- Dynamic server component for individual archetype guide articles.
- Archetype-specific color accent badge at top (each of the 7 has a distinct color: emerald, amber, sky, violet, teal, rose, orange).
- Same ToC sidebar and feedback widget as the general article renderer.
- Team member prev/next navigation cycling through the 7 archetypes.

**6. `apps/web/src/app/dashboard/guide/search/page.tsx`** + `SearchBox.tsx`
- Server-side full-text search across all guide content (no client-side JS bundle weight).
- Title matches ranked above content matches.
- Results show article title, 200-char snippet centered on the matching term, and path.
- Client `SearchBox` component handles submit and router navigation.

**7. `apps/web/src/app/dashboard/guide/live-chat/page.tsx`**
- Support message form (email + message textarea).
- After submit: confirmation state with "back to help center" link.
- Quick links to 4 key help center articles for self-service.

**8. Onboarding Flow — `apps/web/src/app/dashboard/onboarding/`**

`page.tsx` — State machine: welcome → pick → chat → done. Persists completed slugs to localStorage (`edify_onboarding_completed`).

`components/WelcomeScreen.tsx` — Big visual intro. 7 archetype icons displayed as a grid. Three value-prop cards ("They know your mission", "They specialize", "You stay in charge"). CTA to begin.

`components/ArchetypePicker.tsx` — 7 archetype cards in a 2-col grid. Each shows icon, role name, tagline, description. Completed ones marked with a green "Done" badge. Exports `ARCHETYPES` array used across components.

`components/GuidedConversation.tsx` — Preview chat interface. 5 role-specific suggested prompts per archetype. User can click a prompt or type their own. Simulated assistant response. After first interaction: celebration banner with "You just worked with your [Role]!" and a Continue button.

`components/ProgressTracker.tsx` — Sidebar component. Shows "X of 7 team members" with a progress bar and percentage. Per-row status for each archetype with checkmark/circle. Clicking a row navigates directly to that conversation. "Try now" label on uncompleted members.

### Files Updated

**`apps/web/src/components/sidebar.tsx`**
- Added `BookOpen` icon import.
- Added `{ href: '/dashboard/guide', label: 'Help Center', icon: BookOpen }` to `navLinks` between Integrations and Settings.

### Language Compliance
All user-facing strings follow the PRD language guidelines: no "agent", "LLM", "API", "model". Uses "specialist", "team member", "AI hire", "your Development Director", etc. throughout.

### Design Decisions

- **No new dependencies.** Built a simple markdown renderer rather than adding MDX/react-markdown (saves bundle weight; the content is simple enough that a 100-line renderer handles it cleanly).
- **Server-side search.** Search runs as a Next.js server component reading markdown at request time. No client-side bundle for the search index. Fast enough for this content volume.
- **`guide-content.ts` reads from `../../content/guide` relative to `process.cwd()`** — this works because Next.js runs from `apps/web/` and the content directory is at the monorepo root.
- **Onboarding uses localStorage** (not server state) to track which archetypes have been explored -- keeps it zero-infrastructure as specified in the PRD.
- **Simulated conversation in onboarding** — the GuidedConversation component shows a preview response rather than calling a real backend. When the live chat backend is wired in, swapping the simulated response for a real API call is a one-function change.
- **Meet Your Team sub-pages have independent slug/prev/next logic** separate from the main ARTICLE_ORDER. This lets the team member pages cycle through all 7 archetypes without being tangled with the broader article ordering.

### Status
Complete. 14 new frontend files, 7 new content files, 2 new library files, 1 sidebar update. `npx tsc --noEmit` passes clean with zero errors.

---

## 2026-04-10 — /simplify Pass: User Guide Code Review

### What Was Done

Full read of all user guide and onboarding code, then fixed every issue found.

### Issues Fixed

**1. ArticleFeedback.tsx -- fragile import path removed**
- Moved `ArticleFeedback.tsx` from `guide/[slug]/` to shared `guide/` directory.
- Updated import in `guide/[slug]/page.tsx` to `../ArticleFeedback`.
- Updated import in `guide/meet-your-team/[slug]/page.tsx` from `../../[slug]/ArticleFeedback` (traversing through a dynamic route segment -- fragile) to `../../ArticleFeedback`.
- Deleted the original file from the `[slug]` directory.

**2. Duplicate TEAM_SLUG_ORDER removed**
- `meet-your-team/[slug]/page.tsx` had a hardcoded `TEAM_SLUG_ORDER` array that duplicated the meet-your-team entries in `guide-content.ts`'s `ARTICLE_ORDER`.
- Now derives dynamically from `ARTICLE_ORDER` via filter + map -- single source of truth.

**3. Dead code: `unreadCount` in ChatWidget.tsx**
- `const unreadCount = 0` was declared and referenced in a conditional that could never be true (always 0). Removed the variable and the dead JSX block.

**4. Dead state: `setFailedActions` in ProactiveHelper.tsx**
- `[, setFailedActions] = useState(0)` was called only to trigger re-renders after incrementing `failedActionsRef`. But the render is already triggered by `show()` which calls `setVisible(true)`. The state was never read, making it pure dead code. Removed.

**5. Bug: HelpTooltip would never display**
- `visible && !hasBeenSeen` -- after `showTooltip` ran, it set both `visible=true` and `hasBeenSeen=true` in the same call, so the render condition was always false. The tooltip opened and immediately closed.
- Fixed: render condition is now just `visible`.

**6. Bug: handleConversationComplete stale closure**
- `completedSlugs` was read after calling `markComplete(slug)`, but `markComplete` updates state asynchronously -- so `completedSlugs` still reflected the old count. The `>= total` check used stale data and could skip the `done` step.
- Fixed: compute `newCount` from the pre-update `completedSlugs.length` + 1 (if not already done), which is accurate without needing the state update to flush.

**7. Forbidden words in faq.md**
- "Is my Anthropic API key secure?" and "What is the Anthropic API key for?" exposed "API" and "Anthropic" to users.
- Rewritten as "Is my access key secure?" and "What is the access key for?" with matching body text.

**8. Broken internal link in live-chat-support.md**
- `[Troubleshooting](troubleshooting.md)` was a relative markdown path that would not resolve in the rendered help center.
- Changed to `/dashboard/guide/troubleshooting`.

**9. Marketing Director naming inconsistency**
- Content file `marketing-director.md` called this role "Your Marketing & Comms Director" but all UI (layout, pages, ArchetypePicker, getting-started.md) used "Marketing Director".
- Renamed in `marketing-director.md` and `getting-started.md` to match.

### Files Changed
- `apps/web/src/app/dashboard/guide/ArticleFeedback.tsx` -- created (moved from [slug]/)
- `apps/web/src/app/dashboard/guide/[slug]/ArticleFeedback.tsx` -- deleted
- `apps/web/src/app/dashboard/guide/[slug]/page.tsx` -- updated import
- `apps/web/src/app/dashboard/guide/meet-your-team/[slug]/page.tsx` -- updated import + removed duplicate TEAM_SLUG_ORDER
- `apps/web/src/components/support/ChatWidget.tsx` -- removed dead unreadCount
- `apps/web/src/components/support/ProactiveHelper.tsx` -- removed dead state
- `apps/web/src/components/help/Tooltip.tsx` -- fixed tooltip visibility bug
- `apps/web/src/app/dashboard/onboarding/page.tsx` -- fixed stale closure in handleConversationComplete
- `content/guide/faq.md` -- removed forbidden words (API key references)
- `content/guide/live-chat-support.md` -- fixed broken internal link
- `content/guide/meet-your-team/marketing-director.md` -- consistent naming
- `content/guide/getting-started.md` -- consistent naming

---

## 2026-04-10 — Decision Lab Backend

**Task:** Build the Decision Lab backend service -- runs a decision scenario through all 7 AI archetypes in parallel and synthesizes the results.

### Files Created

- `services/agents/src/decision_lab/__init__.py` -- empty package init
- `services/agents/src/decision_lab/models.py` -- Pydantic v2 models: ScenarioRequest, ArchetypeResponse, Synthesis, ScenarioResult, FollowUpRequest
- `services/agents/src/decision_lab/prompts.py` -- three prompt templates: DECISION_LAB_SYSTEM_PROMPT, SYNTHESIS_PROMPT, FOLLOW_UP_PROMPT
- `services/agents/src/decision_lab/orchestrator.py` -- DecisionLabOrchestrator: dispatches to all archetypes via asyncio.gather(), parses [STANCE: X] [CONFIDENCE: Y] headers, supports follow-up queries on individual archetypes
- `services/agents/src/decision_lab/synthesis.py` -- SynthesisEngine: calls LLM as neutral facilitator, parses structured output into Synthesis model (consensus, disagreements, top_risks, recommended_action)
- `services/agents/src/decision_lab/history.py` -- ScenarioHistory: saves/retrieves ScenarioResult to Postgres when pool available, falls back to in-memory dict for dev
- `services/agents/src/decision_lab/router.py` -- FastAPI router: POST /run, GET /history, GET /{scenario_id}, POST /{scenario_id}/follow-up

### Files Modified

- `services/agents/src/main.py` -- registered decision_lab_router at /api/v1 prefix

### Design Decisions

- Each archetype is queried in parallel with asyncio.gather(); max_tokens=500 per archetype, 1000 for synthesis
- Archetype responses prefixed with [STANCE: X] [CONFIDENCE: Y] on first line for reliable parsing; fallback to "caution"/"low" on parse failure
- Synthesis prompt uses explicit section headers (## CONSENSUS, ## DISAGREEMENTS, ## TOP RISKS, ## RECOMMENDED ACTION) and a regex parser with list-item fallback
- History uses a module-level dict as in-memory fallback so no DB is required for local dev
- DB schema expected: decision_lab_scenarios table with (scenario_id, org_id, scenario_text, result_json, created_at); graceful fallback to memory on DB failure
- ClaudeClient.close() called in finally blocks on all API routes to prevent connection leaks

### Endpoints

- POST /api/v1/decision-lab/run -- takes ScenarioRequest (scenario_text, org_id, anthropic_api_key, optional selected_archetypes), returns ScenarioResult
- GET /api/v1/decision-lab/history?org_id=X -- returns list of recent scenarios
- GET /api/v1/decision-lab/{scenario_id}?org_id=X -- returns full ScenarioResult
- POST /api/v1/decision-lab/{scenario_id}/follow-up?org_id=X -- drills into one archetype, returns ArchetypeResponse

---

## 2026-04-10 — Decision Lab Frontend

**Task:** Build the Decision Lab frontend — where users describe a scenario and get instant feedback from their full AI team.

### Files Created

- `apps/web/src/app/dashboard/decision-lab/page.tsx` — Main page with header, input, example prompts, results grid, synthesis, and follow-up wiring
- `apps/web/src/app/dashboard/decision-lab/api.ts` — Client-side API wrapper (`runScenario`, `getHistory`, `getScenario`, `askFollowUp`)
- `apps/web/src/app/dashboard/decision-lab/components/ScenarioInput.tsx` — Large textarea with animated loading state and Cmd+Enter shortcut
- `apps/web/src/app/dashboard/decision-lab/components/TeamSelector.tsx` — 7 toggle pills (one per archetype), all selected by default, click to deselect
- `apps/web/src/app/dashboard/decision-lab/components/ArchetypeCard.tsx` — Per-team-member card with stance badge (Support/Caution/Oppose), confidence indicator, and follow-up button
- `apps/web/src/app/dashboard/decision-lab/components/SynthesisPanel.tsx` — Four-section summary: consensus, disagreements, top risks, recommended action
- `apps/web/src/app/dashboard/decision-lab/components/FollowUp.tsx` — Slide-over panel for asking follow-up questions to individual team members
- `apps/web/src/app/dashboard/decision-lab/components/ScenarioHistory.tsx` — Collapsible sidebar list of past scenarios with empty state
- `apps/web/src/app/api/decision-lab/route.ts` — Next.js API route with full mock data (7 archetypes, varied stances, synthesis); proxies to backend if available

### Files Modified

- `apps/web/src/components/sidebar.tsx` — Added "Decision Lab" nav link with `FlaskConical` icon, placed after Team

### Architecture Notes

- All language follows the "no LLM/agent/token" rule: "team member", "specialist", "your team", "Run it by the team"
- Mock data is fully realistic (7 archetypes with distinct voices, mixed stances, real synthesis)
- TypeScript: zero errors (`tsc --noEmit` passes clean)
- Mobile-responsive grid layout (1 col → 2 col for cards, sidebar collapses below lg)

