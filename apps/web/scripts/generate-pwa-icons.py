#!/usr/bin/env python3
"""
Generate PWA icons for Edify OS.

Uses the edify-mark.svg geometry to draw a purple-background E-mark icon
at the required sizes for PWA installability.

Outputs to apps/web/public/:
  icon-192.png         - 192x192 standard PWA icon
  icon-512.png         - 512x512 standard PWA icon
  icon-512-maskable.png - 512x512 with safe-zone padding for Android adaptive icons
  apple-touch-icon.png  - 180x180 for iOS home screen
"""

import os
from PIL import Image, ImageDraw

# Brand colors
PURPLE = "#9F4EF3"
BG_DARK = "#07070B"
WHITE = "#FFFFFF"

PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")


def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    h = hex_color.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore


def draw_edify_icon(size: int, maskable: bool = False) -> Image.Image:
    """
    Draw the Edify E-mark icon.

    The E-mark SVG is 3 horizontal bars (top/mid/bottom) on a 64x64 canvas:
      top bar:    x=4, y=8,  w=56, h=12
      middle bar: x=4, y=26, w=40, h=12
      bottom bar: x=4, y=44, w=56, h=12

    We scale this geometry to fill the icon canvas with appropriate padding.
    For maskable icons, Android safe zone = center 80% of canvas, so we
    add 10% padding on each side.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Purple rounded-rect background
    bg_rgb = hex_to_rgb(PURPLE)
    corner_radius = size // 5  # ~20% corner radius — matches iOS icon style
    draw.rounded_rectangle(
        [(0, 0), (size - 1, size - 1)],
        radius=corner_radius,
        fill=(*bg_rgb, 255),
    )

    # For maskable, Android crops to a circle inscribed in the full square.
    # Safe zone = 80% of size. Put the E-mark inside that.
    if maskable:
        safe_margin = size * 0.12  # 12% = slightly beyond the 10% minimum
    else:
        safe_margin = size * 0.10  # 10% padding for regular icons

    canvas_inner = size - 2 * safe_margin

    # SVG source canvas: 64x64, mark occupies x=4..60, y=8..56
    # Mark bounding box: x_start=4, y_start=8, x_end=60, y_end=56
    # So mark width=56, mark height=48
    svg_x_start = 4
    svg_width = 56
    svg_y_start = 8
    svg_height = 48
    svg_canvas = 64.0

    # Scale factor: fit mark into canvas_inner
    scale = canvas_inner / max(svg_width, svg_height)

    # Center the mark in the icon
    mark_pixel_w = svg_width * scale
    mark_pixel_h = svg_height * scale
    x_offset = safe_margin + (canvas_inner - mark_pixel_w) / 2
    y_offset = safe_margin + (canvas_inner - mark_pixel_h) / 2

    def svg_to_px(svg_x, svg_y, svg_w, svg_h):
        """Convert SVG rect coords to pixel coords."""
        px = x_offset + (svg_x - svg_x_start) * scale
        py = y_offset + (svg_y - svg_y_start) * scale
        pw = svg_w * scale
        ph = svg_h * scale
        bar_radius = max(1, ph * 0.15)
        return (px, py, pw, ph, bar_radius)

    white_rgb = hex_to_rgb(WHITE)

    # Top bar: x=4, y=8, w=56, h=12
    px, py, pw, ph, br = svg_to_px(4, 8, 56, 12)
    draw.rounded_rectangle(
        [(px, py), (px + pw, py + ph)],
        radius=br,
        fill=(*white_rgb, 255),
    )

    # Middle bar: x=4, y=26, w=40, h=12
    px, py, pw, ph, br = svg_to_px(4, 26, 40, 12)
    draw.rounded_rectangle(
        [(px, py), (px + pw, py + ph)],
        radius=br,
        fill=(*white_rgb, 255),
    )

    # Bottom bar: x=4, y=44, w=56, h=12
    px, py, pw, ph, br = svg_to_px(4, 44, 56, 12)
    draw.rounded_rectangle(
        [(px, py), (px + pw, py + ph)],
        radius=br,
        fill=(*white_rgb, 255),
    )

    return img


def save_png(img: Image.Image, path: str):
    # Flatten alpha onto dark background for PNG
    bg = Image.new("RGBA", img.size, (*hex_to_rgb(BG_DARK), 255))
    composed = Image.alpha_composite(bg, img)
    rgb = composed.convert("RGB")
    rgb.save(path, "PNG", optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f"  Saved {path} ({kb:.1f} KB)")


sizes = [
    ("icon-192.png", 192, False),
    ("icon-512.png", 512, False),
    ("icon-512-maskable.png", 512, True),
    ("apple-touch-icon.png", 180, False),
]

print("Generating Edify PWA icons...")
for filename, size, maskable in sizes:
    img = draw_edify_icon(size, maskable=maskable)
    out_path = os.path.join(PUBLIC_DIR, filename)
    save_png(img, out_path)

print("Done.")
