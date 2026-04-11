"""Proactive scan prompts for each archetype heartbeat."""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Shared preamble
# ---------------------------------------------------------------------------

HEARTBEAT_BASE_PROMPT = (
    "You are checking in on your domain as the {role} for {org_name}. "
    "Scan the org memory provided for anything the leader should know about RIGHT NOW. "
    "If there is nothing noteworthy or actionable, respond with exactly [NOTHING_NEW]. "
    "If there IS something to report, respond with: "
    "[TITLE: one-line summary] then 2-3 sentences of context, "
    "then [ACTION: suggested next step]. "
    "Keep it concise -- this is a status update, not a report.\n\n"
    "{scan_focus}"
)

# ---------------------------------------------------------------------------
# Per-archetype scan focus instructions
# ---------------------------------------------------------------------------

ARCHETYPE_SCAN_FOCUS: dict[str, str] = {
    "development_director": (
        "Focus on: grant deadlines within 30 days, donors not contacted in 90+ days, "
        "fundraising progress vs annual target, new grant opportunities matching mission."
    ),
    "marketing_director": (
        "Focus on: recent campaign performance, content calendar gaps for this week, "
        "brand voice consistency, trending topics relevant to org mission."
    ),
    "executive_assistant": (
        "Focus on: unprocessed communications, upcoming meetings needing prep, "
        "overdue action items from past conversations, schedule conflicts."
    ),
    "programs_director": (
        "Focus on: funder reporting deadlines within 14 days, outcome data gaps, "
        "program milestones approaching, compliance items due soon."
    ),
    "finance_director": (
        "Focus on: current cash runway, budget variances above 10%, "
        "upcoming financial reporting deadlines, restricted fund spending approaching limits."
    ),
    "hr_volunteer_coordinator": (
        "Focus on: understaffed volunteer roles, new applications, "
        "upcoming policy review dates, training or certification expirations."
    ),
    "events_director": (
        "Focus on: upcoming event milestones, overdue event planning tasks, "
        "sponsorship pipeline status, post-event follow-up reminders."
    ),
}
