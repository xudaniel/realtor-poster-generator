"""High-level poster composition and export.

The renderer uses only Pillow primitives and user-supplied assets. All important
copy is drawn deterministically from the validated input; no generative model is
involved in spelling, prices, contact information, or listing details.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, Sequence, Tuple

from PIL import Image, ImageDraw, ImageFilter, ImageOps

from . import __version__
from .drawing import (
    Box,
    crop_to_fill,
    draw_icon,
    draw_lines,
    fit_single_line,
    fit_wrapped_text,
    font,
    hex_color,
    rounded_image,
    text_width,
    wrap_text,
)


def _open_image(path: str) -> Image.Image:
    with Image.open(path) as source:
        return ImageOps.exif_transpose(source).convert("RGBA")


def _draw_logo(canvas: Image.Image, path: str, box: Box) -> None:
    if not path:
        return
    logo = _open_image(path)
    max_size = (box[2] - box[0], box[3] - box[1])
    logo.thumbnail(max_size, Image.Resampling.LANCZOS)
    x = box[0] + (max_size[0] - logo.width) // 2
    y = box[1] + (max_size[1] - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))


def _safe_text(value: Any, fallback: str = "") -> str:
    return fallback if value is None else str(value).strip()


def _format_number(value: Any) -> str:
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


class PosterRenderer:
    """Compose one portrait poster from a validated listing dictionary."""

    def __init__(self, data: Mapping[str, Any]):
        self.data = data
        self.listing = data["listing"]
        self.brand = data["brand"]
        self.contact = data["contact"]
        self.photos = data["photos"]
        self.content = data.get("content", {})
        self.theme = data["theme"]
        self.width = int(data["canvas"]["width"])
        self.height = int(data["canvas"]["height"])
        self.sx = self.width / 1800
        self.sy = self.height / 2400

        self.paper = hex_color(self.theme["paper"])
        self.background = hex_color(self.theme["background"])
        self.ink = hex_color(self.theme["ink"])
        self.muted = hex_color(self.theme["muted"])
        self.accent = hex_color(self.theme["accent"])
        self.accent_light = hex_color(self.theme["accent_light"])
        self.hero_overlay = hex_color(self.theme["hero_overlay"])

    def x(self, value: float) -> int:
        return round(value * self.sx)

    def y(self, value: float) -> int:
        return round(value * self.sy)

    def fs(self, value: float) -> int:
        return max(8, round(value * min(self.sx, self.sy)))

    def face(self, kind: str, size: float):
        return font(kind, self.fs(size), self.theme.get(f"font_{kind}", ""))

    def render(self) -> Image.Image:
        canvas = Image.new("RGBA", (self.width, self.height), self.background + (255,))
        self._draw_hero(canvas)
        self._draw_fact_strip(canvas)
        self._draw_visuals(canvas)
        self._draw_detail_cards(canvas)
        self._draw_location_band(canvas)
        self._draw_footer(canvas)
        return canvas.convert("RGB")

    def _draw_hero(self, canvas: Image.Image) -> None:
        hero_h = self.y(760)
        hero = crop_to_fill(
            _open_image(self.photos["hero"]),
            (self.width, hero_h),
            tuple(self.photos.get("hero_focal", [0.62, 0.48])),
        ).convert("RGBA")
        canvas.alpha_composite(hero, (0, 0))

        # An angled color field separates copy from the property photo without
        # repeating the reference poster's circular crop.
        overlay = Image.new("RGBA", (self.width, hero_h), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        od.polygon(
            [(0, 0), (self.x(1050), 0), (self.x(880), hero_h), (0, hero_h)],
            fill=self.hero_overlay + (242,),
        )
        od.polygon(
            [(self.x(1014), 0), (self.x(1050), 0), (self.x(880), hero_h), (self.x(844), hero_h)],
            fill=self.accent + (255,),
        )
        canvas.alpha_composite(overlay)
        draw = ImageDraw.Draw(canvas)

        margin = self.x(90)
        label = _safe_text(self.listing.get("status"), "FOR LEASE").upper()
        label_face = self.face("bold", 32)
        label_w = text_width(draw, label, label_face) + self.x(54)
        draw.rounded_rectangle(
            (margin, self.y(70), margin + label_w, self.y(132)),
            radius=self.y(28),
            fill=self.accent,
        )
        draw.text((margin + self.x(27), self.y(101)), label, font=label_face, fill=self.hero_overlay, anchor="lm")

        if self.listing.get("demo"):
            demo_face = self.face("bold", 19)
            draw.text((margin + label_w + self.x(28), self.y(101)), "SAMPLE LISTING", font=demo_face, fill=self.paper, anchor="lm")

        address = _safe_text(self.listing["address"])
        address_face = fit_single_line(
            draw, address, self.x(720), self.fs(68), self.fs(36), "bold", self.theme.get("font_bold", "")
        )
        draw.text((margin, self.y(185)), address, font=address_face, fill=self.paper, anchor="la")

        unit_text = f"UNIT {_safe_text(self.listing['unit'])}"
        unit_face = fit_single_line(
            draw, unit_text, self.x(710), self.fs(70), self.fs(36), "serif", self.theme.get("font_serif", "")
        )
        draw.text((margin, self.y(265)), unit_text, font=unit_face, fill=self.accent, anchor="la")

        city = _safe_text(self.listing.get("city"))
        postal = _safe_text(self.listing.get("postal_code"))
        place = "  •  ".join(item for item in (city, postal) if item)
        if place:
            draw.text((margin, self.y(355)), place, font=self.face("regular", 30), fill=self.paper, anchor="la")

        tagline = _safe_text(self.listing.get("tagline"))
        if tagline:
            tagline_face, tagline_lines, tagline_lh = fit_wrapped_text(
                draw,
                tagline,
                (margin, self.y(405), self.x(805), self.y(500)),
                self.fs(28),
                self.fs(20),
                "serif",
                self.theme.get("font_serif", ""),
                max_lines=2,
            )
            draw_lines(draw, (margin, self.y(405)), tagline_lines, tagline_face, self.accent_light, tagline_lh)

        rent_box = (margin, self.y(535), self.x(620), self.y(690))
        draw.rounded_rectangle(rent_box, radius=self.y(28), fill=self.paper)
        rent = _safe_text(self.listing["rent"])
        rent_face = fit_single_line(
            draw, rent, rent_box[2] - rent_box[0] - self.x(50), self.fs(76), self.fs(38), "bold", self.theme.get("font_bold", "")
        )
        draw.text((rent_box[0] + self.x(28), self.y(584)), rent, font=rent_face, fill=self.ink, anchor="la")
        period = _safe_text(self.listing.get("rent_period"), "per month")
        draw.text((rent_box[0] + self.x(31), self.y(655)), period, font=self.face("regular", 25), fill=self.muted, anchor="la")
        draw.text((self.x(650), self.y(650)), f"MLS®  {_safe_text(self.listing['mls'])}", font=self.face("bold", 23), fill=self.paper, anchor="la")

        # Brand lockup remains readable even when the hero is visually busy.
        lockup = (self.x(1420), self.y(55), self.x(1720), self.y(160))
        if self.brand.get("logo"):
            backing = Image.new("RGBA", (lockup[2] - lockup[0], lockup[3] - lockup[1]), (255, 255, 255, 224))
            canvas.alpha_composite(backing, (lockup[0], lockup[1]))
            _draw_logo(canvas, self.brand["logo"], lockup)
        else:
            brand_face = fit_single_line(draw, self.brand["name"], self.x(300), self.fs(30), self.fs(16), "bold")
            draw.text((self.x(1710), self.y(92)), self.brand["name"], font=brand_face, fill=self.paper, anchor="ra")

    def _draw_fact_strip(self, canvas: Image.Image) -> None:
        draw = ImageDraw.Draw(canvas)
        top, bottom = self.y(760), self.y(1010)
        draw.rectangle((0, top, self.width, bottom), fill=self.paper)
        draw.rectangle((0, top, self.width, top + self.y(8)), fill=self.accent)

        facts = [
            ("bed", _format_number(self.listing["beds"]), "Beds"),
            ("bath", _format_number(self.listing["baths"]), "Baths"),
            ("area", f"{_format_number(self.listing['sqft'])}", "Sq. Ft."),
            ("building", _safe_text(self.listing["floor"]), "Floor"),
            ("compass", _safe_text(self.listing["exposure"]), "Exposure"),
            ("parking", _safe_text(self.listing["parking"]), "Parking"),
        ]
        cell_w = self.width / len(facts)
        for index, (icon_name, value, label) in enumerate(facts):
            x0 = round(index * cell_w)
            x1 = round((index + 1) * cell_w)
            if index:
                draw.line((x0, self.y(810), x0, self.y(965)), fill=self.accent_light, width=self.x(3))
            draw_icon(draw, icon_name, (x0 + self.x(24), self.y(827), x0 + self.x(94), self.y(897)), self.accent, width=self.x(5))
            value_face = fit_single_line(
                draw, value, max(self.x(100), x1 - x0 - self.x(130)), self.fs(29), self.fs(17), "bold", self.theme.get("font_bold", "")
            )
            draw.text((x0 + self.x(110), self.y(853)), value, font=value_face, fill=self.ink, anchor="la")
            draw.text((x0 + self.x(110), self.y(904)), label, font=self.face("regular", 20), fill=self.muted, anchor="la")

        availability = f"AVAILABLE  {_safe_text(self.listing['availability'])}"
        available_face = fit_single_line(
            draw, availability, self.width - self.x(160), self.fs(27), self.fs(18), "bold", self.theme.get("font_bold", "")
        )
        draw.text((self.width // 2, self.y(973)), availability, font=available_face, fill=self.ink, anchor="mm")

    def _draw_visuals(self, canvas: Image.Image) -> None:
        draw = ImageDraw.Draw(canvas)
        left = (self.x(70), self.y(1050), self.x(1100), self.y(1588))
        right = (self.x(1130), self.y(1050), self.x(1730), self.y(1588))
        radius = self.y(30)

        gallery: Sequence[str] = self.photos.get("gallery") or [self.photos["hero"]]
        if len(gallery) == 1:
            primary = rounded_image(_open_image(gallery[0]), (left[2] - left[0], left[3] - left[1]), radius)
            canvas.alpha_composite(primary, (left[0], left[1]))
        else:
            # One large lifestyle image plus up to two supporting crops keeps the
            # layout useful when an agent supplies several property photos.
            primary_bottom = self.y(1412)
            primary = rounded_image(
                _open_image(gallery[0]),
                (left[2] - left[0], primary_bottom - left[1]),
                radius,
            )
            canvas.alpha_composite(primary, (left[0], left[1]))
            thumb_top = self.y(1430)
            thumb_gap = self.x(18)
            thumbs = gallery[1:3]
            thumb_w = (left[2] - left[0] - thumb_gap * (len(thumbs) - 1)) // len(thumbs)
            for index, path in enumerate(thumbs):
                thumb_x = left[0] + index * (thumb_w + thumb_gap)
                thumb = rounded_image(_open_image(path), (thumb_w, left[3] - thumb_top), self.y(22))
                canvas.alpha_composite(thumb, (thumb_x, thumb_top))

        # A small caption tab ties the image panel to the data without covering the photo.
        caption = _safe_text(self.content.get("photo_caption"), "RESIDENCE")
        caption_face = self.face("bold", 20)
        caption_w = text_width(draw, caption, caption_face) + self.x(48)
        draw.rounded_rectangle(
            (left[0] + self.x(25), left[1] + self.y(25), left[0] + self.x(25) + caption_w, left[1] + self.y(80)),
            radius=self.y(20),
            fill=self.hero_overlay,
        )
        draw.text((left[0] + self.x(49), left[1] + self.y(53)), caption, font=caption_face, fill=self.paper, anchor="lm")

        floorplan_path = self.photos.get("floorplan")
        if floorplan_path:
            plan = rounded_image(_open_image(floorplan_path), (right[2] - right[0], right[3] - right[1]), radius)
            canvas.alpha_composite(plan, (right[0], right[1]))
        else:
            draw.rounded_rectangle(right, radius=radius, fill=self.paper, outline=self.accent_light, width=self.x(4))
            draw.text(((right[0] + right[2]) // 2, (right[1] + right[3]) // 2), "FLOORPLAN", font=self.face("bold", 26), fill=self.muted, anchor="mm")

        plan_label = _safe_text(self.content.get("floorplan_caption"), "FLOORPLAN")
        plan_face = self.face("bold", 20)
        plan_w = text_width(draw, plan_label, plan_face) + self.x(48)
        draw.rounded_rectangle(
            (right[0] + self.x(25), right[1] + self.y(25), right[0] + self.x(25) + plan_w, right[1] + self.y(80)),
            radius=self.y(20),
            fill=self.accent,
        )
        draw.text((right[0] + self.x(49), right[1] + self.y(53)), plan_label, font=plan_face, fill=self.hero_overlay, anchor="lm")

    def _draw_detail_cards(self, canvas: Image.Image) -> None:
        draw = ImageDraw.Draw(canvas)
        top, bottom = self.y(1620), self.y(2040)
        margin, gap = self.x(70), self.x(20)
        card_w = (self.width - 2 * margin - 3 * gap) // 4

        features = list(self.content.get("features") or [])
        amenities = list(self.content.get("amenities") or [])
        utilities = list(self.content.get("utilities") or [])
        lease_details = list(self.content.get("lease_details") or [])
        if not lease_details:
            lease_details = [
                f"Available: {_safe_text(self.listing['availability'])}",
                f"Parking: {_safe_text(self.listing['parking'])}",
                f"MLS®: {_safe_text(self.listing['mls'])}",
            ]

        cards = [
            ("LEASE DETAILS", lease_details),
            ("FEATURES", features),
            ("AMENITIES", amenities),
            ("UTILITIES", utilities),
        ]
        for index, (title, items) in enumerate(cards):
            x0 = margin + index * (card_w + gap)
            x1 = x0 + card_w
            draw.rounded_rectangle((x0, top, x1, bottom), radius=self.y(24), fill=self.paper)
            draw.rounded_rectangle((x0, top, x1, top + self.y(72)), radius=self.y(24), fill=self.ink)
            draw.rectangle((x0, top + self.y(48), x1, top + self.y(72)), fill=self.ink)
            title_face = fit_single_line(
                draw, title, card_w - self.x(32), self.fs(21), self.fs(14), "bold", self.theme.get("font_bold", "")
            )
            draw.text(((x0 + x1) // 2, top + self.y(37)), title, font=title_face, fill=self.paper, anchor="mm")
            self._draw_bullets(draw, items, (x0 + self.x(24), top + self.y(103), x1 - self.x(20), bottom - self.y(22)))

    def _draw_bullets(self, draw: ImageDraw.ImageDraw, items: Iterable[Any], box: Box) -> None:
        items = [_safe_text(item) for item in items if _safe_text(item)]
        if not items:
            items = ["Contact agent for details"]
        available_h = box[3] - box[1]
        max_size = self.fs(20)
        min_size = self.fs(14)
        chosen = min_size
        wrapped: List[List[str]] = []
        line_h = self.fs(19)
        for size in range(max_size, min_size - 1, -1):
            candidate_face = font("regular", size, self.theme.get("font_regular", ""))
            candidate = [wrap_text(draw, item, candidate_face, box[2] - box[0] - self.x(34)) for item in items]
            candidate_lh = round(size * 1.18)
            total = sum(len(lines) * candidate_lh + self.y(13) for lines in candidate)
            if total <= available_h:
                chosen, wrapped, line_h = size, candidate, candidate_lh
                break
        face = font("regular", chosen, self.theme.get("font_regular", ""))
        y = box[1]
        for lines in wrapped or [[item] for item in items]:
            draw.ellipse((box[0], y + self.y(8), box[0] + self.x(12), y + self.y(20)), fill=self.accent)
            for line in lines:
                draw.text((box[0] + self.x(28), y), line, font=face, fill=self.ink, anchor="la")
                y += line_h
            y += self.y(13)

    def _draw_location_band(self, canvas: Imag