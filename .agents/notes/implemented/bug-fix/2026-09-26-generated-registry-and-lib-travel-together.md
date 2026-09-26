# Agent Note: Generated registry and `lib/` must be committed together

Status: implemented

## Problem

The verdandi submission (`feat/skin-verdandi`) failed CI at the step
"Committed lib matches the sources", which runs `git diff --exit-code -- lib`
after `pnpm build`. Everything after that step — `skin-hooks:check`, the
catalog check, typecheck and the test suite — was skipped, so a single stale
generated file hid the state of every other gate.

Reproduced locally on the pull request head, three different sha256 values
describe the same skin manifest:

| Location | `manifestSha256` for verdandi |
| --- | --- |
| `src/reviewed-hooks.generated.ts` | `c7ffe2eb...` |
| `lib/index.js` | `a440b1af...` |
| `skins/verdandi/skin.json` (actual) | `cbf22a96...` |

`node scripts/skin-hooks-registry.mjs --check` prints "generated registry is
stale". The contributor had edited `skin.json` and `lib/index.js` while
leaving the generator's output untouched. The two are separate artifacts of
separate commands — `node scripts/skin-hooks-registry.mjs` writes
`src/reviewed-hooks.generated.ts` and nothing else; `pnpm build` is what
produces `lib/` — so running either one alone still fails the gate.

This is the second time in two rounds that a generated artifact was the first
failure a contributor hit. The failure mode is specific to this repository: three
different files must agree on a content hash, two of them are generated, and one
of the generators does not run as part of the build. A contributor reasonably
reads "skin.json is the manifest" and edits it, and the resulting error message
("Committed lib matches the sources") names only the second of the two artifacts.

## Decision

**The registry and `lib/` are regenerated together and committed in the same
commit as the source they derive from.** After editing `skin.json`,
`hooks.mjs`, or a skin's `skin.css`, the contributor runs both:

```sh
node scripts/skin-hooks-registry.mjs   # writes src/reviewed-hooks.generated.ts
pnpm build                             # writes lib/
```

and commits `src/reviewed-hooks.generated.ts`, `lib/`, and the skin source
together. Running only the registry script updates the hash registry but leaves
`lib/` stale, and running only the build leaves the registry stale; the CI job
checks both, so either omission is a red build.

The generated registry is not hand-edited. It is a byte-exact function of every
`skins/*/skin.json` and of each manifest's `facets.client.entry` file, so a
hand edit is drift by construction and the next generation reverts it.

## Alternatives considered

- **Fold registry generation into `pnpm build` so one command suffices.**
  Rejected for this round. It changes the build graph shared by every package in
  the repository to fix an intake papercut, and the registry is deliberately a
  standalone, reviewable artifact: its diff is what a reviewer reads to see that
  a manifest hash moved on purpose rather than by accident.
- **Report the registry drift as its own CI step, before the `lib/` diff.**
  Rejected as the primary fix, though it would have made the two failures
  distinguishable. Both artifacts are produced by the same local procedure and
  need the same commit, so naming only one still leaves the contributor to
  discover the other from a second red run.
- **Accept the stale generated file and regenerate it during the maintenance
  merge.** Rejected. The hash registry is a security-relevant input — it is what
  lets a legacy install be recognized without a provenance manifest — so it is
  committed from the contributor's own tree under review, not authored by the
  maintainer after the fact.
- **Drop `lib/` from the repository and build it on install.** Rejected. Two
  packages in this family commit their build output on purpose, and the same rule
  is stated for the parent repository's packages.

## Consequences

- A skin change touches at least three files, two of them generated. The
  contributor learns the generation chain from the CI failure named after only
  one of them, so a reviewer approving a skin edit checks the generated diff as
  part of intake rather than treating it as noise.
- The generated registry appears in skin pull requests as a large, mechanical
  diff. That is the intended shape: it makes a manifest-hash change reviewable,
  and the diff is empty when only non-manifest files moved.
- Verification: on the 2026-09-26 round, `pnpm skin-hooks:check`
  (`node scripts/skin-hooks-registry.mjs --check`) failed at the verdandi head
  with the three hashes above and passed on the six other skin pull requests; the
  two-script procedure above leaves `git diff --exit-code -- lib` and
  `pnpm skin-hooks:check` both clean on the six merged skins.
