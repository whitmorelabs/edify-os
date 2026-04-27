---
name: volunteer_recruitment_kit
description: Build a complete volunteer-role recruitment package as a downloadable Word document — role description, 3-channel outreach text, and structured screening questions with scoring rubrics.
---

# Volunteer Recruitment Kit

## When to use
Invoke `volunteer_recruitment_kit` when the HR & Volunteer Coordinator user wants to recruit for a specific volunteer role. Triggers include: "post a volunteer role", "we need to recruit a Youth Mentor", "draft a recruitment package for X", "help us find volunteers for our program", or "write something to announce a volunteer opening." This skill produces a complete, ready-to-use .docx kit — not a chat summary.

Do not use for recognition program design (use `recognition_program`) or handbook policy writing (use `volunteer_handbook_section`).

## Inputs

- `role_name` *(required, string)* — Title of the volunteer role. Examples: "Youth Mentor", "Event Volunteer", "Tech Support Volunteer"
- `time_commitment` *(required, string)* — Specific time expectation. Examples: "4 hours/month", "Saturdays 9am–1pm", "2 evenings per week"
- `program_area` *(required, string)* — Description of the program the volunteer supports. Examples: "workforce development for young adults", "afterschool tutoring", "food pantry operations"
- `org_name` *(required, string)* — Full name of the organization
- `required_skills` *(optional, list of strings)* — Skills that are required. Examples: ["bilingual Spanish", "valid driver's license", "comfortable with kids"]
- `nice_to_have_skills` *(optional, list of strings)* — Preferred but not required skills. Examples: ["experience with Salesforce", "CPR certified"]
- `commitment_length` *(optional, string)* — Duration expectation. Examples: "6 months minimum", "ongoing", "one-time event"

## Output

`volunteer_recruitment_kit_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

The document contains three sections:

1. **Role Description** — formatted with title, mission line, responsibilities, skills, time commitment, and an equity statement
2. **Outreach Drafts** — three channel-specific drafts:
   - Social media post (hook + ask + link placeholder + hashtags)
   - Email to community partners (subject + 4-sentence body + warm signoff)
   - Flyer text (headline + bullet + CTA)
3. **Screening Questions** — 5–7 questions covering motivation, behavioral competencies, availability, safety judgment, and goal alignment, each with question type label and scoring rubric guidance

## Example invocation

```json
{
  "skill": "volunteer_recruitment_kit",
  "inputs": {
    "role_name": "Youth Mentor",
    "time_commitment": "Saturdays 9am–1pm",
    "program_area": "workforce readiness for youth ages 17–21",
    "org_name": "Bridgepoint Futures",
    "required_skills": ["comfortable working with young adults", "reliable transportation"],
    "nice_to_have_skills": ["bilingual English/Spanish", "background in career counseling"],
    "commitment_length": "6 months minimum"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Before calling, confirm `role_name`, `time_commitment`, `program_area`, and `org_name`. The skill works with only those four required fields — `required_skills`, `nice_to_have_skills`, and `commitment_length` are optional.

**Nonprofit-appropriate tone:** The outreach copy should feel welcoming and mission-driven, not corporate. The screening questions are structured to reduce bias and explicitly flag safety scenarios (mandatory reporting, working with vulnerable populations). The equity statement in the role description is always included — do not omit it.

After the skill produces the file, present it as a downloadable artifact in chat and suggest the user replace `[APPLICATION LINK]` and `[EMAIL/PHONE]` placeholders before publishing.
