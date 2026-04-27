---
name: social_card
description: Generate a polished 1080x1080 social media graphic (Instagram square, Facebook post, LinkedIn carousel slide) for nonprofit use. Takes brand colors, headline, and optional copy, then returns a downloadable PNG.
license: Complete terms in LICENSE.txt
---

# Social Card

## When to use
Invoke `social_card` when the user asks for a social media post graphic, an Instagram square, a Facebook post image, a LinkedIn carousel slide, or any standalone 1:1-ratio visual. Ideal for cause awareness posts, event announcements, campaign launches, volunteer shout-outs, and impact stats. This skill produces a single polished 1080×1080 PNG — the standard shareable unit for nonprofit social media.

Use `social_card` instead of `canvas-design` when the user needs a templated, nonprofit-appropriate graphic fast, rather than an open-ended artistic composition. `canvas-design` is for museum-quality art objects; `social_card` is for publishable social media ready in one call.

## Inputs

- `headline` *(required, string)* — Hero text displayed large. Keep to 3–8 words for best layout. Example: `"Your gift feeds hope."`
- `subheadline` *(optional, string)* — Secondary line below headline. 10–20 words max.
- `cta` *(optional, string)* — Bottom call-to-action text or hashtag. Example: `"Donate today at edify.org"` or `"#GivingTuesday"`
- `brand_color` *(required, hex string)* — Primary background or accent color. Example: `"#1A4D6E"`
- `secondary_color` *(optional, hex string)* — Accent or text contrast color. Defaults to white or a computed complement.
- `font_style` *(optional, enum: `serif` / `sans-serif` / `elegant` / `bold`)* — Visual personality. Defaults to `sans-serif`.
- `org_name` *(optional, string)* — Small footer attribution text. Example: `"Edify Nonprofit OS"`

## Output

1080×1080 PNG. Returned as a downloadable file artifact in chat. Design uses brand_color as the dominant background, headline as the visual hero, and optional subheadline/CTA as supporting layers. Geometric accent shapes and generous white space ensure it reads cleanly as a thumbnail.

## Example invocation

```json
{
  "skill": "social_card",
  "inputs": {
    "headline": "You make hope possible.",
    "subheadline": "Every dollar goes directly to our youth programs.",
    "cta": "Donate at edify.org",
    "brand_color": "#2D7D6F",
    "secondary_color": "#FFFFFF",
    "font_style": "elegant",
    "org_name": "Edify Nonprofit OS"
  }
}
```

## Implementation notes

Assemble inputs into a `render(**inputs)` call against `render.py`. Confirm `headline` and `brand_color` before calling — everything else has defaults.

**Design philosophy:** Nonprofit social cards should feel trustworthy and warm, not corporate. The brand color anchors the composition; the headline is set large and centered with generous breathing room. A thin horizontal accent line or geometric shape (circle, rounded rectangle) drawn in a complementary tone adds visual polish without clutter. Footer attribution is set small (12–14pt) at the bottom margin. Think: one strong typographic statement, one supporting idea, one clear action — no more. Clean enough that a supporter shares it without hesitation.
