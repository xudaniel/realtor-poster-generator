# Design QA — v1.4.3 structured Beds + room/den, authorized MLS import, and complete v1.4 Stories 1–10

## Scope

- Reference: `/var/folders/b7/57f0jdc92vxfxymp3y3mpz7c0000gn/T/codex-clipboard-4af1ec7d-503c-4fc8-9f64-cda5f0abbaf5.png` (1002 × 1080)
- Implementation: local browser editor at `http://127.0.0.1:8765/`
- Browser identifier: `1.4.3`
- Project schema: 6
- Print artwork: 1800 × 2400 canvas, displayed at 776 × 1035 during the final desktop pass
- Prior full-composition visual evidence:
  - `design-qa-v1.4-implementation-final.png`
  - `design-qa-v1.4-poster-final.png`
  - `design-qa-v1.4-comparison-final.png`
- v1.4.3 feature evidence: bedroom display/accessibility unit tests, schema migration and MLS provenance tests, Python print/social tests, and five-format layout-contract goldens

## Product-design interpretation

The reference is used as an information-hierarchy target, not as an asset or geometry template. The implementation preserves the useful hierarchy—facts, paired plans, feature callout, lease/cost modules, amenities, application requirements, and agent CTA—while retaining the project's original dark-green, warm-paper, and gold system. No source illustration, icon, logo, wording, or photographic asset was copied.

## Implemented story coverage

1. Three to eight ordered property facts with accessible labels and social priorities.
2. Independent furnished 3D and technical 2D plan slots with crop/focal metadata.
3. Up to three image-led feature spotlights and three mask styles.
4. Structured lease-detail rows with active, not-applicable, hidden, and sale-collapse states.
5. Ordered rent inclusions using locally bundled MIT-licensed Tabler icons.
6. Ordered tenant-paid costs with blocking included/paid conflict detection.
7. Up to twelve ordered bilingual amenities with reusable local icons.
8. Up to ten ordered bilingual application requirements with confirmation and disclaimer gates.
9. Agent profile and bilingual CTA footer with photo, illustrated, initials, and no-portrait modes.
10. One original modular print composition plus adaptive social summaries.

Cross-cutting issue #20 also preserves the complete schema-driven project and local media in IndexedDB.

Issue #22 adds a discoverable **00 Authorized MLS import / 获授权 MLS 导入** section before manual listing fields. It preserves the existing editing hierarchy while making the connector boundary, provider context, one-number lookup, completeness, image rights, and human review visible as one contained workflow.

Issue #27 adds separate **Main bedrooms** and **Additional room / den** controls without renumbering Stories 1–10. Compound facts use the safe labels **Beds + room/den** and **卧室 + 额外房间/书房**, so `2 + 1` remains two distinct facts rather than becoming three bedrooms.

## Mandatory comparison pass

### Typography

- The reference uses dense all-caps labels and compressed utility sections. The implementation uses the existing serif display face for the listing identity and a compact sans-serif system for modules, maintaining a clearer original brand distinction.
- Initial QA found the lower module copy too small at the editor preview scale. Checklist copy was increased to a fitted 13 px source size and the full poster was recaptured.
- Final pass: headings, values, captions, and footer contacts remain legible with no truncation or overlap.

### Spacing and layout

- The reference's top facts, central plan zone, bottom information grid, and agent footer are all represented in the same reading order without copying its column dimensions.
- Two floor plans retain their aspect ratios and remain independently framed. Empty spotlights collapse instead of leaving placeholder cards.
- Lease details, rent inclusions, and tenant-paid costs share one row; amenities and application requirements share the next. The footer remains inside the canvas and does not collide with the disclosure line.

### Colours and surfaces

- The original dark-green/gold/warm-paper tokens provide strong hierarchy and avoid the reference's beige/charcoal replication.
- Module bars, gold rules, circular icon wells, and the CTA panel use consistent contrast. No decorative gradients, generic card shadows, or unrelated rounded surfaces were added.

### Image and icon fidelity

- The reference's floor-plan intent is represented with real local raster assets supplied by the repository, not CSS drawings or fake SVG illustrations.
- Tabler SVG icons are bundled locally under MIT terms and share consistent stroke weight and optical sizing.
- Hero, two plan images, two gallery images, and one spotlight were uploaded through visible file controls during QA. Recovery after reload restored every tested media slot.

### Copy and state behaviour

- The accessible artwork description reported seven property facts, two plans, one spotlight, two tenant-paid costs, seven amenities, four application requirements, and Daniel Xu's agent contact.
- Bedroom accessible copy reports the two meanings separately—for example, `2 bedrooms + 1 additional room/den` / `2 间卧室 + 1 个额外房间/书房`—and omits additional-room wording when the additional count is zero.
- Application confirmation was required before the final zero-error preflight. Active included/tenant-paid duplicates are blocking errors.
- Photo upload and focal controls are present; missing-photo validation falls back safely to initials or asks for reselection rather than rendering broken artwork.

