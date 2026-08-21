# Realtor Poster Generator Product Requirements Document

[中文产品需求文档](PRD.md) · [English README](README.en.md) · [中文 README](README.md)

## 1. Document information

- Product: Realtor Poster Generator
- Current stable version: 1.4.0
- Current release scope: stable Stories 1–10 plus cross-cutting recovery issue #20; v2 authorized MLS-number candidate in Issue #22
- Language: English
- Product forms: browser-local manual visual editor, opt-in authorized MLS connector, local Python command-line tools, and a self-contained offline HTML preview
- Primary outputs: full-poster PNG/PDF, social-media PNG/ZIP, portable project JSON/YAML, template and compliance profiles, approval ZIP, provenance manifest JSON, batch summary JSON, and focal-preview HTML

## 2. Background

Real-estate agents creating rental or sale artwork repeatedly assemble addresses, prices, MLS® numbers, property facts, features, amenities, photographs, floor plans, and contact details. A general-purpose design tool creates recurring risks:

- Every listing requires manual layout work.
- Addresses, telephone numbers, prices, or MLS® numbers can be mistyped.
- Images with different proportions may be stretched or cropped incorrectly.
- Long text may overflow, overlap, or become unreadable.
- Artwork made by different team members may not follow one brand system.
- Output packages may lack traceable input and asset checksums.

The product transforms structured listing data into a professional vertical poster and responsive social artwork through validation, deterministic text rendering, automatic layout, and configurable branding. Version 1.3 expands the browser flow into a complete local campaign workspace; the v1.4.0 release adds the full ten-story reference-informed module set, while cross-cutting issue #20 makes the generate-review-correct loop recoverable.

## 3. Product goals

### 3.1 Core goals

1. Let an agent enter structured facts once and generate a complete campaign package.
2. Preserve all important text exactly from the input; the system must not guess or rewrite listing facts.
3. Detect common field errors and missing assets before rendering.
4. Rotate, scale, and crop photographs of different dimensions without distortion.
5. Produce a stable, professional, legible, and configurable brand presentation.
6. Produce repeatable visuals from the same inputs, assets, fonts, and software version.
7. Support online sharing, printing, and archival output.
8. Preflight and generate an entire listing batch in one operation.
9. Let users choose a hero focal point without uploading a photograph.
10. Detect and review layout changes with automated metrics.
11. Provide a no-install browser workflow with live previews and local exports.
12. Provide equivalent English and Chinese user and product documentation.
13. Gate browser exports with configurable compliance preflight and preserve a traceable local review record.
14. Make brand templates and bilingual content portable, reusable, and selectively lockable.
15. Let an authorized user resolve one exact MLS number into a complete editable project while retaining field and image-rights provenance.

### 3.2 Non-goals

- Scraping listing pages, bypassing MLS/data-provider authorization, or storing provider credentials in the static application
- Automatically publishing to social-media or real-estate platforms
- Deciding whether an advertisement is legal or factually accurate
- Generating or altering real listing photographs
- Replacing a professional designer for highly customized campaigns
- Providing multi-user cloud collaboration or account management

## 4. Users

### 4.1 Primary users

- Real-estate sales representatives
- Real-estate brokers and agents
- Brokerage or team administrators
- Listing marketing coordinators

### 4.2 Secondary users

- Property managers
- Independent landlords
- Real-estate photography and marketing providers

## 5. Principal use cases

### Use case A: interactive listing creation

An agent runs the questionnaire, enters listing, image, and contact information, and saves YAML before generating PNG/PDF artwork.

### Use case B: batch template reuse

An administrator puts several YAML or JSON listings in one folder. The application validates every input before producing consistent full posters, social images, manifests, and a batch summary.

### Use case C: brand switching

Different teams replace colours, logo, fonts, tagline, and website while using the same rendering engine.

### Use case D: pre-publication validation

The user runs validation-only mode to check required fields, phone, email, asset paths, and list lengths before generating artwork.

### Use case E: hero focal-point selection

The user creates an offline HTML page, clicks the important point in the complete hero image, inspects the crop, and copies the resulting `hero_focal` YAML.

### Use case F: visual-regression review

A developer or marketing owner compares candidate artwork with an approved baseline, reviews difference metrics and an optional diff image, and confirms that the change is intentional.

### Use case G: browser-local campaign creation

