"""
gala_invite/render.py
Generates a formal gala save-the-date / event invite.
Default: 1080x1080 square (IG/social). Portrait option: 1500x2100 (5x7 print).
Uses Pillow directly — bundled Google Fonts (Italiana + CrimsonPro + WorkSans).
Aesthetic: Met Gala meets Vienna Opera invite. Jewel-tone background, gold accents,
refined vertical composition, vignette depth.
"""

import os
import time
from typing import Optional

from PIL import Image, ImageDraw, ImageFilter, ImageFont


# ---------------------------------------------------------------------------
# Font loader
# ---------------------------------------------------------------------------

_FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")


def _font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(os.path.join(_FONT_DIR, name), size)


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _tint(r: int, g: int, b: int, factor: float = 0.35) -> tuple:
    return (
        int(r + (255 - r) * factor),
        int(g + (255 - g) * factor),
        int(b + (255 - b) * factor),
    )


def _shade(r: int, g: int, b: int, factor: float = 0.4) -> tuple:
    return (int(r * (1 - factor)), int(g * (1 - factor)), int(b * (1 - factor)))


# ---------------------------------------------------------------------------
# Pillow effects
# ---------------------------------------------------------------------------

def _wrap_text_px(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
    words = text.split()
    lines = []
    current_words = []
    for word in words:
        test = " ".join(current_words + [word])
        bbox = font.getbbox(test)
        w = bbox[2] - bbox[0]
        if w > max_width and current_words:
            lines.append(" ".join(current_words))
            current_words = [word]
        else:
            current_words.append(word)
    if current_words:
        lines.append(" ".join(current_words))
    return lines


def _gradient_fill(width: int, height: int, top_color: tuple, bottom_color: tuple) -> Image.Image:
    """Vertical linear gradient as RGBA image."""
    grad = Image.new("RGBA", (width, height))
    pixels = grad.load()
    tr, tg, tb = top_color[:3]
    br, bg, bb = bottom_color[:3]
    for y in range(height):
        ratio = y / max(height - 1, 1)
        r = int(tr + (br - tr) * ratio)
        g = int(tg + (bg - tg) * ratio)
        b = int(tb + (bb - tb) * ratio)
        for x in range(width):
            pixels[x, y] = (r, g, b, 255)
    return grad


def _vignette(canvas: Image.Image, strength: float = 0.45) -> Image.Image:
    """Apply corner-darkening vignette for depth."""
    W, H = canvas.size
    vig_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vl = ImageDraw.Draw(vig_layer)
    steps = 16
    alpha_max = int(255 * strength)
    for i in range(steps, 0, -1):
        ratio = i / steps
        mx = int(W * (1 - ratio) * 0.6)
        my = int(H * (1 - ratio) * 0.6)
        a = int(alpha_max * (1 - ratio) * 2.2)
        a = min(a, 255)
        vl.ellipse([mx, my, W - mx, H - my], fill=(0, 0, 0, a))
    blurred = vig_layer.filter(ImageFilter.GaussianBlur(radius=int(W * 0.12)))
    return Image.alpha_composite(canvas, blurred)


def _draw_double_border(draw: ImageDraw.ImageDraw, W: int, H: int, margin: int, gap: int, color: tuple):
    """Draw two concentric thin border lines."""
    draw.rectangle([margin, margin, W - margin, H - margin], outline=(*color, 200), width=2)
    draw.rectangle([margin + gap, margin + gap, W - margin - gap, H - margin - gap], outline=(*color, 120), width=1)


def _letter_spaced(text: str, spacing: int = 3) -> str:
    return (" " * spacing).join(list(text))


def _centered_text(draw: ImageDraw.ImageDraw, W: int, y: int, text: str,
                    font: ImageFont.FreeTypeFont, fill: tuple) -> int:
    """Draw text centered horizontally, return new y below text."""
    bbox = font.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text(((W - tw) // 2, y), text, font=font, fill=fill)
    return y + th


def _centered_text_block(draw: ImageDraw.ImageDraw, W: int, y: int, lines: list,
                           font: ImageFont.FreeTypeFont, fill: tuple, line_spacing: float = 1.25) -> int:
    """Draw multiple centered text lines, return y below last line."""
    for line in lines:
        bbox = font.getbbox(line)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text(((W - tw) // 2, y), line, font=font, fill=fill)
        y += int(th * line_spacing)
    return y


# ---------------------------------------------------------------------------
# Core render canvas
# ---------------------------------------------------------------------------

def _render_invite(canvas: Image.Image, W: int, H: int, scale: float,
                   event_name: str, date: str, venue: str,
                   brand_rgb: tuple, accent_rgb: tuple,
                   tagline: Optional[str], time_str: Optional[str],
                   cta: Optional[str], cta_url: Optional[str]) -> Image.Image:
    """Draw all invite elements on canvas. Returns updated canvas."""
    br, bg, bb = brand_rgb

    # Apply vignette for depth
    canvas = _vignette(canvas, strength=0.42)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Double border frame in accent ---
    border_margin = int(W * 0.055)
    _draw_double_border(draw, W, H, border_margin, int(W * 0.012), accent_rgb)

    # --- Corner diamond ornaments ---
    dm = int(W * 0.022)
    m = border_margin + 3
    corners = [(m, m), (W - m, m), (m, H - m), (W - m, H - m)]
    for cx, cy in corners:
        draw.polygon(
            [(cx, cy - dm), (cx + dm, cy), (cx, cy + dm), (cx - dm, cy)],
            fill=(*accent_rgb, 220),
        )

    # --- Fonts (scaled by canvas size) ---
    s = scale
    font_eyebrow = _font("WorkSans-Bold.ttf", int(26 * s))
    font_tagline = _font("CrimsonPro-Regular.ttf", int(32 * s))
    font_logistics = _font("WorkSans-Bold.ttf", int(28 * s))
    font_venue = _font("CrimsonPro-Regular.ttf", int(30 * s))
    font_cta = _font("WorkSans-Bold.ttf", int(28 * s))
    font_cta_url = _font("CrimsonPro-Regular.ttf", int(22 * s))

    inner_top = int(H * 0.14)
    inner_w = W - border_margin * 2 - int(W * 0.06)
    y = inner_top

    # --- Eyebrow: "— YOU ARE INVITED —" ---
    eyebrow_text = _letter_spaced("YOU ARE INVITED", spacing=2)
    eyebrow_display = f"— {eyebrow_text} —"
    y = _centered_text(draw, W, y, eyebrow_display, font_eyebrow, (*accent_rgb, 230))
    y += int(W * 0.025)

    # --- Thin gold rule ---
    rule_h = 1
    draw.rectangle(
        [(border_margin + int(W * 0.12), y), (W - border_margin - int(W * 0.12), y + rule_h)],
        fill=(*accent_rgb, 180),
    )
    y += rule_h + int(W * 0.038)

    # --- Event name in Italiana (elegant serif hero) ---
    if len(event_name) <= 22:
        name_size = int(88 * s)
    elif len(event_name) <= 36:
        name_size = int(70 * s)
    else:
        name_size = int(56 * s)
    font_event_sized = _font("Italiana-Regular.ttf", name_size)
    name_lines = _wrap_text_px(event_name, font_event_sized, inner_w)

    # Shadow for event name
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    shadow_y = y
    for line in name_lines:
        bbox = font_event_sized.getbbox(line)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        sd.text(((W - tw) // 2 + 4, shadow_y + 5), line, font=font_event_sized, fill=(0, 0, 0, 100))
        shadow_y += int(th * 1.2)
    blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(radius=int(12 * s)))
    canvas.alpha_composite(blurred_shadow)
    draw = ImageDraw.Draw(canvas, "RGBA")

    y = _centered_text_block(draw, W, y, name_lines, font_event_sized, (*accent_rgb, 255), line_spacing=1.2)
    y += int(W * 0.018)

    # --- Tagline in CrimsonPro-Regular italic ---
    if tagline:
        tag_lines = _wrap_text_px(tagline, font_tagline, inner_w)
        y = _centered_text_block(draw, W, y, tag_lines, font_tagline, (*accent_rgb, 175), line_spacing=1.35)
        y += int(W * 0.018)

    # --- Center ornament: double line + diamond ---
    orn_y = y + int(W * 0.015)
    orn_center = W // 2
    wing_w = int(W * 0.22)
    draw.line([(orn_center - wing_w, orn_y), (orn_center - int(dm * 1.5), orn_y)], fill=(*accent_rgb, 170), width=1)
    draw.line([(orn_center + int(dm * 1.5), orn_y), (orn_center + wing_w, orn_y)], fill=(*accent_rgb, 170), width=1)
    ods = int(dm * 0.8)
    draw.polygon(
        [(orn_center, orn_y - ods), (orn_center + ods, orn_y), (orn_center, orn_y + ods), (orn_center - ods, orn_y)],
        fill=(*accent_rgb, 220),
    )
    y = orn_y + int(W * 0.04)

    # --- Date in WorkSans-Bold uppercase ---
    date_spaced = _letter_spaced(date.upper(), spacing=1)
    y = _centered_text(draw, W, y, date_spaced, font_logistics, (*accent_rgb, 240))
    y += int(font_logistics.getbbox("A")[3] * 0.4)

    # --- Time ---
    if time_str:
        y = _centered_text(draw, W, y + int(W * 0.008), time_str, font_logistics, (*accent_rgb, 190))
        y += int(font_logistics.getbbox("A")[3] * 0.2)

    # --- Venue in CrimsonPro italic-ish ---
    y += int(W * 0.012)
    venue_lines = _wrap_text_px(venue, font_venue, inner_w)
    y = _centered_text_block(draw, W, y, venue_lines, font_venue, (*accent_rgb, 175), line_spacing=1.3)
    y += int(W * 0.03)

    # --- Gold accent line separator ---
    draw.rectangle(
        [(border_margin + int(W * 0.22), y), (W - border_margin - int(W * 0.22), y + 1)],
        fill=(*accent_rgb, 130),
    )
    y += int(W * 0.04)

    # --- CTA as pill near bottom ---
    if cta:
        cb = font_cta.getbbox(cta)
        cta_tw = cb[2] - cb[0]
        cta_th = cb[3] - cb[1]
        pill_pad_x = int(28 * s)
        pill_pad_y = int(12 * s)
        pill_w = cta_tw + pill_pad_x * 2
        pill_h = cta_th + pill_pad_y * 2
        pill_x = (W - pill_w) // 2
        draw.rounded_rectangle(
            [(pill_x, y), (pill_x + pill_w, y + pill_h)],
            radius=int(8 * s),
            outline=(*accent_rgb, 200),
            width=2,
        )
        draw.text((pill_x + pill_pad_x, y + pill_pad_y), cta, font=font_cta, fill=(*accent_rgb, 230))
        y += pill_h + int(W * 0.018)

    if cta_url:
        y = _centered_text(draw, W, y, cta_url, font_cta_url, (*accent_rgb, 150))

    return canvas


# ---------------------------------------------------------------------------
# Core render function
# ---------------------------------------------------------------------------

def render(
    event_name: str,
    date: str,
    venue: str,
    brand_color: str,
    tagline: Optional[str] = None,
    time_str: Optional[str] = None,
    cta: Optional[str] = None,
    cta_url: Optional[str] = None,
    accent_color: Optional[str] = None,
    format: str = "square",
    output_dir: str = "/mnt/user-data/outputs",
    **kwargs,
) -> str:
    """
    Render a gala invite PNG.
    format='square'   → 1080x1080 (social media)
    format='portrait' → 1500x2100 (5x7 print card)
    Returns absolute path to generated PNG.
    """
    if "time" in kwargs and time_str is None:
        time_str = kwargs.pop("time")

    # --- Colors ---
    brand_rgb = _hex_to_rgb(brand_color)

    if accent_color:
        accent_rgb = _hex_to_rgb(accent_color)
    else:
        accent_rgb = _hex_to_rgb("#C9A961")  # champagne gold

    # --- Canvas dimensions and scale factor ---
    if format == "portrait":
        W, H = 1500, 2100
        target_size = (1500, 2100)
        scale = 1.4
        suffix = "portrait"
    else:
        W, H = 1080, 1080
        target_size = (1080, 1080)
        scale = 1.0
        suffix = "square"

    # --- Base: gradient from brand_color to slightly darker shade ---
    bg_light = _tint(*brand_rgb, 0.06)
    bg_dark = _shade(*brand_rgb, 0.22)
    canvas = _gradient_fill(W, H, bg_light, bg_dark)

    canvas = _render_invite(
        canvas, W, H, scale,
        event_name=event_name,
        date=date,
        venue=venue,
        brand_rgb=brand_rgb,
        accent_rgb=accent_rgb,
        tagline=tagline,
        time_str=time_str,
        cta=cta,
        cta_url=cta_url,
    )

    final = canvas.convert("RGB")
    if final.size != target_size:
        final = final.resize(target_size, Image.LANCZOS)

    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"gala_invite_{suffix}_{timestamp}.png")
    final.save(out_path, "PNG", optimize=True)
    return out_path
