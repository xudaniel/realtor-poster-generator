"""Command-line interface for validation and rendering."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Optional, Sequence

from .batch import discover_listing_files, export_batch
from .config import ConfigError, load_config
from .renderer import export_poster
from .social import SOCIAL_PRESETS


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="realtor-poster",
        description="Generate full and social real-estate artwork from one file or a folder.",
    )
    parser.add_argument("input", type=Path, help="Listing file, or a folder containing multiple listings")
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="PNG path for one listing, or output folder for batch mode",
    )
    parser.add_argument("--pdf", action="store_true", help="Also save a PDF next to the PNG")
    parser.add_argument(
        "--social",
        action="append",
        choices=(*SOCIAL_PRESETS, "all"),
        default=[],
        help="Add a social-media size; repeat the flag or use 'all'",
    )
    parser.add_argument("--validate-only", action="store_true", help="Check data and assets without rendering")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        if args.input.expanduser().is_dir():
            files = discover_listing_files(args.input)
            if args.validate_only:
                for path in files:
                    load_config(path)
                    print(f"Valid: {path.name}")
                print(f"Validated {len(files)} listing files")
                return 0
            if args.output and args.output.suffix.lower() in {".png", ".jpg", ".jpeg", ".pdf"}:
                raise ConfigError(
                    "Batch --output must be a folder, not an image or PDF path: "
                    f"{args.output}"
                )
            output_folder = args.output or Path("outputs/batch")
            summary = export_batch(
                args.input,
                output_folder,
                make_pdf=args.pdf,
                social_presets=args.social,
            )
            print(f"Rendered {summary['listing_count']} listings")
            print(f"SUMMARY: {summary['summary_path']}")
            return 0

        data = load_config(args.input)
        if args.validate_only:
            print(f"Valid: {Path(data['_input_path']).name}")
            return 0
        output_png = args.output or Path("outputs/poster.png")
        outputs = export_poster(data, output_png, make_pdf=args.pdf, social_presets=args.social)
    except ConfigError as exc:
        print(f"Input validation failed:\n{exc}", file=sys.stderr)
        return 2
    except OSError as exc:
        print(f"Could not render poster: {exc}", file=sys.stderr)
        return 3

    for kind, path in outputs.items():
        print(f"{kind.upper()}: {path}")
    return 0
