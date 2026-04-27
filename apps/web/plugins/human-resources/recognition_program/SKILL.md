---
name: recognition_program
description: Design a tiered volunteer recognition program and generate a downloadable Excel workbook with a Program Design sheet (tiers, milestones, recognition examples, cost estimates) and a Tracking Template roster.
---

# Recognition Program

## When to use
Invoke `recognition_program` when the HR & Volunteer Coordinator user wants to build, formalize, or overhaul their volunteer recognition program. Triggers include: "set up our volunteer recognition", "design a recognition program", "how should we recognize volunteers at 25/50/100 hours", "create milestones for our volunteer program", or "I need a tracking sheet for recognition."

Do not use for recruitment (use `volunteer_recruitment_kit`) or handbook policy writing (use `volunteer_handbook_section`).

## Inputs

- `org_name` *(required, string)* — Name of the organization
- `milestone_types` *(required, list of objects)* — Defines the recognition tiers. Each object has a `type` field and optional `values` list:
  - `{"type": "hours", "values": [25, 50, 100]}` — hour-based milestones
  - `{"type": "tenure", "values": ["6mo", "1yr", "2yr"]}` — tenure-based milestones
  - `{"type": "special_contribution"}` — discretionary spotlight award (no values needed)
- `recognition_budget` *(optional, string)* — Total or per-award budget. Examples: "$500/year", "$25 per award", "none". Used to calibrate cost estimate language.
- `program_focus` *(optional, string)* — The program or community the volunteers serve. Examples: "youth services", "food security", "housing support". Used to personalize award language.

## Output

`recognition_program_<timestamp>.xlsx` saved to `/mnt/user-data/outputs/`.

Two sheets:

1. **Program Design** — table with columns: Tier, Milestone, Recognition Type, Examples, Estimated Cost. Also includes implementation notes below the table.
2. **Tracking Template** — 20-row roster with columns: Volunteer Name, Start Date, Hours Logged, Last Recognition Date, Recognition Given, Next Milestone, Owner. Frozen headers, alternating row shading.

## Example invocation

```json
{
  "skill": "recognition_program",
  "inputs": {
    "org_name": "Bridgepoint Futures",
    "milestone_types": [
      {"type": "hours", "values": [25, 50, 100]},
      {"type": "tenure", "values": ["6mo", "1yr", "2yr"]},
      {"type": "special_contribution"}
    ],
    "recognition_budget": "$1,000/year",
    "program_focus": "youth services"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Before calling, confirm `org_name` and `milestone_types`. The `recognition_budget` and `program_focus` fields are optional — the skill generates sensible defaults if omitted.

**Nonprofit-appropriate design philosophy:** Recognition in nonprofits is often constrained by budget but not by creativity. The generated Program Design table skews toward low-cost, high-meaning recognition (handwritten notes, public shoutouts, leadership acknowledgment) alongside tangible gifts where budget allows. Cost estimates are intentionally ranges, not fixed numbers — actual costs depend on local vendors and procurement. The tracking template is intentionally simple: one row per volunteer, no formulas, easy for any coordinator to maintain in Excel or Google Sheets.

After the skill produces the file, present it as a downloadable artifact and suggest the user add it to their volunteer management folder in Drive.
