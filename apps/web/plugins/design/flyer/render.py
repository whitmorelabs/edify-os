"""
flyer/render.py
Generates a print-ready US Letter portrait flyer (2550x3300 at 300 DPI).
Uses Pillow directly — bundled Google Fonts (YoungSerif + Outfit + WorkSans).

Wow-factor overhaul (Apr 2026):
  1. Hero imagery — optional hero_image_url downloads + composites into hero band
  2. Custom bullet icons — optional bullet_icons keywords mapped to bundled PNGs
  3. Date as design element — big numeric day + month eyebrow + time sub
  4. Texture + depth — paper-grain noise overlay on cream body area
  5. Geometric accent stack — arc, vertical line, sun-ray, ribbon accents
"""

import io
import math
import os
import re
import time
import urllib.request
from typing import List, Optional

from PIL import Image, ImageDraw, ImageFilter, ImageFont


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
_ICON_DIR = os.path.join(os.path.dirname(__file__), "icons")
_ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")


# ---------------------------------------------------------------------------
# Font helpers
# ---------------------------------------------------------------------------

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
# Text helpers
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
# Image fetch helpers
# ---------------------------------------------------------------------------

def _fetch_image(url: str) -> Optional[Image.Image]:
    """Download image from URL, return PIL Image or None on failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "EdifyFlyerSkill/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
        return Image.open(io.BytesIO(data)).convert("RGBA")
    except Exception:
        return None


def _smart_crop(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """Center-crop image to target dimensions, preserving aspect ratio."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = int(src_w * scale)
    new_h = int(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


def _apply_hero_photo(
    canvas: Image.Image,
    photo: Image.Image,
    hero_rect: tuple,  # (x0, y0, x1, y1)
    brand_rgb: tuple,
) -> None:
    """Composite photo into hero_rect with tint + bottom-edge gradient overlay."""
    x0, y0, x1, y1 = hero_rect
    w, h = x1 - x0, y1 - y0

    photo_crop = _smart_crop(photo.convert("RGBA"), w, h)

    # 45% brand-color tint (115/255 ≈ 0.45) keeps photo from competing with headline
    tint_layer = Image.new("RGBA", (w, h), (*brand_rgb, 115))
    photo_tinted = Image.alpha_composite(photo_crop, tint_layer)

    # Bottom-edge gradient drawn row-by-row (faster than pixel loop)
    gradient = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gradient)
    grad_start = int(h * 0.45)
    for row in range(grad_start, h):
        alpha = int(180 * (row - grad_start) / (h - grad_start))
        gd.line([(0, row), (w, row)], fill=(0, 0, 0, alpha))
    photo_final = Image.alpha_composite(photo_tinted, gradient)

    canvas.alpha_composite(photo_final, (x0, y0))


# ---------------------------------------------------------------------------
# Icon lookup
# ---------------------------------------------------------------------------

# Keyword → icon file mapping. Keywords are lowercased tokens.
_ICON_MAP = {
    "lunch": "lunch", "food": "food", "meal": "food", "dinner": "food", "breakfast": "food",
    "panel": "panel", "speaker": "panel", "speakers": "panel", "employer": "panel",
    "resume": "resume", "cv": "resume", "portfolio": "resume",
    "interview": "interview", "interviews": "interview", "hiring": "interview",
    "register": "register", "registration": "register", "rsvp": "register", "signup": "register",
    "fundraiser": "fundraiser", "donate": "fundraiser", "donation": "fundraiser", "fund": "fundraiser",
    "volunteer": "volunteer", "volunteering": "volunteer",
    "award": "award", "awards": "award", "recognition": "award",
    "network": "networking", "networking": "networking", "connect": "networking",
    "training": "training", "workshop": "training", "class": "training", "education": "training",
    "music": "music", "concert": "music", "performance": "music",
    "health": "health", "wellness": "health", "medical": "health",
    "community": "community", "social": "community",
    "calendar": "calendar", "schedule": "calendar", "date": "calendar",
    "location": "location", "venue": "location", "place": "location",
    "star": "star", "highlight": "star",
    "gift": "gift", "raffle": "gift", "prize": "gift",
    "heart": "heart", "care": "heart", "love": "heart",
    "check": "check", "done": "check", "complete": "check", "free": "check",
    "help": "check", "assistance": "check", "support": "check",
}

