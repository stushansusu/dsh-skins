# Agent Note: the atelier phone hero, the footer seat ink, the state pills, and the maid top trim

Status: implemented

## Problem

Three visual defects shared one cause: a palette written for a surface the skin
no longer paints.

**phoebe-atelier's footer seat.** The light-theme sidebar was redesigned into an
ivory pilaster, but the footer seat `[data-slot='sidebar.footer.action']` kept
the near-white label palette written for the retired navy panel. The seat is the
host's extension boundary: a card mounted there inherits its text instead of
painting it, so porcelain ink landed on the ivory plate, at 1.08:1.

**The 390px hero in both atelier skins.** Both skins copy the host's desktop
content floor, `--dsh-chat-content-width: clamp(560px, 41vw, 740px)`, which
resolves to 560px at any width below 1366px. On a 390px phone the hero was laid
out inside a 560px box: phoebe's three-column headline pushed its third column
(the preview badge) into the title, and maid's badge hangs off the title's right
edge with `left: calc(100% + 8px) !important`, so it overflowed the viewport.

**maid-atelier's top trim put the page into horizontal scroll (found by QA after
the first two rounds).** The body-level band that hooks.mjs appends spans the
whole window and then shifted itself right by the sidebar width, so its own box
ended one sidebar width past the viewport: `x=52 / width=390 / right=442` at a
390 viewport with the 52px rail, and `right=1720` at 1440 with the 280px
sidebar. `display: none` on the node dropped `documentElement.scrollWidth` back
to the viewport, which identified it as the owner rather than the column-resize
handles or the dock band the earlier round had removed on mechanism evidence.

**The skin center's state pills.** `.badgeActive`, `.badgeTrying` and
`.delegatedBadge` painted their text with `--dsw-alias-brand-primary` and
`--dsw-alias-state-success-primary`, affordance colours that a skin does not
remap together with its label tokens, so under maid-atelier or phoebe-atelier the
pill kept the host's ink while the card's body text followed the skin. Only the
delegated pill carried a border, which left the other two leaning on fill
contrast alone.

## Decision

- phoebe-atelier moves the porcelain palette off the footer seat root and onto
  the two leaf controls that paint their own navy plate: the settings trigger and
  `[data-cordis-badge]`. The seat root keeps its surface, border and hover
  tokens and declares no label palette at all; a light-theme block
  (`body:not([data-ds-dark-theme]) [data-slot='sidebar.footer.action']`) hands
  the seat the ivory-surface ink (`#17284f`, `#3a4361`, `#48526f`,
  `#56617c`). The theme scope is what keeps the fix honest: the dark theme still
  paints a navy night gallery, where the porcelain ink is the correct one.
- Each skin carries its own `@media (max-width: 480px)` hero block, because a
  skin is a self-contained asset directory and a shared stylesheet would couple
  two independently published skins. The block releases the floor to `100%`,
  sets `min-width: 0` on the headline, uses a 22px row gap, a 56px crest, a
  `clamp(20px, 5.4vw, 27px)` title, `translateY(-2px)`, a 28px hairline, and
  gives the preview badge a `max-width: 100%` placement of its own instead of
  the desktop one that overflowed.
- The skin center's three pills paint their text with
  `--dsw-alias-label-primary`, keep the semantic green/blue in the fill, and
  every one of them now carries a 1px token border. No literal colour is involved.
- **The measured page overflow was the top trim, and its geometry is now the
  fix.** The band is pinned between the sidebar edge and the window's right edge
  instead of spanning the window and then translating itself sideways:
  `left: var(--maid-sidebar-width, 280px)`, `right: 0`, `width: auto`, with the
  horizontal `translate` removed. The layers below still `repeat-x` across the
  content area, so the band paints the same surface, and the crest bow's
  `left` calc drops the sidebar width it used to subtract a second time (the
  band is already the content width; keeping it would pull the bow left by half
  the sidebar, 140px at 1440). Nothing is clipped or hidden: `overflow: hidden`
  on the band was already there for its own repeat layers.
- The phone block also removes two mechanisms that provably put the page into
  horizontal scroll at 390 even though neither was the measured owner. They are
  kept as narrow-viewport hygiene, not as the fix for the 442:
  - **The column-resize handles.** The host positions them with
    `left: calc(50% + var(--dsh-chat-content-width) / 2 + 24px)` and sizes them
    with `min(10px, calc((100% - var(--dsh-chat-content-width)) / 2 - 48px))`.
    Its active-phase axis floors that token at 680px, so on a 390px screen the
    strip lands past the right edge, and the negative width makes the sizing
    declaration invalid rather than the zero-width hit area the host intends for
    narrow columns. They are pointer drag affordances, so `[data-width-handle]`
    is not rendered at or below 480px.
  - **The dock band.** `.dock` is a centered flex line whose chips are
    `white-space: nowrap` and `flex: none`, so a wide strip overflowed sideways
    instead of wrapping. `[data-composer-dock]` now wraps at or below 480px. The
    band is neither hidden nor clipped: wrap only engages when the line does not
    fit, so the collapsing dock keeps every chip and its own state.
