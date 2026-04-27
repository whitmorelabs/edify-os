---
name: board_meeting_packet
description: Generate a complete nonprofit board meeting packet as a Word (.docx) document — cover page, agenda table, consent calendar with recommended motion, action item tracker, committee reports, executive summary, and appendix placeholder. Knows nonprofit board conventions that generic document tools do not.
---

# Board Meeting Packet

## When to use
Invoke `board_meeting_packet` when the Executive Assistant user needs to prepare materials for a board meeting. Triggers: "prepare the board packet for [date]", "put together the board meeting materials", "draft the agenda and board packet for [meeting type]", "I need the board packet for [date]". This skill produces a structured, multi-section .docx file — not a chat summary.

Do not use for single-item meeting agendas, staff meeting prep, or general Word documents.

## Inputs

- `org_name` *(required, string)* — Full name of the organization. Example: "Bridgepoint Community Foundation"
- `meeting_date` *(required, string)* — Date of the board meeting. Example: "May 15, 2026"
- `agenda_items` *(required, list of objects)* — Each item in the meeting agenda:
  ```json
  [
    {
      "title": "Approval of Minutes",
      "presenter": "Board Chair",
      "time_allocation_minutes": 5,
      "type": "consent",
      "supporting_doc_note": "Minutes from March 2026 meeting attached"
    },
    {
      "title": "Q1 Financial Review",
      "presenter": "Treasurer",
      "time_allocation_minutes": 20,
      "type": "informational",
      "supporting_doc_note": "Q1 financials, Appendix A"
    },
    {
      "title": "Approve FY27 Budget",
      "presenter": "Executive Director",
      "time_allocation_minutes": 30,
      "type": "decision",
      "supporting_doc_note": "Proposed FY27 budget, Appendix B"
    }
  ]
  ```
  `type` must be one of: `discussion`, `decision`, `informational`, `consent`
- `prepared_by` *(required, string)* — Name of the EA preparing the packet. Example: "Maria Santos"
- `meeting_type` *(optional, string)* — `regular`, `special`, or `annual`. Default: `regular`
- `prior_action_items` *(optional, list of objects)* — Carryover action items from last meeting:
  ```json
  [
    {"item": "Finalize lease renewal with landlord", "owner": "Executive Director", "status": "In Progress", "notes": "Negotiations ongoing, expected close by 5/1"},
    {"item": "Recruit two new board members", "owner": "Governance Committee", "status": "Pending", "notes": "Two candidates identified, interviews scheduled"}
  ]
  ```
  `status` options: `Complete`, `In Progress`, `Pending`, `Overdue`, `Deferred`
- `consent_calendar_items` *(optional, list of strings)* — Items to be approved en bloc:
  ```json
  ["Approval of March 2026 meeting minutes", "Ratification of staff salary adjustments per HR Committee recommendation"]
  ```
- `committee_reports` *(optional, list of objects)* — Summary for each committee:
  ```json
  [
    {"committee": "Finance Committee", "chair": "James Park", "summary": "The Finance Committee reviewed Q1 actuals vs. budget. Revenue is tracking 8% ahead of plan. The Committee recommends no changes to the current investment policy."},
    {"committee": "Programs Committee", "chair": "Dr. Aisha Osei", "summary": "The Programs Committee reviewed participant outcomes for the spring cohort. Completion rates are at 87%, exceeding the 80% target."}
  ]
  ```
- `executive_summary` *(optional, string)* — 1-paragraph summary from the Executive Director. Example: "This quarter has seen strong programmatic progress and favorable revenue trends. Our spring fundraiser exceeded its $50,000 goal by 12%, and we welcomed two new major donors."
- `signer_role` *(optional, string)* — Title of the person who prepared the packet. Default: `"Executive Assistant"`

## Output

`board_packet_<date>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains:**
1. Cover page — org name, "Board Meeting Packet", meeting date + type, prepared by
2. Meeting Agenda — table: Time | Item | Presenter | Type | Supporting Material; color-coded by item type
3. Consent Calendar — numbered list with recommended motion language
4. Action Item Tracker — table with R/Y/G status badges from prior meeting
5. Committee Reports — each committee in its own subsection
6. Executive Director Summary — 1-paragraph overview
7. Appendix placeholder — index of supporting documents

## Color coding

**Agenda item types:**
| Type | Color |
|------|-------|
| Decision | Amber — requires a board vote |
| Discussion | Blue — input needed, no vote |
| Informational | Green — for awareness only |
| Consent | Purple — approved en bloc |

**Action item status:**
| Status | Color |
|--------|-------|
| Complete | Green |
| In Progress | Amber |
| Pending | Amber |
| Overdue | Red |
| Deferred | Gray |

## Example invocation

```json
{
  "skill": "board_meeting_packet",
  "inputs": {
    "org_name": "Bridgepoint Community Foundation",
    "meeting_date": "May 15, 2026",
    "meeting_type": "regular",
    "agenda_items": [
      {"title": "Call to Order & Roll Call", "presenter": "Board Chair", "time_allocation_minutes": 5, "type": "informational", "supporting_doc_note": ""},
      {"title": "Consent Calendar", "presenter": "Board Chair", "time_allocation_minutes": 5, "type": "consent", "supporting_doc_note": "March minutes + HR salary memo"},
      {"title": "Q1 Financial Report", "presenter": "Treasurer", "time_allocation_minutes": 20, "type": "informational", "supporting_doc_note": "Q1 Financials, Appendix A"},
      {"title": "Approve FY27 Budget", "presenter": "Executive Director", "time_allocation_minutes": 30, "type": "decision", "supporting_doc_note": "Draft FY27 budget, Appendix B"},
      {"title": "Strategic Plan Update", "presenter": "Executive Director", "time_allocation_minutes": 15, "type": "discussion", "supporting_doc_note": ""},
      {"title": "Adjournment", "presenter": "Board Chair", "time_allocation_minutes": 5, "type": "informational", "supporting_doc_note": ""}
    ],
    "consent_calendar_items": [
      "Approval of March 2026 meeting minutes",
      "Ratification of the HR Committee's recommended salary band adjustments effective July 1, 2026"
    ],
    "prior_action_items": [
      {"item": "Finalize lease renewal", "owner": "Executive Director", "status": "In Progress", "notes": "Expected close by 5/1"},
      {"item": "Recruit two new board members", "owner": "Governance Committee", "status": "Pending", "notes": "Two candidates identified"}
    ],
    "committee_reports": [
      {"committee": "Finance Committee", "chair": "James Park", "summary": "Q1 revenue is 8% above plan. The Committee recommends no changes to the investment policy at this time."},
      {"committee": "Programs Committee", "chair": "Dr. Aisha Osei", "summary": "Spring cohort completion rates are at 87%, exceeding our 80% target. Participant satisfaction scores averaged 4.6 out of 5."}
    ],
    "executive_summary": "This quarter has seen strong programmatic momentum and favorable revenue trends. Our spring fundraiser exceeded its $50,000 goal by 12%, and we welcomed two new major donors to the legacy giving program.",
    "prepared_by": "Maria Santos",
    "signer_role": "Executive Assistant"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `org_name`, `meeting_date`, `agenda_items`, and `prepared_by` before calling. Optional sections (consent calendar, action tracker, committee reports, executive summary) enrich the packet but are not required — absent sections are replaced with placeholder text.

After the skill produces the file, present it as a downloadable artifact and remind the EA to:
- Attach supporting documents referenced in the Appendix
- Distribute the packet to board members at least 72 hours before the meeting (best practice)
- Review consent calendar items with the Board Chair before the meeting
