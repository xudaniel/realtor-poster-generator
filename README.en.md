# Realtor Poster Generator

[![Tests](https://img.shields.io/github/actions/workflow/status/xudaniel/realtor-poster-generator/ci.yml?branch=main&label=tests)](https://github.com/xudaniel/realtor-poster-generator/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-d6a25e.svg)](LICENSE)
[![Browser local](https://img.shields.io/badge/privacy-browser--local-2f7654.svg)](web/)

Created and maintained by **Daniel Xu**. [中文说明](README.md) · [Live visual editor](https://xudaniel.github.io/realtor-poster-generator/) · [Changelog](CHANGELOG.md)

Realtor Poster Generator is a deterministic, data-driven toolkit for print and social real-estate artwork. It validates YAML or JSON listing data before rendering addresses, prices, MLS® numbers, property facts, photos, branding, and contact details with Pillow. No generative model is used to draw text.

<p align="center"><img src="outputs/sample-poster.png" width="420" alt="Fictional sample real-estate poster"></p>

## Browser-local visual editor

The [live editor](https://xudaniel.github.io/realtor-poster-generator/) is the fastest way to use the project:

1. Enter listing, agent, and brand details.
2. Drop in a hero photo and logo, then click the important point to control the crop.
3. Preview print, square, portrait, story, and landscape layouts.
4. Download a PNG, print to PDF, save a portable project, or export a ZIP containing all four social formats.

Photos and form data remain in the current browser tab. The editor has no upload or analytics code. To run it locally:

```bash
python3 scripts/serve_web.py
```

Open `http://127.0.0.1:8765`.

## Python quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python scripts/create_sample_assets.py
python generate_poster.py examples/sample_listing.yaml \
  --output outputs/sample-poster.png --pdf --social all
```

The command writes a full PNG, a one-page PDF, four social images, and a SHA-256 manifest.

## Batch workflow

Place YAML, YML, or JSON listings in a folder and run:

```bash
python generate_poster.py listings/ --output outputs/batch --pdf --social all
```

All inputs are validated before any output directory is created. Hidden directories and generated manifests are ignored. `batch-summary.json` records the finished package without disclosing absolute local paths.

## Formats

| Output | Dimensions | Typical use |
|---|---:|---|
| Full poster | Configurable; sample 1800 × 2400 | Print and PDF |
| Square | 1080 × 1080 | Instagram and Facebook posts |
| Portrait | 1080 × 1350 | Instagram portrait posts |
| Story | 1080 × 1920 | Instagram and Facebook stories |
| Landscape | 1200 × 630 | Facebook, LinkedIn, and link previews |

## Quality controls

- Required-field, email, phone, numeric, and asset-path validation
- EXIF-aware image loading and focal-point cropping
- Deterministic rendering and SHA-256 manifests
- Batch preflight validation
- Visual regression metrics and amplified diff images
- Multi-version CI, package builds, and browser-editor syntax/privacy checks

Run the complete local test suite:

```bash
python scripts/create_sample_assets.py
python -m unittest discover -s tests -v
node --check web/app.js
```

## Responsible publishing

Before publishing real listing artwork, verify listing claims, MLS® data, contact information, image and font rights, required brokerage disclosures, and local advertising rules. This tool provides technical validation and layout; it does not replace brokerage or legal review.

## License

Copyright © 2026 **Daniel Xu**. Released under the [MIT License](LICENSE). Contributions are welcome under [CONTRIBUTING.md](CONTRIBUTING.md).