_ICON_CACHE: dict = {}


def _load_icon(keyword: str) -> Optional[Image.Image]:
    """Load icon PNG for keyword, returns None if not found."""
    keyword_lower = keyword.lower().strip()
    icon_name = _ICON_MAP.get(keyword_lower)

    # Try partial match
    if not icon_name:
        for k, v in _ICON_MAP.items():
            if k in keyword_lower or keyword_lower in k:
                icon_name = v
                break

    if not icon_name:
        return None

    if icon_name in _ICON_CACHE:
        return _ICON_CACHE[icon_name]

    icon_path = os.path.join(_ICON_DIR, f"{icon_name}.png")
    if not os.path.exists(icon_path):
        return None

    icon = Image.open(icon_path).convert("RGBA")
    _ICON_CACHE[icon_name] = icon
    return icon


def _tint_icon(icon: Image.Image, color_rgb: tuple, size: int = 52) -> Image.Image:
    """Recolor icon to given RGB, resize to size x size. Preserves source alpha channel."""
    icon = icon.resize((size, size), Image.LANCZOS)
    r, g, b = color_rgb
    _, _, _, a_ch = icon.split()
    return Image.merge("RGBA", [
        Image.new("L", (size, size), r),
        Image.new("L", (size, size), g),
        Image.new("L", (size, size), b),
        a_ch,
    ])


# ---------------------------------------------------------------------------
# Geometric accent helpers
# ---------------------------------------------------------------------------

def _draw_arc_accent(draw: ImageDraw.ImageDraw, W: int, H: int, color: tuple) -> None:
    """Curved arc cutting across lower-left corner."""
    # Large arc centered off-canvas lower-left
    r = int(W * 0.55)
    cx = -int(W * 0.02)
    cy = int(H * 0.78)
    bbox = [(cx - r, cy - r), (cx + r, cy + r)]
    draw.arc(bbox, start=340, end=60, fill=(*color, 55), width=22)
    draw.arc(bbox, start=340, end=60, fill=(*color, 30), width=44)


def _draw_vertical_accent(draw: ImageDraw.ImageDraw, W: int, H: int, HERO_H: int, accent: tuple) -> None:
    """Thin vertical accent line connecting hero bottom to footer top."""
    x = int(W * 0.91)
    y_start = HERO_H + 40
    y_end = int(H * 0.84)
    draw.rectangle([(x, y_start), (x + 6, y_end)], fill=(*accent, 80))


def _draw_sun_rays(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: tuple, n_rays: int = 12, r_inner: int = 90, r_outer: int = 140) -> None:
    """Sun-ray / starburst behind date block."""
    for i in range(n_rays):
        angle = 2 * math.pi * i / n_rays
        x1 = cx + r_inner * math.cos(angle)
        y1 = cy + r_inner * math.sin(angle)
        x2 = cx + r_outer * math.cos(angle)
        y2 = cy + r_outer * math.sin(angle)
        draw.line([(x1, y1), (x2, y2)], fill=(*color, 55), width=8)


