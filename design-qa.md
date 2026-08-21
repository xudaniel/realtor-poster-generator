# Design QA — v1.4 Stories 1–5

## Evidence

- Source visual truth: `/var/folders/b7/57f0jdc92vxfxymp3y3mpz7c0000gn/T/codex-clipboard-4af1ec7d-503c-4fc8-9f64-cda5f0abbaf5.png`
- Initial browser capture: `design-qa-implementation.png`
- Final browser capture: `design-qa-implementation-final.png`
- Final focused poster capture: `design-qa-poster-final.png`
- Final side-by-side comparison: `design-qa-poster-comparison-final.png`
- Browser viewport: 1800 × 1400 CSS px
- Rendered poster canvas: 1800 × 2400 internal pixels, displayed at approximately 776 × 1035 CSS px
- Source pixels: 1002 × 1080
- Initial and final browser-capture pixels: 1800 × 1310
- Focused implementation pixels: 776 × 1035
- Density normalization: the 776 × 1035 focused implementation was proportionally resized to 810 × 1080 beside the unchanged 1002 × 1080 source; no stretching was used
- State: print-poster preview with hero, two ordered interior images, furnished-plan sample, technical-plan sample, one circular spotlight, nine lease rows, and five rent inclusions

The source is a photographed partial poster rather than a straight-on complete artboard. The comparison therefore evaluates information hierarchy, module balance, masks, readability, and reflow—not pixel geometry, exact branding, or the source's portrait, illustration, icons, colours, and copy.

## Full-view comparison

The final implementation preserves the useful hierarchy visible in the source: a complete icon-led facts ribbon, paired plan region, image-led spotlight, structured lease list, and an icon-led rent-inclusions panel. The implementation uses the project's original dark green, warm gold, editorial type, rounded modules, and user-supplied sample assets. No source portrait, plan, logo, icon drawing, colour system, wording, or geometry was copied.

The final browser view shows clear parent-child grouping, consistent dark section headers, aligned plan cards, stable margins, and no overlap with the agent footer. Empty modules are omitted by the renderer.

## Focused-region comparison

The final side-by-side file focuses on the actual poster rather than the surrounding editor. It confirms:

- seven fact cells align on one ribbon without clipping;
- 3D and 2D plan images remain aspect-correct and visually balanced;
- the spotlight image uses the selected circular mask and leaves no layout gap;
- nine literal lease rows remain within their panel;
- five inclusion icons and labels remain grouped and aligned;
- the footer begins below all modules with a consistent safe gap.

## Required fidelity surfaces

### Fonts and typography

The implementation intentionally preserves the product's Georgia editorial display and Arial/PingFang-compatible body stack instead of copying the source. The final iteration increases plan captions to 16 px, spotlight title/detail to 17/13 px, lease rows to 14 px, and inclusion labels to 13 px on the 1800 × 2400 canvas. Headline, module headers, facts, and footer maintain a clear hierarchy with deterministic wrapping.

### Spacing and layout rhythm

The facts ribbon, section headers, paired plans, spotlight, details grid, and footer share aligned outer margins. Plan and detail regions were enlarged after the first comparison. The final layout has no visible collision, cropped module, empty plan cell, or footer overlap.

### Colours and visual tokens

The poster consistently uses the existing configurable ink, paper, and accent tokens. Contrast remains strong for the hero overlay, facts ribbon, section bars, body panels, and footer. The colour system is intentionally original.

### Image quality and asset fidelity

All listing images are local project samples and keep their aspect ratio. Plan rendering supports contain, fit-width, and crop; the tested state uses contain for both plans. Icons are local Tabler assets under the MIT licence, not handcrafted approximations. No source portrait, floor plan, or logo was reused.

### Copy and content

Address, price, MLS®, fact values, plan captions, lease conditions, rent inclusions, and contact details come directly from structured project data. English and Chinese fields remain separate. The system does not translate or infer claims.

## Interaction and runtime verification

- Tested hero upload, two independent floor-plan uploads, one spotlight upload, and multiple interior-image upload.
- Verified plan and spotlight pixel dimensions are recorded after selection.
- Verified the complete preflight passes after required media is present.
- Verified accessible canvas description lists all seven facts, both plans, and the spotlight.
- Verified the browser console contains no errors or warnings in the final state.
- Automated verification: 12 Python tests and the expanded browser-core test suite pass.

## Comparison history

### Iteration 1

- Finding: P2 — plan captions, spotlight copy, lease rows, and rent-inclusion labels were too small in the phone-sized preview relative to the source's dense information panels.
- Fix: reduced the hero region from 760 to 650 canvas pixels; moved the information modules upward; increased the plan region from 300 to 360 pixels, spotlight region from 150 to 170 pixels, and details region from 255 to 310 pixels; increased module text sizes.
- Post-fix evidence: `design-qa-implementation-final.png` and `design-qa-poster-comparison-final.png` show larger plans and materially more readable detail modules with no new overlap.

### Final pass

No actionable P0, P1, or P2 findings remain for Stories 1–5. Differences involving tenant-paid costs, amenities, application requirements, and the portrait/CTA footer are expected because they belong to v1.4 Stories 6–10 and are explicitly outside this phase.

## Follow-up polish

- P3: add reviewed bilingual spotlight detail copy in the default demonstration project so the callout shows a richer second line during demos.
- P3: complete Stories 6–10 before declaring the full v1.4.0 modular template finished.

final result: passed