An agent opens the hosted or locally served visual editor, enters complete listing, agent, brand, and bilingual content, manages the hero, interiors, floor plan, and dual logos, selects a compliance profile and focal point, and previews the complete poster plus four social layouts. All information remains in browser-local storage on the current device.

### Use case H: correct a generated poster without re-entry

An agent generates or exports a poster, notices an error, returns to the editor, restores the latest local draft when needed, corrects only the affected field, and regenerates the artwork without re-entering unaffected information or reselecting recoverable images.

### Use case I: generate from one authorized MLS number

An authorized agent selects a separately operated connector, enters one MLS number, receives one exact listing match, reviews mapped facts and permitted media, corrects any local exceptions, and exports only after the MLS, application, compliance, and image-rights review gates pass. `DEMO1234` supplies a fictional offline evaluation path.

## 6. User flow

1. Install Python dependencies or open the browser editor.
2. Use the questionnaire, edit YAML/JSON, or complete the browser form.
3. Enter listing and contact details.
4. Select the hero image, interior images, optional floor plan, and logo.
5. Validate the input.
6. Correct reported errors.
7. Select or adjust the hero focal point when necessary.
8. Generate the full PNG, optional PDF, social formats, and manifest.
9. If review finds an error, return to the saved editor state, correct it, and regenerate.
10. Run visual regression for important templates.
11. Complete factual, compliance, and visual review.
12. Publish or print the final artwork.

For the v2 candidate, steps 2–4 may begin with the explicit MLS-number flow. The editor must save a recovery snapshot before replacing current data, show refresh differences, and retain the complete imported project afterward.

The browser editor provides a complete no-install path for entering all core details; managing the hero, interiors, floor plan, and dual logos; setting the focal point; running validation aligned with Python rules; using compliance profiles and brand templates; previewing five formats in three language modes; and exporting PNG, browser-printed PDF, project JSON/YAML, a social ZIP, a manifest, or an approval package. Folder batch processing and pixel-level visual regression remain Python command-line workflows.

## 7. Functional requirements

### 7.1 Structured input

The system must support YAML and JSON with these field groups:

| Group | Required support |
|---|---|
| Listing identity | Status, address, unit, city, postal code, headline |
| Price | Rent or sale price, billing period, MLS® number |
| Property facts | Bedrooms, bathrooms, area, floor, exposure, parking, availability |
| Details | Lease terms, features, amenities, utilities, neighbourhood highlights |
| Agent | Name, title, telephone, email |
| Brand | Company or team name, tagline, website, logo |
| Images | Hero, interior images, floor plan, hero focal point |
| Theme | Background, paper, text, accent, and font settings |
| Canvas | Width, height, DPI |

### 7.2 Data validation

The system must:

- Check every required field.
- Validate a basic email-address format.
- Require 10 to 15 digits in telephone numbers.
- Validate positive bedroom, bathroom, and area values.
- Support area ranges such as `600-699`.
- Validate six-digit hexadecimal theme colours.
- Verify photograph, floor-plan, logo, and custom-font files.
- Require both hero-focal values to remain between `0` and `1`.
- Limit detail-list lengths to protect layout integrity.
- Stop rendering and return understandable errors when validation fails.

### 7.3 Image processing

The system must:

- Apply EXIF orientation.
- Use high-quality resampling.
- Preserve aspect ratios and never stretch images.
- Crop images to target regions.
- Support hero focal-point control.
- Support transparent brand logos.
- Accept up to four interior photographs.
- Display a hero, at least one interior photograph, and an optional floor plan.

### 7.4 Typography

The system must:

- Render all text deterministically.
- Reduce single-line font size to fit available width.
- Wrap text within available width and height.
- Safely truncate unusually long text.
- Preserve address, price, MLS®, telephone, and email content exactly.
- Avoid overlap and overflow for common content lengths.

### 7.5 Visual layout

The full poster must include:

- Sale or rental status
- Address and unit
- Price and billing period
- MLS® number
- Bedrooms, bathrooms, area, floor, exposure, and parking facts
- Availability
- Listing photography and floor-plan regions
- Cards for lease terms, features, amenities, and utilities
- Neighbourhood highlights
- Agent, company, phone, email, website, and brand-logo footer

The design may use the information architecture of a supplied reference but must not copy its layout or decoration pixel for pixel.

### 7.6 Brand configuration

The system must support:

