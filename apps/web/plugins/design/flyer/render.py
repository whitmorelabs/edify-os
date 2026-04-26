"""
flyer/render.py
Generates a print-ready US Letter portrait flyer (2550x3300 at 300 DPI).
Uses ReportLab for PDF layout + pdf2image to convert to PNG.
All libraries are pre-installed in Anthropic's code-execution sandbox.
"""

import io
import os
import time
from typing import Optional, List

from reportlab.lib.units import inch
from reportlab.pdfgen import canvas as rl_canvas
from pdf2image import convert_from_bytes


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hex_to_rgb(hex_color: str):
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return r / 255.0, g / 255.0, b / 255.0


def _luminance(r, g, b) -> float:
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def _contrast_text(r, g, b) -> tuple:
    return (1, 1, 1) if _luminance(r, g, b) < 0.4 else (0.08, 0.08, 0.08)


def _tint(r, g, b, factor=0.35) -> tuple:
    return (r + (1 - r) * factor, g + (1 - g) * factor, b + (1 - b) * factor)


def _shade(r, g, b, factor=0.4) -> tuple:
    return (r * (1 - factor), g * (1 - factor), b * (1 - factor))


def _wrap_text(text: str, max_chars: int) -> List[str]:
    words = text.split()
    lines, current, current_len = [], [], 0
    for word in words:
        needed = len(word) + (1 if current else 0)
        if current_len + needed > max_chars:
            if current:
                lines.append(" ".join(current))
            current, current_len = [word], len(word)
        else:
            current.append(word)
            current_len += needed
    if current:
        lines.append(" ".join(current))
    return lines


