---
name: participant_survey
description: Generate a ready-to-use participant survey instrument as a Word document — intake, satisfaction, outcome, or exit survey with 10-15 questions, cover page, privacy statement, and scoring guide (for outcome surveys).
---

# Participant Survey

## When to use
Invoke `participant_survey` when the Programs Director user wants to collect data from program participants. Triggers include: "create an intake form for [program]", "build a satisfaction survey", "we need an outcome survey", "design our exit interview questions", "draft a survey for participants", or "we need a pre/post assessment tool". This skill produces a complete, print-ready .docx file — not a plain list of questions.

Do not use for grant reports (use `grant_outcome_report`) or program planning (use `logic_model_builder`).

## Inputs

- `survey_type` *(required, enum)* — Type of survey instrument:
  - `intake` — demographics, baseline self-assessment, program expectations, accessibility needs, contact preferences
  - `satisfaction` — facility/service experience, staff interactions, content quality, NPS, open feedback
  - `outcome` — pre vs post baseline, learning gains, behavior changes, self-reported impact, quotes
  - `exit` — reasons for leaving, what worked, what didn't, would-return likelihood, suggestions
- `program_name` *(required, string)* — Name of the program. Example: "Pathways to Work"
- `org_name` *(required, string)* — Full name of the organization
- `target_population` *(required, string)* — Who will complete the survey: "youth", "adults", "parents", "general"
- `program_focus` *(optional, string)* — Program domain to tailor questions. Example: "workforce development", "mental health", "education", "housing"
- `additional_topics` *(optional, list of strings)* — Extra question areas to weave into the survey. Example: ["transportation barriers", "childcare needs", "language preference"]
- `language_level` *(optional, enum)* — `plain` (default, plain language, 6th grade reading level) or `formal` (professional tone, for staff or board surveys)

## Output

`survey_<type>_<program>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

**Document contains:**
- Cover page — org logo placeholder, survey title, intro paragraph, privacy/voluntary statement
- 10-15 questions grouped into 3-5 thematic sections
- Mix of question types: Likert 5-point scale, multiple choice with ☐ checkboxes, open-ended (blank lines), rank-order
- Scoring guide at the end (outcome surveys only)
- Footer: "This survey is voluntary and your responses are confidential."

**Survey type templates:**
- **intake:** Section 1: About You (demographics) | Section 2: Your Starting Point (baseline self-assessment) | Section 3: What to Expect (program goals + expectations) | Section 4: Your Needs (accessibility + communication preferences)
- **satisfaction:** Section 1: Overall Experience | Section 2: Staff and Services | Section 3: Program Content | Section 4: Would You Recommend Us? (NPS) | Section 5: Your Voice (open feedback)
- **outcome:** Section 1: Thinking Back (baseline recall) | Section 2: What You Learned (knowledge gains) | Section 3: Changes You've Made (behavior) | Section 4: Your Impact Story | Section 5: Looking Ahead
- **exit:** Section 1: Your Time with Us | Section 2: What Worked | Section 3: What Could Be Better | Section 4: Next Steps | Section 5: Final Thoughts

## Example invocation

```json
{
  "skill": "participant_survey",
  "inputs": {
    "survey_type": "intake",
    "program_name": "Pathways to Work",
    "org_name": "Bridgepoint Futures",
    "target_population": "youth",
    "program_focus": "workforce development",
    "additional_topics": ["transportation needs", "technology access"],
    "language_level": "plain"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `survey_type`, `program_name`, `org_name`, and `target_population` before calling. Optional fields adjust tone and add custom topics.

The skill hardcodes standard nonprofit question templates for each survey type — it does not ask the model to generate arbitrary questions. Custom `additional_topics` are woven into the most relevant section.

Question formatting conventions:
- Likert: 1-row scale with labeled anchors (Strongly Disagree → Strongly Agree)
- Multiple choice: ☐ inline checkbox before each option
- Open-ended: 3 blank lines for handwritten responses
- Rank-order: numbered options with "1 = most important" instruction

After the skill produces the file, present it as a downloadable artifact and remind the user to:
- Pilot the survey with 2-3 participants before full rollout
- Add any program-specific questions in the bracketed placeholder sections
- Translate the survey if participants use languages other than English