- Seven core colours
- Regular, bold, and serif font paths
- Brand logo
- Company or team name
- Brand tagline and website
- Readable logo treatment on light and dark backgrounds

### 7.7 Output

The system must:

- Produce RGB PNG.
- Optionally produce a single-page PDF.
- Produce a manifest containing SHA-256 hashes for the input, resources, and outputs.
- Optionally produce 1080 × 1080, 1080 × 1350, 1080 × 1920, and 1200 × 630 social PNG files.
- Produce `batch-summary.json` for a folder batch.
- Create output directories automatically.
- Use stable, predictable filenames.
- Show every output path when the command finishes.

### 7.8 Entry points

The system must provide:

1. `generate_poster.py` to render existing YAML/JSON.
2. `scripts/new_listing.py` to collect answers, save YAML, and optionally render.
3. `python -m realtor_poster` as a standard module entry point.
4. `realtor-poster` as the installed command.
5. `scripts/focal_preview.py` and `realtor-poster-preview` for offline focal previews.
6. `scripts/visual_regression.py` and `realtor-poster-visual` for comparisons.
7. `scripts/serve_web.py` for the local browser editor.

### 7.9 Batch processing

The system must:

- Accept a folder containing YAML, YML, or JSON listings.
- Discover inputs recursively in stable filename order.
- Exclude hidden files and directories, generated manifests, and batch summaries.
- Validate every input before rendering so invalid data never leaves a partial batch.
- Generate collision-free output names for duplicate source names.
- Preserve an individual manifest for each listing and one summary for the batch.

### 7.10 Social-media layouts

The system must:

- Support `square`, `portrait`, `story`, and `landscape` presets.
- Support selecting every preset with `all`.
- Use the hero focal point for responsive cropping without distortion.
- Preserve status, address, unit, price, MLS®, core facts, agent, and contact details.
- Use the same brand colours, fonts, and logo as the full poster.
- Include social output hashes in the listing manifest.

### 7.11 Offline focal preview

The system must:

- Produce one HTML file with no network or external-resource requirement.
- Embed the full hero image, crop preview, and current poster thumbnail.
- Let the user click the complete image to choose normalized focal coordinates.
- Update the crop and three-decimal YAML immediately.
- Offer a copy action with a manual-copy fallback.
- Never transmit or upload listing images.

### 7.12 Visual regression

The system must:

- Require matching baseline and candidate dimensions.
- Calculate normalized mean absolute error from `0` to `1`.
- Calculate the changed-pixel proportion and maximum channel delta.
- Accept a caller-defined pass threshold.
- Optionally save an amplified diff image.
- Distinguish pass, threshold failure, and input error through exit status.

### 7.13 Browser-local visual editor

The system must:

- Require no account, server upload, or analytics code.
- Process photographs, logo, contact details, and project files in browser-local storage on the current device.
- Support drag-and-drop or file selection for a hero photo and transparent logo.
- Let users click the hero image and adjust horizontal and vertical focal coordinates.
- Preview full, square, portrait, story, and landscape layouts in real time.
- Download PNG, use browser printing for PDF, and export four social images in a ZIP.
- Save and reopen project JSON containing the form, theme, focal point, and selected images.
- Round-trip project JSON/YAML; reorder, replace, and remove interior photos; and preserve a floor plan and light/dark logos.
- Apply lease, sale, open-house, and just-listed compliance profiles, require agent title and licence/registration data when configured, and block export while required errors remain.
- Import, export, duplicate, and rename versioned brand templates carrying colours, typography, dual logos, a default layout, and selective field locks.
- Render English, Chinese, and bilingual content in all five formats, measuring and wrapping bilingual headlines and features independently.
- Compare with an approved project, record reviewer/date/notes, and export a complete approval ZIP.
- Build a local manifest covering language, profile, template, assets, outputs, and SHA-256 hashes.
- Preserve three to eight ordered property facts, paired plan media, up to three image-led spotlights, structured lease rows, and ordered rent-included costs.
- Preserve ordered tenant-paid costs and block export when the same cost is also marked as rent-included.
- Preserve up to twelve bilingual amenity items with reusable local icons and up to ten bilingual application requirements.
- Require explicit confirmation and a visible informational disclaimer before exporting artwork with active application requirements.
- Support photo, illustrated, initials, and no-portrait agent-profile modes with portrait focal controls, bilingual taglines, bilingual calls to action, and contact details.
- Render one original modular print hierarchy and priority-aware social summaries without copying the supplied reference artwork.
- Autosave the complete schema-driven project, including local images, to IndexedDB after a short debounce and immediately before export, reset, or project replacement.
- Offer the newest compatible draft with its project name and save time when the editor is reopened; restore its controls, local media, and scroll position only after the user chooses recovery.
- Isolate drafts by project identifier, detect a newer same-project draft from another tab, and pause saving until the user resolves the conflict.
- Confirm destructive reset/import/clear actions, show quota/private-mode/corruption/version failures instead of silently claiming success, and allow incompatible recovery data to be downloaded before deletion.
- Keep recovery data on-device with no upload, analytics, account, cloud synchronization, or cross-device promise; provide explicit portable-project download and local-draft clearing controls.
- Run from GitHub Pages or locally through `scripts/serve_web.py`.

