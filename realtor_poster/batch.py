"""Batch discovery, validation, and export helpers."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Sequence

from . import __version__
from .config import ConfigError, load_config
from .renderer import export_poster


SUPPORTED_INPUT_SUFFIXES = {".yaml", ".yml", ".json"}


def discover_listing_files(folder: Path) -> List[Path]:
    """Find listing inputs in deterministic filename order.

    Files beginning with a dot and generated manifest JSON files are excluded so
    a previous output directory cannot accidentally become new listing input.
    """
    folder = folder.expanduser().resolve()
    if not folder.is_dir():
        raise ConfigError(f"Batch input is not a directory: {folder}")
    files = [
        path
        for path in folder.rglob("*")
        if path.is_file()
        and path.suffix.lower() in SUPPORTED_INPUT_SUFFIXES
        and not path.name.startswith(".")
        and not path.name.endswith(".manifest.json")
        and path.name != "batch-summary.json"
    ]
    files.sort(key=lambda path: path.relative_to(folder).as_posix().casefold())
    if not files:
        raise ConfigError(f"No YAML or JSON listing files found in: {folder}")
    return files


def _safe_stem(path: Path) -> str:
    stem = re.sub(r"[^A-Za-z0-9._-]+", "-", path.stem).strip("-._")
    return stem or "listing"


def export_batch(
    input_folder: Path,
    output_folder: Path,
    *,
    make_pdf: bool = False,
    social_presets: Sequence[str] = (),
) -> Dict[str, Any]:
    """Validate every input first, then render all listings into one folder."""
    input_folder = input_folder.expanduser().resolve()
    output_folder = output_folder.expanduser().resolve()
    files = discover_listing_files(input_folder)

    loaded = []
    errors = []
    for path in files:
        try:
            loaded.append((path, load_config(path)))
        except ConfigError as exc:
            errors.append(f"{path.relative_to(input_folder)}:\n{exc}")
    if errors:
        raise ConfigError("Batch validation failed; nothing was rendered:\n" + "\n".join(errors))

    output_folder.mkdir(parents=True, exist_ok=True)
    used_names: Dict[str, int] = {}
    listings = []
    for path, data in loaded:
        stem = _safe_stem(path)
        used_names[stem] = used_names.get(stem, 0) + 1
        if used_names[stem] > 1:
            stem = f"{stem}-{used_names[stem]}"
        outputs = export_poster(
            data,
            output_folder / f"{stem}.png",
            make_pdf=make_pdf,
            social_presets=social_presets,
        )
        listings.append(
            {
                "input": path.relative_to(input_folder).as_posix(),
                "outputs": {name: result.name for name, result in outputs.items()},
            }
        )

    summary = {
        "generator": f"realtor-poster {__version__}",
        # Store only the folder label; absolute local paths can reveal a user's
        # account name when the batch summary is shared with a client.
        "input_folder": input_folder.name,
        "listing_count": len(listings),
        "listings": listings,
    }
    summary_path = output_folder / "batch-summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    summary["summary_path"] = summary_path
    return summary
