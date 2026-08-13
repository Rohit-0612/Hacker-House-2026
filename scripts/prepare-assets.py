#!/usr/bin/env python3
"""
Derives the web assets in public/ from the source artwork in pfp1/.

Run after replacing either source file:

    python3 scripts/prepare-assets.py

Two jobs:

1. **PFP frame.** pfp1/img2.png is a 1536x1024 canvas with the circular frame
   sitting in the middle and transparent margins either side. Crop to the art's
   alpha bounding box so the asset is square and the drawing code can treat it
   as "fills the output".

2. **Palms.** pfp1/tree.png is a flat screenshot with no alpha, and the palm
   fronds are filled with the *same* green as the background (measured colour
   distance: 2). That makes chroma-keying impossible — it would punch holes
   through every frond. So the palms are cropped as opaque rectangles and the
   cut edges are feathered to transparent, which hides the seam against the page
   without needing the page colour to match the artwork exactly.
"""

from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pfp1"
OUT = ROOT / "public"

# Feather width in source pixels for a cut edge that meets the page background.
FEATHER = 90
# The palms never render taller than ~550 CSS px, so 1100 covers 2x DPR.
PALM_HEIGHT = 1100


def alpha_bbox(im: Image.Image, threshold: int = 16) -> tuple[int, int, int, int]:
    a = np.array(im.convert("RGBA"))[:, :, 3]
    cols = np.where((a > threshold).any(axis=0))[0]
    rows = np.where((a > threshold).any(axis=1))[0]
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def feather(im: Image.Image, edges: tuple[str, ...], width: int = FEATHER) -> Image.Image:
    """Ramps alpha to zero on the named edges, so a rectangular crop dissolves
    into whatever is behind it instead of ending in a visible straight line."""
    im = im.convert("RGBA")
    a = np.array(im)[:, :, 3].astype(np.float32) / 255.0
    h, w = a.shape
    ramp = np.linspace(0.0, 1.0, width, dtype=np.float32)

    if "left" in edges:
        a[:, :width] *= ramp[None, :]
    if "right" in edges:
        a[:, -width:] *= ramp[::-1][None, :]
    if "top" in edges:
        a[:width, :] *= ramp[:, None]
    if "bottom" in edges:
        a[-width:, :] *= ramp[::-1][:, None]

    out = np.array(im)
    out[:, :, 3] = (a * 255).round().astype(np.uint8)
    return Image.fromarray(out, "RGBA")


def main() -> None:
    OUT.mkdir(exist_ok=True)

    # --- PFP frame -----------------------------------------------------------
    frame_src = Image.open(SRC / "img2.png").convert("RGBA")
    box = alpha_bbox(frame_src)
    frame = frame_src.crop(box)
    frame.save(OUT / "pfp-frame.webp", lossless=True, method=6)
    print(f"pfp-frame.webp  {frame.size[0]}x{frame.size[1]}  (crop {box})")

    # --- Palms ---------------------------------------------------------------
    tree = Image.open(SRC / "tree.png").convert("RGB")

    # Column bands found by masking the background green and taking runs of
    # columns that still contain artwork.
    # Height stops at 1145: the source is a screenshot of the whole footer, and
    # "(c) 2026 HH-GOA. ALL RIGHTS RESERVED." occupies rows 1158-1193. The first
    # cut shipped with "S RESERVED." legible in the right-hand palm. The right
    # band also stops at x 2640 to drop a UI widget sitting in the corner.
    bands = {
        # The outer edge is clipped by the viewport, so only the inner edge and
        # the top/bottom need dissolving.
        "palms-left": ((0, 0, 750, 1145), ("right", "top", "bottom")),
        "palms-right": ((1950, 0, 2640, 1145), ("left", "top", "bottom")),
    }

    for name, (crop, edges) in bands.items():
        im = tree.crop(crop)
        scale = PALM_HEIGHT / im.height
        im = im.resize((round(im.width * scale), PALM_HEIGHT), Image.LANCZOS)
        im = feather(im, edges, width=round(FEATHER * scale))
        im.save(OUT / f"{name}.webp", quality=90, method=6)
        print(f"{name}.webp  {im.size[0]}x{im.size[1]}")


if __name__ == "__main__":
    main()
