"""Input loading, defaults, and validation.

Validation happens before rendering so a missing price, typo in an email address,
or broken image path cannot silently make it into a client-facing poster.
"""

from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path
from typing import Any, Dict, Iterable, List, Mapping, MutableMapping, Tuple

import yaml


class ConfigError(ValueError):
    """Raised when a listing input file is incomplete or malformed."""


DEFAULT_THEME: Dict[str, Any] = {
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
}

DEFAULT_CANVAS = {"width": 1800, "height": 2400, "dpi": 150}

REQUIRED_PATHS = (
    "listing.address",
    "listing.unit",
    "listing.rent",
    "listing.mls",
    "listing.beds",
    "listing.baths",
    "listing.sqft",
    "listing.floor",
    "listing.exposure",
    "listing.parking",
    "listing.availability",
    "contact.name",
    "contact.phone",
    "contact.email",
    "brand.name",
    "photos.hero",
)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
# Intentionally permissive about formatting, but strict about digit count.
PHONE_ALLOWED_RE = re.compile(r"^[+()\-. xX\d]+$")
HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _deep_merge(base: MutableMapping[str, Any], override: Mapping[str, Any]) -> MutableMapping[str, Any]:
    for key, value in override.items():
        if isinstance(value, Mapping) and isinstance(base.get(key), MutableMapping):
            _deep_merge(base[key], value)
        else:
            base[key] = value
    return base


def _value_at(data: Mapping[str, Any], dotted: str) -> Any:
    value: Any = data
    for part in dotted.split("."):
        if not isinstance(value, Mapping) or part not in value:
            return None
        value = value[part]
    return value


def load_config(path: Path) -> Dict[str, Any]:
    """Load YAML or JSON and resolve all asset paths relative to the input file."""
    path = path.expanduser().resolve()
    if not path.exists():
        raise ConfigError(f"Input file does not exist: {path}")

    try:
        with path.open("r", encoding="utf-8") as handle:
            if path.suffix.lower() == ".json":
                raw = json.load(handle)
            elif path.suffix.lower() in {".yaml", ".yml"}:
                raw = yaml.safe_load(handle)
            else:
                raise ConfigError("Input must use .yaml, .yml, or .json")
    except (OSError, json.JSONDecodeError, yaml.YAMLError) as exc:
        raise ConfigError(f"Could not read {path.name}: {exc}") from exc

    if not isinstance(raw, dict):
        raise ConfigError("The input file must contain a mapping/object at its top level")

    data: Dict[str, Any] = deepcopy(raw)
    data["theme"] = dict(_deep_merge(deepcopy(DEFAULT_THEME), data.get("theme", {})))
    data["canvas"] = dict(_deep_merge(deepcopy(DEFAULT_CANVAS), data.get("canvas", {})))
    data.setdefault("listing", {})
    data.setdefault("brand", {})
    data.setdefault("contact", {})
    data.setdefault("photos", {})
    data.setdefault("content", {})

    # Store a stable base path once. The renderer never relies on its launch directory.
    data["_input_path"] = str(path)
    data["_base_dir"] = str(path.parent)
    for section, keys in {
        "photos": ("hero", "gallery", "floorplan"),
        "brand": ("logo",),
        "theme": ("font_regular", "font_bold", "font_serif"),
    }.items():
        mapping = data.get(section, {})
        for key in keys:
            value = mapping.get(key)
            if not value:
                continue
            if isinstance(value, list):
                mapping[key] = [str(_resolve_asset(path.parent, item)) for item in value]
            else:
                mapping[key] = str(_resolve_asset(path.parent, value))

    validate_config(data)
    return data


def _resolve_asset(base_dir: Path, value: Any) -> Path:
    if not isinstance(value, str):
        raise ConfigError(f"Asset paths must be strings, got {type(value).__name__}")
    candidate = Path(value).expanduser()
    return candidate.resolve() if candidate.is_absolute() else (base_dir / candidate).resolve()


def _list_of_text(value: Any, name: str, maximum: int) -> List[str]:
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        raise ConfigError(f"{name} must be a list of non-empty text items")
    if len(value) > maximum:
        raise ConfigError(f"{name} supports at most {maximum} items (received {len(value)})")
    return value


