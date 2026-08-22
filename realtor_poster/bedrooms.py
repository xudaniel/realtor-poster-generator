"""Structured bedroom and additional-room handling shared by all renderers."""

from __future__ import annotations

import re
from typing import Any, Mapping, MutableMapping, Optional, Tuple


COMPOUND_BEDROOM_RE = re.compile(r"^\s*(\d+)\s*\+\s*(\d+)\s*$")


def whole_number(value: Any) -> Optional[int]:
    """Return a non-negative whole number, without accepting decimal notation."""
    text = str(value).strip() if value is not None else ""
    return int(text) if re.fullmatch(r"\d+", text) else None


def parse_compound_bedrooms(value: Any) -> Optional[Tuple[int, int]]:
    """Parse an explicit provider value such as ``2 + 1`` without inference."""
    match = COMPOUND_BEDROOM_RE.fullmatch(str(value)) if value is not None else None
    return (int(match.group(1)), int(match.group(2))) if match else None


def has_mixed_bedroom_representation(listing: Mapping[str, Any]) -> bool:
    """Return whether compound and separate bedroom fields were supplied together."""
    return parse_compound_bedrooms(listing.get("beds")) is not None and "beds_additional" in listing


def normalize_bedroom_listing(listing: MutableMapping[str, Any]) -> None:
    """Migrate a legacy/compound bedroom value into two explicit fields in place."""
    compound = parse_compound_bedrooms(listing.get("beds"))
    if compound and "beds_additional" not in listing:
        listing["beds"], listing["beds_additional"] = compound
    else:
        listing.setdefault("beds_additional", 0)


def bedroom_counts(listing: Mapping[str, Any]) -> Tuple[Optional[int], Optional[int]]:
    """Return main-bedroom and additional-room counts."""
    compound = parse_compound_bedrooms(listing.get("beds"))
    if compound and "beds_additional" not in listing:
        return compound
    return whole_number(listing.get("beds")), whole_number(listing.get("beds_additional", 0))


def bedroom_display(listing: Mapping[str, Any]) -> str:
    """Return the compact poster expression while omitting ``+ 0``."""
    primary, additional = bedroom_counts(listing)
    if primary is None:
        return str(listing.get("beds", "")).strip()
    return f"{primary} + {additional}" if additional and additional > 0 else str(primary)


def bedroom_accessible_copy(listing: Mapping[str, Any], language: str = "english") -> str:
    """Describe both counts without reclassifying an additional room as a bedroom."""
    primary, additional = bedroom_counts(listing)
    display = bedroom_display(listing)
    if primary is None or additional is None:
        return display
    english = f"{primary} {'bedroom' if primary == 1 else 'bedrooms'}"
    if additional > 0:
        english += f" + {additional} additional {'room/den' if additional == 1 else 'rooms/dens'}"
    chinese = f"{primary} 间卧室"
    if additional > 0:
        chinese += f" + {additional} 个额外房间/书房"
    if language == "chinese":
        return chinese
    if language == "bilingual":
        return f"{english} / {chinese}"
    return english
