from __future__ import annotations

import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

from realtor_poster.config import ConfigError, load_config, validate_config
from realtor_poster.renderer import render_poster


ROOT = Path(__file__).resolve().parents[1]


class PosterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        assets = ROOT / "examples" / "assets" / "sample_exterior.png"
        if not assets.exists():
            cls.skip_reason = "Run python scripts/create_sample_assets.py before tests"
        else:
            cls.skip_reason = ""

    def test_sample_validates_and_renders_to_requested_size(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        image = render_poster(data)
        self.assertEqual(image.size, (1800, 2400))
        self.assertEqual(image.mode, "RGB")

    def test_invalid_email_and_phone_are_reported(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        broken = deepcopy(data)
        broken["contact"]["email"] = "not-an-email"
        broken["contact"]["phone"] = "123"
        with self.assertRaises(ConfigError) as caught:
            validate_config(broken)
        self.assertIn("contact.email", str(caught.exception))
        self.assertIn("contact.phone", str(caught.exception))

    def test_square_footage_range_is_supported(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        ranged = deepcopy(data)
        ranged["listing"]["sqft"] = "600-699"
        validate_config(ranged)


if __name__ == "__main__":
    unittest.main()
