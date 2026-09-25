# Agent Note: The 0.1.7 composer and process-row adaptations

Status: implemented

## Problem

0.1.7 changed two shell regions that the Skin Center's rendering layer and the
blue-fantasy patch layer both reach into, and both layers were written against
the previous shape.

The composer row: 0.1.7 added a context meter (`ContextMeter`, a ring plus a
percentage that opens a breakdown panel) and seated it **beside** the
`conversation.composer.dock` slot host instead of inside it. The shared
accessory contract in `src/client/runtime/shell-rendering.ts` paints the docks'
occupants, but it reached only the slot host's direct children. Because that host
is `display: contents`, its children are laid out as items of the surrounding
dock row — so the meter shared a row with the statistics pill while staying bare:
one line, two looks. The defect is skin-independent, since the accessory rule is
the generic `[data-dsh-skin]` adapter every skin rides.

The process rows: 0.1.7 split the conversation's "process" display into a
per-step row (`[data-step-process]`) and reduced the turn-process row to a
non-interactive elapsed-time bar (always `disabled`, showing only the duration).
blue-fantasy's patch layer predated both, leaving the new step title line as bare
text straight over the illustration while its sibling rows all carried the
translucent readability layer, and letting the skin's blanket `button:disabled`
rule outrank the shell's own `cursor: default` on the info bar — so the bar
rendered as a greyed-out control with a not-allowed cursor.

## Decision

**The accessory contract gains an adjacent-sibling head.** The rule that paints
task and statistics docks now also matches
`[data-phase="active"] [data-slot="conversation.composer.dock"] + *`, so an
accessory seated next to the dock slot host gets the same surface as one seated
inside it, and a second rule gives it the same gap and padding as a dock child so
both seats of the row end up the same height. The selector names no hashed class
and no localized label, so it covers whatever accessory the shell seats there
next. The plate lands on the accessory's own seat rather than on a trigger inside
it, which leaves a component's own hover feedback painting on top.

**The blue-fantasy step row gets the plate its siblings carry.** The rule targets
the title button (`[data-step-process] [data-process-activity]`, the stable
semantic attribute), not the row root and not the shimmer label. The row root
holds the expanded body, so a plate there stacks a second background behind every
member row; the label span uses `background-clip: text`, so a plate there paints
over the glyphs and the text disappears. A negative left margin cancels the new
padding so the activity icon keeps the x it shares with the member rows: the
plate grows leftwards instead of pushing the text column right. A dark-theme
variant keeps both rows on the same `--dsh-skin-bubble-alpha` family.

**The blanket disabled rule is narrowed by exclusion, not overridden per
control.** blue-fantasy's `button:disabled` becomes
`button:disabled:not([data-turn-process])`. Excluding the info bar by the
semantic attribute the shell stamps keeps real controls greyed and cursor-blocked
while leaving each shell component's own disabled appearance intact. The
alternative — adding a `[disabled]` override per shell component — is a losing
race: every future custom disabled look would need its own counter-rule.

## Alternatives considered

- **Widen the accessory rule to the dock container's children** (e.g. matching
  the dock row element's own children). Rejected: the dock element is rendered by
  a CSS-Modules class, so this would key the shared adapter to a hash-suffixed
  name that the safety pipeline already warns about and that any official rebuild
  can break. The adjacent-sibling selector anchors on the same semantic slot
  attribute the rest of the adapter already uses.
- **Anchor on the meter itself** (`button:has(svg circle)` under the composer
  dock slot, as the report suggested). Rejected as the general mechanism: it
  describes one component's internals, so the next accessory seated beside the
  dock would fall out of the surface again, and the `:has(svg circle)` shape is
  fragile against any ring the shell adds elsewhere in the row.
- **Leave the ring bare and strip the plate from the statistics pill instead**,
  making the row uniformly unplated. Rejected: the report explicitly offers this
  as the fallback if the ring "should" stay bare, but the plate is the intended
  accessory surface for the whole dock row, and the pill was already correct — so
  this would have removed the skin's signature treatment from the one element
  that had it.
- **Plate the whole `[data-step-process]` row.** Rejected: it contains the
  expanded body, so the background stacks a second plate behind every member row.
- **Plate the shimmer label span.** Rejected: it uses `background-clip: text`; a
  background there erases the glyphs.
- **Give the step plate symmetric padding without the negative margin.**
  Rejected: the activity icon is the row's left anchor and shares an x with the
  member rows below it; symmetric padding shifts it 8px right and breaks that
  alignment, which the report measured and called out.
- **Add a per-component `[disabled]` override instead of excluding the info
  bar.** Rejected: it fixes one component and leaves the global rule positioned
  to override the next one, which is the failure mode the report itself names.

## Consequences

- The composer row renders one consistent accessory surface whatever the shell
  seats beside the dock slot host, and the rule keeps working without naming any
  hashed class or component internals.
- The blue-fantasy step title line reads as the glass plate its sibling rows use,
  with the activity icon still aligned to the member rows. The fix is pinned by
  `tests/blue-fantasy-process-rows.spec.ts`, whose first four assertions fail
  against the pre-fix stylesheet.
- The disabled exclusion is narrow by attribute: any shell control that carries
  `data-turn-process` opts out of the skin's blanket disabled styling, which is
  correct only while that attribute means "non-interactive info bar". A future
  shell change that makes that row interactive again must revisit the exclusion.
- Both fixes are cosmetic and skin-scoped; no skin manifest, preview asset, or
  catalog entry changed, so the repo catalog check is unaffected. The
  skin-center client bundle under `lib/` was rebuilt in the same change.
- Verification: `pnpm test` (47 files), `pnpm typecheck`,
  `pnpm skin-center:check`, and `pnpm skin-hooks:check` all pass on the rebased
  branch. No GUI capture was taken for either fix; the two adapters are asserted
  at the stylesheet level, so a rendered check of the composer row and the step
  row against a live 0.1.7 host is still owed.