- The reasoning-sweep animation was NOT the owner, and the note records that so
  the next round does not chase it: maid moves a 240px `::after` band to
  `translate(calc(100vw + 240px))`, but the host already gives that pseudo's
  containing block `position: relative` and `overflow: hidden`
  (`client/ui-primitives/src/DisclosureRow.module.css`), so its excursion is
  clipped and never reaches the document's scrollable overflow.
- The Cordis badge's cascade: the footer trigger rule and the badge rule both
  target a button in the same seat, and the trigger rule out-specifies the badge
  (0,3,2 against 0,1,1), so the badge's porcelain label was repainted in the
  trigger's gold. The trigger rule now carries `:not([data-cordis-badge])`; the
  dark counterpart stays exactly as it was. The light-theme badge plate is
  deepened from `rgba(44, 68, 132, 0.74)` to `0.84` because the porcelain label
  measured 3.70:1 on the light end of the old plate, and the wide badge draws its
  label across it.

## Alternatives considered

- **Reset the sidebar's label tokens globally.** A `:root` or pane-level reset
  would have darkened the porcelain text on every navy-painted surface the skin
  still ships, and it would have reached the sidebar's own ornaments. The seat
  was the only surface the light theme actually broke, so the fix is scoped to it.
- **Keep the porcelain palette on the seat and paint the ivory plate instead.**
  That inverts the bug rather than fixing it: the seat is transparent, so a card
  must not have to know which plate it landed on.
- **Fix the phone hero in the skin center's module CSS.** The hero is host
  markup; both skins already own their hero rules, and a module-level rule would
  have to out-specify two different skin selectors at once.
- **Treat the pills as a text-only change.** Without a border the pill's edge
  disappears on a fill a skin tints close to the card surface, so the outline is
  part of the fix, not decoration.
- **Clip the page (`overflow-x: hidden` or `clip` on the shell) for the phone
  overflow.** That zeroes `scrollWidth` while leaving the mispositioned strip
  and the over-wide dock exactly where they were: the layout stays wrong, the
  page just stops admitting it. Removing the handles and letting the band wrap
  fixes the cause; the band loses no content.
- **Hide the dock strip or give it overflow.** Same masking problem from the
  other side: the strip carries session state a user opens deliberately, so a
  phone layout must keep it reachable, which wrapping does and hiding does not.

## Consequences

- **Correction to the first round's conclusion.** It said no shipped combination
  paired the seat's navy plate with the ivory ink. That was wrong about the seat:
  a real host found a live collision inside the seat's own cascade, not between a
  card and its plate. The footer trigger rule repainted the Cordis badge's label,
  and the badge's plate then read at roughly 1.1:1 on the light end. The cascade
  is now excluded and the plate deepened, so the pair is settled by test rather
  than assumed absent.
- The seat's `--dsw-alias-bg-base` / `layer-*` tokens are still the navy plate.
  A third-party card that *paints* its plate from those tokens while *inheriting*
  its text still pairs navy with the ivory ink. Both leaves the skin ships are
  covered; that remaining combination is a real-host QA item, not something this
  change can settle.
- The badge's hover/focus plate is unchanged, and its label there is `#fff8e8`
  on a deliberately lighter gradient: about 2.6:1. It is a transient pointer
  state the skin designed before this note, not the resting badge this round
  measured, so it is recorded here rather than changed.
- **The second round removed the wrong owner first.** It argued from mechanism
  evidence that the column-resize handles and the dock band caused the page
  overflow, and changed both. The host's measurement then named the top trim:
  the handles and the dock still produced real overflow at phone widths, but the
  442 / scrollX 52 under test was the trim's box. The trim is now fixed by
  geometry; the handle and dock changes stay as narrow-viewport hygiene and are
  described that way above, not as the fix. The lesson recorded here is that a
  mechanism argument does not replace the measured node.
- The trim's own `overflow: hidden` and `contain: paint` are unchanged: they
  bound the band's repeat layers, and the fix is the box's geometry. The bottom
  trim still carries the same `translate: var(--maid-sidebar-width, 280px) 0`
  pattern; the host's measurement cleared it (hiding the top trim alone returned
  `scrollWidth` to the viewport), so it is left alone rather than changed
  speculatively.
- The dark-theme trying pill keeps the semantic blue but fills it with
  `--dsw-alias-state-business-tertiary` instead of the mid-blue dimmed button
  fill. The actual dark label ink measures about 8.8:1 on that plate; the previous
  `#687aa6` plate measured 3.60:1 in the real GUI. The light-theme pill keeps
  `--dsw-alias-button-primary-dimmed` unchanged.
- `lib/client.js` embeds the module CSS, so the skin center change travels with a
  regenerated `lib`. The `pnpm build` + `git diff --exit-code -- lib` gate
  expects both in the same commit.
- The regression tests are static: they pin the declarations and compute the
  contrast ratios themselves. They cannot see a real 390px layout, so the visual
  pass on a real host at 390px stays part of the QA round.
