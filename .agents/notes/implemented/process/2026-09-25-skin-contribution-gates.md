# Agent Note: Skin contribution gates at intake

Status: implemented

## Problem

This repository receives skin submissions from outside contributors, and the
2026-09-25 maintenance round reviewed sixteen such pull requests at once. The CI
gate (`pnpm skin-center:check` plus `pnpm test`) validates the v2 manifest
contract and runs every stylesheet through the safety pipeline, but it says
nothing about whether the artwork is licensed, whether the "user-visible change
evidence" section was actually filled with evidence, or whether the result looks
acceptable. Those three questions decide whether a skin may be listed, and none
of them is mechanically checkable.

Reviewing that batch without a written rule produced three recurring failure
modes: evidence hosted on a branch that predates the change, a checklist box
ticked whose claim the repository contradicts, and skins carrying third-party
character art with no licensing record anywhere in the tree.

## Decision

Intake decisions for skin pull requests apply three gates, all three required
before merge. The gate definitions and their rationale live in the maintenance
workflow; what this note fixes is how this repository records the outcome.

- **Evidence must be reproducible against the pull request's own code.** A
  screenshot or video counts only when it is hosted on a branch this pull request
  actually changes, and when the change it claims to prove is visible in the
  frame. A byte-comparison of the evidence branch's asset files against the base
  is the check that catches the common case: evidence branches whose CSS is
  byte-identical to the base prove nothing, because they depict the code before
  the change. Screenshots of an empty-session hero page cannot demonstrate a
  right-column, session-header, code-block, or narrow-viewport fix.
- **Licensing is recorded in the repository, not in the pull request text.** The
  skin manifest's optional `license`, `licenseUrl`, and `attribution` fields,
  or a `LICENSE`/`NOTICE` file in the skin directory, must carry the source,
  the rights holder, and the license name. Skins bundling third-party character
  artwork require an explicit statement that the artwork is excluded from the
  project's own grant, that it is unofficial and non-commercial, and that rights
  remain with the original holder. A ticked checklist box is not evidence; the
  tree is.
- **Aesthetics are judged on the rendered asset, not the description.** The
  verdict is reached by viewing the actual `preview/{light,dark}` renders, and
  is recorded with file- and region-level reasons.

A closed-but-wrong means no listing: the pull request stays open with the missing
item named and the evidence quoted, rather than merged with a follow-up promise.

## Alternatives considered

- **Trust the submission checklist.** Rejected. Across the reviewed batch the
  checklist was ticked for README and licensing on skins where neither existed:
  `skins/miku/` has no README at all and no licensing field, and `skins/observatory/`
  shipped a manifest and two README files describing an hour-scale feature the same
  pull request had just deleted.
- **Let CI cover licensing by extending the catalog check.** Rejected as the
  primary mechanism. The catalog check is a manifest-contract validator; encoding
  a licensing policy into it would make an asset directory unbuildable for a
  judgment that is editorial and needs a human or model reader. The check stays
  structural; the licensing review stays an intake gate.
- **Require a LICENSE file in every skin directory.** Rejected as over-broad.
  Only 15 of the 42 catalog skins carry one, and the manifest's licensing fields
  are the declared home for this fact. Requiring both would invent a second,
  partially redundant convention.
- **Treat a high-resolution screenshot as sufficient evidence.** Rejected. Size
  and reachability do not establish provenance; the evidence branch used by three
  pull requests served valid 1440x900 JPEGs whose underlying stylesheet was
  byte-identical to the base.

## Consequences

- Pull requests that pass CI can still be blocked at intake. Contributors learn
  the specific missing item instead of a generic rejection, and the blocking
  reason is public on the pull request.
- Evidence hosted outside the pull request's own branch is treated as absent,
  which costs contributors a re-shoot even when the underlying fix is correct.
  That is the intended trade: provenance is not inferable after the fact.
- The three gates are documented here rather than in the pull request template,
  because the template can only state a requirement; this note records why a
  ticked box is not accepted as proof of one.
- Verification: at the 2026-09-25 round the gates were decisive — five skins were
  merged (three new, two adaptations) and six were held with file-level reasons,
  including one genuine functional regression caught by reading the stylesheet
  rather than the description (`min-height: 100dvh` on `[data-dsh-frame]`
  overriding the skin's own `height: calc(100vh - 56px) !important`).
- Verification: at the 2026-09-26 round the three gates were again decisive —
  three skins were merged (two new, one adaptation), and three were held: two on
  the frame-height convention now recorded in
  [the frame height note](2026-09-26-frame-height-belongs-to-the-host.md), and
  one on a stale generated registry plus two documentation defects that the
  licensing and evidence gates do not cover.
