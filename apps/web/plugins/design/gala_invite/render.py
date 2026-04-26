"""
gala_invite/render.py
Generates a formal gala save-the-date / event invite.
Default: 1080x1080 square (IG/social). portrait option: 1500x2100 (5x7 print).
Uses ReportLab for PDF layout + pdf2image to convert to PNG.
All libraries are pre-installed in Anthropic's code-execution sandbox.
"""

import io
import os
import time
from typing import Optional

from reportlab.pdfgen import canvas as rl_canvas
from reportlab.lib.colors import Color
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


def _draw_border_frame(c, W, H, margin, color_rgb, line_width=1.5):
    """Draw a thin rectangular border frame inside margins."""
    cr, cg, cb = color_rgb
    c.setStrokeColorRGB(cr, cg, cb)
    c.setLineWidth(line_width)
    c.rect(margin, margin, W - 2 * margin, H - 2 * margin, fill=0, stroke=1)


def _draw_double_border(c, W, H, outer_margin, gap, color_rgb):
    """Draw two concentric thin border lines — formal invitation aesthetic."""
    _draw_border_frame(c, W, H, outer_margin, color_rgb, 1.2)
    _draw_border_frame(c, W, H, outer_margin + gap, color_rgb, 0.6)


def _render_canvas(
    c,
    W: float,
    H: float,
    event_name: str,
    date: str,
    venue: str,
    brand_rgb: tuple,
    accent_rgb: tuple,
    tagline: Optional[str] = None,
    time_str: Optional[str] = None,
    cta: Optional[str] = None,
    cta_url: Optional[str] = None,
):
    """Draw all invite elements onto the ReportLab canvas c."""
    br, bg, bb = brand_rgb
    ar, ag, ab = accent_rgb

    # ---- Full background in brand_color ----
    c.setFillColorRGB(br, bg, bb)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    # ---- Subtle vignette / radial texture: two concentric circles fading ----
    # Lighter tint in center for depth
    c.setFillColor(Color(*_tint(br, bg, bb, 0.08), alpha=0.5))
    c.circle(W / 2, H / 2, W * 0.55, fill=1, stroke=0)
    c.setFillColor(Color(*_tint(br, bg, bb, 0.05), alpha=0.3))
    c.circle(W / 2, H / 2, W * 0.3, fill=1, stroke=0)

    # ---- Double border frame in accent color ----
    margin = W * 0.05
    _draw_double_border(c, W, H, margin, 5, accent_rgb)

    # ---- Corner ornaments: small diamond shapes at each corner ----
    diamond_size = W * 0.025
    corners = [
        (margin + 2, H - margin - 2),
        (W - margin - 2, H - margin - 2),
        (margin + 2, margin + 2),
        (W - margin - 2, margin + 2),
    ]
    c.setFillColorRGB(ar, ag, ab)
    for cx, cy in corners:
        p = c.beginPath()
        p.moveTo(cx, cy + diamond_size)
        p.lineTo(cx + diamond_size, cy)
        p.lineTo(cx, cy - diamond_size)
        p.lineTo(cx - diamond_size, cy)
        p.close()
        c.drawPath(p, fill=1, stroke=0)

    # ---- Layout vertical rhythm ----
    # Work from top to bottom, centering everything
    center_x = W / 2

    # Top padding from inner border
    inner_top = H - margin - 5 - 20

    # --- "YOU ARE INVITED" eyebrow ---
    eyebrow_y = inner_top - W * 0.06
    c.setFillColorRGB(ar, ag, ab)
    c.setFont("Helvetica", W * 0.022)
    # Letter-spaced eyebrow: manually space chars
    eyebrow = "— Y O U  A R E  I N V I T E D —"
    c.drawCentredString(center_x, eyebrow_y, eyebrow)

    # --- Thin accent rule ---
    rule_y1 = eyebrow_y - W * 0.025
    c.setStrokeColorRGB(ar, ag, ab)
    c.setLineWidth(0.8)
    c.line(W * 0.25, rule_y1, W * 0.75, rule_y1)

    # --- Event name (hero) ---
    if len(event_name) <= 22:
        name_size = W * 0.085
        max_chars = 20
    elif len(event_name) <= 36:
        name_size = W * 0.067
        max_chars = 28
    else:
        name_size = W * 0.054
        max_chars = 36

    name_lines = _wrap_text(event_name, max_chars)
    line_h = name_size * 1.3
    name_block_h = len(name_lines) * line_h

    name_y_start = rule_y1 - W * 0.04

    c.setFillColorRGB(ar, ag, ab)
    c.setFont("Times-Bold", name_size)
    y = name_y_start
    for line in name_lines:
        c.drawCentredString(center_x, y, line)
        y -= line_h

    # --- Tagline (italic, lighter) ---
    y -= W * 0.01
    if tagline:
        c.setFillColor(Color(ar, ag, ab, alpha=0.80))
        c.setFont("Times-Italic", W * 0.040)
        tag_lines = _wrap_text(tagline, 38)
        for line in tag_lines:
            c.drawCentredString(center_x, y, line)
            y -= W * 0.050

    # --- Decorative center ornament ---
    y -= W * 0.03
    ornament_y = y
    c.setStrokeColorRGB(ar, ag, ab)
    c.setLineWidth(0.6)
    c.line(W * 0.2, ornament_y, W * 0.42, ornament_y)
    c.line(W * 0.58, ornament_y, W * 0.80, ornament_y)
    # Small diamond at center
    ds = W * 0.012
    p = c.beginPath()
    p.moveTo(center_x, ornament_y + ds)
    p.lineTo(center_x + ds, ornament_y)
    p.lineTo(center_x, ornament_y - ds)
    p.lineTo(center_x - ds, ornament_y)
    p.close()
    c.setFillColorRGB(ar, ag, ab)
    c.drawPath(p, fill=1, stroke=0)

    # --- Date ---
    y -= W * 0.045
    date_size = W * 0.040
    c.setFillColorRGB(ar, ag, ab)
    c.setFont("Helvetica-Bold", date_size)
    c.drawCentredString(center_x, y, date.upper())
    y -= date_size * 1.5

    # --- Time ---
    if time_str:
        c.setFillColor(Color(ar, ag, ab, alpha=0.85))
        c.setFont("Helvetica", W * 0.033)
        c.drawCentredString(center_x, y, time_str)
        y -= W * 0.048

    # --- Venue ---
    venue_lines = _wrap_text(venue, 42)
    c.setFillColor(Color(ar, ag, ab, alpha=0.80))
    c.setFont("Times-Italic", W * 0.033)
    for line in venue_lines:
        c.drawCentredString(center_x, y, line)
        y -= W * 0.042

    # --- CTA block near bottom ---
    bottom_margin = margin + 5 + W * 0.06
    if cta:
        cta_y = bottom_margin + (W * 0.04 if cta_url else 0)
        c.setFillColorRGB(ar, ag, ab)
        c.setFont("Helvetica-Bold", W * 0.038)
        c.drawCentredString(center_x, cta_y, cta)
        if cta_url:
            c.setFillColor(Color(ar, ag, ab, alpha=0.75))
            c.setFont("Helvetica", W * 0.028)
            c.drawCentredString(center_x, bottom_margin, cta_url)


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
    # Accept 'time' kwarg since Python reserves 'time' module name
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
    br, bg, bb = _hex_to_rgb(brand_color)

    if accent_color:
        ar, ag, ab = _hex_to_rgb(accent_color)
    else:
        # Default: warm gold — works with most deep brand tones
        ar, ag, ab = _hex_to_rgb("#D4AF37")

    brand_rgb = (br, bg, bb)
    accent_rgb = (ar, ag, ab)

    # --- Canvas dimensions ---
    if format == "portrait":
        # 5x7 at 72 DPI → 360x504 pt; pdf2image at 300 DPI → 1500x2100
        W = 5.0 * 72
        H = 7.0 * 72
        target_size = (1500, 2100)
        dpi = 300
        suffix = "portrait"
    else:
        # Square: 1080x1080 pt; pdf2image at 72 DPI → 1080x1080
        W = 1080.0
        H = 1080.0
        target_size = (1080, 1080)
        dpi = 72
        suffix = "square"

    buf = io.BytesIO()
    c = rl_canvas.Canvas(buf, pagesize=(W, H))

    _render_canvas(
        c, W, H,
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

    c.save()
    pdf_bytes = buf.getvalue()

    # --- Convert PDF → PNG ---
    images = convert_from_bytes(pdf_bytes, dpi=dpi, fmt="png")
    img = images[0]

    if img.size != target_size:
        from PIL import Image as PILImage
        img = img.resize(target_size, PILImage.LANCZOS)

    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"gala_invite_{suffix}_{timestamp}.png")
    img.save(out_path, "PNG", optimize=True)

    return out_path
