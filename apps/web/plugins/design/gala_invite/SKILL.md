---
name: gala_invite
description: Generate a formal save-the-date or event invite for galas, fundraising dinners, and anniversary celebrations. Defaults to 1080x1080 square (IG/social); pass format="portrait" for a 1500x2100 print card. Returns a downloadable PNG.
license: Complete terms in LICENSE.txt
---

# Gala Invite

## When to use
Invoke `gala_invite` when the user wants a formal event invitation, a save-the-date graphic, or a fundraising gala announcement. This skill is tuned for prestigious nonprofit events — galas, benefit dinners, anniversary celebrations, major donor events. The aesthetic defaults to elegant: deep background tones, gold or champagne accents, refined typography.

Use `gala_invite` over `social_card` when the occasion calls for formality and visual gravitas rather than a casual social post. Use the `portrait` format option when the output is destined for print or email as a physical-feeling invite card; use the default `square` format for social media distribution.

## Inputs

- `event_name` *(required, string)* — The name of the gala or event. Example: `"The Lights of Hope Gala"`
- `tagline` *(optional, string)* — A brief poetic subline beneath the event name. Example: `"Hope is worth celebrating."`
- `date` *(required, string)* — Display-format date. Example: `"Saturday, October 17, 2026"`
- `time` *(optional, string)* — Event start time. Example: `"7:00 PM"`
- `venue` *(required, string)* — Venue name and city. Example: `"The Avalon Ballroom, New York City"`
- `cta` *(optional, string)* — RSVP or action phrase. Example: `"Reserve Your Seat"` or `"RSVP by September 15"`
- `cta_url` *(optional, string)* — URL printed elegantly below the CTA. Example: `"edify.org/gala2026"`
- `brand_color` *(required, hex string)* — Primary deep tone for the background. Elegant choices: deep purple (`#2D1B4E`), navy (`#0F2044`), burgundy (`#5C1A2E`), forest green (`#1A3C2A`).
- `accent_color` *(optional, hex string)* — Metallic or light accent. Classic choices: gold (`#D4AF37`), champagne (`#F7E7CE`), silver (`#C0C0C0`). Defaults to a warm gold.
- `format` *(optional, enum: `square` / `portrait`)* — Output canvas. `square` = 1080×1080 (default, for social media). `portrait` = 1500×2100 (for print/email invite card).

## Output

**Square (default):** 1080×1080 PNG — optimized for Instagram and LinkedIn.
**Portrait:** 1500×2100 PNG — 5×7" at 300 DPI, print-ready.

Returned as a downloadable file artifact. Both formats use a dark, jewel-toned background, accent-color typographic hierarchy, and formal centered layout. Decorative rules, thin borders, or subtle geometric elements frame the content without cluttering it.

## Example invocation

```json
{
  "skill": "gala_invite",
  "inputs": {
    "event_name": "The Lights of Hope Gala",
    "tagline": "An evening of impact, elegance, and hope.",
    "date": "Saturday, October 17, 2026",
    "time": "7:00 PM",
    "venue": "The Avalon Ballroom, New York City",
    "cta": "Reserve Your Seat",
    "cta_url": "edify.org/gala2026",
    "brand_color": "#2D1B4E",
    "accent_color": "#D4AF37",
    "format": "square"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Confirm `event_name`, `date`, `venue`, and `brand_color` before calling — these four are load-bearing for any readable invite. `accent_color` defaults to gold if not provided, which works for most deep-tone brand colors.

**Design philosophy:** Gala invitations communicate prestige through restraint. Deep jewel tones (navy, purple, burgundy) with a gold or champagne accent signal occasion without shouting. All text is centered and arranged in a clear hierarchy: event name large and prominent at upper center, tagline in a lighter italic weight below, then a thin decorative rule, then the logistics (date / time / venue) in spaced-out caps, then the CTA at the bottom. Margins should be substantial — crowding the invite undermines its formality. The accent color appears in typographic details (the rule, the CTA, perhaps a decorative ornament) rather than as a background, preserving the elegant dark-background feel that reads as upscale. Think invitation suite from a museum benefit dinner, not an event flyer.
