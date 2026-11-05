# Agent Note: The 2026-11-05 skin intake round

Status: implemented

## Problem

Ten open PRs (#68, #77, #80, #83, #84, #85, #93, #97, #99, and #101) were reviewed against all three content gates—user-visible evidence, third-party character copyright, and multimodal aesthetic evaluation. Three recurring failure patterns defined the round:

- **Evidence chains disconnected from the actual change.** Submissions continued to supply byte-identical captures, consecutive captures taken in the same state, or captures from a stale or shifted view state that prevented verifying whether previously reported defects were fixed.
- **Repeated copyright declaration omissions on character skins from the same author.** Required provenance and liability statements were omitted across multiple character-art submissions rather than resolved once across the author's open PRs.
- **Aesthetic rejections surfacing after mechanical gates passed.** Skins that cleared structural validation and numeric contrast checks still failed visual inspection due to washed-out artwork, translucent surface bleed-through, or foreign overlays in the capture frame.

## Decision

**Merged into `main`:**

- **#68 (`skins/model-dorm` floating-surface token adjustment)**: Converted from the prior `CHANGES_REQUESTED` review to `APPROVED` and merged into `main`. It provided the only closed evidence chain in this round: four `512x376` close-up captures from an identical camera position (floating surface bounded at `112-400,60-280`), a clear and directionally accurate comparison between the official default and the skin (light mode top edge shifting from near `#ECEDEF` to near `#B3A197` warm brown; dark mode shifting from near `#3A3B3D` to near `#BAA091` warm white), and a `skin.css` sha256 in `evidence/README` matching the `HEAD` file.

**Returned with required changes:**

- **#101 (`equation-sea`)**: Primary CI fails at `tests/builtin-skins.spec.ts:114` because the primary action button contrast falls below the `3:1` minimum in both modes—light mode `#3a2a1c` on `#9c3b2a` measures `2.01:1` and dark mode `#e9eef6` on `#8fb6ff` measures `1.75:1`—caused by `skin.css` pairing `label-primary-foreground` (tuned for the paper surface) with `var(--eq-accent)` fills. The submission also omits two required copyright declarations: asset source category and liability assumption.
- **#84 (`pixel-whale`)**: Passes the evidence gate, but the copyright declaration omits four required items (asset source category, character/work/rightsholder attribution, liability assumption, and personal non-commercial use only), and both the PR description and README declare `1680x1000` while the actual image dimensions are `2048x1152`.
- **#99 (`verdandi` `1.0.4`)**: Passes all three content gates, but `main` has already carried version `1.0.4` since `2026-10-09`. Replacing content without advancing the version causes `compareVersions(installed, latest) < 0` at `src/bulk.ts:137` to return `0`, so users with `1.0.4` installed never receive the update; the manifest version must be bumped to `1.0.5`.
- **#97 and #93**: Remain in their previous returned state with prior review items unresolved.

**Vetoed at the aesthetic gate despite clearing mechanical checks:**

- **#77 (`whale-watercolour`)**: The creamy-white scrim introduced this round obscures the illustration under a milky fog that erases local boundaries, and the evidence captures switched to the conversation state, making it impossible to verify whether the landing-page composition defect cited in the previous round was resolved.
- **#80 (`md3`)**: The overall design is acceptable for listing, but the settings floating surface and composer are insufficiently opaque—allowing underlying text to bleed through—and `conversation-light` includes a third-party floating window overlapping the logo, requiring clean recaptures and higher surface opacity.

**Awaiting author action:**

- **#83 (`diy-journal` size reduction)**: Passes all three gates and holds `APPROVED` status, blocked only because its branch is behind `main` and awaits author synchronization (contributor branches are not updated on the author's behalf in this round).
- **#85 (`diy-journal` delegated skin)**: Remains blocked by merge conflicts and three unanswered technical questions.

## Alternatives considered

- **Accepting #101 on green workflow status alone.** Rejected: primary CI fails at `tests/builtin-skins.spec.ts:114` with primary button contrast at `2.01:1` (light) and `1.75:1` (dark) against the `3:1` threshold, and the copyright statement still lacks asset source category and liability assumption.
- **Accepting #77's scrim adjustment because measured contrast numbers improved.** Rejected: numeric contrast gains cannot compensate for a full-canvas milky scrim that destroys illustration legibility, nor can conversation-view screenshots substitute for verifying the previously flagged landing-page framing defect.
- **Updating #83's branch with `main` on the contributor's behalf.** Rejected: per explicit round instruction, maintainer review does not push synchronization commits to contributor branches; the author must sync the branch before merge.

## Consequences

- Only one PR (#68) merges in this round; #83 remains `APPROVED` and ready to merge as soon as the author synchronizes the branch with `main`.
- Mechanical gates (schema validation, contrast assertions, and hash checks) are necessary preconditions rather than sufficient criteria for intake: multimodal aesthetic review acts as the final filter after mechanical checks pass, catching over-scrimming (#77), surface bleed-through, and capture contamination (#80).
- Reviewing #99 surfaced a concrete distribution defect in `src/bulk.ts:137`: because bulk update detection relies on `compareVersions(installed, latest) < 0`, any update PR that reuses the version already on `main` (`1.0.4`) will silently fail to deliver to installed users unless bumped to `1.0.5`.
