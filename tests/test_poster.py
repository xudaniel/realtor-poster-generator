from __future__ import annotations

import tempfile
import unittest
from copy import deepcopy
from pathlib import Path

import yaml
from PIL import Image, ImageChops

from realtor_poster.batch import discover_listing_files, export_batch
from realtor_poster.cli import main as cli_main
from realtor_poster.config import ConfigError, load_config, validate_config
from realtor_poster.preview import create_focal_preview
from realtor_poster.renderer import render_poster
from realtor_poster.social import SOCIAL_PRESETS, render_social
from realtor_poster.visual_regression import compare_images
from realtor_poster import __version__


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

    def test_social_presets_render_to_documented_sizes(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        for preset, expected_size in SOCIAL_PRESETS.items():
            with self.subTest(preset=preset):
                image = render_social(data, preset)
                self.assertEqual(image.size, expected_size)
                self.assertEqual(image.mode, "RGB")

    def test_render_is_pixel_deterministic_in_one_environment(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        first = render_poster(data)
        second = render_poster(data)
        self.assertIsNone(ImageChops.difference(first, second).getbbox())

    def test_focal_preview_is_self_contained(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        data = load_config(ROOT / "examples" / "sample_listing.yaml")
        with tempfile.TemporaryDirectory() as folder:
            output = create_focal_preview(data, Path(folder) / "preview.html")
            content = output.read_text(encoding="utf-8")
        self.assertIn("data:image/jpeg;base64,", content)
        self.assertIn("hero_focal", content)
        self.assertNotIn("https://", content)

    def test_visual_regression_detects_real_change(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            folder_path = Path(folder)
            baseline = folder_path / "baseline.png"
            same = folder_path / "same.png"
            changed = folder_path / "changed.png"
            Image.new("RGB", (80, 60), "white").save(baseline)
            Image.new("RGB", (80, 60), "white").save(same)
            changed_image = Image.new("RGB", (80, 60), "white")
            for x in range(30):
                for y in range(30):
                    changed_image.putpixel((x, y), (0, 0, 0))
            changed_image.save(changed)
            self.assertTrue(compare_images(baseline, same, threshold=0).passed)
            result = compare_images(baseline, changed, threshold=0.01, diff_path=folder_path / "diff.png")
            self.assertFalse(result.passed)
            self.assertGreater(result.changed_pixel_ratio, 0.1)

    def test_visual_regression_counts_largest_rgb_channel_delta(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            folder_path = Path(folder)
            baseline = folder_path / "baseline.png"
            changed = folder_path / "changed.png"
            Image.new("RGB", (8, 8), (0, 0, 0)).save(baseline)
            Image.new("RGB", (8, 8), (20, 0, 0)).save(changed)
            result = compare_images(baseline, changed, threshold=1)
            self.assertEqual(result.changed_pixel_ratio, 1.0)

    def test_batch_discovers_validates_and_renders_multiple_listings(self) -> None:
        if self.skip_reason:
            self.skipTest(self.skip_reason)
        raw = yaml.safe_load((ROOT / "examples" / "sample_listing.yaml").read_text(encoding="utf-8"))
        asset_dir = ROOT / "examples" / "assets"
        raw["photos"]["hero"] = str(asset_dir / "sample_exterior.png")
        raw["photos"]["gallery"] = [
            str(asset_dir / "sample_living_room.png"),
            str(asset_dir / "sample_kitchen.png"),
        ]
        raw["photos"]["floorplan"] = str(asset_dir / "sample_floorplan.png")
        raw["brand"]["logo"] = str(asset_dir / "sample_logo.png")
        raw["canvas"] = {"width": 900, "height": 1200, "dpi": 150}
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            inputs = root / "inputs"
            outputs = root / "outputs"
            inputs.mkdir()
            for index in (1, 2):
                item = deepcopy(raw)
                item["listing"]["unit"] = str(2600 + index)
                (inputs / f"listing-{index}.yaml").write_text(
                    yaml.safe_dump(item, sort_keys=False, allow_unicode=True), encoding="utf-8"
                )
            self.assertEqual(len(discover_listing_files(inputs)), 2)
            summary = export_batch(inputs, outputs)
            self.assertEqual(summary["listing_count"], 2)
            self.assertTrue((outputs / "listing-1.png").is_file())
            self.assertTrue((outputs / "listing-2.manifest.json").is_file())

            broken = deepcopy(raw)
            broken["listing"].pop("address")
            (inputs / "broken.yaml").write_text(
                yaml.safe_dump(broken, sort_keys=False, allow_unicode=True), encoding="utf-8"
            )
            blocked_outputs = root / "blocked-outputs"
            with self.assertRaises(ConfigError):
                export_batch(inputs, blocked_outputs)
            self.assertFalse(blocked_outputs.exists())

    def test_batch_ignores_files_inside_hidden_directories(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            visible = root / "listing.yaml"
            hidden_dir = root / ".drafts"
            hidden_dir.mkdir()
            visible.write_text("listing: {}\n", encoding="utf-8")
            (hidden_dir / "private.yaml").write_text("listing: {}\n", encoding="utf-8")
            self.assertEqual(discover_listing_files(root), [visible.resolve()])

    def test_batch_rejects_file_shaped_output_path(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            inputs = root / "inputs"
            inputs.mkdir()
            (inputs / "listing.yaml").write_text("listing: {}\n", encoding="utf-8")
            output = root / "poster.png"
            self.assertEqual(cli_main([str(inputs), "--output", str(output)]), 2)
            self.assertFalse(output.exists())

    def test_browser_editor_is_local_and_has_core_exports(self) -> None:
        index = (ROOT / "web" / "index.html").read_text(encoding="utf-8")
        script = (ROOT / "web" / "app.js").read_text(encoding="utf-8")
        core = (ROOT / "web" / "core.js").read_text(encoding="utf-8")
        self.assertIn("Daniel Xu", index)
        self.assertIn('id="hero-upload"', index)
        self.assertIn('id="gallery-upload"', index)
        self.assertIn('id="plans-editor"', index)
        self.assertIn('id="facts-editor"', index)
        self.assertIn('id="spotlights-editor"', index)
        self.assertIn('id="lease-editor"', index)
        self.assertIn('id="costs-editor"', index)
        self.assertIn('id="tenant-costs-editor"', index)
        self.assertIn('id="amenities-editor"', index)
        self.assertIn('id="requirements-editor"', index)
        self.assertIn('id="portrait-upload"', index)
        self.assertIn('id="import-listing"', index)
        self.assertIn('id="compliance-profile"', index)
        self.assertIn('id="save-template"', index)
        self.assertIn('id="language-mode"', index)
        self.assertIn('id="download-approval"', index)
        self.assertIn('id="download-png"', index)
        self.assertIn('id="print-pdf"', index)
        self.assertIn('id="download-pack"', index)
        self.assertIn("makeZip", script)
        self.assertIn("drawPoster", script)
        self.assertIn("validateProject", core)
        self.assertIn("buildManifest", core)
        self.assertIn("diffProjects", core)
        self.assertIn("resolvedPropertyFacts", core)
        self.assertIn("activeFloorPlans", core)
        self.assertIn("activeTenantPaidCosts", core)
        self.assertIn("activeAmenities", core)
        self.assertIn("activeApplicationRequirements", core)
        self.assertIn("layoutSnapshot", core)
        self.assertIn("OUTPUT_DIMENSIONS", core)
        self.assertEqual(__version__, "1.3.0")
        combined = index + script + core
        self.assertNotIn("fetch(", combined)
        self.assertNotIn("XMLHttpRequest", combined)


if __name__ == "__main__":
    unittest.main()
