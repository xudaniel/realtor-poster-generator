#!/usr/bin/env python3
"""Guided form for creating a listing YAML file and optionally rendering it.

This is intended for a realtor who prefers answering prompts instead of editing
YAML by hand. Asset paths are saved as absolute paths so moving the YAML into a
`listings/` folder does not break photo, floorplan, logo, or font references.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from realtor_poster.config import ConfigError, EMAIL_RE, PHONE_ALLOWED_RE, load_config
from realtor_poster.renderer import export_poster


def ask(label: str, default: str = "", required: bool = False) -> str:
    """Prompt until a required field has a value."""
    suffix = f" [{default}]" if default else ""
    while True:
        value = input(f"{label}{suffix}: ").strip()
        if value:
            return value
        if default:
            return default
        if not required:
            return ""
        print("  This field is required.")


def ask_email() -> str:
    while True:
        value = ask("Agent email", required=True)
        if EMAIL_RE.fullmatch(value):
            return value
        print("  Enter a valid email address, for example agent@example.com.")


def ask_phone() -> str:
    while True:
        value = ask("Agent phone", required=True)
        digits = re.sub(r"\D", "", value)
        if PHONE_ALLOWED_RE.fullmatch(value) and 10 <= len(digits) <= 15:
            return value
        print("  Use 10-15 digits with normal phone punctuation.")


def ask_asset(label: str, required: bool = False) -> str:
    """Collect and verify an image path before saving it."""
    while True:
        value = ask(label, required=required)
        if not value:
            return ""
        path = Path(value).expanduser().resolve()
        if path.is_file():
            return str(path)
        print(f"  File not found: {path}")


def ask_list(label: str, example: str) -> List[str]:
    print(f"{label} — enter one per line; press Enter on a blank line to finish.")
    print(f"  Example: {example}")
    items: List[str] = []
    while True:
        item = input(f"  {len(items) + 1}. ").strip()
        if not item:
            return items
        items.append(item)


def build_listing() -> Dict[str, Any]:
    print("\nREAL-ESTATE POSTER — NEW LISTING\n")
    print("Listing information")
    status = ask("Status", "FOR LEASE", required=True)
    address = ask("Street address", required=True)
    unit = ask("Unit", required=True)
    city = ask("City and province", "Toronto, ON")
    postal = ask("Postal code")
    tagline = ask("Short listing tagline")
    rent = ask("Rent or price, including currency symbol", required=True)
    rent_period = ask("Price period", "per month")
    mls = ask("MLS number", required=True)
    beds = ask("Bedrooms", required=True)
    baths = ask("Bathrooms", required=True)
    sqft = ask("Square feet or range, e.g. 815 or 600-699", required=True)
    floor = ask("Floor", required=True)
    exposure = ask("Exposure", required=True)
    parking = ask("Parking", required=True)
    availability = ask("Availability", required=True)

    print("\nBrand and agent")
    brand_name = ask("Brokerage or team name", required=True)
    brand_tagline = ask("Brand tagline", "Your next move starts here.")
    website = ask("Website")
    logo = ask_asset("Logo image path (optional)")
    agent_name = ask("Agent name", required=True)
    agent_title = ask("Agent title", "Sales Representative")
    phone = ask_phone()
    email = ask_email()

    print("\nProperty images")
    hero = ask_asset("Hero/exterior photo path", required=True)
    gallery: List[str] = []
    for number in range(1, 5):
        value = ask_asset(f"Gallery photo {number} path (optional)")
        if not value:
            break
        gallery.append(value)
    floorplan = ask_asset("Floorplan image path (optional)")

    print("\nPoster details")
    lease_details = ask_list("Lease details", "12-month lease")
    features = ask_list("Property features", "Floor-to-ceiling windows")
    amenities = ask_list("Building amenities", "24-hour concierge")
    utilities = ask_list("Utilities", "Water included")
    highlights = ask_list("Location highlights", "5 min to TTC")

    data: Dict[str, Any] = {
        "listing": {
            "status": status,
            "demo": False,
            "address": address,
            "unit": unit,
            "city": city,
            "postal_code": postal,
            "tagline": tagline,
            "rent": rent,
            "rent_period": rent_period,
            "mls": mls,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "floor": floor,
            "exposure": exposure,
            "parking": parking,
            "availability": availability,
        },
        "brand": {
            "name": brand_name,
            "tagline": brand_tagline,
            "website": website,
            "logo": logo,
        },
        "contact": {
            "name": agent_name,
            "title": agent_title,
            "phone": phone,
            "email": email,
        },
        "photos": {
            "hero": hero,
            "hero_focal": [0.5, 0.5],
            "gallery": gallery,
            "floorplan": floorplan,
        },
        "content": {
            "photo_caption": "RESIDENCE",
            "floorplan_caption": "FLOORPLAN",
            "lease_details": lease_details,
            "features": features,
            "amenities": amenities,
            "utilities": utilities,
            "location_highlights": highlights,
        },
        "theme": {
            "background": "#F4F0E7",
            "paper": "#FFFDF8",
            "ink": "#102A2A",
            "muted": "#6A746F",
            "accent": "#D99A55",
            "accent_light": "#F2DEC3",
            "hero_overlay": "#0A2526",
            "font_regular": "",
            "font_bold": "",
            "font_serif": "",
        },
        "canvas": {"width": 1800, "height": 2400, "dpi": 150},
    }

    # Keep optional fields out of the file when the user leaves them blank.
    if not logo:
        data["brand"].pop("logo")
    if not floorplan:
        data["photos"].pop("floorplan")
    return data


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="Create a listing YAML through guided prompts.")
    result.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("listings/new-listing.yaml"),
        help="YAML file to create (default: listings/new-listing.yaml)",
    )
    result.add_argument("--render", type=Path, help="Also generate a PNG at this path")
    result.add_argument("--pdf", action="store_true", help="With --render, also generate PDF")
    return result


def main() -> int:
    args = parser().parse_args()
    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    data = build_listing()
    output.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True), encoding="utf-8")
    print(f"\nSaved listing: {output}")

    if args.render:
        try:
            loaded = load_config(output)
            generated = export_poster(loaded, args.render, make_pdf=args.pdf)
        except ConfigError as exc:
            print(f"The YAML was saved, but rendering failed:\n{exc}", file=sys.stderr)
            return 2
        for kind, path in generated.items():
            print(f"{kind.upper()}: {path}")
    else:
        print("Generate it with:")
        print(f"  python3 generate_poster.py {output} --output outputs/poster.png --pdf")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
