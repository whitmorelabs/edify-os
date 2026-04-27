"""
donor_thank_you/render.py
Generates a warm 5x7" portrait thank-you card (1500x2100 at 300 DPI).
Uses ReportLab for PDF layout + pdf2image to convert to PNG.
All libraries are pre-installed in Anthropic's code-execution sandbox.
"""

import io
import os
import time
from typing import Optional

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


def _wrap_text(text: str, max_chars: int) -> list:
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


def _draw_heart(c, cx, cy, size, r, g, b, alpha=0.18):
    """Draw a simple heart using two arcs and a triangle (filled polygon)."""
    from reportlab.lib.colors import Color
    c.setFillColor(Color(r, g, b, alpha=alpha))
    # Simple heart approximation using a path
    c.saveState()
    c.translate(cx, cy)
    c.scale(size, size)
    p = c.beginPath()
    # Heart drawn as two semicircles + V bottom
    # Upper-left lobe
    p.arc(-0.5, 0.0, 0.0, 1.0, startAng=0, extent=180)
    # Upper-right lobe
    p.arc(0.0, 0.0, 0.5, 1.0, startAng=0, extent=180)
    # Right slope down to point
    p.lineTo(0.0, -1.0)
    # Left slope back
    p.lineTo(-0.5, 0.0)
    p.close()
    c.drawPath(p, fill=1, stroke=0)
    c.restoreState()


# ---------------------------------------------------------------------------
# Core render function
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
    # --- Colors ---
    br, bg, bb = _hex_to_rgb(brand_color)

    if accent_color:
        ar, ag, ab = _hex_to_rgb(accent_color)
    else:
        # Default: warm complementary — lighten the brand color considerably
        ar, ag, ab = _tint(br, bg, bb, 0.55)

    # Card background: warm off-white
    card_bg = (0.99, 0.98, 0.96)

    # Text colors on light background
    primary_text = (0.12, 0.10, 0.10)
    subtle_text = (0.35, 0.32, 0.30)

    # Page: 5x7 inches at 72 DPI → 360x504 pt
    W = 5.0 * 72   # 360 pt
    H = 7.0 * 72   # 504 pt

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(W, H))

    # ---- Card background ----
    c.setFillColorRGB(*card_bg)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ---- Top accent band (brand_color strip) ----
    BAND_H = 14
    c.setFillColorRGB(br, bg, bb)
    c.rect(0, H - BAND_H, W, BAND_H, fill=1, stroke=0)

    # ---- Thin accent rule below band ----
    c.setFillColorRGB(ar, ag, ab)
    c.rect(0, H - BAND_H - 3, W, 3, fill=1, stroke=0)

    # ---- Bottom accent band ----
    c.setFillColorRGB(br, bg, bb)
    c.rect(0, 0, W, BAND_H, fill=1, stroke=0)

    # Thin accent rule above bottom band
    c.setFillColorRGB(ar, ag, ab)
    c.rect(0, BAND_H, W, 3, fill=1, stroke=0)

    # ---- Decorative heart motif (subtle, upper-right) ----
    try:
        _draw_heart(c, W - 38, H - 60, 22, ar, ag, ab, alpha=0.25)
    except Exception:
        pass  # Non-critical decoration — skip on error

    # ---- Small decorative heart (lower-left) ----
    try:
        _draw_heart(c, 36, 52, 14, br, bg, bb, alpha=0.20)
    except Exception:
        pass

    # ---- Org name (small, top-center, in brand color) ----
    c.setFillColorRGB(br, bg, bb)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(W / 2, H - BAND_H - 22, org_name.upper())

    # ---- Thin horizontal rule after org name ----
    c.setStrokeColorRGB(ar, ag, ab)
    c.setLineWidth(1.5)
    rule_y = H - BAND_H - 34
    c.line(W * 0.2, rule_y, W * 0.8, rule_y)

    # ---- Salutation: "Dear [donor_name]," ----
    MARGIN = 28
    y_cursor = H - BAND_H - 60

    if donor_name:
        c.setFillColorRGB(*primary_text)
        c.setFont("Times-Italic", 18)
        c.drawString(MARGIN, y_cursor, f"Dear {donor_name},")
        y_cursor -= 18 * 1.8
    else:
        y_cursor -= 8

    # ---- Gratitude message ----
    msg_lines = _wrap_text(gratitude_message, 38)
    c.setFillColorRGB(*primary_text)
    c.setFont("Times-Roman", 17)
    for line in msg_lines:
        c.drawString(MARGIN, y_cursor, line)
        y_cursor -= 17 * 1.65

    # ---- Small decorative flourish ----
    y_cursor -= 10
    c.setStrokeColorRGB(ar, ag, ab)
    c.setLineWidth(1)
    c.line(W * 0.3, y_cursor, W * 0.7, y_cursor)
    y_cursor -= 20

    # ---- Signoff block ----
    signoff_text = signoff or "With gratitude,"
    c.setFillColorRGB(*subtle_text)
    c.setFont("Times-Italic", 16)
    c.drawString(MARGIN, y_cursor, signoff_text)
    y_cursor -= 16 * 2.2

    if signer_name:
        c.setFillColorRGB(*primary_text)
        c.setFont("Times-Bold", 16)
        c.drawString(MARGIN, y_cursor, signer_name)
        y_cursor -= 16 * 1.5

    if signer_title:
        c.setFillColorRGB(*subtle_text)
        c.setFont("Times-Roman", 13)
        c.drawString(MARGIN, y_cursor, signer_title)
        y_cursor -= 13 * 1.4

    c.save()
    pdf_bytes = buf.getvalue()

    # --- Convert PDF → PNG at 300 DPI → 1500x2100 ---
    images = convert_from_bytes(pdf_bytes, dpi=300, fmt="png")
    img = images[0]

    if img.size != (1500, 2100):
        from PIL import Image as PILImage
        img = img.resize((1500, 2100), PILImage.LANCZOS)

    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"donor_thank_you_{timestamp}.png")
    img.save(out_path, "PNG", optimize=True)

    return out_path
