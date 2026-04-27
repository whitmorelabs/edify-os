---
name: action_item_extractor
description: Extract structured action items from pasted meeting notes or a transcript and generate a Word (.docx) document with an action items table (# | Action | Owner | Deadline | Priority | Notes), decisions captured, and open questions. Parsing is heuristic — output is a draft for EA review.
---

# Action Item Extractor

## When to use
Invoke `action_item_extractor` when the Executive Assistant user has raw meeting notes and wants to turn them into a structured action list. Triggers: "extract the action items from these notes", "pull out the AIs from [meeting] notes", "turn these meeting notes into action items", "who's doing what from [meeting]?", "I just got the notes from the board meeting, can you pull out what needs to happen?". This skill produces a .docx file — not a chat summary.

Do not use for agenda creation (use `board_meeting_packet`) or general documents.

## Inputs

- `meeting_title` *(required, string)* — Title of the meeting. Example: "April 2026 Board Meeting"
- `meeting_date` *(required, string)* — Date of the meeting. Example: "April 26, 2026"
- `meeting_notes` *(required, string)* — The raw meeting notes, transcript, or summary to parse. Paste the full text.
- `default_owner` *(optional, string)* — Default owner when no owner can be identified. Default: `"Unassigned"`
- `org_name` *(optional, string)* — Organization name for the cover page

## How parsing works

The skill uses heuristic pattern matching — not AI inference. It is designed to produce a useful starting draft, not an authoritative extraction.

**Action item signals** (triggers classification as an action):
- Explicit prefixes: "Action:", "TODO:", "AI:"
- Verb patterns: "will send", "to review", "to prepare", "to schedule", "to draft", "to coordinate", "needs to", "responsible for", "follow up on", "assigned to"

**Owner extraction** (best effort):
- "Owner: Name" or "Assigned to: Name"
- "@Name" mentions
- "[Name]" or "(Name)" brackets
- "Name will X" or "Name to X" at the start of a sentence
- Falls back to `default_owner` if no pattern matches

**Deadline extraction** (best effort):
- ISO dates: `2026-04-26`
- Month-day formats: "April 26, 2026" / "April 26"
- "by Friday", "by Monday" → resolved to next occurrence of that weekday
- "by end of week" → next Friday
- "by end of month" → last day of current month
- "next week", "next month" → first day of that period
- "deadline: [date]", "due [date]"
- If no date found, Deadline column shows "—"

**Priority** (keyword scan):
- "urgent", "critical", "asap", "high priority" → **High** (red row)
- All other items → **Normal** (green)

**Decisions**: lines containing "decided", "agreed", "approved", "confirmed", "resolved", "voted", "motion passed", "going with", "committed to", etc.

**Open questions**: lines containing "?", "TBD", "unclear", "pending", "need to determine", "open question", "to be confirmed", etc.

## Output

`action_items_<meeting>_<date>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains:**
1. Cover page — meeting title, date, org name, extraction date; summary counts (X action items | Y decisions | Z open questions); DRAFT watermark
2. Action Items Table — # | Action | Owner | Deadline | Priority | Notes; High-priority rows highlighted in red
3. Decisions Captured — numbered list
4. Open Questions — numbered list
5. Footer note — parsing method, dateutil availability status

## Limitations and tips for better extraction

The parser works best when notes are formatted with clear signals:
- Start action lines with "Action:", "TODO:", or "AI:"
- Include owner explicitly: "Action: Maria to send the report by Friday"
- Use ISO dates when possible: "by 2026-05-01"
- Put each action item on its own line

Parsing limitations:
- Implicit actions ("Let's get the report done") may be missed
- Owner extraction is best-effort — always review before sending
- The "decisions" list may include false positives (lines with "we will" that are actually actions)
- Very long or complex transcripts may produce more noise — edit the output after downloading

The output is marked DRAFT throughout. The EA should review all extracted items before distributing.

## Example invocation

```json
{
  "skill": "action_item_extractor",
  "inputs": {
    "meeting_title": "April 2026 Board Meeting",
    "meeting_date": "April 26, 2026",
    "org_name": "Bridgepoint Community Foundation",
    "default_owner": "Executive Director",
    "meeting_notes": "April 26, 2026 — Board Meeting Notes\n\nAttendees: Dr. Maya Chen (ED), James Park (Treasurer), Dr. Aisha Osei (Programs), Maria Santos (EA), Robert Kim (Board Chair)\n\nCall to Order: Meeting called to order at 6:02 PM.\n\nConsent Calendar: The consent calendar was approved unanimously. Motion passed.\n\nQ1 Financial Report: James presented Q1 financials. Revenue is tracking 8% above plan.\n\nAction: Maria to send the Q1 summary to all board members by April 28, 2026.\n\nStrategic Plan Update: The board discussed the 3-year strategic plan. Dr. Chen will draft a revised strategic goal for programs by end of month.\n\nWe need to determine if we should hire a development associate or contract with a fundraising consultant. TBD pending budget review.\n\nThe board agreed to table the marketing plan discussion to the June meeting.\n\nAisha to prepare a participant outcome summary for June — urgent.\n\nNext Steps: Robert Kim will follow up with two board candidates this week. Maria to schedule the June board meeting by next Friday.\n\nAdjournment: Meeting adjourned at 8:14 PM."
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `meeting_title`, `meeting_date`, and `meeting_notes` before calling.

After the skill produces the file, present it as a downloadable artifact and remind the EA to:
- Review all extracted action items — add any missed items manually
- Verify or correct owners and deadlines
- Mark any decisions or questions that are actually action items and move them to the action table
- Distribute to owners once reviewed
