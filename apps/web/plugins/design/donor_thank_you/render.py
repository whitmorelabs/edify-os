"""
donor_thank_you/render.py
Generates a warm 5x7" portrait thank-you card (1500x2100 at 300 DPI).
Uses Pillow directly — bundled Google Fonts (CrimsonPro Italic/Regular + NothingYouCouldDo).
Aesthetic: letterpress personal note card. Cream background, serif italic message,
handwritten signoff, restrained brand-color accent band.
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


def _soft_vignette(canvas: Image.Image, strength: float = 0.18) -> Image.Image:
    """Apply a gentle corner-darkening vignette for warmth."""
    W, H = canvas.size
    vig_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    vl = ImageDraw.Draw(vig_layer)
    alpha_val = int(255 * strength)
    steps = 12
    for i in range(steps, 0, -1):
        ratio = i / steps
        margin_x = int(W * (1 - ratio) * 0.5)
        margin_y = int(H * (1 - ratio) * 0.5)
        a = min(int(alpha_val * (1 - ratio) * 1.8), 255)
        vl.ellipse([margin_x, margin_y, W - margin_x, H - margin_y], fill=(10, 8, 6, a))
    blurred_vig = vig_layer.filter(ImageFilter.GaussianBlur(radius=60))
    return Image.alpha_composite(canvas, blurred_vig)


# ---------------------------------------------------------------------------
# Core render
# ---------------------------------------------------------------------------

def render(
    gratitude_message: str,
    org_name: str,
    brand_color: str,
    donor_name: Optional[str] = None,
    signoff: Optional[str] = "With gratitude,",
    signer_name: Optional[str] = None,
    signer_title: Optional[str] = None,
    accent_color: Optional[str] = None,
    output_dir: str = "/mnt/user-data/outputs",
) -> str:
    """
    Render a 5x7 portrait donor thank-you card PNG (1500x2100 at 300 DPI).
    Returns absolute path to generated PNG.
    """
    W, H = 1500, 2100

    # --- Colors ---
    br, bg, bb = _hex_to_rgb(brand_color)

    if accent_color:
        ar, ag, ab = _hex_to_rgb(accent_color)
    else:
        ar, ag, ab = _tint(br, bg, bb, 0.55)

    # Card background: warm cream (not pure white — adds physical-card warmth)
    CREAM = (252, 249, 243)
    primary_text = (28, 22, 18)
    subtle_text = (90, 80, 72)

    canvas = Image.new("RGBA", (W, H), (*CREAM, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Load fonts ---
    font_italic = _font("CrimsonPro-Italic.ttf", 88)
    font_org = _font("CrimsonPro-Regular.ttf", 52)
    font_signoff = _font("NothingYouCouldDo-Regular.ttf", 96)
    font_signer = _font("CrimsonPro-Regular.ttf", 68)
    font_signer_title = _font("CrimsonPro-Italic.ttf", 58)
    font_donor_name = _font("CrimsonPro-Italic.ttf", 96)

    MARGIN = 120

    # --- TOP accent band (restrained — just one, not top + bottom) ---
    BAND_H = 28
    draw.rectangle([(0, 0), (W, BAND_H)], fill=(br, bg, bb, 255))
    # Thin sub-rule in accent
    draw.rectangle([(0, BAND_H), (W, BAND_H + 5)], fill=(ar, ag, ab, 255))

    # --- Subtle decorative brushstroke element (upper-right corner) ---
    # Blurred soft ellipse in accent color — watercolor impression
    brush_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(brush_layer)
    bd.ellipse([W - 280, 40, W + 80, 380], fill=(ar, ag, ab, 55))
    bd.ellipse([W - 240, 60, W + 40, 340], fill=(ar, ag, ab, 35))
    blurred_brush = brush_layer.filter(ImageFilter.GaussianBlur(radius=40))
    canvas.alpha_composite(blurred_brush)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Org name centered near top ---
    org_text = org_name.upper()
    ob = font_org.getbbox(org_text)
    org_w = ob[2] - ob[0]
    org_y = BAND_H + 5 + 52
    draw.text(((W - org_w) // 2, org_y), org_text, font=font_org, fill=(br, bg, bb, 255))

    # Thin decorative rule below org name
    rule_y = org_y + 62
    draw.line([(W // 2 - 180, rule_y), (W // 2 + 180, rule_y)], fill=(ar, ag, ab, 200), width=2)

    # --- Salutation: "Dear [donor_name]," in italic ---
    y_cursor = rule_y + 80

    if donor_name:
        salutation = f"Dear {donor_name},"
        # Donor name is the hero — slightly oversize, left-aligned (personal, not corporate)
        draw.text((MARGIN, y_cursor), salutation, font=font_donor_name, fill=(*primary_text, 255))
        y_cursor += int(96 * 1.7)
    else:
        y_cursor += 20

    # --- Gratitude message in CrimsonPro-Italic for personal voice ---
    msg_lines = _wrap_text_px(gratitude_message, font_italic, W - MARGIN * 2)
    for line in msg_lines:
        draw.text((MARGIN, y_cursor), line, font=font_italic, fill=(*primary_text, 255))
        y_cursor += int(88 * 1.62)

    # --- Decorative flourish: thin rule + small diamond ornament ---
    y_cursor += 40
    mid_x = W // 2
    draw.line([(MARGIN + 60, y_cursor), (mid_x - 30, y_cursor)], fill=(ar, ag, ab, 180), width=2)
    draw.line([(mid_x + 30, y_cursor), (W - MARGIN - 60, y_cursor)], fill=(ar, ag, ab, 180), width=2)
    # Diamond
    dm = 12
    draw.polygon(
        [(mid_x, y_cursor - dm), (mid_x + dm, y_cursor), (mid_x, y_cursor + dm), (mid_x - dm, y_cursor)],
        fill=(ar, ag, ab, 220),
    )
    y_cursor += 60

    # --- Signoff in NothingYouCouldDo handwritten ---
    signoff_text = signoff or "With gratitude,"
    draw.text((MARGIN, y_cursor), signoff_text, font=font_signoff, fill=(*subtle_text, 255))
    y_cursor += int(96 * 1.8)

    # --- Signer name in CrimsonPro-Regular ---
    if signer_name:
        draw.text((MARGIN, y_cursor), signer_name, font=font_signer, fill=(*primary_text, 255))
        y_cursor += int(68 * 1.5)

    # --- Signer title in CrimsonPro-Italic ---
    if signer_title:
        draw.text((MARGIN, y_cursor), signer_title, font=font_signer_title, fill=(*subtle_text, 255))
        y_cursor += int(58 * 1.4)

    # --- Bottom accent: tiny brand-color rule only (restrained) ---
    draw.rectangle([(0, H - BAND_H), (W, H)], fill=(br, bg, bb, 255))

    # --- Warm vignette for letterpress depth ---
    canvas = _soft_vignette(canvas, strength=0.10)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Export ---
    final = canvas.convert("RGB")
    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"donor_thank_you_{timestamp}.png")
    final.save(out_path, "PNG", optimize=True)
    return out_path
