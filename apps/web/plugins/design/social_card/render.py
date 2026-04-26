"""
social_card/render.py
Generates a 1080x1080 social media graphic (Instagram square / FB post / LinkedIn slide).
Uses ReportLab for PDF layout + pdf2image to convert to PNG.
All libraries are pre-installed in Anthropic's code-execution sandbox.
"""

import io
import os
import time
from typing import Optional

from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape
from reportlab.pdfgen import canvas as rl_canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# pdf2image converts the PDF page to a raster PNG
from pdf2image import convert_from_bytes


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hex_to_rgb(hex_color: str):
    """Convert #RRGGBB to a (r, g, b) tuple in 0–1 range for ReportLab."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r / 255.0, g / 255.0, b / 255.0


def _luminance(r, g, b) -> float:
    """Perceived luminance (0=black, 1=white)."""
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def _contrast_text(r, g, b) -> tuple:
    """Return white or near-black depending on background luminance."""
    return (1, 1, 1) if _luminance(r, g, b) < 0.4 else (0.08, 0.08, 0.08)


def _tint(r, g, b, factor=0.35) -> tuple:
    """Lighten a color toward white by factor (0=original, 1=white)."""
    return (
        r + (1 - r) * factor,
        g + (1 - g) * factor,
        b + (1 - b) * factor,
    )


def _shade(r, g, b, factor=0.4) -> tuple:
    """Darken a color toward black by factor (0=original, 1=black)."""
    return (r * (1 - factor), g * (1 - factor), b * (1 - factor))


def _wrap_text(text: str, max_chars_per_line: int) -> list:
    """Simple word-wrap returning a list of lines."""
    words = text.split()
    lines = []
    current = []
    current_len = 0
    for word in words:
        if current_len + len(word) + (1 if current else 0) > max_chars_per_line:
            if current:
                lines.append(" ".join(current))
            current = [word]
            current_len = len(word)
        else:
            current.append(word)
            current_len += len(word) + (1 if len(current) > 1 else 0)
    if current:
        lines.append(" ".join(current))
    return lines


def _font_for_style(style: str) -> str:
    """Map font_style enum to a ReportLab built-in font name."""
    mapping = {
        "serif":      "Times-Roman",
        "sans-serif": "Helvetica",
        "elegant":    "Times-Italic",
        "bold":       "Helvetica-Bold",
    }
    return mapping.get(style, "Helvetica")


def _bold_font_for_style(style: str) -> str:
    mapping = {
        "serif":      "Times-Bold",
        "sans-serif": "Helvetica-Bold",
        "elegant":    "Times-BoldItalic",
        "bold":       "Helvetica-Bold",
    }
    return mapping.get(style, "Helvetica-Bold")


# ---------------------------------------------------------------------------
# Core render function
# ---------------------------------------------------------------------------

def render(
    headline: str,
    brand_color: str,
    subheadline: Optional[str] = None,
    cta: Optional[str] = None,
    secondary_color: Optional[str] = None,
    font_style: str = "sans-serif",
    org_name: Optional[str] = None,
    output_dir: str = "/mnt/user-data/outputs",
) -> str:
    """
    Render a 1080x1080 social media card PNG.

    Returns the absolute path to the generated PNG file.
    """
    # --- Resolve colors ---
    bg_r, bg_g, bg_b = _hex_to_rgb(brand_color)

    if secondary_color:
        sec_r, sec_g, sec_b = _hex_to_rgb(secondary_color)
    else:
        # Auto-pick: use white on dark backgrounds, dark on light
        sec_r, sec_g, sec_b = _contrast_text(bg_r, bg_g, bg_b)

    accent_r, accent_g, accent_b = _tint(bg_r, bg_g, bg_b, 0.25)
    dark_r, dark_g, dark_b = _shade(bg_r, bg_g, bg_b, 0.35)

    text_r, text_g, text_b = _contrast_text(bg_r, bg_g, bg_b)

    # --- ReportLab canvas: 1080x1080 pt (1 pt = 1 px at 72dpi; we'll export at 15x) ---
    # To get a true 1080px output we set the page to 1080x1080 and export at 1 DPI multiple
    # (pdf2image dpi=72 * 15 = 1080 would be overkill; simpler: use 72dpi and export at 15x)
    # Easiest: set page size to 1080x1080 pts and convert at 72 DPI → 1080px
    W = 1080.0
    H = 1080.0

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(W, H))

    # --- Background ---
    c.setFillColorRGB(bg_r, bg_g, bg_b)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # --- Decorative accent band (top 8px) ---
    c.setFillColorRGB(*_tint(bg_r, bg_g, bg_b, 0.4))
    c.rect(0, H - 8, W, 8, fill=1, stroke=0)

    # --- Decorative bottom band ---
    c.setFillColorRGB(*_shade(bg_r, bg_g, bg_b, 0.2))
    c.rect(0, 0, W, 80, fill=1, stroke=0)

    # --- Subtle geometric accent: large faint circle upper-right ---
    c.setFillColorRGB(*_tint(bg_r, bg_g, bg_b, 0.12))
    c.circle(W - 60, H - 60, 280, fill=1, stroke=0)

    # --- Small accent circle lower-left ---
    c.setFillColorRGB(*_tint(bg_r, bg_g, bg_b, 0.10))
    c.circle(80, 120, 140, fill=1, stroke=0)

    # --- Headline ---
    headline_font = _bold_font_for_style(font_style)
    base_font = _font_for_style(font_style)

    # Compute headline font size based on length
    if len(headline) <= 20:
        headline_size = 96
        max_chars = 16
    elif len(headline) <= 35:
        headline_size = 76
        max_chars = 20
    else:
        headline_size = 60
        max_chars = 26

    headline_lines = _wrap_text(headline, max_chars)

    # Vertical centering: start headline near vertical center
    block_height_est = len(headline_lines) * (headline_size * 1.2)
    if subheadline:
        block_height_est += 40 + 36 * 1.4  # gap + subheadline line
    if cta:
        block_height_est += 40  # gap for cta

    y_start = (H + block_height_est) / 2 - 40

    c.setFillColorRGB(text_r, text_g, text_b)
    c.setFont(headline_font, headline_size)
    y = y_start
    for line in headline_lines:
        c.drawCentredString(W / 2, y, line)
        y -= headline_size * 1.25

    # --- Thin divider rule ---
    rule_y = y - 20
    c.setStrokeColorRGB(sec_r, sec_g, sec_b)
    c.setLineWidth(2)
    c.line(W * 0.25, rule_y, W * 0.75, rule_y)
    y = rule_y - 28

    # --- Subheadline ---
    if subheadline:
        sub_size = 32
        sub_lines = _wrap_text(subheadline, 40)
        c.setFillColorRGB(text_r, text_g, text_b)
        c.setFont(base_font, sub_size)
        for line in sub_lines:
            c.drawCentredString(W / 2, y, line)
            y -= sub_size * 1.4

    # --- CTA (bottom area) ---
    if cta:
        cta_y = 110
        c.setFillColorRGB(sec_r, sec_g, sec_b)
        c.setFont(headline_font, 28)
        c.drawCentredString(W / 2, cta_y, cta)

    # --- Org name footer ---
    if org_name:
        c.setFillColorRGB(text_r, text_g, text_b)
        c.setFont(base_font, 20)
        c.drawCentredString(W / 2, 28, org_name.upper())

    c.save()
    pdf_bytes = buf.getvalue()

    # --- Convert PDF → PNG via pdf2image ---
    # dpi=72 with 1080pt canvas → 1080px output
    images = convert_from_bytes(pdf_bytes, dpi=72, fmt="png")
    img = images[0]

    # Ensure output is exactly 1080x1080 (pdf2image may round)
    if img.size != (1080, 1080):
        from PIL import Image as PILImage
        img = img.resize((1080, 1080), PILImage.LANCZOS)

    # --- Save output ---
    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"social_card_{timestamp}.png")
    img.save(out_path, "PNG", optimize=True)

    return out_path
