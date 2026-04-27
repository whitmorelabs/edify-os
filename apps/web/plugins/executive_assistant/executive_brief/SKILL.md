---
name: executive_brief
description: Generate a compact 1-page briefing note for the Executive Director as a Word (.docx) document. Designed for prep before external meetings — foundation pitches, government partnerships, donor calls. Includes attendees table, background, key decisions needed, stakeholder positions, recommended stance, and risks.
---

# Executive Brief

## When to use
Invoke `executive_brief` when the Executive Assistant user needs to prep the Executive Director for an external meeting. Triggers: "brief the ED for [meeting]", "prepare a briefing note for [topic]", "I need a one-pager before the [funder/partner] meeting", "draft an ED brief for [date]". This skill produces a compact .docx file formatted to print on one page — not a chat summary.

Do not use for board meeting prep (use `board_meeting_packet`) or general document drafts.

## Inputs

- `org_name` *(required, string)* — Name of the organization
- `meeting_topic` *(required, string)* — Short label for the meeting. Example: "Smith Foundation Funding Meeting"
- `meeting_date` *(required, string)* — Date of the meeting. Example: "May 20, 2026"
- `attendees` *(required, list of objects)* — All attendees, both sides:
  ```json
  [
    {"name": "Dr. Maya Chen", "role": "Executive Director", "organization": "Bridgepoint Community Foundation"},
    {"name": "Robert Tran", "role": "Program Officer", "organization": "Smith Family Foundation"},
    {"name": "Lisa Park", "role": "Senior Program Associate", "organization": "Smith Family Foundation"}
  ]
  ```
- `background` *(required, string)* — Paragraph explaining what brought us here, prior interactions, and relevant history. Example: "Smith Family Foundation is a $40M education-focused funder we have cultivated for 8 months. We submitted an LOI in February and were invited to a full proposal meeting."
- `key_decisions_needed` *(required, list of strings)* — What must come out of this meeting:
  ```json
  ["Confirm whether Smith will accept a 3-year grant structure", "Agree on the program component that is in scope", "Get a timeline for the full proposal deadline"]
  ```
- `recommended_stance` *(required, string)* — What the ED should say or push for. Example: "Lead with our outcomes data from the spring cohort. Position the 3-year ask as lower risk for the funder because of our track record. Be flexible on year 1 scope if needed — the relationship is worth the adaptation."
- `stakeholder_positions` *(optional, list of objects)* — What each party wants:
  ```json
  [
    {"stakeholder": "Smith Family Foundation", "position": "Wants measurable 2-year outcomes. Prefers direct service over admin costs. Interested in our school partnership model."},
    {"stakeholder": "Bridgepoint (us)", "position": "Seeking $200K/year for 3 years for our Pathways to Work program. Want flexibility on year 1 design given new cohort structure."}
  ]
  ```
- `risks` *(optional, list of strings)* — Things to watch for:
  ```json
  ["Foundation may push back on the 3-year ask — have a 2-year fallback ready", "Robert Tran is new to this program area — calibrate level of detail accordingly", "Do not commit to a specific evaluation methodology without consulting our data team first"]
  ```
- `prepared_by` *(required, string)* — EA's name. Example: "Maria Santos"

## Output

`executive_brief_<topic>_<date>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains (formatted for 1-page print at 0.7" margins):**
1. Title bar — "Executive Director Briefing", org name, meeting topic
2. Meeting date
3. Attendees table — Name | Role | Organization
4. Background — paragraph context
5. Key Decisions Needed — numbered list
6. Stakeholder Positions — 2-column table (if provided)
7. Recommended Stance — paragraph or bullets
8. Risks & Watch Points — bulleted list (if provided)
9. Footer — Prepared by + date + CONFIDENTIAL

## Example invocation

```json
{
  "skill": "executive_brief",
  "inputs": {
    "org_name": "Bridgepoint Community Foundation",
    "meeting_topic": "Smith Foundation Funding Meeting",
    "meeting_date": "May 20, 2026",
    "attendees": [
      {"name": "Dr. Maya Chen", "role": "Executive Director", "organization": "Bridgepoint Community Foundation"},
      {"name": "Maria Santos", "role": "Executive Assistant", "organization": "Bridgepoint Community Foundation"},
      {"name": "Robert Tran", "role": "Program Officer", "organization": "Smith Family Foundation"},
      {"name": "Lisa Park", "role": "Senior Program Associate", "organization": "Smith Family Foundation"}
    ],
    "background": "Smith Family Foundation is a $40M education-focused funder we have cultivated for 8 months. We submitted an LOI in February and were invited to a full proposal meeting after a positive initial screening call in March.",
    "key_decisions_needed": [
      "Confirm whether Smith will accept a 3-year grant structure",
      "Agree on which program component is in scope for this funding",
      "Get a timeline for the full proposal submission deadline"
    ],
    "stakeholder_positions": [
      {"stakeholder": "Smith Family Foundation", "position": "Prefers measurable 2-year outcomes. Interested in our school partnership model. Cautious about overhead."},
      {"stakeholder": "Bridgepoint (us)", "position": "Seeking $200K/year for 3 years for Pathways to Work. Want flexibility on year 1 design given new cohort structure."}
    ],
    "recommended_stance": "Lead with spring cohort outcomes data. Position the 3-year ask as lower risk because of our track record. If they push back on duration, offer a 2-year pilot with a renewal option.",
    "risks": [
      "Foundation may push back on the 3-year structure — prepare a 2-year fallback",
      "Robert Tran is new; calibrate the level of technical detail accordingly",
      "Do not commit to a specific evaluation methodology without our data team's sign-off"
    ],
    "prepared_by": "Maria Santos"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `org_name`, `meeting_topic`, `meeting_date`, `attendees`, `background`, `key_decisions_needed`, `recommended_stance`, and `prepared_by` before calling.

The brief is designed to print on one page. Word's rendering may vary slightly with long content — if sections are very long, the document may flow to a second page. That is acceptable; the formatting is still optimized to be as compact as possible.

After the skill produces the file, present it as a downloadable artifact and remind the EA to:
- Send the brief to the ED at least 24 hours before the meeting
- Include any funder profile, prior proposal, or financial documents as separate attachments
- Confirm any "decisions needed" with the ED so they are mentally prepared to answer