def validate_config(data: Mapping[str, Any]) -> None:
    errors: List[str] = []
    for dotted in REQUIRED_PATHS:
        value = _value_at(data, dotted)
        if value is None or (isinstance(value, str) and not value.strip()):
            errors.append(f"Missing required field: {dotted}")

    email = str(_value_at(data, "contact.email") or "")
    if email and not EMAIL_RE.fullmatch(email):
        errors.append(f"Invalid contact.email: {email!r}")

    phone = str(_value_at(data, "contact.phone") or "")
    digits = re.sub(r"\D", "", phone)
    if phone and (not PHONE_ALLOWED_RE.fullmatch(phone) or not 10 <= len(digits) <= 15):
        errors.append("Invalid contact.phone: use 10-15 digits with normal phone punctuation")

    for name in ("beds", "baths"):
        value = _value_at(data, f"listing.{name}")
        try:
            if float(value) <= 0:
                raise ValueError
        except (TypeError, ValueError):
            errors.append(f"listing.{name} must be a positive number")

    sqft = _value_at(data, "listing.sqft")
    sqft_valid = False
    try:
        sqft_valid = float(sqft) > 0
    except (TypeError, ValueError):
        if isinstance(sqft, str):
            match = re.fullmatch(r"\s*(\d{2,5})\s*-\s*(\d{2,5})\s*", sqft)
            sqft_valid = bool(match and int(match.group(1)) <= int(match.group(2)))
    if not sqft_valid:
        errors.append("listing.sqft must be a positive number or an ASCII-hyphen range such as 600-699")

    canvas = data.get("canvas", {})
    try:
        width, height = int(canvas["width"]), int(canvas["height"])
        dpi = int(canvas["dpi"])
        if width < 900 or height < 1200 or width >= height or not 72 <= dpi <= 600:
            raise ValueError
    except (KeyError, TypeError, ValueError):
        errors.append("canvas must be portrait, at least 900x1200, with dpi between 72 and 600")

    for key, value in data.get("theme", {}).items():
        if key.startswith("font_"):
            continue
        if not isinstance(value, str) or not HEX_RE.fullmatch(value):
            errors.append(f"theme.{key} must be a six-digit hex color such as #102A2A")

    try:
        _list_of_text(_value_at(data, "content.features"), "content.features", 8)
        _list_of_text(_value_at(data, "content.amenities"), "content.amenities", 10)
        _list_of_text(_value_at(data, "content.utilities"), "content.utilities", 8)
    except ConfigError as exc:
        errors.append(str(exc))

    asset_paths: List[Tuple[str, Any]] = [
        ("photos.hero", _value_at(data, "photos.hero")),
        ("photos.floorplan", _value_at(data, "photos.floorplan")),
        ("brand.logo", _value_at(data, "brand.logo")),
    ]
    gallery = _value_at(data, "photos.gallery") or []
    if gallery and not isinstance(gallery, list):
        errors.append("photos.gallery must be a list of image paths")
    elif len(gallery) > 4:
        errors.append("photos.gallery supports at most 4 images")
    else:
        asset_paths.extend((f"photos.gallery[{index}]", item) for index, item in enumerate(gallery))

    for dotted, value in asset_paths:
        if value and not Path(str(value)).is_file():
            errors.append(f"Image file not found for {dotted}: {value}")

    for name in ("font_regular", "font_bold", "font_serif"):
        value = _value_at(data, f"theme.{name}")
        if value and not Path(str(value)).is_file():
            errors.append(f"Font file not found for theme.{name}: {value}")

    focal = _value_at(data, "photos.hero_focal")
    if focal is not None:
        if (
            not isinstance(focal, list)
            or len(focal) != 2
            or not all(isinstance(v, (int, float)) and 0 <= v <= 1 for v in focal)
        ):
            errors.append("photos.hero_focal must be [x, y] with both values between 0 and 1")

    if errors:
        raise ConfigError("\n".join(f"- {error}" for error in errors))
