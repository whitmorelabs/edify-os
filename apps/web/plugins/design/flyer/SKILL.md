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
- `bullet_points` *(optional, array of strings)* — Up to 6 key highlights or program features. Example: `["Live auction", "Silent raffle", "Dinner included"]`
- `bullet_icons` *(optional, array of strings)* — Keyword per bullet that maps to a bundled icon (see Icon keywords below). Must match `bullet_points` index-for-index. Falls back to diamond markers when omitted or unmatched. Example: `["fundraiser", "music", "food"]`
- `date` *(optional, string)* — Event date in display format. Example: `"Thursday, May 22, 2026"`
- `time` *(optional, string)* — Event start time. Example: `"10:00 AM – 2:00 PM"`
- `venue` *(optional, string)* — Location name and address.
- `cta` *(optional, string)* — Primary call-to-action text. Example: `"Register Today"`
- `cta_url` *(optional, string)* — URL printed below the CTA. Example: `"edify.org/gala"`
- `brand_color` *(required, hex string)* — Primary brand color applied to header band and accents.
- `secondary_color` *(optional, hex string)* — Secondary accent. Defaults to a tint/shade of brand_color.
- `org_name` *(optional, string)* — Organization name for eyebrow label and footer attribution.

## Icon keywords

Pass these as items in `bullet_icons` to get a matching icon beside each bullet point. The renderer does partial-match lookup, so "free lunch" maps to `"lunch"` automatically.

| Keyword(s) | Icon |
|---|---|
| `lunch`, `food`, `meal`, `dinner`, `breakfast` | Fork & knife |
| `panel`, `speaker`, `employer` | Three people |
| `resume`, `cv`, `portfolio` | Document |
| `interview`, `interviews`, `hiring` | Handshake |
| `register`, `registration`, `rsvp`, `signup` | Clipboard with checkmark |
| `fundraiser`, `donate`, `donation`, `fund` | Heart with dollar |
| `volunteer`, `volunteering` | Person with raised arms |
| `award`, `awards`, `recognition` | Medal/ribbon |
| `network`, `networking`, `connect` | Connected nodes |
| `training`, `workshop`, `class`, `education` | Graduation cap |
| `music`, `concert`, `performance` | Musical note |
| `health`, `wellness`, `medical` | Cross |
| `community`, `social` | Group of people |
| `calendar`, `schedule` | Calendar |
| `location`, `venue`, `place` | Map pin |
| `star`, `highlight` | Star |
| `gift`, `raffle`, `prize` | Gift box |
| `heart`, `care`, `love` | Heart |
| `check`, `free`, `help`, `support`, `assistance` | Checkmark circle |

If a keyword doesn't match, the bullet falls back to the diamond marker automatically — no error.

## Output

2550×3300 PNG at 300 DPI (US Letter portrait). Returned as a downloadable file artifact.

**Layout regions:**
- **Hero band** (top 38%): Diagonal-edge brand-color block with eyebrow label and YoungSerif headline. Asymmetric corner block in upper-right adds depth.
- **Body area** (middle ~48%): Cream off-white with paper-grain texture overlay. Contains subheadline, date callout (when `date` provided), venue line, body text, and two-column bullet grid.
- **Date callout**: When `date` is provided, renders a tear-off calendar block — big numeric day in YoungSerif display size, month eyebrow label above, time below — with a sun-ray starburst accent behind the number.
- **Footer** (bottom ~14%): Darker brand shade with accent stripe separator. Contains CTA + URL left, org name right.

## Example invocation

```json
{
  "skill": "flyer",
  "inputs": {
    "headline": "Open Doors Career Day",
    "subheadline": "Building futures for ages 17-21",
    "bullet_points": ["Free lunch provided", "Employer panel", "Resume help", "On-site interviews"],
    "bullet_icons": ["lunch", "panel", "resume", "interview"],
    "date": "Thursday, May 22, 2026",
    "time": "10:00 AM – 2:00 PM",
    "venue": "Bridgewater Community Center",
    "cta": "RSVP at opendoors.edify.org",
    "cta_url": "opendoors.edify.org",
    "brand_color": "#F4801A",
    "org_name": "Open Doors Program"
  }
}
```

