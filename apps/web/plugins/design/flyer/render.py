"""
flyer/render.py
Generates a print-ready US Letter portrait flyer (2550x3300 at 300 DPI).
Uses Pillow directly — bundled Google Fonts (YoungSerif + Outfit + WorkSans).
Editorial museum-poster composition: geometric brand color block, multi-column body,
generous margins, serif hero with clean sans body.
"""

import os
import time
from typing import Optional, List

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


def _luminance(r: int, g: int, b: int) -> float:
    def lin(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def _contrast_text(r: int, g: int, b: int) -> tuple:
    return (255, 255, 255) if _luminance(r, g, b) < 0.4 else (16, 16, 16)


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


def _letter_spaced(text: str, spacing: int = 12) -> str:
    """Insert spaces between characters to simulate letter-spacing."""
    return (" " * spacing).join(list(text))


# ---------------------------------------------------------------------------
# Core render
# ---------------------------------------------------------------------------

def render(
    headline: str,
    brand_color: str,
    subheadline: Optional[str] = None,
    body_text: Optional[str] = None,
    bullet_points: Optional[List[str]] = None,
    date: Optional[str] = None,
    time_str: Optional[str] = None,
    venue: Optional[str] = None,
    cta: Optional[str] = None,
    cta_url: Optional[str] = None,
    secondary_color: Optional[str] = None,
    org_name: Optional[str] = None,
    output_dir: str = "/mnt/user-data/outputs",
    **kwargs,
) -> str:
    """
    Render a US Letter portrait flyer PNG (2550x3300, 300 DPI).
    Returns absolute path to generated PNG.
    """
    if "time" in kwargs and time_str is None:
        time_str = kwargs.pop("time")

    # --- Colors ---
    bg = _hex_to_rgb(brand_color)
    bg_dark = _shade(*bg, 0.25)
    body_bg = (250, 248, 245)  # warm off-white body area
    text_on_dark = _contrast_text(*bg)
    text_on_light = (20, 18, 16)

    if secondary_color:
        accent = _hex_to_rgb(secondary_color)
    else:
        if _luminance(*bg) < 0.4:
            accent = _tint(*bg, 0.60)
        else:
            accent = _shade(*bg, 0.45)

    # --- Canvas: 2550x3300 at 300 DPI ---
    W, H = 2550, 3300
    canvas = Image.new("RGBA", (W, H), (*body_bg, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- HERO BAND: brand color occupies top 38% with diagonal bottom edge ---
    HERO_H = int(H * 0.38)
    # Solid hero rectangle
    draw.rectangle([(0, 0), (W, HERO_H)], fill=(*bg, 255))

    # Diagonal bottom edge (polygon slanting right→left)
    diagonal_drop = int(H * 0.05)
    draw.polygon(
        [(0, HERO_H), (W, HERO_H - diagonal_drop), (W, HERO_H + diagonal_drop // 2), (0, HERO_H + diagonal_drop // 2)],
        fill=(*bg, 255),
    )

    # Decorative: thin accent stripe at very top
    draw.rectangle([(0, 0), (W, 18)], fill=(*accent, 255))

    # Subtle geometric block upper-right corner of hero (asymmetric accent)
    corner_w = int(W * 0.28)
    corner_h = int(HERO_H * 0.65)
    corner_color = (*_tint(*bg, 0.12), 160)
    draw.rectangle([(W - corner_w, 0), (W, corner_h)], fill=corner_color)

    # --- Load fonts ---
    hl_len = len(headline)
    if hl_len <= 20:
        hero_size = 260
    elif hl_len <= 36:
        hero_size = 210
    else:
        hero_size = 170

    font_hero = _font("YoungSerif-Regular.ttf", hero_size)
    font_eyebrow = _font("WorkSans-Bold.ttf", 80)
    font_sub = _font("Outfit-Regular.ttf", 90)
    font_body = _font("Outfit-Regular.ttf", 72)
    font_logistics_label = _font("WorkSans-Bold.ttf", 68)
    font_logistics = _font("Outfit-Regular.ttf", 72)
    font_bullet = _font("Outfit-Regular.ttf", 72)
    font_cta = _font("WorkSans-Bold.ttf", 96)
    font_footer = _font("Outfit-Regular.ttf", 56)

    MARGIN = int(W * 0.09)
    text_w = W - MARGIN * 2

    # --- Eyebrow label in hero band ---
    # e.g. "ANNOUNCEMENT" or org name
    eyebrow_text = org_name.upper() if org_name else "ANNOUNCEMENT"
    eyebrow_spaced = _letter_spaced(eyebrow_text, spacing=2)
    draw.text((MARGIN, MARGIN + 30), eyebrow_spaced, font=font_eyebrow, fill=(*accent, 220))

    # --- Headline in YoungSerif hero ---
    hl_lines = _wrap_text_px(headline, font_hero, text_w - corner_w - 100)
    line_h = int(hero_size * 1.14)
    y = MARGIN + 80 + 68 + 40  # below eyebrow

    # Draw with shadow
    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    for line in hl_lines:
        sd.text((MARGIN + 5, y + 8), line, font=font_hero, fill=(0, 0, 0, 85))
        y += line_h
    blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(radius=16))
    canvas.alpha_composite(blurred_shadow)
    draw = ImageDraw.Draw(canvas, "RGBA")

    y = MARGIN + 80 + 68 + 40
    for line in hl_lines:
        draw.text((MARGIN, y), line, font=font_hero, fill=(*text_on_dark, 255))
        y += line_h

    # --- Subheadline below hero band ---
    body_top = HERO_H + diagonal_drop // 2 + 90
    y_body = body_top

    if subheadline:
        sub_lines = _wrap_text_px(subheadline, font_sub, text_w)
        for line in sub_lines:
            draw.text((MARGIN, y_body), line, font=font_sub, fill=(*_shade(*bg, 0.1), 255))
            y_body += int(90 * 1.4)
        y_body += 40

    # --- Logistics block: date / time / venue ---
    has_logistics = date or time_str or venue
    if has_logistics:
        # Box with light tint background + left accent bar
        box_lines = []
        if date:
            box_lines.append(("LABEL", date.upper()))
        if time_str:
            box_lines.append(("INFO", time_str))
        if venue:
            box_lines.append(("INFO", venue))

        box_line_h = 110
        box_pad = 60
        box_h = len(box_lines) * box_line_h + box_pad * 2
        box_bg = (*_tint(*bg, 0.88), 255)
        draw.rectangle([(MARGIN, y_body), (W - MARGIN, y_body + box_h)], fill=box_bg)
        # Left accent bar
        draw.rectangle([(MARGIN, y_body), (MARGIN + 12, y_body + box_h)], fill=(*accent, 255))

        y_l = y_body + box_pad
        for kind, txt in box_lines:
            f = font_logistics_label if kind == "LABEL" else font_logistics
            draw.text((MARGIN + 48, y_l), txt, font=f, fill=(*bg, 255))
            y_l += box_line_h

        y_body = y_body + box_h + 70

    # --- Body text ---
    if body_text:
        body_lines = _wrap_text_px(body_text, font_body, text_w)
        for line in body_lines:
            if y_body > H - 520:
                break
            draw.text((MARGIN, y_body), line, font=font_body, fill=(*text_on_light, 255))
            y_body += int(72 * 1.55)
        y_body += 30

    # --- Bullet points --- two-column layout ---
    if bullet_points:
        bullets = bullet_points[:6]
        col_w = (text_w - 60) // 2
        font_bul_label = _font("WorkSans-Bold.ttf", 68)
        draw.text((MARGIN, y_body), "HIGHLIGHTS", font=font_bul_label, fill=(*bg, 255))
        y_body += 90

        left_y = y_body
        right_y = y_body
        for i, point in enumerate(bullets):
            if y_body > H - 520:
                break
            col_x = MARGIN if i % 2 == 0 else MARGIN + col_w + 60
            col_y = left_y if i % 2 == 0 else right_y

            # Diamond bullet
            dm = 14
            draw.polygon(
                [(col_x, col_y + 36), (col_x + dm, col_y + 36 - dm), (col_x + dm * 2, col_y + 36), (col_x + dm, col_y + 36 + dm)],
                fill=(*accent, 255),
            )
            bul_lines = _wrap_text_px(point, font_bullet, col_w - 50)
            for bl in bul_lines:
                draw.text((col_x + dm * 2 + 14, col_y), bl, font=font_bullet, fill=(*text_on_light, 255))
                col_y += int(72 * 1.45)

            if i % 2 == 0:
                left_y = col_y + 20
            else:
                right_y = col_y + 20

        y_body = max(left_y, right_y) + 20

    # --- Footer band ---
    FOOTER_H = int(H * 0.14)
    footer_y = H - FOOTER_H
    draw.rectangle([(0, footer_y), (W, H)], fill=(*bg_dark, 255))
    draw.rectangle([(0, footer_y), (W, footer_y + 10)], fill=(*accent, 255))

    # CTA in footer
    footer_text_col = _contrast_text(*bg_dark)
    if cta:
        cb = font_cta.getbbox(cta)
        cta_x = MARGIN
        cta_y_pos = footer_y + (FOOTER_H - (cb[3] - cb[1])) // 2 - 20
        draw.text((cta_x, cta_y_pos), cta, font=font_cta, fill=(*footer_text_col, 255))
        if cta_url:
            draw.text((cta_x, cta_y_pos + 110), cta_url, font=font_footer, fill=(*footer_text_col, 160))
    elif cta_url:
        draw.text((MARGIN, footer_y + FOOTER_H // 2 - 30), cta_url, font=font_footer, fill=(*footer_text_col, 200))

    # Org footer right
    if org_name:
        ob = font_footer.getbbox(org_name.upper())
        org_w = ob[2] - ob[0]
        draw.text((W - MARGIN - org_w, H - int(FOOTER_H * 0.4)), org_name.upper(), font=font_footer, fill=(*footer_text_col, 140))

    # --- Export 2550x3300 PNG ---
    final = canvas.convert("RGB")
    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"flyer_{timestamp}.png")
    final.save(out_path, "PNG", optimize=True)
    return out_path
