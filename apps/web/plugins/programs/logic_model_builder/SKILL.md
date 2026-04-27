---
name: logic_model_builder
description: Generate a formatted logic model and theory of change narrative as a downloadable Word document — cover page, theory of change paragraph, 5-column logic model table, measurement indicators, assumptions, and external factors.
---

# Logic Model Builder

## When to use
Invoke `logic_model_builder` when the Programs Director user wants to design or document a program's theory of change. Triggers include: "build a logic model for [program]", "create our theory of change", "map out our inputs and outcomes", "design the program framework", or "we need a logic model for our grant". This skill produces a complete, structured .docx file — not a chat summary.

Do not use for funder outcome reports (use `grant_outcome_report`) or participant surveys (use `participant_survey`).

## Inputs

- `program_name` *(required, string)* — Name of the program. Example: "Pathways to Work"
- `target_population` *(required, string)* — Who the program serves. Example: "youth ages 17-21 with developmental disabilities"
- `org_name` *(required, string)* — Full name of the organization running the program
- `program_inputs` *(required, list of strings)* — Resources that go into the program: staff, funding, partners, materials. Example: ["2 FTE program staff", "$75,000 grant funding", "employer partners", "vocational curriculum"]
- `activities` *(required, list of strings)* — What the program does. Example: ["weekly job readiness workshops", "one-on-one career coaching", "employer site visits"]
- `outputs` *(required, list of strings)* — Directly countable products of activities. Example: ["150 youth served", "45 workshops delivered", "30 employer partnerships maintained"]
- `short_term_outcomes` *(required, list of strings)* — Knowledge, attitude, or skill changes (within 1 year). Example: ["increased workplace readiness skills", "improved self-advocacy", "stronger resume and interview skills"]
- `long_term_outcomes` *(required, list of strings)* — Behavior changes and mission impact (1-3+ years). Example: ["employment or post-secondary enrollment", "sustained job retention at 6 months", "increased financial independence"]
- `measurement_indicators` *(optional, list of strings)* — How each outcome is tracked. Example: ["pre/post competency assessment", "90-day follow-up survey", "employer check-in at 60 days"]
- `assumptions` *(optional, list of strings)* — What must be true for the model to work. Example: ["participants have access to transportation", "employers are willing to hire with job coaching support"]
- `external_factors` *(optional, list of strings)* — Context that affects program success. Example: ["local labor market conditions", "state funding for vocational rehabilitation"]

## Output

`logic_model_<program>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains:**
1. Cover page — program name, org name, date
2. Theory of Change narrative — 1 paragraph synthesizing inputs → activities → outcomes
3. Logic Model Table — 5 columns (Inputs | Activities | Outputs | Short-Term Outcomes | Long-Term Outcomes), header shading, formatted for readability
4. Measurement Indicators table — Outcome | Indicator | Data Source (3 columns)
5. Assumptions — numbered list
6. External Factors — numbered list
7. Compliance note: "Generated draft — review with Programs Director before submitting to funder."

## Example invocation

```json
{
  "skill": "logic_model_builder",
  "inputs": {
    "program_name": "Pathways to Work",
    "target_population": "youth ages 17-21 with developmental disabilities",
    "org_name": "Bridgepoint Futures",
    "program_inputs": ["2 FTE program staff", "$75,000 annual grant", "12 employer partners", "evidence-based vocational curriculum"],
    "activities": ["weekly job readiness workshops (12 weeks)", "one-on-one career coaching sessions", "employer site visits and job shadows", "post-placement check-in calls"],
    "outputs": ["150 youth enrolled per year", "45 group workshops delivered", "30 employer partnerships active", "90 individual coaching sessions"],
    "short_term_outcomes": ["increased workplace readiness skills", "improved resume and interview confidence", "expanded professional network"],
    "long_term_outcomes": ["competitive employment secured within 90 days", "6-month job retention", "increased financial independence"],
    "measurement_indicators": ["pre/post WorkKeys assessment", "90-day placement survey", "employer satisfaction survey at 60 days"],
    "assumptions": ["participants have transportation to program site", "employers are willing to hire with job coach support"],
    "external_factors": ["local unemployment rate", "state vocational rehabilitation waitlist length"]
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `program_name`, `target_population`, `org_name`, `program_inputs`, `activities`, `outputs`, `short_term_outcomes`, and `long_term_outcomes` before calling. Optional fields (`measurement_indicators`, `assumptions`, `external_factors`) enrich the document but are not required.

The theory of change paragraph is generated from the inputs — it reads as a coherent narrative, not a list. The logic model table spans the full page width with evenly distributed columns and shaded headers.

After the skill produces the file, present it as a downloadable artifact and remind the user to:
- Review the theory of change narrative for accuracy
- Confirm all outcome indicators match their data collection systems
- Share the logic model with funders and program staff for alignment