```json
{
  "skill": "flyer",
  "inputs": {
    "headline": "Fall Fundraiser Dinner",
    "subheadline": "An evening of impact and community",
    "body_text": "Join us for a night celebrating the families we serve.",
    "bullet_points": ["Live auction", "Gourmet dinner", "Impact stories from families"],
    "bullet_icons": ["fundraiser", "food", "heart"],
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

**Design philosophy:** Print flyers for nonprofits work best when they communicate hierarchy — the event name commands attention, the logistics answer "when and where," and the CTA closes the deal. Resist the urge to fill every pixel — white space signals confidence and makes the event feel prestigious.

**Composition rules:**
- Create clear visual hierarchy: the headline/event name dominates the top 40-50% of space as the HERO element
- Use asymmetric layouts — offset text blocks, diagonal accent lines, or staggered sections create energy vs. rigid centering
- Maximum 2-3 colors: brand_color for header band and accents, secondary_color for CTA/highlights, white or near-white for body background
- Text sizing for print clarity: headline 36-48pt, subheadline 24-28pt, body 18-20pt, footer 12-14pt
- Leave at least 15% padding from edges — critical for print trim safety and visual breathing room
- Body on white or very light background ensures readability when printed in grayscale on a home printer
- Bullet points should feel like a preview (3-5 items max), not a brochure dump
- Event details (date, time, venue) in a visually distinct block — bordered, shaded, or icon-paired — so scanners find them instantly
- CTA section at the bottom gets its own visual weight: bold text, contrasting background, clear action verb

**Common mistakes to avoid:**
- Too many competing elements — if everything is bold, nothing stands out
- Filling every square inch with content; density signals desperation, not prestige
- Using gradients as a crutch instead of intentional color blocking
- Ignoring print constraints: dark backgrounds waste ink, thin fonts disappear at distance

## Visual upgrade notes (Apr 2026 — wow-factor overhaul)

**(Apr 30, 2026) Removed hero_image_url support** — Anthropic Skills sandbox has no internet access. Photo support requires Anthropic Files API integration, queued for a future sprint. Current flyer is typography + design-element driven.

**1. Custom bullet icons** — `bullet_icons` maps keyword strings to a bundled set of ~20 procedurally-generated PNG icons (64×64) in `icons/`. Icons are recolored to match the accent color at render time. Partial keyword matching handles `"free lunch"` → `"lunch"` icon automatically. Falls back to diamond markers for unmatched keywords.

**2. Date as design element** — When `date` is provided, renders a tear-off calendar callout block: big numeric day (200pt YoungSerif), `MAY` month eyebrow (WorkSans-Bold, letter-spaced), weekday label above, time below. A sun-ray starburst pattern (16 rays) radiates behind the day number. The callout has a soft alpha-blended shadow underneath.

**3. Texture + depth** — A `assets/noise.png` (512×512 paper-grain texture) tiles across the cream body region at 4-6% opacity, giving the flyer a premium printed feel. The headline drop shadow radius is strengthened (GaussianBlur r=20). The hero band's top edge has a 3px lighter inset highlight.

**4. Geometric accent stack** — Added beyond the original diagonal hero edge + corner block:
- Curved arc element cutting across the lower-left body area
- Thin vertical accent line connecting hero bottom to footer (right side)
- Sun-ray starburst behind the date number
- Ribbon/banner stripe under the headline in the hero band
- Halftone dot field fading in the upper-right body corner

Typography is powered by **YoungSerif-Regular** (hero headline + date day number), **Outfit-Regular** (body text, logistics, bullets), and **WorkSans-Bold** (eyebrow labels, HIGHLIGHTS label, date month + weekday) — bundled Google Fonts in `fonts/`.
