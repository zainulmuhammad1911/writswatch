#!/usr/bin/env python3
"""Build src/app/favicon.ico from the museum's mark.

    pip install pillow && python3 scripts/make-favicon.py

The source is `public/images/favicon-source.png`, which is the brand asset
`Aset/LOGO/Pavicon.png` byte for byte. Aset/ is not in the repository (see
.gitignore), so the tracked copy under public/ is what makes this script
runnable from a fresh clone.

Two things here are deliberate.

The mark sits on an opaque cool-white ground rather than a transparent one.
The glyph is #132155, which is nearly invisible against a dark tab strip or a
dark taskbar; the ground keeps it readable everywhere and matches
`src/app/apple-icon.png`, which already uses the same treatment.

Each size is rendered from the full-resolution crop with its own settings
rather than downscaled from one large icon. A straight Lanczos reduction to
16px turns the roof line, the dial and the two columns into a uniform grey
smudge, because every stroke lands on a fraction of a pixel. Raising the alpha
gamma pushes those partial pixels back toward the ink colour, and a little
unsharp mask at the smallest sizes separates the strokes again. The gamma is
eased off as the canvas grows, since by 48px the artwork carries itself and
more contrast would only add halos.

16px is still an impression of the mark rather than a reading of it. That is
the honest limit of the canvas for artwork with this much detail, and browsers
only reach for it on 1x displays.
"""

import pathlib

from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public/images/favicon-source.png"
TARGET = ROOT / "src/app/favicon.ico"

GROUND = (0xF5, 0xF7, 0xF8, 255)  # --color-cool-white

# size: (share of canvas the mark spans, alpha gamma, unsharp percent)
SIZES = {
    16: (0.94, 0.50, 140),
    32: (0.90, 0.60, 80),
    48: (0.88, 0.75, 0),
    64: (0.86, 0.85, 0),
}


def render(mark: Image.Image, size: int) -> Image.Image:
    fill, gamma, sharpen = SIZES[size]
    mark_w, mark_h = mark.size
    limit = size * fill
    scale = min(limit / mark_w, limit / mark_h)
    width = max(1, round(mark_w * scale))
    height = max(1, round(mark_h * scale))

    glyph = mark.resize((width, height), Image.LANCZOS)
    if sharpen:
        glyph = glyph.filter(
            ImageFilter.UnsharpMask(radius=0.6, percent=sharpen, threshold=0)
        )
    if gamma != 1.0:
        alpha = glyph.getchannel("A").point(
            lambda v: min(255, round(255 * ((v / 255) ** gamma)))
        )
        glyph.putalpha(alpha)

    canvas = Image.new("RGBA", (size, size), GROUND)
    canvas.alpha_composite(glyph, ((size - width) // 2, (size - height) // 2))
    return canvas.convert("RGB")


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    # Crop to the ink. The source has the mark floating in transparent padding,
    # and the padding here is set per size.
    mark = source.crop(source.getchannel("A").getbbox())

    frames = {size: render(mark, size) for size in sorted(SIZES)}

    # `append_images` is what keeps the per-size rendering: Pillow's ICO writer
    # will otherwise take one image and resize it to every entry itself.
    #
    # `bitmap_format="bmp"` is not optional. Pillow defaults to PNG payloads,
    # and Turbopack's image processor cannot read a PNG-payload ICO — the build
    # fails with nothing more specific than "Processing image failed".
    largest = max(frames)
    frames[largest].save(
        TARGET,
        format="ICO",
        bitmap_format="bmp",
        sizes=[(size, size) for size in sorted(frames)],
        append_images=[frames[size] for size in sorted(frames) if size != largest],
    )

    sizes = ", ".join(f"{size}x{size}" for size in sorted(frames))
    print(f"wrote {TARGET.relative_to(ROOT)} "
          f"({TARGET.stat().st_size:,} bytes: {sizes})")


if __name__ == "__main__":
    main()
