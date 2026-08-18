"""Adaptive social-media artwork derived from the validated listing data.

The social cards intentionally use a different composition from the full poster:
they keep only the facts that remain readable on a phone screen. All text still
comes directly from the input file, so an export cannot silently rewrite a price,
address, MLS number, or contact detail.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Mapping, Sequence, Tuple

from PIL import Image, ImageDraw, ImageOps

from .drawing import crop_to_fill, draw_icon, fit_single_line, fit_wrapped_text, font, hex_color


SOCIAL_PRESETS: Dict[str, Tuple[int, int]] = {
    "square": (1080, 1080),
    "portrait": (1080, 1350),
    "story": (1080, 1920),
    "landscape": (1200, 630),
}


def normalize_social_presets(values: Sequence[str]) -> Tuple[str, ...]:
    """Validate preset names, expand ``all``, and preserve first-use order."""
    expanded = list(SOCIAL_PRESETS) if "all" in values else list(values)
    unknown = [value for value in expanded if value not in SOCIAL_PRESETS]
    if unknown:
        valid = ", ".join((*SOCIAL_PRESETS, "all"))
        raise ValueError(f"Unknown social preset {unknown[0]!r}; choose from {valid}")
    return tuple(dict.fromkeys(expanded))


def _open_image(path: str) -> Image.Image:
    with Image.open(path) as source:
        return ImageOps.exif_transpose(source).convert("RGBA")


def _safe(value: Any, fallback: str = "") -> str:
    return fallback if value is None else str(value).strip()


def _logo(canvas: Image.Image, path: str, box: Tuple[int, int, int, int]) -> None:
    if not path:
        return
    logo = _open_image(path)
    size = (box[2] - box[0], box[3] - box[1])
    logo.thumbnail(size, Image.Resampling.LANCZOS)
    canvas.alpha_composite(logo, (box[0] + (size[0] - logo.width) // 2, box[1] + (size[1] - logo.height) // 2))


class SocialRenderer:
    """Render one concise, phone-readable social card."""

    def __init__(self, data: Mapping[str, Any], preset: str):
        if preset not in SOCIAL_PRESETS:
            raise ValueError(f"Unknown social preset: {preset}")
        self.data = data
        self.listing = data["listing"]
        self.brand = data["brand"]
        self.contact = data["contact"]
        self.photos = data["photos"]
        self.theme = data["theme"]
        self.preset = preset
        self.width, self.height = SOCIAL_PRESETS[preset]
        self.scale = self.width / 1080
        self.ink = hex_color(self.theme["ink"])
        self.paper = hex_color(self.theme["paper"])
        self.accent = hex_color(self.theme["accent"])
        self.muted = hex_color(self.theme["muted"])
        self.overlay = hex_color(self.theme["hero_overlay"])

    def px(self, value: float) -> int:
        return max(1, round(value * self.scale))

    def face(self, kind: str, size: float):
        return font(kind, self.px(size), self.theme.get(f"font_{kind}", ""))

    def render(self) -> Image.Image:
        focal = tuple(self.photos.get("hero_focal", [0.5, 0.5]))
        hero = crop_to_fill(_open_image(self.photos["hero"]), (self.width, self.height), focal).convert("RGBA")
        if self.preset == "landscape":
            self._draw_landscape(hero)
        else:
            self._draw_vertical(hero)
        return hero.convert("RGB")

    def _draw_status_and_logo(self, canvas: Image.Image, top: int) -> None:
        draw = ImageDraw.Draw(canvas)
        margin = self.px(60)
        status = _safe(self.listing.get("status"), "FOR LEASE").upper()
        status_face = self.face("bold", 24)
        status_box = draw.textbbox((0, 0), status, font=status_face)
        status_w = status_box[2] - status_box[0] + self.px(44)
        draw.rounded_rectangle(
            (margin, top, margin + status_w, top + self.px(58)),
            radius=self.px(24),
            fill=self.accent,
        )
        draw.text((margin + self.px(22), top + self.px(29)), status, font=status_face, fill=self.overlay, anchor="lm")

        if self.brand.get("logo"):
            box = (self.width - self.px(300), top - self.px(6), self.width - margin, top + self.px(70))
            draw.rounded_rectangle(
                (box[0] - self.px(12), box[1] - self.px(7), box[2] + self.px(12), box[3] + self.px(7)),
                radius=self.px(14),
                fill=self.paper + (232,),
            )
            _logo(canvas, self.brand["logo"], box)

    def _draw_vertical(self, canvas: Image.Image) -> None:
        # A smooth deterministic overlay protects the copy without hiding the
        # top of the property photograph.
        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        start = int(self.height * (0.22 if self.preset == "story" else 0.12))
        for y in range(start, self.height):
            progress = (y - start) / max(1, self.height - start)
            alpha = round(238 * (progress ** 0.72))
            od.line((0, y, self.width, y), fill=self.overlay + (alpha,))
        canvas.alpha_composite(overlay)
        self._draw_status_and_logo(canvas, self.px(54))

        draw = ImageDraw.Draw(canvas)
        margin = self.px(60)
        footer_h = self.px(132)
        facts_h = self.px(118)
        content_bottom = self.height - footer_h - facts_h - self.px(44)
        title_y = max(self.px(335), content_bottom - self.px(350))

        address = _safe(self.listing["address"])
        title_face, title_lines, title_lh = fit_wrapped_text(
            draw,
            address,
            (margin, title_y, self.width - margin, title_y + self.px(150)),
            self.px(58),
            self.px(34),
            "bold",
            self.theme.get("font_bold", ""),
            max_lines=2,
        )
        y = title_y
        for line in title_lines:
            draw.text((margin, y), line, font=title_face, fill=self.paper, anchor="la")
            y += title_lh

        unit = f"UNIT {_safe(self.listing['unit'])}"
        unit_face = fit_single_line(
            draw, unit, self.width - 2 * margin, self.px(50), self.px(30), "serif", self.theme.get("font_serif", "")
        )
        draw.text((margin, y + self.px(12)), unit, font=unit_face, fill=self.accent, anchor="la")

        rent = _safe(self.listing["rent"])
        rent_face = fit_single_line(
            draw, rent, self.width - 2 * margin, self.px(68), self.px(40), "bold", self.theme.get("font_bold", "")
        )
        draw.text((margin, y + self.px(92)), rent, font=rent_face, fill=self.paper, anchor="la")
        draw.text(
            (self.width - margin, y + self.px(125)),
            f"MLS® {_safe(self.listing['mls'])}",
            font=self.face("bold", 21),
            fill=self.paper,
            anchor="ra",
        )

        facts_top = self.height - footer_h - facts_h
        draw.rectangle((0, facts_top, self.width, facts_top + facts_h), fill=self.paper)
        facts = [
            ("bed", _safe(self.listing["beds"]), "Beds"),
            ("bath", _safe(self.listing["baths"]), "Baths"),
            ("area", _safe(self.listing["sqft"]), "Sq. Ft."),
            ("parking", _safe(self.listing["parking"]), "Parking"),
        ]
        cell_w = self.width / len(facts)
        for index, (icon_name, value, label) in enumerate(facts):
            x0 = round(index * cell_w)
            if index:
                draw.line((x0, facts_top + self.px(22), x0, facts_top + facts_h - self.px(22)), fill=self.accent, width=self.px(2))
            draw_icon(draw, icon_name, (x0 + self.px(20), facts_top + self.px(28), x0 + self.px(72), facts_top + self.px(80)), self.accent, width=self.px(4))
            value_face = fit_single_line(draw, value, round(cell_w) - self.px(104), self.px(25), self.px(16), "bold")
            draw.text((x0 + self.px(84), facts_top + self.px(47)), value, font=value_face, fill=self.ink, anchor="la")
            draw.text((x0 + self.px(84), facts_top + self.px(82)), label, font=self.face("regular", 16), fill=self.muted, anchor="la")

        footer_top = self.height - footer_h
        draw.rectangle((0, footer_top, self.width, self.height), fill=self.overlay)
        draw.rectangle((0, footer_top, self.width, footer_top + self.px(7)), fill=self.accent)
        name = _safe(self.contact["name"])
        draw.text((margin, footer_top + self.px(46)), name, font=self.face("bold", 28), fill=self.paper, anchor="la")
        draw.text((margin, footer_top + self.px(87)), _safe(self.brand["name"]), font=self.face("regular", 17), fill=self.accent, anchor="la")
        contact = f"{_safe(self.contact['phone'])}  •  {_safe(self.contact['email'])}"
        contact_face = fit_single_line(
            draw, contact, self.width - self.px(500), self.px(21), self.px(14), "regular", self.theme.get("font_regular", "")
        )
        draw.text((self.width - margin, footer_top + self.px(66)), contact, font=contact_face, fill=self.paper, anchor="ra")

    def _draw_landscape(self, canvas: Image.Image) -> None:
        overlay = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        ImageDraw.Draw(overlay).polygon(
            [(0, 0), (int(self.width * 0.68), 0), (int(self.width * 0.57), self.height), (0, self.height)],
            fill=self.overlay + (242,),
        )
        canvas.alpha_composite(overlay)
        self._draw_status_and_logo(canvas, self.px(35))
        draw = ImageDraw.Draw(canvas)
        margin = self.px(60)

        address = _safe(self.listing["address"])
        title_face, lines, lh = fit_wrapped_text(
            draw,
            address,
            (margin, self.px(145), self.px(650), self.px(285)),
            self.px(54),
            self.px(32),
            "bold",
            self.theme.get("font_bold", ""),
            max_lines=2,
        )
        y = self.px(145)
        for line in lines:
            draw.text((margin, y), line, font=title_face, fill=self.paper, anchor="la")
            y += lh
        unit = f"UNIT {_safe(self.listing['unit'])}"
        draw.text((margin, y + self.px(10)), unit, font=self.face("serif", 38), fill=self.accent, anchor="la")
        draw.text((margin, self.px(360)), _safe(self.listing["rent"]), font=self.face("bold", 56), fill=self.paper, anchor="la")
        draw.text((margin, self.px(430)), f"MLS® {_safe(self.listing['mls'])}", font=self.face("bold", 19), fill=self.paper, anchor="la")

        facts = f"{_safe(self.listing['beds'])} BED  •  {_safe(self.listing['baths'])} BATH  •  {_safe(self.listing['sqft'])} SQ. FT."
        facts_face = fit_single_line(draw, facts, self.px(580), self.px(22), self.px(15), "bold")
        draw.text((margin, self.px(485)), facts, font=facts_face, fill=self.accent, anchor="la")

        draw.rectangle((0, self.height - self.px(82), self.width, self.height), fill=self.overlay)
        name = f"{_safe(self.contact['name'])}  •  {_safe(self.contact['phone'])}"
        draw.text((margin, self.height - self.px(41)), name, font=self.face("bold", 20), fill=self.paper, anchor="lm")
        draw.text((self.px(650), self.height - self.px(41)), _safe(self.contact["email"]), font=self.face("regular", 17), fill=self.paper, anchor="rm")


def render_social(data: Mapping[str, Any], preset: str) -> Image.Image:
    """Return one social card for ``preset`` without writing to disk."""
    return SocialRenderer(data, preset).render()


def social_output_path(base_png: Path, preset: str) -> Path:
    """Create a stable filename beside the full poster output."""
    return base_png.with_name(f"{base_png.stem}.{preset}.png")
