#!/usr/bin/env python3
"""Rebuild the transparent school-logo assets from the source artwork.

The source is a JPEG on a white background, so it carries no alpha channel:
white is simply white pixels. This script recovers transparency by treating
"distance from white" as coverage, then un-multiplies the colour so the artwork
still composites correctly on light and dark surfaces.

Outputs (run from anywhere; paths resolve against the repo root):
  images/logo.png            dark lockup, for light surfaces (header)
  images/logo-light.png      white lockup, for dark surfaces (footer, join nav)
  images/logo-full.png       full lockup including the tagline (large placements)
  images/logo-mark.png       512px square mark (PWA icon)
  favicon.png                192px square mark (browser tab)

Usage:  python3 scripts/build-logo.py
Needs:  Pillow  (pip install Pillow)
"""

import pathlib
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover - guidance beats a stack trace
    sys.exit("Pillow is required: pip install Pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "brand" / "logo-source.jpeg"
OUT = ROOT / "images"

# JPEG noise sits just off pure white; anything below this stays fully clear.
NOISE_FLOOR = 8

# Geometry of the artwork, measured from the alpha profile of the trimmed image:
# the green "#" mark spans x 4-184 and its tail runs the full height, the
# FUTURE SCHOOL wordmark spans x 191-588 down to y 140, and the tagline sits at
# x 191-566 from y 141. The tagline can therefore be cleared without touching
# the mark's tail.
MARK_RIGHT = 189
WORDMARK_BOTTOM = 140


def to_rgba(img):
    px = img.load()
    w, h = img.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    dst = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y][:3]
            mn = min(r, g, b)
            alpha = 255 - mn
            if alpha <= NOISE_FLOOR:
                continue

            a = (alpha - NOISE_FLOOR) / (255 - NOISE_FLOOR)
            if a > 1:
                a = 1.0

            # Un-multiply against white: C = F*a + 255*(1-a)  ->  F = (C - 255*(1-a)) / a
            inv = 255 * (1 - a)
            dst[x, y] = (
                max(0, min(255, int(round((r - inv) / a)))),
                max(0, min(255, int(round((g - inv) / a)))),
                max(0, min(255, int(round((b - inv) / a)))),
                int(round(a * 255)),
            )
    return out


def trim(img, pad=2):
    bbox = img.getbbox()
    if not bbox:
        return img
    return img.crop((
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(img.width, bbox[2] + pad),
        min(img.height, bbox[3] + pad),
    ))


def drop_tagline(img):
    """Erase the tagline while keeping the mark's tail (which runs lower)."""
    out = img.copy()
    dst = out.load()
    for y in range(WORDMARK_BOTTOM + 1, out.height):
        for x in range(MARK_RIGHT + 1, out.width):
            if dst[x, y][3]:
                dst[x, y] = (0, 0, 0, 0)
    return trim(out)


def light_variant(img):
    """For dark surfaces: green mark and outline stay, letterforms go white."""
    px = img.load()
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    dst = out.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            greenish = g > r + 14 and g > b + 14
            dst[x, y] = (r, g, b, a) if greenish else (255, 255, 255, a)
    return out


def square_icon(img, pad_ratio=0.1, size=512):
    side = max(img.size)
    pad = int(side * pad_ratio)
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(img, ((canvas.width - img.width) // 2, (canvas.height - img.height) // 2), img)
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    if not SRC.exists():
        sys.exit(f"Source artwork not found: {SRC}")

    src = Image.open(SRC).convert("RGB")
    full = trim(to_rgba(src))
    lockup = drop_tagline(full)

    # The header renders the lockup 122px wide and the footer 167px wide, so a
    # 334px asset covers both at 2x without shipping a 596px image on every page.
    height = round(lockup.height * 334 / lockup.width)
    asset = lockup.resize((334, height), Image.LANCZOS)

    asset.save(OUT / "logo.png", optimize=True)
    light_variant(asset).save(OUT / "logo-light.png", optimize=True)
    full.save(OUT / "logo-full.png", optimize=True)

    mark = trim(full.crop((0, 0, MARK_RIGHT, full.height)), pad=0)
    icon = square_icon(mark)
    icon.save(OUT / "logo-mark.png", optimize=True)
    icon.resize((192, 192), Image.LANCZOS).save(ROOT / "favicon.png", optimize=True)

    print("wrote logo.png, logo-light.png, logo-full.png, logo-mark.png, favicon.png")


if __name__ == "__main__":
    main()