# ---------------------------------------------------------------------------
# Core render function
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
    # Allow caller to pass 'time' kwarg (maps to time_str internally)
    **kwargs,
) -> str:
    """
    Render a US Letter portrait flyer PNG (2550x3300, 300 DPI).
    Returns absolute path to generated PNG.
    """
    # Handle 'time' kwarg since Python reserves 'time' as a module name
    if "time" in kwargs and time_str is None:
        time_str = kwargs.pop("time")

    # --- Colors ---
    bg_r, bg_g, bg_b = _hex_to_rgb(brand_color)
    text_on_dark = _contrast_text(bg_r, bg_g, bg_b)

    if secondary_color:
        sec_r, sec_g, sec_b = _hex_to_rgb(secondary_color)
    else:
        # Default to a warm tint for the accent
        sec_r, sec_g, sec_b = _tint(bg_r, bg_g, bg_b, 0.45)

    # Page in points at 72 DPI for US Letter (8.5 x 11 in)
    # pdf2image at 300 DPI will produce 2550x3300 px
    W = 8.5 * 72    # 612 pt
    H = 11.0 * 72   # 792 pt

    MARGIN = 0.55 * 72  # ~40pt margin

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(W, H))

    # ---- Header band ----
    HEADER_H = 1.8 * 72  # 1.8 inches
    c.setFillColorRGB(bg_r, bg_g, bg_b)
    c.rect(0, H - HEADER_H, W, HEADER_H, fill=1, stroke=0)

    # Thin accent rule at bottom of header
    c.setFillColorRGB(sec_r, sec_g, sec_b)
    c.rect(0, H - HEADER_H, W, 5, fill=1, stroke=0)

    # Headline text in header
    headline_text_color = _contrast_text(bg_r, bg_g, bg_b)
    c.setFillColorRGB(*headline_text_color)

    # Choose font size based on headline length
    if len(headline) <= 24:
        h_size = 40
        max_chars = 28
    elif len(headline) <= 40:
        h_size = 32
        max_chars = 36
    else:
        h_size = 26
        max_chars = 44

    h_lines = _wrap_text(headline, max_chars)
    line_height = h_size * 1.3

    # Center vertically in header
    total_h = len(h_lines) * line_height
    y = H - HEADER_H / 2 + total_h / 2 - line_height * 0.3

    c.setFont("Helvetica-Bold", h_size)
    for line in h_lines:
        c.drawCentredString(W / 2, y, line)
        y -= line_height

    # ---- Subheadline ----
    y_cursor = H - HEADER_H - 32

    if subheadline:
        sub_lines = _wrap_text(subheadline, 60)
        c.setFillColorRGB(bg_r, bg_g, bg_b)
        c.setFont("Helvetica-Oblique", 18)
        for line in sub_lines:
            c.drawCentredString(W / 2, y_cursor, line)
            y_cursor -= 18 * 1.4
        y_cursor -= 8

    # ---- Event logistics block (date / time / venue) ----
    has_logistics = date or time_str or venue
    if has_logistics:
        # Logistics box with light tint background
        box_y_start = y_cursor
        box_content_lines = []
        if date:
            box_content_lines.append(("Helvetica-Bold", 16, date.upper()))
        if time_str:
            box_content_lines.append(("Helvetica", 15, time_str))
        if venue:
            box_content_lines.append(("Helvetica-Oblique", 14, venue))

        box_h = len(box_content_lines) * 22 + 24
        box_y_top = box_y_start
        box_y_bottom = box_y_top - box_h

        # Light tint background box
        c.setFillColorRGB(*_tint(bg_r, bg_g, bg_b, 0.82))
        c.roundRect(MARGIN, box_y_bottom, W - 2 * MARGIN, box_h, 8, fill=1, stroke=0)

        # Accent left border
        c.setFillColorRGB(sec_r, sec_g, sec_b)
        c.rect(MARGIN, box_y_bottom, 5, box_h, fill=1, stroke=0)

        y_line = box_y_start - 14
        for font, size, text in box_content_lines:
            c.setFillColorRGB(bg_r, bg_g, bg_b)
            c.setFont(font, size)
            c.drawCentredString(W / 2, y_line, text)
            y_line -= 22

        y_cursor = box_y_bottom - 20

    # ---- Body text ----
    if body_text:
        body_lines = _wrap_text(body_text, 68)
        c.setFillColorRGB(0.12, 0.12, 0.12)
        c.setFont("Helvetica", 14)
        for line in body_lines:
            if y_cursor < 160:
                break  # Don't overflow into footer
            c.drawCentredString(W / 2, y_cursor, line)
            y_cursor -= 14 * 1.55
        y_cursor -= 10

    # ---- Bullet points ----
    if bullet_points:
        BULLET_X = MARGIN + 20
        c.setFont("Helvetica-Bold", 13)
        c.setFillColorRGB(bg_r, bg_g, bg_b)
        c.drawString(MARGIN, y_cursor, "HIGHLIGHTS")
        y_cursor -= 20

        c.setFont("Helvetica", 14)
        for point in bullet_points[:5]:
            if y_cursor < 160:
                break
            c.setFillColorRGB(sec_r, sec_g, sec_b)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(MARGIN, y_cursor, "•")
            c.setFillColorRGB(0.1, 0.1, 0.1)
            c.setFont("Helvetica", 14)
            c.drawString(BULLET_X, y_cursor, point[:80])
            y_cursor -= 22

        y_cursor -= 8

    # ---- Footer band ----
    FOOTER_H = 1.0 * 72
    c.setFillColorRGB(bg_r, bg_g, bg_b)
    c.rect(0, 0, W, FOOTER_H, fill=1, stroke=0)

    # Thin accent rule at top of footer
    c.setFillColorRGB(sec_r, sec_g, sec_b)
    c.rect(0, FOOTER_H, W, 4, fill=1, stroke=0)

    # CTA in footer
    footer_text_color = _contrast_text(bg_r, bg_g, bg_b)
    c.setFillColorRGB(*footer_text_color)

    if cta:
        c.setFont("Helvetica-Bold", 24)
        cta_y = FOOTER_H - 28
        c.drawCentredString(W / 2, cta_y, cta)
        if cta_url:
            c.setFont("Helvetica", 14)
            c.drawCentredString(W / 2, cta_y - 22, cta_url)
    elif cta_url:
        c.setFont("Helvetica", 16)
        c.drawCentredString(W / 2, FOOTER_H - 30, cta_url)

    if org_name:
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(W / 2, 10, org_name.upper())

    c.save()
    pdf_bytes = buf.getvalue()

    # --- Convert PDF → PNG at 300 DPI → 2550x3300 ---
    images = convert_from_bytes(pdf_bytes, dpi=300, fmt="png")
    img = images[0]

    # Ensure exact dimensions
    if img.size != (2550, 3300):
        from PIL import Image as PILImage
        img = img.resize((2550, 3300), PILImage.LANCZOS)

    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"flyer_{timestamp}.png")
    img.save(out_path, "PNG", optimize=True)

    return out_path