### 7.14 Bilingual documentation

The system must provide:

- A complete Chinese README in `README.md`.
- A complete English README in `README.en.md`.
- A complete Chinese product requirements document in `PRD.md`.
- A complete English product requirements document in `PRD.en.md`.
- Direct language-switching links at the beginning of every document.
- The same current version and implemented feature scope in both languages.

### 7.15 Authorized MLS-number generation candidate

- The browser must make no MLS request until the user explicitly chooses an authorized connector and presses Generate.
- Production connector URLs must use HTTPS; loopback HTTP is allowed only for development. URLs must not contain credentials, query tokens, or fragments.
- The connector must return exactly one confirmed provider/board/MLS/status/address/unit match and an active supported listing status.
- Mapping must be deterministic and must not invent, translate, summarize, or rewrite listing claims.
- The v1.4 modules for lease details, rent inclusions, tenant-paid costs, amenities, application requirements, permitted images, and paired floor plans must map into the existing schema without removing agent, brand, theme, template, or compliance data.
- Every imported field and media record must retain provider, listing, retrieval, source-ID, rights, and local-override metadata. Media without explicit export permission must not enter artwork.
- Refresh must show differences and require confirmation before replacing imported or locally edited values.
- Imported-project exports must remain blocked until a user reviews facts, current status, disclosures, application requirements, and image rights. Editing imported data or media invalidates that review.
- The browser must accept no MLS password, API key, bearer token, or real provider fixture; authentication and provider secrets belong in the separately operated connector.

## 8. Non-functional requirements

### 8.1 Compatibility

- Python 3.9 or later
- macOS and common Linux environments
- Core dependencies limited to Pillow and PyYAML
- Current evergreen browsers for the visual editor

### 8.2 Performance

- An 1800 × 2400 sample poster should render in seconds on a typical personal computer.
- All four sample social formats should complete in one command.
- Image processing must avoid unbounded memory use.
- Font discovery and loading should be cached.
- The browser editor should update previews interactively after ordinary field changes.

### 8.3 Maintainability

- Validation, drawing helpers, full poster, social layouts, batch processing, previews, visual comparison, and command entry points must remain separated.
- Core functions should have clear descriptions and comments.
- A new theme should not require changes to the listing business-data structure.
- Sample data must not contain real personal contact details.
- English and Chinese documentation should be updated in the same release.

### 8.4 Traceability

- A manifest must record the generator version.
- It must record the input-file hash.
- It must record every used asset hash.
- It must record PNG/PDF output hashes.
- It must record all social PNG hashes.

### 8.5 Privacy

- Manual editing and the fictional demo must not upload listing data or images.
- The authorized connector may receive only the normalized MLS number after an explicit Generate action; no background lookup is permitted.
- It must not include analytics or tracking code.
- Portable project files must be created only through an explicit user action.
- Manifests must avoid unnecessary absolute local paths and personal data.

## 9. Acceptance criteria

The v1.4.0 release is acceptable when:

