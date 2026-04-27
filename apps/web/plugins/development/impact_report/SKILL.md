---
name: impact_report
description: Generate a funder-ready or annual-report-style impact report as a Word document — outcomes table, impact story, financial summary, and acknowledgements — in either funder-specific or broad annual report format.
---

# Impact Report

## When to use
Invoke `impact_report` when the Development Director user needs to report on program outcomes to a funder or broad audience. Triggers include: "write an impact report for [funder]", "draft our annual report", "create a mid-year funder report", "we need to report out on outcomes for [period]", or "help me put together an impact summary." This skill produces a structured .docx file — not a chat summary.

Do not use for grant proposals (use `grant_proposal_writer`) or donor stewardship (use `donor_stewardship_sequence`).

## Inputs

- `org_name` *(required, string)* — Full name of the organization
- `report_type` *(required, string)* — "funder_report" (specific funder, formal) or "annual_report" (broad audience, stakeholder-facing)
- `report_period` *(required, string)* — Time period covered. Example: "January – June 2026" or "Fiscal Year 2025-2026"
- `program_outcomes` *(required, list of objects)* — Each object: `{"program": "...", "target": "...", "actual": "...", "narrative": "..."}`. Example: `[{"program": "Pathways to Work", "target": "50 youth served", "actual": "63 youth served", "narrative": "Exceeded target by 26% due to expanded employer partnerships."}]`
- `funder_name` *(required if report_type="funder_report", string)* — Name of the funder
- `grant_amount` *(required if report_type="funder_report", string)* — Amount of the grant being reported on
- `total_revenue` *(optional, string)* — Total organizational revenue for the period. Example: "$1,100,000"
- `total_expenses` *(optional, string)* — Total organizational expenses for the period. Example: "$1,050,000"
- `participant_story` *(optional, string)* — Anonymized participant story or testimonial (freeform)
- `top_funders` *(optional, list of strings)* — Names to include in the acknowledgements section
- `org_mission` *(optional, string)* — Mission statement for the Mission Recap section

## Output

`impact_report_<period>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

The document contains:
1. **Cover** — title, reporting period, org name
2. **Letter from Leadership** — 1-paragraph placeholder with tone guide
3. **Mission Recap** — org mission or placeholder
4. **Outcomes at a Glance** — table: program | target | actual | narrative
5. **Impact Story** — anonymized participant story or placeholder
6. **Financial Summary** — revenue/expenses if provided, else placeholder
7. **Thank You / Acknowledgements** — top funders if provided
8. **Looking Ahead** — 1-paragraph placeholder

## Example invocation

```json
{
  "skill": "impact_report",
  "inputs": {
    "org_name": "Bridgepoint Futures",
    "report_type": "funder_report",
    "report_period": "January – June 2026",
    "program_outcomes": [
      {
        "program": "Pathways to Work",
        "target": "50 youth served",
        "actual": "63 youth served",
        "narrative": "Exceeded enrollment target by 26% due to expansion into two new employer partner sites."
      },
      {
        "program": "Pathways to Work — Employment Placement",
        "target": "50% job placement rate within 90 days",
        "actual": "68% placement rate",
        "narrative": "Placement rate exceeded target; average starting wage was $16.20/hour."
      }
    ],
    "funder_name": "Smith Family Foundation",
    "grant_amount": "$50,000",
    "total_revenue": "$580,000",
    "total_expenses": "$545,000",
    "participant_story": "One participant — we'll call her Maria — came to Pathways to Work after aging out of the school system without a job plan. Six months later, she accepted a full-time offer from a local healthcare company. 'I didn't know I could do this,' she told her job coach. 'Now I can't imagine not doing it.'",
    "top_funders": ["Smith Family Foundation", "City of Houston - CDBG", "Annenberg Foundation"],
    "org_mission": "Bridgepoint Futures empowers young adults with developmental disabilities to achieve economic independence and community belonging through workforce development and life skills training."
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `org_name`, `report_type`, `report_period`, and `program_outcomes` before calling. For `report_type="funder_report"`, also confirm `funder_name` and `grant_amount`.

After the skill produces the file, present it as a downloadable artifact and remind the user:
- "GENERATED DRAFT — pair with photos and a board signoff before publishing."
- Replace all [PLACEHOLDER] blocks with org-specific content
- Verify all outcome figures against your data system before submitting to any funder
- Have the Executive Director or Board Chair sign off on the Leadership Letter
