---
name: post_event_report
description: Generate a post-event debrief and wrap-up report as a Word document — executive summary, by-the-numbers table with auto-computed ROI, cost breakdown, survey highlights, what worked/didn't, and next-year recommendations. Designed for nonprofit galas, fundraisers, and programs.
---

# Post-Event Report

## When to use
Invoke `post_event_report` when the Events Director user needs to document what happened after an event. Triggers include: "write a post-event report for [event]", "create an event debrief", "draft the wrap-up report for our gala", "we need the post-event summary", or "help me document the event outcomes". This skill produces a structured .docx file — not a chat summary.

Do not use for run-of-show planning (use `run_of_show`) or sponsor outreach (use `sponsor_package`).

## Inputs

- `event_name` *(required, string)* — Name of the event. Example: "Spring Gala 2026"
- `event_date` *(required, string)* — Date of the event. Example: "May 15, 2026"
- `org_name` *(required, string)* — Full name of the organization
- `attendance` *(required, integer)* — Number of attendees
- `revenue_raised` *(required, number or string)* — Total revenue (ticket sales + donations + sponsorships). Example: 125000
- `costs_total` *(required, number or string)* — Total event costs. Example: 42000
- `cost_breakdown` *(optional, list of objects)* — Itemized costs:
  ```json
  [
    {"category": "Venue", "amount": 15000},
    {"category": "Catering", "amount": 18000},
    {"category": "AV / Production", "amount": 5000},
    {"category": "Printing / Materials", "amount": 2000},
    {"category": "Entertainment", "amount": 2000}
  ]
  ```
- `survey_results` *(optional, string or list of objects)* — Survey feedback. Either freeform string or:
  ```json
  [{"question": "Overall satisfaction", "summary": "4.6/5 average across 87 respondents"}]
  ```
- `donor_acquisition_count` *(optional, integer)* — Net new donors from the event
- `what_worked` *(optional, list of strings)* — What went well
- `what_didnt_work` *(optional, list of strings)* — What to improve
- `next_year_recommendations` *(optional, list of strings)* — Suggestions for next year

## Output

`post_event_report_<event>_<date>.docx` saved to `/mnt/user-data/outputs/`.

The document contains:
1. **Cover** — event name, date, report date, prepared by org name
2. **Executive Summary** — 1 paragraph: attendance + revenue + net + ROI
3. **By the Numbers** — table: Attendance, Revenue, Total Costs, Net Revenue, Donor Acquisition, ROI %
4. **Cost Breakdown** — table if provided, else placeholder
5. **Survey Highlights** — if provided
6. **What Worked** — bullet list
7. **What Didn't Work** — bullet list
8. **Recommendations for Next Year** — bullet list
9. **Appendix: Vendor + Sponsor List** — placeholder

## Auto-computed fields

- **Net Revenue** = revenue_raised − costs_total
- **ROI %** = (revenue_raised − costs_total) / costs_total × 100 (rounded to 1 decimal)

## Example invocation

```json
{
  "skill": "post_event_report",
  "inputs": {
    "event_name": "Spring Gala 2026",
    "event_date": "May 15, 2026",
    "org_name": "Bridgepoint Futures",
    "attendance": 238,
    "revenue_raised": 127500,
    "costs_total": 41200,
    "cost_breakdown": [
      {"category": "Venue", "amount": 14000},
      {"category": "Catering", "amount": 16500},
      {"category": "AV / Production", "amount": 5200},
      {"category": "Printing & Materials", "amount": 2100},
      {"category": "Entertainment", "amount": 2400},
      {"category": "Staffing", "amount": 1000}
    ],
    "survey_results": [
      {"question": "Overall event satisfaction", "summary": "4.7 / 5.0 average across 94 respondents"},
      {"question": "Likelihood to attend again", "summary": "91% said 'Yes' or 'Very likely'"},
      {"question": "Program / speaker quality", "summary": "4.5 / 5.0 — attendees praised the impact video and Fund-a-Need appeal"}
    ],
    "donor_acquisition_count": 18,
    "what_worked": [
      "Fund-a-Need appeal exceeded goal by 22% — live ask by ED was highly effective",
      "New venue layout improved sightlines and flow to main stage",
      "Impact video generated strong emotional response and drove appeal momentum",
      "VIP reception created meaningful donor stewardship moments before main event"
    ],
    "what_didnt_work": [
      "Registration line at entry created a 20-minute wait — need more check-in stations",
      "Raffle drawing ran 12 minutes over — compress or move to cocktail hour",
      "Parking signage was unclear — received 8 complaints from guests"
    ],
    "next_year_recommendations": [
      "Add 2 additional check-in stations and implement digital check-in via QR code",
      "Move raffle to cocktail hour to preserve main program pacing",
      "Negotiate venue to include valet service or hire parking attendants",
      "Begin sponsor outreach 10 weeks out — this year's 8-week lead time was tight",
      "Explore hybrid viewing option for donors who cannot attend in person"
    ]
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `event_name`, `event_date`, `org_name`, `attendance`, `revenue_raised`, and `costs_total` before calling. All other fields are optional but improve the usefulness of the report.

After the skill produces the file, present it as a downloadable artifact. Remind the user to:
- Verify all financial figures against actuals before sharing with the board or funders
- Add vendor and sponsor names to the Appendix placeholder
- Share with the full events team as part of the post-event debrief meeting
