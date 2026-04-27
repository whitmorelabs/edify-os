---
name: flyer
description: Generate a print-ready US Letter portrait flyer (8.5x11", 2550x3300 at 300 DPI) for events, announcements, and program details. Returns a downloadable PNG suitable for printing or sharing digitally.
license: Complete terms in LICENSE.txt
---

# Flyer

## When to use
Invoke `flyer` when the user asks for a printable handout, a program flyer, an event announcement, or anything they might print and post on a bulletin board or email as a PDF-quality image. Ideal for volunteer recruitment, fundraiser events, program enrollment announcements, or community outreach.

Use `flyer` over `canvas-design` when the user needs a structured, information-rich layout (event details, bullet points, venue, date, CTA URL) rather than an artistic open-ended composition. `flyer` prioritizes clarity and print readiness; `canvas-design` prioritizes artistic expression.

## Inputs

- `headline` *(required, string)* — Event name or primary announcement. Example: `"Fall Fundraiser Dinner"`
- `subheadline` *(optional, string)* — Tagline or date range beneath the headline.
- `body_text` *(optional, string)* — One paragraph of details (description, mission context, or call to community).
- `bullet_points` *(optional, array of strings)* — Up to 5 key highlights or program features. Example: `["Live auction", "Silent raffle", "Dinner included"]`
- `date` *(optional, string)* — Event date in display format. Example: `"Saturday, November 8, 2026"`
- `time` *(optional, string)* — Event start time. Example: `"6:00 PM – 9:00 PM"`
- `venue` *(optional, string)* — Location name and address.
- `cta` *(optional, string)* — Primary call-to-action text. Example: `"Register Today"`
- `cta_url` *(optional, string)* — URL printed below the CTA. Example: `"edify.org/gala"`
- `brand_color` *(required, hex string)* — Primary brand color applied to header band and accents.
- `secondary_color` *(optional, hex string)* — Secondary accent. Defaults to a tint of brand_color.
- `org_name` *(optional, string)* — Organization name for footer attribution.

## Output

2550×3300 PNG at 300 DPI (US Letter portrait). Returned as a downloadable file artifact. The layout uses a branded header band with the headline, a structured body area for details and bullet points, and a bold CTA section at the bottom. Ready for print or digital distribution.

## Example invocation

```json
{
  "skill": "flyer",
  "inputs": {
    "headline": "Fall Fundraiser Dinner",
    "subheadline": "An evening of impact and community",
    "body_text": "Join us for a night celebrating the families we serve. Your presence makes a difference.",
    "bullet_points": ["Live auction", "Gourmet dinner", "Impact stories from families"],
    "date": "Saturday, November 8, 2026",
    "time": "6:00 PM – 9:00 PM",
    "venue": "The Grand Pavilion, 500 Main Street, Chicago IL",
    "cta": "Reserve Your Seat",
    "cta_url": "edify.org/fundraiser",
    "brand_color": "#1A3C5E",
    "secondary_color": "#C89B3C",
    "org_name": "Edify Nonprofit OS"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Confirm `headline` and `brand_color` before calling. If the user provides event details (date, venue, time), include them; otherwise the layout gracefully omits empty sections.

**Design philosophy:** Print flyers for nonprofits work best when they communicate hierarchy — the event name commands attention, the logistics answer "when and where," and the CTA closes the deal. Use the brand_color as a full-width header band and a matching footer strip, leaving the body on a white or very light background for maximum readability when printed in grayscale on a home printer. Bullet points should feel like a preview, not a brochure dump. Body text at 18–20pt. Resist the urge to fill every pixel — white space signals confidence and makes the event feel prestigious.
