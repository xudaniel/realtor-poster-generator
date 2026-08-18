"""Low-level deterministic drawing helpers used by the poster renderer."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple, Union

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps


Color = Tuple[int, int, int]
Box = Tuple[int, int, int, int]


FONT_CANDIDATES: Dict[str, Sequence[str]] = {
    "regular": (
        "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ),
    "bold": (
        "/System/Library/Fonts/Supplemental/Avenir Next.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ),
    "serif": (
        "/System/Library/Fonts/NewYork.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
    ),
}


def hex_color(value: str) -> Color:
    value = value.lstrip("#")
    return tuple(int(value[index : index + 2], 16) for index in (0, 2, 4))  # type: ignore[return-value]


def _find_font(kind: str, configured: str = "") -> str:
    if configured and Path(configured).is_file():
        return configured
    for candidate in FONT_CANDIDATES[kind]:
        if Path(candidate).is_file():
            return candidate
    return ""


@lru_cache(maxsize=256)
def _font_cached(path: str, size: int, index: int) -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    if not path:
        return ImageFont.load_default(size=size)
    try:
        return ImageFont.truetype(path, size=size, index=index)
    except OSError:
        return ImageFont.truetype(path, size=size)


def font(kind: str, size: int, configured: str = "") -> Union[ImageFont.FreeTypeFont, ImageFont.ImageFont]:
    path = _find_font(kind, configured)
    # Avenir Next's first face is regular and face 1 is bold on macOS. Other files ignore index.
    index = 1 if kind == "bold" and path.endswith("Avenir Next.ttc") else 0
    return _font_cached(path, max(8, int(size)), index)


def text_width(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.ImageFont) -> int:
    box = draw.textbbox((0, 0), text, font=face)
    return box[2] - box[0]


def fit_single_line(
    draw: ImageDraw.ImageDraw,
    text: str,
    max_width: int,
    max_size: int,
    min_size: int,
    kind: str,
    configured: str = "",
) -> ImageFont.ImageFont:
    """Find the largest font size that keeps one line inside max_width."""
    low, high, best = min_size, max_size, min_size
    while low <= high:
        mid = (low + high) // 2
        candidate = font(kind, mid, configured)
        if text_width(draw, text, candidate) <= max_width:
            best = mid
            low = mid + 1
        else:
            high = mid - 1
    return font(kind, best, configured)


def wrap_text(draw: ImageDraw.ImageDraw, text: str, face: ImageFont.ImageFont, max_width: int) -> List[str]:
    """Greedy wrapping that also breaks unusually long tokens safely."""
    paragraphs = str(text).splitlines() or [""]
    output: List[str] = []
    for paragraph in paragraphs:
        words = paragraph.split()
        if not words:
            output.append("")
            continue
        line = words[0]
        for word in words[1:]:
            candidate = f"{line} {word}"
            if text_width(draw, candidate, face) <= max_width:
                line = candidate
            else:
                output.append(line)
                line = word
        output.append(line)

    safe: List[str] = []
    for line in output:
        if text_width(draw, line, face) <= max_width:
            safe.append(line)
            continue
        chunk = ""
        for char in line:
            if chunk and text_width(draw, chunk + char, face) > max_width:
                safe.append(chunk)
                chunk = char
            else:
                chunk += char
        if chunk:
            safe.append(chunk)
    return safe


def fit_wrapped_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: Box,
    max_size: int,
    min_size: int,
    kind: str,
    configured: str = "",
    line_spacing: float = 1.22,
    max_lines: Optional[int] = None,
) -> Tuple[ImageFont.ImageFont, List[str], int]:
    """Fit wrapped text into both the width and height of a rectangle."""
    width, height = box[2] - box[0], box[3] - box[1]
    for size in range(max_size, min_size - 1, -1):
        face = font(kind, size, configured)
        lines = wrap_text(draw, text, face, width)
        line_height = int(size * line_spacing)
        if (max_lines is None or len(lines) <= max_lines) and len(lines) * line_height <= height:
            return face, lines, line_height
    face = font(kind, min_size, configured)
    lines = wrap_text(draw, text, face, width)
    if max_lines and len(lines) > max_lines:
        lines = lines[:max_lines]
        tail = lines[-1]
        while tail and text_width(draw, tail + "…", face) > width:
            tail = tail[:-1]
        lines[-1] = tail.rstrip() + "…"
    return face, lines, int(min_size * line_spacing)


def draw_lines(
    draw: ImageDraw.ImageDraw,
    xy: Tuple[int, int],
    lines: Iterable[str],
    face: ImageFont.ImageFont,
    fill: Color,
    line_height: int,
) -> int:
    x, y = xy
    for line in lines:
        draw.text((x, y), line, font=face, fill=fill, anchor="la")
        y += line_height
    return y


def crop_to_fill(image: Image.Image, size: Tuple[int, int], focal: Tuple[float, float] = (0.5, 0.5)) -> Image.Image:
    """Resize and crop without distortion while keeping a configurable focal point."""
    image = ImageOps.exif_transpose(image).convert("RGB")
    target_w, target_h = size
    scale = max(target_w / image.width, target_h / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    excess_x = max(0, resized.width - target_w)
    excess_y = max(0, resized.height - target_h)
    left = round(excess_x * max(0.0, min(1.0, focal[0])))
    top = round(excess_y * max(0.0, min(1.0, focal[1])))
    return resized.crop((left, top, left + target_w, top + target_h))


def rounded_image(image: Image.Image, size: Tuple[int, int], radius: int, focal=(0.5, 0.5)) -> Image.Image:
    cropped = crop_to_fill(image, size, focal)
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    output = Image.new("RGBA", size, (0, 0, 0, 0))
    output.paste(cropped, (0, 0), mask)
    return output


def cover_with_tint(image: Image.Image, tint: Color, strength: float) -> Image.Image:
    base = image.convert("RGB")
    overlay = Image.new("RGB", base.size, tint)
    return Image.blend(base, overlay, max(0.0, min(1.0, strength)))


def draw_icon(draw: ImageDraw.ImageDraw, name: str, box: Box, color: Color, width: int = 5) -> None:
    """Draw small vector symbols with Pillow primitives; no icon font is required."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    cx, cy = x0 + w // 2, y0 + h // 2
    p = max(2, width)

    if name == "bed":
        draw.line((x0 + w * .12, y0 + h * .72, x0 + w * .12, y0 + h * .28), fill=color, width=p)
        draw.line((x0 + w * .12, y0 + h * .54, x0 + w * .88, y0 + h * .54), fill=color, width=p)
        draw.rounded_rectangle((x0 + w * .32, y0 + h * .32, x0 + w * .86, y0 + h * .56), radius=p, outline=color, width=p)
        draw.line((x0 + w * .88, y0 + h * .48, x0 + w * .88, y0 + h * .72), fill=color, width=p)
    elif name == "bath":
        draw.arc((x0 + w * .08, y0 + h * .20, x0 + w * .42, y0 + h * .56), 180, 360, fill=color, width=p)
        draw.line((x0 + w * .08, y0 + h * .38, x0 + w * .08, y0 + h * .68), fill=color, width=p)
        draw.arc((x0 + w * .12, y0 + h * .30, x0 + w * .88, y0 + h * .84), 0, 180, fill=color, width=p)
        draw.line((x0 + w * .12, y0 + h * .56, x0 + w * .88, y0 + h * .56), fill=color, width=p)
    elif name == "area":
        draw.rectangle((x0 + w * .20, y0 + h * .20, x0 + w * .80, y0 + h * .80), outline=color, width=p)
        draw.line((x0 + w * .08, y0 + h * .25, x0 + w * .08, y0 + h * .75), fill=color, width=p)
        draw.line((x0 + w * .04, y0 + h * .25, x0 + w * .13, y0 + h * .25), fill=color, width=p)
        draw.line((x0 + w * .04, y0 + h * .75, x0 + w * .13, y0 + h * .75), fill=color, width=p)
    elif name == "building":
        draw.rectangle((x0 + w * .25, y0 + h * .12, x0 + w * .75, y0 + h * .88), outline=color, width=p)
        for yy in (.32, .52, .72):
            draw.line((x0 + w * .38, y0 + h * yy, x0 + w * .62, y0 + h * yy), fill=color, width=p)
    elif name == "compass":
        points = [(cx, y0 + h * .10), (x0 + w * .64, cy), (cx, y0 + h * .90), (x0 + w * .36, cy)]
        draw.polygon(points, outline=color)
        draw.line((cx, y0 + h * .10, cx, y0 + h * .90), fill=color, width=p)
    elif name == "parking":
        draw.ellipse((x0 + w * .12, y0 + h * .12, x0 + w * .88, y0 + h * .88), outline=color, width=p)
        face = fit_single_line(draw, "P", int(w * .44), int(h * .64), 8, "bold")
        draw.text((cx, cy), "P", font=face, fill=color, anchor="mm")
    elif name == "calendar":
        draw.rounded_rectangle((x0 + w * .14, y0 + h * .20, x0 + w * .86, y0 + h * .84), radius=p, outline=color, width=p)
        draw.line((x0 + w * .14, y0 + h * .40, x0 + w * .86, y0 + h * .40), fill=color, width=p)
        draw.line((x0 + w * .32, y0 + h * .10, x0 + w * .32, y0 + h * .28), fill=color, width=p)
        draw.line((x0 + w * .68, y0 + h * .10, x0 + w * .68, y0 + h * .28), fill=color, width=p)
    elif name == "phone":
        draw.arc((x0 + w * .16, y0 + h * .08, x0 + w * .82, y0 + h * .90), 125, 235, fill=color, width=p * 2)
        draw.line((x0 + w * .20, y0 + h * .24, x0 + w * .34, y0 + h * .34), fill=color, width=p * 2)
        draw.line((x0 + w * .66, y0 + h * .66, x0 + w * .80, y0 + h * .76), fill=color, width=p * 2)
    elif name == "email":
        draw.rounded_rectangle((x0 + w * .10, y0 + h * .22, x0 + w * .90, y0 + h * .78), radius=p, outline=color, width=p)
        draw.line((x0 + w * .12, y0 + h * .26, cx, y0 + h * .56, x0 + w * .88, y0 + h * .26), fill=color, width=p)
    else:
        draw.ellipse((x0 + w * .36, y0 + h * .36, x0 + w * .64, y0 + h * .64), fill=color)
