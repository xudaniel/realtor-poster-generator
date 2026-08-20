# Changelog

All notable changes to Realtor Poster Generator are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [1.2.1] - 2026-08-20

### Documentation

- Expanded the English README to match the Chinese guide's installation, batch, social, focal-preview, visual-regression, input, branding, testing, and publishing coverage
- Added a complete English product requirements document in `PRD.en.md`
- Added direct English/中文 navigation between both README and PRD documents
- Updated the Chinese PRD to include the browser-local editor, portable project files, social ZIP export, privacy requirements, and current acceptance tests

### Changed

- Bumped package and manifest version metadata to 1.2.1

## [1.2.0] - 2026-08-20

### Added

- Browser-local Realtor Poster Studio with live print and social previews
- Hero-image focal-point controls, logo upload, brand colors, and portable project files
- PNG export, print-to-PDF workflow, and a ZIP containing four social formats
- Batch YAML/YML/JSON discovery with all-or-nothing preflight validation
- Square, portrait, story, and landscape social renderers
- Offline focal preview and deterministic visual-regression metrics
- MIT License, English documentation, contribution and security policies
- GitHub Actions for Python tests, package builds, JavaScript checks, and GitHub Pages

### Fixed

- Hidden input directories are excluded from batch discovery
- Batch output paths that look like image or PDF files fail fast
- Changed-pixel ratios now use the largest RGB channel delta as documented

## [1.0.0] - 2026-08-18

- Initial deterministic YAML/JSON-to-PNG/PDF poster renderer
- Configurable listing, contact, branding, typography, and photo inputs
- Validation, sample assets, manifest hashing, and unit tests

[1.2.0]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.2.0
[1.2.1]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.2.1
[1.0.0]: https://github.com/xudaniel/realtor-poster-generator/commits/main/
