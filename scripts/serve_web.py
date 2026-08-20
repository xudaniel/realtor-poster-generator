#!/usr/bin/env python3
"""Serve the browser-local editor without third-party dependencies."""

from __future__ import annotations

import argparse
import http.server
import socketserver
from functools import partial
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the local Realtor Poster Studio.")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=ROOT / "web")
    with socketserver.TCPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Realtor Poster Studio: http://127.0.0.1:{args.port}")
        server.serve_forever()


if __name__ == "__main__":
    main()