1. The sample YAML validates.
2. It produces an 1800 × 2400 RGB PNG.
3. It produces a one-page full PDF.
4. Address, price, MLS®, telephone, and email remain unchanged.
5. Hero, interior, floor-plan, and logo assets display correctly.
6. Six core property facts remain readable.
7. Four detail-card categories do not overlap.
8. Invalid email addresses and telephone numbers are rejected.
9. Missing images are reported before rendering.
10. The `600-699` area range validates and displays.
11. All twelve automated tests pass.
12. Both README documents provide complete commands from installation to output.
13. Folder input generates multiple listings and a batch summary in one operation.
14. An invalid batch does not leave partial generated results.
15. All four social layouts produce correctly sized RGB PNG files.
16. Social layouts preserve address, price, MLS®, and contact information.
17. Focal-preview HTML references no external images or scripts.
18. Repeated rendering of the same input is pixel-identical in one environment.
19. Visual regression passes identical images and rejects meaningful changes.
20. The manifest records version 1.4.0 and social-output SHA-256 hashes.
21. The browser editor has no upload or analytics code and processes data only in the current tab.
22. The browser editor previews and exports the full poster and four social sizes.
23. Project JSON preserves and reopens form, theme, focal, and selected images.
24. English and Chinese README and PRD files have direct language links and equivalent feature coverage.
25. Browser JSON/YAML projects preserve every listing field, interior order, floor plan, and dual logos.
26. Compliance profiles can require brokerage, agent title, licence/registration data, and contact details; errors block every publication export and the UI states that the tool does not grant legal approval.
27. Versioned brand templates carry colours, typography, dual logos, and a default layout; they support duplication, renaming, and selected-field locks while unlocked project overrides remain editable.
28. English, Chinese, and bilingual content each render in all five formats with suitable CJK font fallback and independently measured and wrapped bilingual headlines and features.
29. Approved status requires a reviewer and date; the approval package contains five proofs, source data, the review record, manifest, and SHA-256 catalog.
30. The property-facts ribbon supports bedrooms, bathrooms, area, floor, exposure, balcony, parking, and custom items; print shows up to eight, social formats show four priority facts, and hidden facts leave no gaps.
31. Furnished 3D and technical 2D plans can be added, replaced, removed, reordered, contained, fit to width, or cropped independently; low resolution produces a warning and the manifest records source pixels and SHA-256 hashes.
32. Up to three spotlights preserve a local image, separate English/Chinese title and detail, circle/rounded-square/rectangle mask, and focal point; empty items consume no poster space.
33. Lease details render up to nine rows selected from term, availability, deposit, payment, insurance, keys, pets, smoking, parking, and custom entries, with reorder, hidden, and not-applicable states; sale campaigns collapse the module.
34. Rent inclusions support standard and custom costs, ordering, removal, and an unknown/verify state; all content reaches projects, comparisons, manifests, and approval packages.
35. Tenant-paid costs support standard and custom categories, ordering, visibility, and bilingual labels; a duplicate active rent-included cost is a blocking preflight error, and sale campaigns collapse both cost modules.
36. Up to twelve bilingual amenities can be added, reordered, hidden, and rendered with reusable local icons; the print module preserves visible order and collapses without empty gaps when no items remain.
37. Up to ten application requirements can be added, reordered, or hidden; active requirements require an explicit user confirmation and visible informational disclaimer before export, and sale campaigns collapse the module.
38. The agent footer supports photo, illustrated, initials, and no-portrait modes, safe fallback when an image is absent, portrait focal controls, bilingual tagline/CTA copy, credentials, brokerage, telephone, email, website, and logo.
39. The 1800 × 2400 print poster composes Stories 1–9 as one original modular hierarchy with no overlap; square, portrait, story, and landscape formats preserve the essential listing identity and compact priority summaries.
40. Generating PNG/PDF/social ZIP/manifest/approval ZIP never clears the editable project, and every export begins after a local recovery snapshot request.
41. Reopening the editor offers the newest compatible IndexedDB draft and can restore every schema field, embedded hero/interior/floor-plan/logo/spotlight/portrait image, project identifier, and scroll position.
42. Reset and project/template/compliance imports require confirmation and a pre-action recovery snapshot; users can also download a portable project and explicitly clear local drafts.
43. Storage quota, restricted browser mode, corrupt/incompatible recovery data, and cross-tab conflicts produce visible bilingual warnings rather than silent data loss.
44. Automated recovery tests cover full image-bearing snapshots, project isolation, newest-record selection, schema compatibility, and generation/export/reset recovery hooks.
45. `DEMO1234` generates a complete fictional v1.4 project without a network request or real listing data.
46. An authorized connector accepts one normalized MLS number and rejects insecure/token-bearing URLs, non-unique or inexact matches, unsupported/withdrawn statuses, oversized or malformed responses, and provider errors with bilingual messages.
47. Imported listing facts, all supported structured modules, permitted images, and floor plans are deterministically mapped while saved agent, brand, theme, template, and compliance settings remain intact.
48. Media lacking explicit export rights is excluded; projects and manifests retain source IDs, dimensions, ordering, rights basis, confirmation time, and local media overrides.
49. Project JSON/YAML round-trips retain the MLS source record, per-field provenance, retrieval/import times, refresh count, blocked-media record, and user overrides.
50. Import and refresh use Issue #20 snapshots; refresh shows changed fields and requires confirmation before replacement, and failure preserves the current editor state.
51. Publication export is blocked until both application-requirement confirmation and explicit MLS fact/status/disclosure/image-rights review pass; editing an imported field or image invalidates MLS review.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Incorrect listing facts | Strong validation plus required human review |
| Extreme image proportions | Aspect-preserving crop and user-controlled focal point |
| Text overflow | Font reduction, wrapping, and list limits |
| Cross-system font differences | Explicit font paths and resource hashes |
| Unreadable logo on a dark background | Contrasting logo plate |
| PDF/PNG visual mismatch | Export PDF from the same deterministic canvas and render-check the page |
| Regulatory non-compliance | README requires final agent and brokerage review |
| Fictional sample treated as a real listing | Sample artwork and data are clearly marked as fictional |
| Sensitive listing data uploaded accidentally | Browser-local processing, no upload endpoints, and no analytics |
| Editor input lost after generation, reload, or correction | Debounced IndexedDB autosave, pre-action snapshots, bilingual restore UI, and portable project download |
| Newer work overwritten by another browser tab | Per-project identifiers, BroadcastChannel conflict detection, and paused autosave until user resolution |
| Browser storage unavailable or full | Explicit bilingual warning and manual portable-project backup; never claim that a failed save succeeded |
| English and Chinese documentation drifting | Same-release version updates, direct links, and scope checks |
| Unauthorized or stale listing data | Explicit provider selection, exact-match contract, active-status validation, retrieval timestamps, stale warnings, and mandatory human review |
| Unlicensed provider images | Default-deny media rights, blocked-media records, explicit rights review, and source metadata in manifests |
| Connector secrets exposed in static hosting | No browser token fields; secure session authentication and all provider credentials remain in the separately operated connector |

