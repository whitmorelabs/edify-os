---
name: grant_proposal_writer
description: Generate a complete grant proposal or letter of inquiry (LOI) as a downloadable Word document — cover page, executive summary, statement of need, program description, goals, evaluation plan, organizational capacity, budget justification, and sustainability.
---

# Grant Proposal Writer

## When to use
Invoke `grant_proposal_writer` when the Development Director user wants to draft a grant proposal or LOI. Triggers include: "write a grant proposal for [funder]", "draft an LOI to [foundation]", "help me apply for this grant", "we need a proposal for [program]", or "start the application for [funder]". This skill produces a complete, structured .docx file — not a chat summary.

Do not use for donor stewardship letters (use `donor_stewardship_sequence`) or impact reports (use `impact_report`).

## Inputs

- `funder_name` *(required, string)* — Name of the funder or foundation. Example: "Smith Family Foundation"
- `grant_amount` *(required, string)* — Dollar amount requested or "TBD". Example: "$50,000"
- `deadline` *(required, string)* — Application deadline. Example: "June 15, 2026"
- `org_name` *(required, string)* — Full name of the applicant organization
- `org_mission` *(required, string)* — 1-2 sentence mission statement
- `program_name` *(required, string)* — Name of the program this grant would fund
- `program_description` *(required, string)* — Paragraph describing program activities and methodology
- `target_population` *(required, string)* — Who the program serves. Example: "youth ages 17-21 with developmental disabilities"
- `geographic_area` *(required, string)* — Where the program operates. Example: "Harris County, TX"
- `funding_request_summary` *(required, string)* — 1-paragraph summary of what the grant will fund
- `evaluation_metrics` *(optional, list of strings)* — Measurable outcome indicators. Example: ["80% of participants complete the program", "50 youth placed in employment"]
- `org_budget_total` *(optional, string)* — Total annual organizational budget. Example: "$1,200,000"
- `proposal_type` *(optional, string)* — "loi" for a 1-page letter of inquiry or "full" for a 5-7 page proposal. Default: "full"
- `additional_context` *(optional, string)* — Any extra funder priorities, relationship notes, or context to weave in

## Output

`grant_proposal_<funder>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

**Full proposal** contains:
1. Cover page — org name, funder, request amount, deadline
2. Executive Summary — 1-paragraph overview
3. Statement of Need — data-rich narrative on who is served and the gap addressed
4. Program Description — activities, methodology, timeline
5. Goals and Objectives — measurable outcomes
6. Evaluation Plan — how outcomes will be tracked and reported
7. Organizational Capacity — credibility and track record
8. Budget Justification — 1-paragraph + placeholder budget table
9. Sustainability — how the program continues post-grant

**LOI variant** (1 page): condensed cover, executive summary, statement of need, and goals only.

## Example invocation

```json
{
  "skill": "grant_proposal_writer",
  "inputs": {
    "funder_name": "Smith Family Foundation",
    "grant_amount": "$50,000",
    "deadline": "June 15, 2026",
    "org_name": "Bridgepoint Futures",
    "org_mission": "Bridgepoint Futures empowers young adults with developmental disabilities to achieve economic independence and community belonging through workforce development and life skills training.",
    "program_name": "Pathways to Work",
    "program_description": "Pathways to Work is a 12-week intensive workforce readiness program combining occupational skills training, job coaching, and employer partnerships to connect youth ages 17-21 with meaningful employment.",
    "target_population": "youth ages 17-21 with developmental disabilities",
    "geographic_area": "Harris County, TX",
    "funding_request_summary": "We are requesting $50,000 to support the Pathways to Work program, covering staff salaries, participant stipends, and job coach training for 50 youth in the 2026-2027 program year.",
    "evaluation_metrics": ["80% of participants complete the 12-week program", "50% of graduates secure employment within 90 days", "Average hourly wage at placement exceeds $14/hour"],
    "org_budget_total": "$1,200,000",
    "proposal_type": "full"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `funder_name`, `grant_amount`, `deadline`, `org_name`, `org_mission`, `program_name`, `program_description`, `target_population`, `geographic_area`, and `funding_request_summary` before calling. Optional fields enrich the output but are not required.

The document opens with a compliance note: "GENERATED DRAFT — review with Development Director before submission." Every proposal section is substantive — the skill writes real content using the inputs, not placeholder text.

After the skill produces the file, present it as a downloadable artifact and remind the user to:
- Verify all statistics and data points before submission
- Add any required attachments (IRS determination letter, audited financials, board list)
- Have leadership sign off before transmitting
