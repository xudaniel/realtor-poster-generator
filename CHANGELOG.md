# Changelog

All notable changes to Realtor Poster Generator are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [Unreleased] - v2.0 authorized MLS candidate

See the bilingual [candidate release notes](RELEASE_NOTES_v2.0.0-candidate.md) and Issue [#22](https://github.com/xudaniel/realtor-poster-generator/issues/22).

### Added

- Opt-in generation of a complete editable project from one exact MLS number through a separately authorized connector
- Bundled fictional `DEMO1234` provider for offline evaluation without credentials or real listing data
- Deterministic mapping for v1.4 listing facts, lease details, included and tenant-paid costs, amenities, application requirements, permitted images, and paired floor plans
- Per-field source records, media-rights metadata, refresh differences, local-override tracking, and manifest/approval-proof provenance
- Blocking human-review gates for imported facts, current status, disclosures, application requirements, and image rights
- Bilingual connector protocol documentation and mock-only automated tests

### Security

- Production URLs require HTTPS except explicit loopback development; credentials stay outside the static application
- The browser accepts no API key or bearer token and makes no background lookup or scraping request

## [1.4.0] - 2026-08-20

See the bilingual [v1.4.0 release notes](RELEASE_NOTES_v1.4.0.md).

### Added

- Reorderable, hideable property-facts ribbon with up to eight shared values, bilingual labels, accessible text, and four-fact social priorities
- Two independent browser-local floor-plan slots for furnished 3D and technical 2D plans, including contain, fit-width, crop, focal, caption, note, pixel-dimension, and SHA-256 metadata
- Up to three image-led bilingual feature spotlights with circle, rounded-square, and rectangle masks
- Structured bilingual lease-detail rows with active, not-applicable, and hidden states plus sale-campaign collapse
- Reorderable rent-included costs with locally bundled MIT-licensed Tabler icons, unknown/verify states, and conflict warnings
- Reorderable tenant-paid costs with blocking duplicate detection against rent inclusions
- Up to twelve ordered bilingual amenities with reusable locally bundled icons and clean empty-state collapse
- Up to ten bilingual application requirements with explicit confirmation and disclaimer export gates
- Branded agent profile and CTA footer with photo, illustrated, initials, and no-portrait modes plus focal controls and bilingual contact copy
- Complete original modular print layout plus compact social summaries for the new cost modules
- Browser project schema version 4 and `1.4.0` browser generator metadata
- Cross-cutting v1.4 recovery for complete editor projects and local images using IndexedDB, with debounced autosave, pre-export/reset/import snapshots, bilingual restore controls, per-project isolation, scroll restoration, storage warnings, and cross-tab conflict detection ([#20](https://github.com/xudaniel/realtor-poster-generator/issues/20))
- Browser recovery tests for snapshot completeness, version compatibility, project identity, newest-draft selection, IndexedDB CRUD/write failures, and action hooks
- Deterministic v1.4 layout-contract golden fixtures for minimum, typical, maximum, and bilingual social-reduction projects

### Changed

- Print artwork now uses an original high-information modular hierarchy inspired by the supplied reference without copying its assets, wording, icons, colours, or geometry
- Project files, listing interchange, comparisons, manifests, and approval packages now preserve all ten v1.4 story modules and their local image hashes
- Browser documentation and product requirements now describe v1.4 Stories 1–10 in English and Chinese

### Fixed

- Destructive imports and resets now stop when their required pre-action recovery snapshot cannot be saved
- Print output now preserves the first ordered interior photo and all four configured feature statements
- Lease details have a validated nine-row maximum with multiline print rendering
- Twelve-item responsibility grids use dense spacing that prevents labels, icons, and verify markers from colliding
- Provenance manifests preserve hidden property facts, original order, source path, and resolved value
- Shared-value property-fact controls refresh immediately when their referenced listing field changes

## [1.3.0] - 2026-08-20

See the complete [bilingual v1.3.0 release notes](RELEASE_NOTES_v1.3.0.md).

### Added

- Versioned browser project schema with complete listing fields, four ordered interior photos, floor plans, dual logo variants, and YAML/JSON interchange
- Browser validation aligned with the Python renderer, blocking preflight errors, translation warnings, and local SHA-256 provenance manifests
- Reusable lease, sale, open-house, and just-listed compliance profiles with configurable export gates and portable profile files
- Versioned brand templates with selectively locked brand fields, dual logos, and portable template files
- English, Chinese, and bilingual artwork across print, square, portrait, story, and landscape formats
- Local comparison against an approved project plus Draft, Changes Requested, and Approved review records
- Approval ZIP containing five proofs, source data, project data, approval record, provenance manifest, and SHA-256 catalog
- Testable browser core and Node-based coverage for validation, YAML round-trips, manifests, approval requirements, and project comparisons
- Configurable licence/registration data, portable typography and default layout settings, template duplication, and independently composed bilingual copy

### Changed

- Browser exports now require compliance preflight and include explicit privacy and non-legal-approval boundaries
- Package and runtime manifest metadata now report 1.3.0

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
[1.3.0]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.3.0
[1.4.0]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.4.0
[1.0.0]: https://github.com/xudaniel/realtor-poster-generator/commits/main/