## 11. Roadmap

### Completed in 1.2

- Folder-wide YAML, YML, and JSON processing after all-input validation
- Four responsive social-media formats
- Self-contained focal-point and layout preview
- Pixel determinism, social-dimension, batch, and visual-difference tests
- Browser-local editor, five live previews, portable projects, and ZIP export
- Complete English and Chinese README and PRD documentation

### Completed in 1.3

- Complete browser-local campaign editor with a versioned project schema
- Compliance profiles with blocking export preflight
- Portable brand templates and selective field locks
- English, Chinese, and bilingual artwork in five formats
- Baseline comparison, review records, and checksummed approval packages

### Completed in 1.4 (Stories 1–10)

- Complete reorderable property-facts ribbon with social priorities
- Paired furnished 3D and technical 2D floor-plan presentation
- Up to three local image-led feature spotlights
- Structured bilingual lease details
- Rent inclusions with locally bundled MIT icons
- Tenant-paid costs with blocking included/paid conflict detection
- Ordered reusable-icon amenity list with clean empty-state collapse
- Application-requirements checklist with confirmation and disclaimer gates
- Branded agent profile and bilingual CTA footer with four portrait modes
- Original modular print and adaptive social layouts integrating all ten stories
- Cross-cutting issue #20: schema-driven on-device autosave and recovery for all v1.4 modules without renumbering Stories 1–10

### 2.0 candidates

- Issue #22 authorized MLS-number import foundation with fictional offline fixture, exact-match contract, provenance, rights filtering, recovery, refresh comparison, and review gates
- Optional desktop application
- Shared brokerage-team configurations
- External listing-data integration only after explicit authorization
- Optional QR-code layouts

## 12. Compliance principles

- Do not generate, guess, or exaggerate listing facts.
- Do not publish sample data as a real advertisement.
- Do not store account passwords or access tokens.
- Do not place unnecessary personal data in manifests.
- Require review of every final advertisement by the responsible agent or brokerage.

Copyright © 2026 **Daniel Xu**. This document and project are released under the [MIT License](LICENSE).
