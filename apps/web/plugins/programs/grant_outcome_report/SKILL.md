---
name: grant_outcome_report
description: Generate a funder-ready grant outcome report as a Word document — cover page, executive summary, performance-against-deliverables table (with auto-computed % of target and R/Y/G color coding), program narrative, participant story, challenges, and next period plan.
---

# Grant Outcome Report

## When to use
Invoke `grant_outcome_report` when the Programs Director user needs to report to a funder on grant deliverables. Triggers include: "write the outcome report for [funder]", "draft our mid-year grant report", "we need to report to [foundation]", "help me fill out our grant deliverables", or "put together the funder report for [period]". This skill produces a complete, structured .docx file — not a chat summary.

Do not use for full grant proposals (use Development Director's `grant_proposal_writer`) or logic models (use `logic_model_builder`).

## Inputs

- `grant_name` *(required, string)* — Name of the grant. Example: "Workforce Readiness Initiative Grant"
- `funder_name` *(required, string)* — Name of the funder. Example: "Smith Family Foundation"
- `grant_amount` *(required, string)* — Total grant award. Example: "$75,000"
- `org_name` *(required, string)* — Full name of the reporting organization
- `program_name` *(required, string)* — What the grant funded. Example: "Pathways to Work"
- `report_period` *(required, string)* — Reporting period. Example: "January–June 2026"
- `deliverable_targets` *(required, list of objects)* — Each deliverable with target and actual:
  ```json
  [
    {"deliverable": "Serve 100 youth", "target_value": 100, "actual_value": 127, "narrative": "We exceeded enrollment due to strong school referral partnerships."},
    {"deliverable": "Deliver 40 workshops", "target_value": 40, "actual_value": 38, "narrative": "Two workshops were rescheduled due to a facility closure; will be completed in Q3."}
  ]
  ```
- `participant_story` *(optional, string)* — Anonymized participant story (first name only or pseudonym). Example: "Marcus, age 19, entered the program without work experience..."
- `program_narrative` *(optional, string)* — What happened during the reporting period: key activities, events, partnerships, highlights
- `challenges_encountered` *(optional, list of strings)* — Honest challenges and how they were addressed. Example: ["Transportation barriers reduced attendance in Month 2", "Staff vacancy for 6 weeks impacted coaching capacity"]
- `next_period_plan` *(optional, string)* — What the organization plans to accomplish in the next reporting period

## Output

`grant_outcome_report_<grant>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains:**
1. Cover page — grant name, funder, reporting period, org name, report date
2. Executive Summary — 1 paragraph synthesizing performance and highlights
3. Performance Against Deliverables — table with columns: Deliverable | Target | Actual | % of Target | Notes; auto-computed percentage; color-coded status (green ≥100%, amber 75-99%, red <75%)
4. Program Narrative — structured paragraph(s) on what happened
5. Participant Story — anonymized, formatted as a pull-quote block (if provided)
6. Challenges and Adaptations — bulleted list framing challenges as learning
7. Next Reporting Period Plan — forward-looking paragraph
8. Compliance note: "Generated draft — pair with photos and program-specific details before submission to funder."

## Color coding logic

| % of Target | Status |
|-------------|--------|
| ≥ 100%      | Green (on/above target) |
| 75–99%      | Amber (approaching target) |
| < 75%       | Red (below target — explanation required) |

## Example invocation

```json
{
  "skill": "grant_outcome_report",
  "inputs": {
    "grant_name": "Workforce Readiness Initiative Grant",
    "funder_name": "Smith Family Foundation",
    "grant_amount": "$75,000",
    "org_name": "Bridgepoint Futures",
    "program_name": "Pathways to Work",
    "report_period": "January–June 2026",
    "deliverable_targets": [
      {"deliverable": "Serve 100 youth", "target_value": 100, "actual_value": 127, "narrative": "Exceeded due to strong school referral partnerships."},
      {"deliverable": "Deliver 40 job readiness workshops", "target_value": 40, "actual_value": 38, "narrative": "Two sessions rescheduled; will be completed in Q3."},
      {"deliverable": "Place 50 participants in employment", "target_value": 50, "actual_value": 31, "narrative": "Labor market tightening impacted placement timelines; adding employer outreach in Q3."}
    ],
    "participant_story": "Marcus, 19, came to Pathways to Work after aging out of his school's transition program. After 12 weeks of coaching, he started his first job at a local grocery distribution center — his first paycheck arrived on his birthday.",
    "program_narrative": "The first half of 2026 focused on cohort enrollment, curriculum delivery, and employer partner cultivation. We launched a new employer breakfast series that brought in 8 new hiring partners.",
    "challenges_encountered": ["Transportation barriers reduced attendance in Month 2 by approximately 12%", "A staff vacancy from February to mid-March impacted coaching capacity for one cohort"],
    "next_period_plan": "In Q3-Q4 2026, we will focus on placement acceleration, post-placement retention support, and completing the two rescheduled workshops. We will also conduct our 90-day follow-up survey with the January cohort graduates."
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `grant_name`, `funder_name`, `grant_amount`, `org_name`, `program_name`, `report_period`, and `deliverable_targets` before calling. Optional fields enrich the narrative sections but are not required.

The performance table auto-computes percentage = (actual_value / target_value) × 100. Color coding is applied to the Status column. Red rows include a note that explanation is required. The document uses the same professional heading style as other Edify programs skills.

After the skill produces the file, present it as a downloadable artifact and remind the user to:
- Add photos, participant photos (with consent), or program activity images
- Have the Executive Director review before submission
- Attach any required financial documentation per funder guidelines
