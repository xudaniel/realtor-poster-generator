"""Loopback-only connector for contractually authorized MLS/provider feeds.

The static browser editor never receives provider credentials. This process reads a
token from an environment variable, calls one operator-configured HTTPS endpoint,
and returns the provider's normalized listing contract to localhost only.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Callable, Dict, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen


STATUS_CODES = {
    401: "MLS_AUTH_EXPIRED",
    403: "MLS_UNAUTHORIZED",
    404: "MLS_NOT_FOUND",
    410: "MLS_WITHDRAWN",
    429: "MLS_RATE_LIMITED",
}
SAFE_ORIGIN = re.compile(r"^https?://(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$")
SENSITIVE_KEY = re.compile(r"secret|token|credential|password|api[-_]?key", re.IGNORECASE)


@dataclass(frozen=True)
class ConnectorConfig:
    provider_id: str
    provider_name: str
    board: str
    endpoint: str = ""
    token_env: str = "MLS_PROVIDER_TOKEN"
    auth_header: str = "Authorization"
    mock_fixture: str = ""

    def public_context(self) -> Dict[str, Any]:
        return {
            "provider": {"id": self.provider_id, "name": self.provider_name, "board": self.board},
            "mode": "synthetic-mock" if self.mock_fixture else "authorized-provider",
            "authorizationStorage": "environment-only",
        }


def error_payload(code: str, message: str) -> Dict[str, Any]:
    return {"error": {"code": code, "message": message}}


def sanitize_provider_payload(value: Any, key: str = "") -> Any:
    """Remove credential-like keys before any provider payload reaches the browser."""
    if SENSITIVE_KEY.search(key):
        return None
    if isinstance(value, list):
        return [sanitize_provider_payload(item) for item in value]
    if isinstance(value, dict):
        return {
            child_key: sanitize_provider_payload(child, child_key)
            for child_key, child in value.items()
            if not SENSITIVE_KEY.search(child_key)
        }
    return value


def map_upstream_status(status: int) -> str:
    return STATUS_CODES.get(status, "MLS_PROVIDER_UNAVAILABLE" if status >= 500 else "MLS_PROVIDER_ERROR")


def _normalized_endpoint(endpoint: str, listing_number: str) -> str:
    parsed = urlparse(endpoint)
    if parsed.scheme != "https" or not parsed.netloc:
        raise ValueError("Authorized provider endpoint must be an absolute HTTPS URL")
    encoded = quote(listing_number, safe="")
    if "{listing_number}" in endpoint:
        return endpoint.replace("{listing_number}", encoded)
    separator = "&" if parsed.query else "?"
    return f"{endpoint}{separator}{urlencode({'listing_number': listing_number})}"


def fetch_authorized_listing(
    config: ConnectorConfig,
    listing_number: str,
    opener: Callable[..., Any] = urlopen,
) -> Tuple[int, Dict[str, Any]]:
    token = os.environ.get(config.token_env, "")
    if not token:
        return 401, error_payload("MLS_AUTH_EXPIRED", f"Set provider credential in {config.token_env} before starting the connector")
    try:
        endpoint = _normalized_endpoint(config.endpoint, listing_number)
    except ValueError as exc:
        return 503, error_payload("MLS_PROVIDER_UNAVAILABLE", str(exc))
    auth_value = token if config.auth_header.lower() != "authorization" else f"Bearer {token}"
    request = Request(endpoint, headers={config.auth_header: auth_value, "Accept": "application/json", "User-Agent": "realtor-poster-mls/1.4.3"})
    try:
        with opener(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
            status = int(getattr(response, "status", 200))
    except HTTPError as exc:
        code = map_upstream_status(exc.code)
        return exc.code, error_payload(code, f"Authorized provider returned HTTP {exc.code}")
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        return 503, error_payload("MLS_PROVIDER_UNAVAILABLE", f"Authorized provider unavailable: {type(exc).__name__}")
    if not isinstance(payload, dict):
        return 502, error_payload("MLS_PROVIDER_ERROR", "Provider response must be a JSON object")
    payload = sanitize_provider_payload(payload)
    payload.setdefault("provider", {"id": config.provider_id, "name": config.provider_name, "board": config.board})
    payload.setdefault("retrievedAt", datetime.now(timezone.utc).isoformat())
    return status, payload


def fetch_mock_listing(config: ConnectorConfig, listing_number: str) -> Tuple[int, Dict[str, Any]]:
    fixture = json.loads(Path(config.mock_fixture).read_text(encoding="utf-8"))
    scenario = fixture.get("scenarios", {}).get(listing_number)
    if not scenario:
        return 404, error_payload("MLS_NOT_FOUND", "Synthetic fixture listing not found")
    status = int(scenario.get("status", 200))
    body = scenario.get("body", {})
    if not isinstance(body, dict):
        return 500, error_payload("MLS_PROVIDER_ERROR", "Synthetic scenario body must be an object")
    body = sanitize_provider_payload(body)
    body.setdefault("provider", fixture.get("provider", config.public_context()["provider"]))
    body.setdefault("retrievedAt", "2026-08-21T12:00:00Z")
    return status, body


def lookup(config: ConnectorConfig, provider_id: str, listing_number: str) -> Tuple[int, Dict[str, Any]]:
    if provider_id != config.provider_id:
        return 403, error_payload("MLS_UNAUTHORIZED", "Requested provider does not match this connector")
    if not listing_number.strip():
        return 400, error_payload("MLS_NUMBER_REQUIRED", "listingNumber is required")
    if config.mock_fixture:
        return fetch_mock_listing(config, listing_number.strip())
    return fetch_authorized_listing(config, listing_number.strip())


def handler_for(config: ConnectorConfig):
    class ConnectorHandler(BaseHTTPRequestHandler):
        server_version = "RealtorPosterMLS/1.4.3"

        def _origin(self) -> Optional[str]:
            origin = self.headers.get("Origin", "")
            return origin if SAFE_ORIGIN.fullmatch(origin) else None

        def _send(self, status: int, payload: Dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            origin = self._origin()
            if origin:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(body)

        def do_OPTIONS(self) -> None:  # noqa: N802
            if not self._origin():
                self._send(403, error_payload("MLS_ORIGIN_BLOCKED", "Only a local editor origin is allowed"))
                return
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", self._origin() or "")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Max-Age", "600")
            self.end_headers()

        def do_GET(self) -> None:  # noqa: N802
            if self.path != "/v1/context":
                self._send(404, error_payload("MLS_NOT_FOUND", "Connector route not found"))
                return
            self._send(200, config.public_context())

        def do_POST(self) -> None:  # noqa: N802
            if self.path != "/v1/listings/lookup":
                self._send(404, error_payload("MLS_NOT_FOUND", "Connector route not found"))
                return
            try:
                length = min(int(self.headers.get("Content-Length", "0")), 8192)
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
                self._send(400, error_payload("MLS_INVALID_REQUEST", "Request body must be JSON"))
                return
            status, payload = lookup(config, str(body.get("providerId", "")), str(body.get("listingNumber", "")))
            self._send(status, payload)

        def log_message(self, format: str, *args: Any) -> None:
            # Never log request bodies, MLS numbers, headers, or provider responses.
            print(f"MLS connector: {self.command} {self.path} -> {args[1] if len(args) > 1 else '-'}")

    return ConnectorHandler


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run a loopback-only authorized MLS connector")
    parser.add_argument("--provider-id", required=True)
    parser.add_argument("--provider-name", required=True)
    parser.add_argument("--board", required=True)
    parser.add_argument("--endpoint", default="", help="Operator-approved HTTPS endpoint; use {listing_number} as an optional placeholder")
    parser.add_argument("--token-env", default="MLS_PROVIDER_TOKEN", help="Environment-variable name containing the provider credential")
    parser.add_argument("--auth-header", default="Authorization")
    parser.add_argument("--mock-fixture", default="", help="Synthetic test/demo contract; never use real listing records")
    parser.add_argument("--port", type=int, default=8766)
    return parser


def main(argv: Optional[list] = None) -> int:
    args = build_parser().parse_args(argv)
    if not args.mock_fixture and not args.endpoint:
        raise SystemExit("--endpoint is required unless --mock-fixture is used")
    config = ConnectorConfig(args.provider_id, args.provider_name, args.board, args.endpoint, args.token_env, args.auth_header, args.mock_fixture)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler_for(config))
    print(f"Authorized MLS connector ready on http://127.0.0.1:{args.port} for {args.provider_name} / {args.board}")
    print("Provider credentials remain in the named environment variable and are never returned to the editor.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
