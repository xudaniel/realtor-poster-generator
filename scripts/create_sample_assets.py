#!/usr/bin/env python3
"""Create deterministic demo assets used by examples/sample_listing.yaml.

These are intentionally illustrated placeholders, not representations of a real
property. Replace them with the listing's own photographs before publishing.
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "examples" / "assets"
RNG = random.Random(2608)

# Direct script execution sets sys.path to scripts/, so include the project root
# before importing the local package. This keeps the documented command working
# without requiring an editable install first.
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from realtor_poster.drawing import font


def vertical_gradient(size, top, bottom):
    image = Image.new("RGB", size)
    draw = ImageDraw.Draw(image)
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
        draw.line((0, y, size[0], y), fill=color)
    return image


def make_hero(path: Path) -> None:
    """Stylized urban-condo exterior with a dusk skyline."""
    w, h = 2200, 1400
    image = vertical_gradient((w, h), (41, 70, 96), (224, 149, 96))
    draw = ImageDraw.Draw(image)
    # Warm horizon glow and distant skyline.
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for radius in range(520, 40, -28):
        alpha = max(0, round(2.8 * (520 - radius)))
        gd.ellipse((1220 - radius, 540 - radius, 1220 + radius, 540 + radius), fill=(255, 187, 105, min(alpha, 20)))
    image = Image.alpha_composite(image.convert("RGBA"), glow).convert("RGB")
    draw = ImageDraw.Draw(image)
    for x in range(0, w, 42):
        building_h = RNG.randint(110, 320)
        shade = RNG.randint(28, 58)
        draw.rectangle((x, h - 260 - building_h, x + RNG.randint(26, 50), h), fill=(shade, shade + 10, shade + 18))
    # Foreground glass tower.
    tower = [(1170, 210), (1960, 310), (1875, 1310), (1070, 1310)]
    draw.polygon(tower, fill=(35, 57, 67), outline=(226, 169, 105), width=12)
    for floor_y in range(290, 1260, 70):
        t = (floor_y - 210) / 1100
        left = round(1170 + (1070 - 1170) * t)
        right = round(1960 + (1875 - 1960) * t)
        draw.line((left + 18, floor_y, right - 18, floor_y + 24), fill=(113, 145, 150), width=6)
        for col in range(7):
            x = left + 55 + col * max(80, (right - left - 130) // 7)
            lit = RNG.random() > 0.35
            draw.rectangle((x, floor_y + 9, x + 42, floor_y + 44), fill=(246, 190, 110) if lit else (46, 83, 96))
    # Road light trails for depth.
    draw.line((0, 1290, 1020, 935), fill=(245, 174, 87), width=18)
    draw.line((0, 1335, 1040, 970), fill=(234, 225, 192), width=8)
    image = image.filter(ImageFilter.GaussianBlur(radius=0.6))
    image.save(path, "PNG")


def make_interior(path: Path, alternate: bool = False) -> None:
    """Warm editorial interior illustration with strong perspective lines."""
    w, h = 1800, 1200
    image = vertical_gradient((w, h), (241, 222, 191), (179, 128, 88))
    draw = ImageDraw.Draw(image)
    # Ceiling, window wall, and wood floor.
    draw.polygon([(0, 0), (w, 0), (1480, 270), (250, 270)], fill=(247, 239, 222))
    draw.polygon([(0, h), (w, h), (1480, 660), (250, 660)], fill=(166, 113, 74))
    for x in range(-400, 2200, 140):
        draw.line((900, 640, x, h), fill=(114, 78, 56), width=5)
    # Windows with skyline.
    draw.rectangle((1110, 210, 1710, 680), fill=(64, 93, 105), outline=(246, 233, 207), width=18)
    for x in range(1140, 1680, 70):
        bh = RNG.randint(90, 240)
        draw.rectangle((x, 650 - bh, x + 42, 680), fill=(37, 62, 70))
    draw.line((1410, 215, 1410, 680), fill=(236, 220, 190), width=12)
    # Sofa or kitchen island depending on the variant.
    if not alternate:
        draw.rounded_rectangle((120, 540, 930, 900), radius=70, fill=(216, 208, 191), outline=(87, 76, 65), width=9)
        draw.rounded_rectangle((170, 490, 850, 650), radius=55, fill=(228, 220, 202))
        for x, color in ((240, (190, 122, 72)), (520, (54, 91, 73))):
            draw.rounded_rectangle((x, 515, x + 185, 680), radius=30, fill=color)
        draw.polygon([(640, 820), (1080, 760), (1260, 970), (780, 1040)], fill=(90, 72, 59))
        draw.polygon([(674, 830), (1065, 782), (1200, 950), (790, 1010)], fill=(221, 202, 169))
    else:
        draw.rectangle((90, 330, 1040, 700), fill=(205, 181, 147), outline=(98, 76, 57), width=8)
        for x in range(120, 1000, 210):
            draw.rectangle((x, 365, x + 170, 640), fill=(221, 204, 178), outline=(144, 116, 87), width=5)
        draw.polygon([(430, 660), (1260, 660), (1450, 920), (250, 920)], fill=(75, 72, 67))
        draw.polygon([(465, 680), (1230, 680), (1370, 870), (315, 870)], fill=(230, 220, 203))
        for x in (470, 870, 1230):
            draw.line((x, 900, x - 30, 1110), fill=(58, 52, 48), width=20)
    # Soft pools of light make the placeholders feel photographic at poster size.
    light = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ld = ImageDraw.Draw(light)
    for x in (480, 920, 1330):
        ld.ellipse((x - 180, 60, x + 180, 420), fill=(255, 244, 197, 45))
        ld.line((x, 30, x, 210), fill=(68, 63, 55, 255), width=8)
        ld.ellipse((x - 24, 190, x + 24, 238), fill=(255, 239, 180, 255))
    image = Image.alpha_composite(image.convert("RGBA"), light.filter(ImageFilter.GaussianBlur(22))).convert("RGB")
    image.save(path, "PNG")


def make_floorplan(path: Path) -> None:
    w, h = 1300, 1300
    image = Image.new("RGB", (w, h), (250, 248, 242))
    draw = ImageDraw.Draw(image)
    ink, accent = (52, 69, 69), (216, 154, 85)
    draw.rounded_rectangle((90, 90, 1210, 1210), radius=26, outline=ink, width=24)
    # Core walls and openings.
    walls = [
        (90, 690, 650, 690),
        (650, 90, 650, 470),
        (650, 610, 650, 1210),
        (90, 930, 650, 930),
        (880, 90, 880, 400),
        (880, 400, 1210, 400),
        (900, 740, 1210, 740),
    ]
    for wall in walls:
        draw.line(wall, fill=ink, width=22)
    # Kitchen counters and island.
    draw.rectangle((940, 450, 1160, 650), outline=accent, width=15)
    for y in (490, 550, 610):
        draw.line((945, y, 1155, y), fill=accent, width=5)
    draw.rounded_rectangle((690, 820, 1010, 940), radius=18, outline=accent, width=14)
    # Bathroom fixtures.
    draw.ellipse((210, 740, 390, 890), outline=accent, width=13)
    draw.rounded_rectangle((420, 750, 590, 890), radius=25, outline=accent, width=13)
    # Bed and living furniture.
    draw.rounded_rectangle((170, 160, 560, 560), radius=28, outline=accent, width=16)
    draw.line((170, 285, 560, 285), fill=accent, width=12)
    draw.rounded_rectangle((720, 500, 1020, 660), radius=30, outline=accent, width=13)
    draw.rounded_rectangle((750, 1020, 1080, 1120), radius=30, outline=accent, width=13)
    labels = [
        ("BEDROOM", 355, 610),
        ("BATH", 350, 905),
        ("LIVING", 930, 700),
        ("KITCHEN", 1050, 430),
        ("BALCONY", 915, 1160),
    ]
    face = font("bold", 31)
    for label, x, y in labels:
        draw.text((x, y), label, font=face, fill=ink, anchor="mm")
    image.save(path, "PNG")


def make_logo(path: Path) -> None:
    image = Image.new("RGBA", (760, 220), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    ink, accent = (16, 42, 42), (217, 154, 85)
    draw.polygon([(35, 145), (125, 55), (215, 145)], outline=accent)
    draw.line((58, 130, 58, 194, 192, 194, 192, 130), fill=accent, width=14)
    draw.line((125, 78, 125, 194), fill=accent, width=10)
    draw.text((255, 68), "NORTHLINE", font=font("bold", 58), fill=ink, anchor="la")
    draw.text((258, 142), "REALTY  •  TORONTO", font=font("regular", 27), fill=accent, anchor="la")
    image.save(path, "PNG")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    make_hero(OUT / "sample_exterior.png")
    make_interior(OUT / "sample_living_room.png")
    make_interior(OUT / "sample_kitchen.png", alternate=True)
    make_floorplan(OUT / "sample_floorplan.png")
    make_logo(OUT / "sample_logo.png")
    print(f"Created sample assets in {OUT}")


if __name__ == "__main__":
    main()
