"""
social_card/render.py
Generates a 1080x1080 social media graphic (Instagram square / FB post / LinkedIn slide).
Uses Pillow directly — bundled Google Fonts (Outfit + CrimsonPro) instead of system fonts.
Editorial-magazine composition: oversize headline, geometric accent shape, gradient depth.
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
    path = os.path.join(_FONT_DIR, name)
    return ImageFont.truetype(path, size)


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------

def _hex_to_rgb(hex_color: str) -> tuple:
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _luminance(r: int, g: int, b: int) -> float:
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def _contrast_text(r: int, g: int, b: int) -> tuple:
    return (255, 255, 255) if _luminance(r, g, b) < 0.4 else (18, 18, 18)


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

def _gradient_fill(width: int, height: int, top_color: tuple, bottom_color: tuple) -> Image.Image:
    """Vertical linear gradient as a Pillow RGBA image."""
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


def _draw_quarter_circle(draw: ImageDraw.ImageDraw, cx: int, cy: int, radius: int, color: tuple, quadrant: str = "top-right"):
    """Draw a filled quarter-circle. quadrant controls the pieslice angle."""
    angle_map = {
        "top-right":    (-90, 0),
        "top-left":     (180, 270),
        "bottom-right": (0, 90),
        "bottom-left":  (90, 180),
    }
    bbox = (cx - radius, cy - radius, cx + radius, cy + radius)
    start, end = angle_map[quadrant]
    draw.pieslice(bbox, start=start, end=end, fill=color)


def _wrap_text_px(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list:
    """Word-wrap text to fit within max_width pixels."""
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


# ---------------------------------------------------------------------------
# Core render
# ---------------------------------------------------------------------------

def render(
    headline: str,
    brand_color: str,
    subheadline: Optional[str] = None,
    cta: Optional[str] = None,
    secondary_color: Optional[str] = None,
    font_style: str = "sans-serif",  # kept for API compat; we ignore and use Outfit
    org_name: Optional[str] = None,
    output_dir: str = "/mnt/user-data/outputs",
) -> str:
    """
    Render a 1080x1080 editorial social media card PNG.
    Returns the absolute path to the generated PNG file.
    """
    W, H = 1080, 1080

    # --- Colors ---
    bg = _hex_to_rgb(brand_color)
    bg_dark = _shade(*bg, 0.28)
    bg_light = _tint(*bg, 0.18)
    text_color = _contrast_text(*bg)

    if secondary_color:
        accent = _hex_to_rgb(secondary_color)
    else:
        # Complementary: if dark bg use light tint, if light bg use dark shade
        if _luminance(*bg) < 0.4:
            accent = _tint(*bg, 0.55)
        else:
            accent = _shade(*bg, 0.5)

    # --- Base canvas: gradient background ---
    canvas = _gradient_fill(W, H, bg_light, bg_dark)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Geometric accent: large quarter-circle in upper-right (bold brand shape) ---
    # Oversized — partially off canvas — adds energy
    circle_color = (*_tint(*bg, 0.22), 200)
    _draw_quarter_circle(draw, W + 60, -60, 580, circle_color, "bottom-left")

    # --- Second subtler circle, lower-left ---
    circle2_color = (*_shade(*bg, 0.18), 130)
    _draw_quarter_circle(draw, -80, H + 80, 420, circle2_color, "top-right")

    # --- Diagonal accent stripe across lower portion ---
    # Thin parallelogram across bottom quarter
    stripe_color = (*accent, 45)
    stripe_y = int(H * 0.72)
    draw.polygon(
        [(0, stripe_y), (W, stripe_y - 60), (W, stripe_y - 60 + 18), (0, stripe_y + 18)],
        fill=stripe_color,
    )

    # --- Load fonts ---
    # Hero headline: Outfit-Bold, scaled by headline length
    hl_len = len(headline)
    if hl_len <= 12:
        hero_size = 130
    elif hl_len <= 20:
        hero_size = 108
    elif hl_len <= 32:
        hero_size = 86
    else:
        hero_size = 68

    font_hero = _font("Outfit-Bold.ttf", hero_size)
    font_sub = _font("Outfit-Regular.ttf", 38)
    font_cta = _font("Outfit-Bold.ttf", 34)
    font_arrow = _font("Outfit-Bold.ttf", 52)
    font_org = _font("Outfit-Regular.ttf", 22)

    # --- Layout: headline occupies upper 60% ---
    MARGIN = 72
    max_text_w = W - MARGIN * 2

    hl_lines = _wrap_text_px(headline, font_hero, max_text_w)
    line_h = hero_size * 1.18

    # Headline starts at ~18% from top — editorial: text is HIGH, not centered
    y = int(H * 0.14)

    # Shadow layer for headline
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_d = ImageDraw.Draw(shadow_layer)

    for line in hl_lines:
        shadow_d.text((MARGIN + 4, y + 4), line, font=font_hero, fill=(0, 0, 0, 90))
        draw.text((MARGIN, y), line, font=font_hero, fill=text_color)
        y += int(line_h)

    # Composite shadow below headline
    blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(radius=10))
    canvas = Image.alpha_composite(canvas, blurred_shadow)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # Re-draw headline cleanly on top of blurred shadow
    y = int(H * 0.14)
    for line in hl_lines:
        draw.text((MARGIN, y), line, font=font_hero, fill=text_color)
        y += int(line_h)

    # --- Accent bar: horizontal rule in accent color ---
    rule_y = y + 28
    rule_thickness = 4
    rule_w = int(W * 0.35)
    draw.rectangle([(MARGIN, rule_y), (MARGIN + rule_w, rule_y + rule_thickness)], fill=(*accent, 255))
    y = rule_y + rule_thickness + 32

    # --- Subheadline in Outfit-Regular ---
    if subheadline:
        sub_lines = _wrap_text_px(subheadline, font_sub, max_text_w - 40)
        sub_color = (*text_color, 200)  # slightly faded
        for line in sub_lines:
            draw.text((MARGIN, y), line, font=font_sub, fill=sub_color)
            y += int(38 * 1.45)
        y += 16

    # --- CTA in accent color near bottom ---
    if cta:
        # CTA pill background
        cta_y = H - MARGIN - 90
        cta_bbox = font_cta.getbbox(cta)
        cta_w = cta_bbox[2] - cta_bbox[0] + 48
        cta_h_px = cta_bbox[3] - cta_bbox[1] + 24
        pill_x = MARGIN
        pill_y = cta_y
        # Pill background
        draw.rounded_rectangle(
            [(pill_x, pill_y), (pill_x + cta_w, pill_y + cta_h_px + 4)],
            radius=6,
            fill=(*accent, 230),
        )
        # CTA text — ensure contrast against accent pill
        cta_text_color = _contrast_text(*accent)
        draw.text((pill_x + 24, pill_y + 4), cta, font=font_cta, fill=cta_text_color)

    # --- Arrow mark — editorial punctuation ---
    arrow_x = W - MARGIN - 60
    arrow_y = H - MARGIN - 60
    draw.text((arrow_x, arrow_y), "→", font=font_arrow, fill=(*accent, 200))

    # --- Org name small top-right ---
    if org_name:
        org_text = org_name.upper()
        ob = font_org.getbbox(org_text)
        org_w = ob[2] - ob[0]
        draw.text((W - MARGIN - org_w, MARGIN - 4), org_text, font=font_org, fill=(*text_color, 160))

    # --- Save output ---
    final = canvas.convert("RGB")
    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"social_card_{timestamp}.png")
    final.save(out_path, "PNG", optimize=True)
    return out_path