### Responsive resilience

- Desktop: 1800 × 1400 viewport, two-column editor/preview layout, 776 × 1035 displayed poster.
- Tablet: 900 × 1000 viewport, one 860 px editor column, 540 px displayed poster, no horizontal overflow.
- Mobile: 420 × 900 viewport, one 398 px editor column, 332 px displayed poster, no horizontal overflow.
- Portrait preset rendered at 1080 × 1350; story preset rendered at 1080 × 1920; print was restored to 1800 × 2400 after the check.

### Accessibility

- Controls use native labels, buttons, checkboxes, selects, and file inputs; application confirmation has an explicit label.
- The canvas has an accessible description containing structured listing and agent information.
- Keyboard-visible controls, semantic status text, high-contrast module headings, and mobile-width tap targets were retained.

## Recovery verification

- Reload exposed the bilingual recovery panel and paused autosave until the user chose an action.
- Restore recovered the hero, two gallery images, two plans, the spotlight, project fields, and the checked application confirmation.
- Browser-local recovery remained isolated from cloud upload and analytics.

## v1.4.1 connector verification

- The local editor rendered at 1440 × 1400 with the v1.4.1 identifier, bilingual authorized-import heading, existing listing controls, and the unchanged poster preview without overlap or horizontal overflow.
- A live synthetic connector on `127.0.0.1:8766` returned provider/board context and one normalized synthetic record to the locally served editor origin on `127.0.0.1:8765`.
- Response headers included `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`, and the exact local `Access-Control-Allow-Origin`.
- Connector logs contained only method, fixed route, and status; the submitted listing number, request body, authorization, and response data were absent.
- Core tests confirmed that unresolved image rights and missing human review block export, user edits become field-level overrides, same-listing refresh produces a diff, and manifest provenance omits embedded provider image data.

## v1.4.3 bedroom integrity verification

- The editor exposes independent native number inputs: **Main bedrooms** with `min="0"`, `max="20"`, `step="1"`; and **Additional room / den** with `min="0"`, `max="10"`, `step="1"`.
- The derived preview updates from the same structured project state used by rendering. A zero additional count produces `2`, while a positive count produces the canonical `2 + 1`; no code path adds the values.
- The print renderer and all four social renderers use the shared expression. Five-format layout goldens assert 1800 × 2400, 1080 × 1080, 1080 × 1350, 1080 × 1920, and 1200 × 630 output with the compound value and safe English/Chinese labels intact.
- Main-bedroom validation accepts only whole numbers from `0–20`; additional-room/den validation accepts only whole numbers from `0–10`. Invalid preflight entries target and focus the corresponding input.
- Schema 6 stores both counts. JSON/YAML interchange, IndexedDB recovery, comparisons, manifests, and approval packages retain them separately. Schema-5 single values migrate with `0` additional rooms, and explicit compound values split without changing their display.
- Authorized MLS mapping accepts a separate additional count or explicit compound value only when supplied by the provider. Missing optional data remains missing, while an explicit compound source remains in field-level provenance.
- Editing either imported count records `user-overridden`, clears the previous review confirmation and review time, and restores the export-blocking human-review action.
- Layout and control rules retain the existing single-column mobile reflow, visible focus, and 200% zoom support; long safe labels fit through the same measured/fitted fact-label paths used by the layout goldens.

## Release-hardening verification

- Destructive imports and reset stop when the required pre-action recovery snapshot fails.
- The print composition preserves all four feature statements and renders the first ordered interior photo with the available floor plans.
- Nine lease rows use multiline wrapping, and maximum twelve-item responsibility grids keep icons, labels, and verify states separated.
- Provenance output records hidden property facts with original order, shared source path, and resolved value.
- Bedroom provenance records primary, additional, and canonical display values without a derived legal-bedroom total.
- Automated IndexedDB coverage performs save, read, list, latest, delete, clear, and simulated write-failure operations.

## Final result

- Preflight: 0 errors, 0 warnings.
- Console: 0 error/warn entries after the final interaction sequence.
- Automated checks: browser core tests, browser recovery tests, minimum/typical/maximum/bilingual layout-contract goldens, Python unit tests, JavaScript syntax checks, and whitespace validation all pass.
- Remaining P0/P1/P2 design findings: none.

The complete Stories 1–10 implementation, recovery foundation, authorized Issue #22 import, actionable Issue #25 preflight, and structured Issue #27 bedroom-plus-den workflow are ready for the v1.4.3 publication workflow.
