# Changelog

All notable changes to Realtor Poster Generator are documented here. The project follows [Semantic Versioning](https://semver.org/).

## [1.4.3] - 2026-08-22

See the bilingual [v1.4.3 release notes](RELEASE_NOTES_v1.4.3.md).

### Added

- Separate **Main bedrooms** (`0–20`) and **Additional room / den** (`0–10`) whole-number controls with immediate canonical `1`, `1 + 1`, `2`, and `2 + 1` preview
- Browser project schema 6 plus two-field preservation through portable JSON/YAML, IndexedDB recovery, project comparison, provenance manifests, and approval packages
- Automated coverage for display values, bounds, bilingual accessible copy, legacy migration, round trips, five-format layouts, explicit MLS values, provenance, and review invalidation

### Changed

- Compound property facts use the safe labels **“Beds + room/den”** and **“卧室 + 额外房间/书房”** instead of describing an additional room as a bedroom
- Print, square, portrait, story, and landscape output now share the structured bedroom expression without summing or changing either count
- Legacy single-value projects migrate with an additional count of `0`; explicit legacy compound values split into the two fields without changing their displayed expression
- Authorized MLS import maps an additional count only from explicit separate or compound provider data and retains the original value in field-level provenance

### Accessibility

- English, Chinese, and bilingual artwork describe the separate counts explicitly, such as `2 bedrooms + 1 additional room/den` and `2 间卧室 + 1 个额外房间/书房`
- Invalid values use actionable preflight errors that focus the relevant control; controls and derived preview remain responsive on mobile and at 200% zoom

### Integrity

- The application never adds the two counts, infers `+1` from descriptions, remarks, photographs, or floor plans, or represents a room/den as a legal bedroom
- Editing either imported count records a local override, invalidates the previous MLS human review, and requires review again before export

## [1.4.2] - 2026-08-21

See the bilingual [v1.4.2 release notes](RELEASE_NOTES_v1.4.2.md).

### Added

- Plain-language action cards for every blocking export-preflight issue, with direct buttons that open, scroll to, and focus the relevant control
- Separate amber source-change notices that identify every locally changed MLS field and link to the first changed field
- Unit coverage for zero, one, and multiple blockers/warnings, blocker-only counts, direct action targets, and immediate MLS-review state changes

### Changed

- The red preflight panel now contains and counts only issues that block export; warnings no longer appear as blocking errors
- Status copy avoids internal validation terminology and uses explicit action-required, warning, and ready states
- Package, browser, connector, manifest, README, PRD, and release metadata now report v1.4.2 without changing browser project schema 5

### Accessibility

- Live-region state updates, text plus status symbols, visible keyboard focus, logical focus placement, and responsive action-card reflow for mobile and 200% zoom

### Fixed

- Imported-field overrides no longer appear inside the red export-blocked container
- Users can return directly to MLS review, image rights, application requirements, or a validated field instead of manually searching the editor

## [1.4.1] - 2026-08-21

See the bilingual [v1.4.1 release notes](RELEASE_NOTES_v1.4.1.md).

### Added

- Loopback-only `realtor-poster-mls` bridge for operator-approved official or contractual HTTPS provider endpoints, with environment-only authorization and local-origin controls
- Authorized MLS import UI with exact provider/board/listing-number matching, deterministic field/module mapping, completeness summary, bilingual failure messages, and explicit human review
- Browser project schema version 5 with field-level provider, board, listing number, retrieval/source times, original values, current values, and user-override provenance
- Same-listing refresh diffs with confirmation before protected user edits or local listing images are overwritten
- Image source/order/caption/dimensions/rights provenance plus blocking confirmation or local-replacement workflow
- Fully synthetic provider fixture and Python/Node coverage for exact, ambiguous, incomplete, withdrawn, stale, auth-expired, rate-limited, outage, override, refresh, and image-rights paths

### Changed

- Security and privacy documentation now distinguishes fully local manual editing from explicitly initiated authorized provider access
- README, English README, Chinese/English PRDs, release notes, package metadata, browser metadata, and manifest metadata now report v1.4.1
- Browser preflight blocks authorized imports until identity, publishable status, image rights, required content, disclosures, and human review are complete

### Security

- Browser connector URLs are restricted to loopback hosts, provider upstream URLs are fixed at connector startup and require HTTPS, and authorization never enters browser responses, project files, manifests, logs, fixtures, or the repository

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
[1.4.1]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.4.1
[1.4.2]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.4.2
[1.4.3]: https://github.com/xudaniel/realtor-poster-generator/releases/tag/v1.4.3
[1.0.0]: https://github.com/xudaniel/realtor-poster-generator/commits/main/
