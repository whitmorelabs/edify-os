---
name: volunteer_handbook_section
description: Generate a plain-language volunteer handbook section for a specific policy topic — code of conduct, safety, mandatory reporting, grievance procedure, confidentiality, boundaries with youth, or social media policy. Output is a formatted Word document ready for inclusion in a master handbook.
---

# Volunteer Handbook Section

## When to use
Invoke `volunteer_handbook_section` when the HR & Volunteer Coordinator user wants to draft, generate, or update a specific policy section for their volunteer handbook. Triggers include: "draft our code of conduct", "add a mandatory reporting section to our handbook", "write a social media policy for volunteers", "we need a confidentiality policy", "generate a boundaries policy for youth-serving volunteers", or "I need to write the [topic] section."

Do not use for recruitment (use `volunteer_recruitment_kit`) or recognition program design (use `recognition_program`).

## Inputs

- `topic` *(required, enum)* — The policy topic to generate. Must be one of:
  - `code_of_conduct` — behavioral standards, respect, professionalism, reporting
  - `safety_protocols` — emergency procedures, two-adult rule, incident reporting
  - `mandatory_reporting` — legal obligation to report abuse/neglect, step-by-step procedure
  - `grievance_procedure` — formal process for raising concerns, anti-retaliation
  - `confidentiality` — participant data protection, information access, digital hygiene
  - `boundaries_with_youth` — professional boundaries, contact rules, social media with participants
  - `social_media_policy` — online conduct, participant privacy, organizational representation
- `org_name` *(required, string)* — Name of the organization
- `population_served` *(optional, string)* — Who the organization serves. Examples: "youth ages 17–21", "adults with developmental disabilities", "general public". Affects language in safety, mandatory reporting, and boundaries sections.
- `org_specific_notes` *(optional, string)* — Freeform org-specific context, exceptions, or additional rules to include in the document. Example: "All volunteers must complete Darkness to Light training before starting" or "Our two-adult rule extends to all digital communications, not just in-person."

## Output

`volunteer_handbook_<topic>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

The document contains five sections:
1. **Purpose** — 1 paragraph explaining why this policy exists
2. **Scope** — 1 paragraph defining who it applies to and when
3. **Procedures and Expectations** — numbered step-by-step expectations (8–10 items)
4. **What To Do If...** — 3–5 common scenario FAQs with actionable answers
5. **Acknowledgement** — signature/date block for volunteer to sign

A Compliance Note at the bottom flags relevant laws and recommends legal review.

## Example invocation

```json
{
  "skill": "volunteer_handbook_section",
  "inputs": {
    "topic": "mandatory_reporting",
    "org_name": "Bridgepoint Futures",
    "population_served": "youth ages 17-21",
    "org_specific_notes": "All volunteers must complete our state-mandated mandated reporter training before beginning service. Training is tracked in our volunteer database."
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Before calling, confirm `topic` and `org_name`. `population_served` and `org_specific_notes` are optional but significantly improve the quality of the output for safety-related topics — ask for them if the user's request suggests working with a specific population.

**Nonprofit compliance flavor:** Each topic template is written with nonprofit-appropriate compliance language. The mandatory reporting section includes explicit language about reasonable suspicion (not certainty), the duty to escalate rather than investigate, and the prohibition on promising confidentiality. The boundaries_with_youth section is informed by the Darkness to Light / Stewards of Children framework. Safety protocols reference the two-adult rule. The compliance note at the bottom of each document flags relevant statutes and always recommends legal review before distribution — this is intentional and should not be edited out.

**Tone guidance:** Policies should feel protective, not punitive. The prose is designed to explain the "why" behind each rule, not just state the rule. This makes policies more likely to be read and followed by volunteers.

After the skill produces the file, present it as a downloadable artifact and recommend the user have it reviewed by HR counsel before adding it to their official handbook.
