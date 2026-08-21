import base64
import json
import os
import unittest
from pathlib import Path
from unittest.mock import patch

from realtor_poster.mls_connector import (
    ConnectorConfig,
    SAFE_ORIGIN,
    _normalized_endpoint,
    fetch_authorized_listing,
    lookup,
    map_upstream_status,
    sanitize_provider_payload,
)


FIXTURE = Path(__file__).parent / "fixtures" / "mls" / "synthetic_provider.json"
CONTRACT_SCHEMA = Path(__file__).parents[1] / "docs" / "mls-normalized-contract.schema.json"


class AuthorizedMlsConnectorTests(unittest.TestCase):
    def setUp(self):
        self.config = ConnectorConfig(
            "synthetic-provider", "Synthetic Authorized Provider", "SYNTH-BOARD", mock_fixture=str(FIXTURE)
        )

    def test_public_context_never_contains_credentials(self):
        context = self.config.public_context()
        serialized = json.dumps(context).lower()
        self.assertEqual(context["provider"]["board"], "SYNTH-BOARD")
        self.assertNotIn("token", serialized)
        self.assertNotIn("secret", serialized)
        self.assertNotIn("password", serialized)

    def test_synthetic_contract_scenarios(self):
        expected = {
            "SYN-EXACT": (200, None),
            "SYN-AMBIGUOUS": (200, None),
            "SYN-INCOMPLETE": (200, None),
            "SYN-WITHDRAWN": (200, None),
            "SYN-STALE": (200, None),
            "SYN-AUTH-EXPIRED": (401, "MLS_AUTH_EXPIRED"),
            "SYN-RATE-LIMIT": (429, "MLS_RATE_LIMITED"),
            "SYN-OUTAGE": (503, "MLS_PROVIDER_UNAVAILABLE"),
        }
        for listing_number, (status, error) in expected.items():
            with self.subTest(listing_number=listing_number):
                actual_status, payload = lookup(self.config, "synthetic-provider", listing_number)
                self.assertEqual(actual_status, status)
                self.assertEqual(payload.get("error", {}).get("code"), error)
                self.assertEqual(payload.get("provider", {}).get("id"), "synthetic-provider")

    def test_exact_fixture_covers_machine_readable_identity_contract(self):
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        schema = json.loads(CONTRACT_SCHEMA.read_text(encoding="utf-8"))
        match = fixture["scenarios"]["SYN-EXACT"]["body"]["matches"][0]
        required = schema["properties"]["matches"]["items"]["required"]
        self.assertTrue(set(required).issubset(match))
        image_required = schema["properties"]["matches"]["items"]["properties"]["images"]["items"]["required"]
        self.assertTrue(all(set(image_required).issubset(image) for image in match["images"]))
        for image in match["images"]:
            self.assertTrue(base64.b64decode(image["dataUrl"].split(",", 1)[1]).startswith(b"\x89PNG\r\n\x1a\n"))

    def test_provider_context_mismatch_is_blocked(self):
        status, payload = lookup(self.config, "another-provider", "SYN-EXACT")
        self.assertEqual(status, 403)
        self.assertEqual(payload["error"]["code"], "MLS_UNAUTHORIZED")

    def test_only_loopback_editor_origins_are_allowed(self):
        self.assertIsNotNone(SAFE_ORIGIN.fullmatch("http://127.0.0.1:8765"))
        self.assertIsNotNone(SAFE_ORIGIN.fullmatch("https://localhost:9443"))
        self.assertIsNone(SAFE_ORIGIN.fullmatch("https://example.com"))
        self.assertIsNone(SAFE_ORIGIN.fullmatch("null"))

    def test_upstream_requires_https_and_encodes_listing_number(self):
        self.assertEqual(
            _normalized_endpoint("https://provider.example/listings/{listing_number}", "AB 12/3"),
            "https://provider.example/listings/AB%2012%2F3",
        )
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            _normalized_endpoint("http://provider.example/listings", "AB123")

    def test_missing_environment_credential_fails_without_network(self):
        live = ConnectorConfig("p", "Provider", "BOARD", endpoint="https://provider.example/listings/{listing_number}", token_env="TEST_MLS_TOKEN")
        with patch.dict(os.environ, {}, clear=True):
            status, payload = fetch_authorized_listing(live, "AB123", opener=lambda *args, **kwargs: self.fail("network should not be called"))
        self.assertEqual(status, 401)
        self.assertEqual(payload["error"]["code"], "MLS_AUTH_EXPIRED")

    def test_status_mapping_is_bilingual_client_safe(self):
        self.assertEqual(map_upstream_status(401), "MLS_AUTH_EXPIRED")
        self.assertEqual(map_upstream_status(403), "MLS_UNAUTHORIZED")
        self.assertEqual(map_upstream_status(404), "MLS_NOT_FOUND")
        self.assertEqual(map_upstream_status(429), "MLS_RATE_LIMITED")
        self.assertEqual(map_upstream_status(503), "MLS_PROVIDER_UNAVAILABLE")

    def test_provider_payload_is_recursively_scrubbed(self):
        payload = sanitize_provider_payload({
            "provider": "safe", "accessToken": "remove", "nested": {"api_key": "remove", "board": "visible"},
            "matches": [{"listingNumber": "SYN-1", "password": "remove"}],
        })
        self.assertEqual(payload, {"provider": "safe", "nested": {"board": "visible"}, "matches": [{"listingNumber": "SYN-1"}]})


if __name__ == "__main__":
    unittest.main()
