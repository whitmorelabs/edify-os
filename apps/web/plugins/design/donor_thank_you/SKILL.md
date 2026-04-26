---
name: donor_thank_you
description: Generate a warm 5x7" portrait thank-you card (1500x2100 at 300 DPI) for donor stewardship. Returns a downloadable PNG that reads like a real handwritten note — suitable as a social post, email graphic, or print card.
license: Complete terms in LICENSE.txt
---

# Donor Thank You

## When to use
Invoke `donor_thank_you` when the user wants to thank a donor, recognize a supporter, steward a major gift, or mark the anniversary of a relationship. This skill produces a warm, personal 5×7" portrait card — the kind of thing a donor would want to frame, not archive. It works equally well as a social media post ("look at the note we just sent our Giving Tuesday donors"), an email header graphic, or a physical printed card.

Do not use this for event invitations (use `gala_invite`) or general social media announcements (use `social_card`). `donor_thank_you` is specifically for the moment of gratitude — one donor, one message, one feeling.

## Inputs

- `donor_name` *(optional, string)* — Salutation name. If provided, rendered as "Dear [name]," at the top. If omitted, card opens directly with the gratitude message.
- `gratitude_message` *(required, string)* — The heart of the card. 1–3 sentences. Should feel personal, not boilerplate. Example: `"Your generosity made it possible for 47 families to stay housed this winter. That's not a statistic — that's 47 families waking up warm."`
- `org_name` *(required, string)* — The organization sending the card. Appears in the footer and/or signoff block.
- `signoff` *(optional, string)* — Closing phrase. Example: `"With deep gratitude,"`. Defaults to `"With gratitude,"`
- `signer_name` *(optional, string)* — Name of the person signing. Example: `"Maria Chen"`
- `signer_title` *(optional, string)* — Title below signer name. Example: `"Executive Director"`
- `brand_color` *(required, hex string)* — Primary brand color applied to accent elements. Warm tones (coral, teal, burgundy, gold) work especially well here.
- `accent_color` *(optional, hex string)* — Complementary tone for decorative flourishes. Defaults to a lighter tint of brand_color.

## Output

1500×2100 PNG portrait (5×7" at 300 DPI). Returned as a downloadable file artifact. The design evokes a physical note card: cream or white background, brand_color header accent, handsome typography, signoff block at bottom. Warm and personal, never corporate.

## Example invocation

```json
{
  "skill": "donor_thank_you",
  "inputs": {
    "donor_name": "The Rivera Family",
    "gratitude_message": "Your gift this year helped 12 young people find their first jobs. We carry your generosity with us every day.",
    "org_name": "Edify Nonprofit OS",
    "signoff": "With deep gratitude,",
    "signer_name": "Elena Torres",
    "signer_title": "Executive Director",
    "brand_color": "#6B3FA0",
    "accent_color": "#D4AF37"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Always confirm `gratitude_message`, `org_name`, and `brand_color` before calling. `donor_name` is optional — some orgs send a generic "Dear Friend," version for mass stewardship campaigns.

**Design philosophy:** The best thank-you cards feel handcrafted, not mail-merged. Emulate the warmth of a personal letter: generous margins, a serif-adjacent layout, the brand color used as a tasteful top border or decorative element rather than a dominating background. The gratitude message is the hero — set it at a comfortable reading size with loose leading. The signoff block should feel like someone actually signed it. Avoid gradients and busy patterns; this is about sincerity, not showmanship. A single decorative flourish (a thin rule, a small heart or star in the accent color) is all the ornament needed.
