---
name: donor_stewardship_sequence
description: Generate a 3-touch donor stewardship package as a Word document — acknowledgement letter, thank-you call script, and 60-90 day impact update email — personalized to a specific gift.
---

# Donor Stewardship Sequence

## When to use
Invoke `donor_stewardship_sequence` when the Development Director user wants to steward a donor after a gift. Triggers include: "write a thank-you letter for [donor]", "stewardship sequence for [donor name]", "draft follow-up touchpoints after a major gift", "help me acknowledge [donor]'s donation", or "create a 3-touch stewardship plan." This skill produces a complete, structured .docx file with all 3 touches — not a chat summary.

Do not use for grant proposals (use `grant_proposal_writer`) or impact reports (use `impact_report`).

## Inputs

- `donor_name` *(required, string)* — Full name of the donor. Example: "Margaret Chen"
- `gift_amount` *(required, string)* — Dollar amount of the gift. Example: "$5,000"
- `gift_date` *(required, string)* — Date the gift was received. Example: "April 15, 2026"
- `org_name` *(required, string)* — Full name of the organization
- `signer_name` *(required, string)* — Name of the person signing the acknowledgement letter
- `signer_title` *(required, string)* — Title of the signer. Example: "Executive Director"
- `donor_salutation` *(optional, string)* — How to address the donor formally. Example: "Dr. Chen", "Ms. Chen". Default: donor's first name
- `gift_purpose` *(optional, string)* — What the gift supports. Example: "general operating", "scholarship fund", "youth workforce program". Default: "general operating"
- `program_impact_data` *(optional, string)* — Recent outcome data to reference in the impact email. Example: "This year we served 127 youth, 68% of whom secured employment."
- `donor_giving_history_summary` *(optional, string)* — Notes on the donor's history. Example: "First-time donor, referred by board member Jane Smith"

## Output

`donor_stewardship_<donor>_<timestamp>.docx` saved to `/mnt/user-data/outputs/`.

The document contains 3 touches separated by page breaks:
1. **Touch 1 — Acknowledgement Letter** (within 48 hours): formal letter with thank-you, gift details, IRS language, and signature block
2. **Touch 2 — Thank-You Call Script** (within 1 week): conversational outline with talking points, impact bridge, and next-ask suggestion
3. **Touch 3 — Impact Update Email** (60-90 days post-gift): subject line + email body with program impact, story bridge, and soft next step

## Example invocation

```json
{
  "skill": "donor_stewardship_sequence",
  "inputs": {
    "donor_name": "Margaret Chen",
    "gift_amount": "$5,000",
    "gift_date": "April 15, 2026",
    "org_name": "Bridgepoint Futures",
    "signer_name": "Dr. Angela Torres",
    "signer_title": "Executive Director",
    "donor_salutation": "Dr. Chen",
    "gift_purpose": "Pathways to Work scholarship fund",
    "program_impact_data": "This year, Bridgepoint served 127 youth, 68% of whom secured employment or enrolled in post-secondary programs within 90 days.",
    "donor_giving_history_summary": "First-time major gift donor. Referred by board member Jane Smith. Works in healthcare, has expressed interest in workforce outcomes."
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `donor_name`, `gift_amount`, `gift_date`, `org_name`, `signer_name`, and `signer_title` before calling. Optional fields meaningfully personalize the output — especially `donor_salutation`, `gift_purpose`, and `program_impact_data`.

The IRS acknowledgement language in Touch 1 is standard boilerplate. Remind the user to confirm their organization's legal name matches IRS records before sending.

After the skill produces the file, present it as a downloadable artifact and remind the user to:
- Fill in the [ADDRESS BLOCK] placeholder in the acknowledgement letter
- Schedule Touch 2 (call) within 7 days of receipt
- Calendar Touch 3 (email) at 60-90 days post-gift
- Personalize the call script talking points with any specific knowledge about the donor
