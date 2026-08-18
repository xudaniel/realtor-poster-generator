#!/usr/bin/env python3
"""Simple entry point for generating a poster from a YAML or JSON listing.

Example:
    python3 generate_poster.py listings/my-listing.yaml \
        --output outputs/my-listing.png --pdf
"""

from realtor_poster.cli import main


if __name__ == "__main__":
    raise SystemExit(main())