def _draw_ribbon(draw: ImageDraw.ImageDraw, x: int, y: int, width: int, color: tuple) -> None:
    """Decorative ribbon / banner stripe under headline area."""
    h = 18
    draw.rectangle([(x, y), (x + width, y + h)], fill=(*color, 70))
    # Left notch
    draw.polygon([(x, y), (x, y + h), (x + 20, y + h // 2)], fill=(*color, 150))


def _draw_halftone_dots(draw: ImageDraw.ImageDraw, area_x: int, area_y: int, area_w: int, area_h: int, color: tuple) -> None:
    """Sparse halftone dot pattern in negative space."""
    spacing = 60
    dot_r = 8
    for dy in range(0, area_h, spacing):
        for dx in range(0, area_w, spacing):
            px = area_x + dx
            py = area_y + dy
            # Fade alpha by distance from top-left of area
            dist = ((dx / area_w) ** 2 + (dy / area_h) ** 2) ** 0.5
            alpha = max(0, int(45 * (1 - dist)))
            if alpha > 5:
                draw.ellipse([(px - dot_r, py - dot_r), (px + dot_r, py + dot_r)], fill=(*color, alpha))


# ---------------------------------------------------------------------------
# Date callout helper
# ---------------------------------------------------------------------------

def _parse_date_parts(date_str: str) -> tuple:
    """
    Extract (weekday, month_abbr, day_num) from a date string.
    Returns (None, None, None) if fields cannot be found.
    """
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
    month_abbrs = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                   "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

    weekday = None
    month = None
    day_num = None

    # Look for weekday
    for wd in weekdays:
        if wd.lower() in date_str.lower():
            weekday = wd.upper()
            break

    # Look for month
    for i, m in enumerate(months):
        if m.lower() in date_str.lower() or m[:3].lower() in date_str.lower():
            month = month_abbrs[i]
            break

    # Look for day number
    nums = re.findall(r'\b(\d{1,2})\b', date_str)
    for n in nums:
        val = int(n)
        if 1 <= val <= 31:
            day_num = n
            break

    return weekday, month, day_num


# ---------------------------------------------------------------------------
# Noise texture helper
# ---------------------------------------------------------------------------

def _apply_noise(canvas: Image.Image, region_y: int, region_h: int, W: int) -> None:
    """Apply paper-grain noise overlay to the cream body region."""
    noise_path = os.path.join(_ASSETS_DIR, "noise.png")
    if not os.path.exists(noise_path):
        return
    noise = Image.open(noise_path).convert("RGBA")
    nw, nh = noise.size
    # Tile noise across canvas width and region height
    for ty in range(region_y, region_y + region_h, nh):
        for tx in range(0, W, nw):
            canvas.alpha_composite(noise, dest=(tx, ty))


# ---------------------------------------------------------------------------
# Core render
# ---------------------------------------------------------------------------

def render(
    headline: str,
    brand_color: str,
    subheadline: Optional[str] = None,
    body_text: Optional[str] = None,
    bullet_points: Optional[List[str]] = None,
    bullet_icons: Optional[List[str]] = None,
    date: Optional[str] = None,
    time_str: Optional[str] = None,
    venue: Optional[str] = None,
    cta: Optional[str] = None,
    cta_url: Optional[str] = None,
    secondary_color: Optional[str] = None,
    org_name: Optional[str] = None,
    hero_image_url: Optional[str] = None,
    output_dir: str = "/mnt/user-data/outputs",
    **kwargs,
) -> str:
    """
    Render a US Letter portrait flyer PNG (2550x3300, 300 DPI).
    Returns absolute path to generated PNG.

    New inputs (wow-factor overhaul):
      hero_image_url: optional URL to a photo that composites into the hero band
      bullet_icons: optional list of keyword strings matched to bundled icon PNGs
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

    accent_dark = _shade(*accent, 0.3)

    # --- Canvas: 2550x3300 at 300 DPI ---
    W, H = 2550, 3300
    canvas = Image.new("RGBA", (W, H), (*body_bg, 255))
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- HERO BAND: brand color top 38%, diagonal bottom edge ---
    HERO_H = int(H * 0.38)
    draw.rectangle([(0, 0), (W, HERO_H)], fill=(*bg, 255))

    diagonal_drop = int(H * 0.05)
    draw.polygon(
        [(0, HERO_H), (W, HERO_H - diagonal_drop),
         (W, HERO_H + diagonal_drop // 2), (0, HERO_H + diagonal_drop // 2)],
        fill=(*bg, 255),
    )

    # Inset highlight on hero band's top edge (subtle lighter 1px line)
    lighter = _tint(*bg, 0.22)
    draw.rectangle([(0, 0), (W, 3)], fill=(*lighter, 255))

    # Thin accent stripe at very top
    draw.rectangle([(0, 0), (W, 18)], fill=(*accent, 255))

    # Asymmetric corner block upper-right
    corner_w = int(W * 0.28)
    corner_h = int(HERO_H * 0.65)
    corner_color = (*_tint(*bg, 0.12), 160)
    draw.rectangle([(W - corner_w, 0), (W, corner_h)], fill=corner_color)

    # --- Hero photo compositing (wow element 1) ---
    hero_photo = None
    if hero_image_url:
        hero_photo = _fetch_image(hero_image_url)

    if hero_photo is not None:
        # Photo fills the hero band (behind text) — right side panel approach
        # Left 65% for text, right 35% for photo (split panel)
        photo_x = int(W * 0.58)
        photo_w = W - photo_x
        photo_h = HERO_H + diagonal_drop // 2 + 20
        _apply_hero_photo(canvas, hero_photo, (photo_x, 0, photo_x + photo_w, photo_h), bg)

        # Horizontal gradient blends left edge of photo into the hero band color
        gradient_blend = Image.new("RGBA", (200, photo_h), (0, 0, 0, 0))
        gb_draw = ImageDraw.Draw(gradient_blend)
        for bx in range(200):
            alpha = int(255 * (1 - bx / 200))
            gb_draw.line([(bx, 0), (bx, photo_h)], fill=(*bg, alpha))
        canvas.alpha_composite(gradient_blend, (photo_x - 80, 0))

        draw = ImageDraw.Draw(canvas, "RGBA")

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
    font_logistics = font_body  # same face + size
    font_bullet = _font("Outfit-Regular.ttf", 72)
    font_cta = _font("WorkSans-Bold.ttf", 96)
    font_footer = _font("Outfit-Regular.ttf", 56)
    font_date_big = _font("YoungSerif-Regular.ttf", 200)
    font_date_month = _font("WorkSans-Bold.ttf", 80)
    font_date_time = _font("Outfit-Regular.ttf", 64)
    font_date_weekday = _font("WorkSans-Bold.ttf", 56)

    MARGIN = int(W * 0.09)
    text_w = W - MARGIN * 2

    # Text area width — narrower when photo occupies right side
    hero_text_w = int(W * 0.56) - MARGIN if hero_photo else text_w - corner_w - 100

    # --- Eyebrow label in hero band ---
    eyebrow_text = org_name.upper() if org_name else "ANNOUNCEMENT"
    eyebrow_spaced = _letter_spaced(eyebrow_text, spacing=2)
    draw.text((MARGIN, MARGIN + 30), eyebrow_spaced, font=font_eyebrow, fill=(*accent, 220))

    # --- Headline in YoungSerif hero with shadow ---
    hl_lines = _wrap_text_px(headline, font_hero, hero_text_w)
    line_h = int(hero_size * 1.14)
    y_hero = MARGIN + 80 + 68 + 40  # below eyebrow

    shadow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow_layer)
    y_tmp = y_hero
    for line in hl_lines:
        sd.text((MARGIN + 6, y_tmp + 10), line, font=font_hero, fill=(0, 0, 0, 100))
        y_tmp += line_h
    blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(radius=20))
    canvas.alpha_composite(blurred_shadow)
    draw = ImageDraw.Draw(canvas, "RGBA")

    y_hero_text = MARGIN + 80 + 68 + 40
    for line in hl_lines:
        draw.text((MARGIN, y_hero_text), line, font=font_hero, fill=(*text_on_dark, 255))
        y_hero_text += line_h

    # Decorative ribbon under last headline line
    ribbon_y = y_hero_text + 8
    _draw_ribbon(draw, MARGIN, ribbon_y, int(hero_text_w * 0.7), accent)

    # --- Body region top ---
    body_top = HERO_H + diagonal_drop // 2 + 90
    y_body = body_top

    # --- NOISE TEXTURE on body region (wow element 4) ---
    FOOTER_H = int(H * 0.14)
    footer_y = H - FOOTER_H
    body_region_h = footer_y - body_top
    _apply_noise(canvas, body_top, body_region_h, W)
    draw = ImageDraw.Draw(canvas, "RGBA")

    # --- Geometric accent: halftone dots in upper-right body corner ---
    dots_x = int(W * 0.72)
    dots_y = body_top + 30
    _draw_halftone_dots(draw, dots_x, dots_y, int(W * 0.20), int(H * 0.12), bg)

    # --- Subheadline ---
    if subheadline:
        sub_lines = _wrap_text_px(subheadline, font_sub, text_w)
        for line in sub_lines:
            draw.text((MARGIN, y_body), line, font=font_sub, fill=(*_shade(*bg, 0.1), 255))
            y_body += int(90 * 1.4)
        y_body += 40

    # --- DATE CALLOUT as design element (wow element 3) ---
    if date or time_str or venue:
        weekday, month_abbr, day_num = _parse_date_parts(date) if date else (None, None, None)

        date_block_w = int(W * 0.30)
        date_block_x = W - MARGIN - date_block_w
        DATE_BLOCK_H = 340

        # Soft shadow ellipse beneath date block
        shadow_ellipse = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        se_draw = ImageDraw.Draw(shadow_ellipse)
        se_draw.ellipse([
            (date_block_x - 30, y_body + 10),
            (date_block_x + date_block_w + 30, y_body + DATE_BLOCK_H + 20)
        ], fill=(0, 0, 0, 40))
        shadow_blurred = shadow_ellipse.filter(ImageFilter.GaussianBlur(radius=30))
        canvas.alpha_composite(shadow_blurred)
        draw = ImageDraw.Draw(canvas, "RGBA")

        if day_num:
            sun_cx = date_block_x + date_block_w // 2
            sun_cy = y_body + 140
            _draw_sun_rays(draw, sun_cx, sun_cy, accent, n_rays=16, r_inner=80, r_outer=160)

        date_bg = (*_tint(*bg, 0.92), 255)
        draw.rectangle([
            (date_block_x, y_body),
            (date_block_x + date_block_w, y_body + DATE_BLOCK_H)
        ], fill=date_bg)

        draw.rectangle([
            (date_block_x, y_body),
            (date_block_x + 12, y_body + DATE_BLOCK_H)
        ], fill=(*accent, 255))

        # Weekday label above month (small)
        date_text_x = date_block_x + 36
        date_y = y_body + 18
        if weekday:
            wd_spaced = _letter_spaced(weekday, spacing=1)
            draw.text((date_text_x, date_y), wd_spaced, font=font_date_weekday, fill=(*bg, 140))
            date_y += 62

        # Month eyebrow
        if month_abbr:
            mo_spaced = _letter_spaced(month_abbr, spacing=4)
            draw.text((date_text_x, date_y), mo_spaced, font=font_date_month, fill=(*bg, 200))
            date_y += 88

        # Big day number — the focal point
        if day_num:
            day_bbox = font_date_big.getbbox(day_num)
            # Center the big number
            day_w = day_bbox[2] - day_bbox[0]
            day_x = date_block_x + (date_block_w - day_w) // 2
            draw.text((day_x, date_y - 10), day_num, font=font_date_big, fill=(*bg, 255))
            date_y += 190

        # Time below
        if time_str:
            draw.text((date_text_x, date_y), time_str, font=font_date_time, fill=(*bg, 180))
            date_y += 70

        # Venue info in info block on the left
        info_block_w = int(W * 0.52)
        info_block_x = MARGIN
        info_y = y_body

        # Left info box (date text + venue)
        box_lines = []
        if date:
            box_lines.append(("LABEL", date.upper()))
        if venue:
            box_lines.append(("INFO", venue))

        box_line_h = 110
        box_pad = 60
        box_h = max(len(box_lines) * box_line_h + box_pad * 2, 200)
        box_bg = (*_tint(*bg, 0.88), 255)
        draw.rectangle([(info_block_x, info_y), (info_block_x + info_block_w, info_y + box_h)], fill=box_bg)
        draw.rectangle([(info_block_x, info_y), (info_block_x + 12, info_y + box_h)], fill=(*accent, 255))

        y_l = info_y + box_pad
        for kind, txt in box_lines:
            f = font_logistics_label if kind == "LABEL" else font_logistics
            draw.text((info_block_x + 48, y_l), txt, font=f, fill=(*bg, 255))
            y_l += box_line_h

        date_block_bottom = y_body + DATE_BLOCK_H
        info_block_bottom = info_y + box_h
        y_body = max(date_block_bottom, info_block_bottom) + 70

    # --- Body text ---
    if body_text:
        body_lines = _wrap_text_px(body_text, font_body, text_w)
        for line in body_lines:
            if y_body > H - 520:
                break
            draw.text((MARGIN, y_body), line, font=font_body, fill=(*text_on_light, 255))
            y_body += int(72 * 1.55)
        y_body += 30

    # --- Bullet points: two-column with custom icons (wow elements 2) ---
    if bullet_points:
        bullets = bullet_points[:6]
        col_w = (text_w - 60) // 2
        font_bul_label = _font("WorkSans-Bold.ttf", 68)
        draw.text((MARGIN, y_body), "HIGHLIGHTS", font=font_bul_label, fill=(*bg, 255))
        y_body += 90

        left_y = y_body
        right_y = y_body

        for i, point in enumerate(bullets):
            if max(left_y, right_y) > H - 520:
                break
            col_x = MARGIN if i % 2 == 0 else MARGIN + col_w + 60
            col_y = left_y if i % 2 == 0 else right_y

            # Determine icon keyword
            icon_keyword = None
            if bullet_icons and i < len(bullet_icons):
                icon_keyword = bullet_icons[i]
            else:
                # Auto-detect from bullet text
                words_in_bullet = point.lower().split()
                for w in words_in_bullet:
                    if w in _ICON_MAP:
                        icon_keyword = w
                        break

            icon_img = _load_icon(icon_keyword) if icon_keyword else None

            if icon_img is not None:
                icon_tinted = _tint_icon(icon_img, accent_dark, size=52)
                canvas.alpha_composite(icon_tinted, (col_x, col_y + 4))
                text_x = col_x + 64
                draw = ImageDraw.Draw(canvas, "RGBA")
            else:
                # Fallback: diamond bullet marker
                dm = 14
                draw.polygon(
                    [(col_x, col_y + 36), (col_x + dm, col_y + 36 - dm),
                     (col_x + dm * 2, col_y + 36), (col_x + dm, col_y + 36 + dm)],
                    fill=(*accent, 255),
                )
                text_x = col_x + dm * 2 + 14

            bul_lines = _wrap_text_px(point, font_bullet, col_w - 70)
            for bl in bul_lines:
                draw.text((text_x, col_y), bl, font=font_bullet, fill=(*text_on_light, 255))
                col_y += int(72 * 1.45)

            if i % 2 == 0:
                left_y = col_y + 20
            else:
                right_y = col_y + 20

        y_body = max(left_y, right_y) + 20

    # --- Geometric accents: arc + vertical line (wow element 5) ---
    _draw_arc_accent(draw, W, H, bg)
    _draw_vertical_accent(draw, W, H, HERO_H, accent)

    # --- Footer band ---
    draw.rectangle([(0, footer_y), (W, H)], fill=(*bg_dark, 255))
    draw.rectangle([(0, footer_y), (W, footer_y + 10)], fill=(*accent, 255))

    # CTA in footer
    footer_text_col = _contrast_text(*bg_dark)
    if cta:
        cb = font_cta.getbbox(cta)
        cta_y_pos = footer_y + (FOOTER_H - (cb[3] - cb[1])) // 2 - 20
        draw.text((MARGIN, cta_y_pos), cta, font=font_cta, fill=(*footer_text_col, 255))
        if cta_url:
            draw.text((MARGIN, cta_y_pos + 110), cta_url, font=font_footer, fill=(*footer_text_col, 160))
    elif cta_url:
        draw.text((MARGIN, footer_y + FOOTER_H // 2 - 30), cta_url, font=font_footer, fill=(*footer_text_col, 200))

    # Org name footer right
    if org_name:
        ob = font_footer.getbbox(org_name.upper())
        org_w = ob[2] - ob[0]
        draw.text((W - MARGIN - org_w, H - int(FOOTER_H * 0.4)), org_name.upper(),
                  font=font_footer, fill=(*footer_text_col, 140))

    # --- Export 2550x3300 PNG ---
    final = canvas.convert("RGB")
    os.makedirs(output_dir, exist_ok=True)
    timestamp = int(time.time())
    out_path = os.path.join(output_dir, f"flyer_{timestamp}.png")
    final.save(out_path, "PNG", optimize=True)
    return out_path
