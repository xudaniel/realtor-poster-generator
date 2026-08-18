"""Command-line interface for validation and rendering."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional, Sequence

from .config import ConfigError, load_config
from .renderer import export_poster


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="realtor-poster",
        description="Generate a portrait real-estate poster from YAML or JSON.",
    )
    parser.add_argument("input", type=Path, help="Listing data (.yaml, .yml, or .json)")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=Path("outputs/poster.png"),
        help="PNG output path (default: outputs/poster.png)",
    )
    parser.add_argument("--pdf", action="store_true", help="Also save a PDF next to the PNG")
    parser.add_argument("--validate-only", action="store_true", help="Check data and assets without rendering")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        data = load_config(args.input)
        if args.validate_only:
            print(f"Valid: {Path(data['_input_path']).name}")
            return 0
        outputs = export_poster(data, args.output, make_pdf=args.pdf)
    except ConfigError as exc:
        print(f"Input validation failed:\n{exc}", file=sys.stderr)
        return 2
    except OSError as exc:
        print(f"Could not render poster: {exc}", file=sys.stderr)
        return 3

    for kind, path in outputs.items():
        print(f"{kind.upper()}: {path}")
    return 0
