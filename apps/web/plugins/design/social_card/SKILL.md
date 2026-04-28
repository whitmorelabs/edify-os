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

**Design philosophy:** Nonprofit social cards should feel trustworthy and warm, not corporate. The brand color anchors the composition; the headline is set large with generous breathing room. Think: one strong typographic statement, one supporting idea, one clear action — no more. Clean enough that a supporter shares it without hesitation.

**Composition rules:**
- NEVER center everything — use asymmetric layouts, offset headline text, or diagonal flow to create energy and visual interest
- One HERO element (the headline) dominates 60% of the visual space — everything else is subordinate
- Use maximum 2-3 colors: brand_color as dominant, secondary_color as accent, one neutral (white or near-black)
- Text must be large enough to read on mobile at thumbnail size — min 48px equivalent for headlines, 24px for body/CTA
- Leave at least 15% padding from all edges — breathing room signals confidence
- A single geometric accent shape (circle, rounded rectangle, diagonal line) in a complementary tone adds polish without clutter
- Footer attribution is set small (12-14pt) at the bottom margin
- Avoid generic stock-photo backgrounds with overlaid text — they look amateur
- If everything is bold, nothing stands out; restrain secondary elements
- Never use gradients as a crutch instead of intentional design thinking
- Avoid clip art or generic icons; use purposeful geometric elements instead

## Visual upgrade notes (Apr 2026)

Typography is now powered by **Outfit-Bold** (hero headline), **Outfit-Regular** (subheadline/body), and **CrimsonPro-Italic** (accent accent text) — bundled Google Fonts in `fonts/` rather than system Helvetica. This gives the card a contemporary geometric-sans editorial character.

Composition has moved from centered-stack to an **editorial-magazine layout**: the headline is left-aligned and oversize, pushed to the upper portion of the canvas (not vertically centered). A large quarter-circle geometric accent in the upper-right corner (partially clipped off canvas) creates energy and unexpected negative space. A diagonal stripe in the accent color bisects the lower third. The CTA is rendered as an accent-colored pill rather than plain centered text, and a typographic arrow (→) in the lower-right corner adds editorial punctuation. A gradient background (light-to-dark brand color) replaces the flat solid fill. Drop shadows on the headline are composited via Pillow `GaussianBlur` on a separate RGBA layer for soft depth without hard edges.
