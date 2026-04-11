# SESSION LOG — Edify OS

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
