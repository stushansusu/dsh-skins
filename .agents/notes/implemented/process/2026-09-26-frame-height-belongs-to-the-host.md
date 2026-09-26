# Agent Note: The frame height belongs to the host, not the skin

Status: implemented

## Problem

The 2026-09-26 maintenance round reviewed six skin pull requests at the same
time. Three of them (black-gold, cafe-roastery, blueprint) are 0.1.7 adaptation
work on skins that already ship, and all three had independently added the same
block to `patches.css`:

```css
@supports (height: 100dvh) {
  [data-dsh-frame] {
    height: 100dvh;
    min-height: 100dvh;
  }
}
```

It reads as the ordinary iOS address-bar fix, and the 0.1.7 batch template that
these adaptations follow even lists "view height uses dvh" as one of the three
things a skin must handle. The rule is nevertheless wrong for this shell, for a
reason that is not visible in the skin being changed.

The host already sizes the frame. `dsh-web-all` sets
`[data-dsh-frame] { min-height: 0; }` as a column shim, and its `<=768px`
layer repeats `height: 100dvh; min-height: 100dvh; max-height: 100dvh`. That
zero is deliberate rather than incidental: it is what allows a skin to shorten
the frame, which is how a skin leaves room for top and bottom HUD bars. The
blueprint skin does exactly that, with
`height: calc(100% - var(--dsh-bp-bar-top) - var(--dsh-bp-bar-bottom)) !important`
under its own `@supports`.

Adding `min-height: 100dvh` on the frame removes that freedom. `height` and
`min-height` resolve separately, so a skin's own `height` declaration — even
with `!important` — does not outrank a competing `min-height`; the used height
becomes `max(calc(...), 100dvh)`. Because the frame's containing block is the
viewport at desktop width, the rule is a no-op for a skin that never shortens its
frame, and a real regression only for one that does.

That asymmetry is why this is a written convention and not just a review
comment: each individual skin passed CI and looked correct in isolation, and the
defect appears in a *sibling* skin. Five shipped skins — whale-maid,
ice-princess, observatory, pixel-anime, shangmei-jinbi — carry the ban as
comment text inside their own `设备适配` block, which is how the batch
remembered it until now. Comment text in five separate skin directories is not a
decision record, and the two skins that re-added the rule in this round had both
ticked the "view height uses dvh" item while doing it.

## Decision

**A skin never sets `height` or `min-height` on `[data-dsh-frame]`.** View
height is the host's concern: the host sizes the frame, and `dsh-web-all`'s
`<=768px` layer already applies the `dvh` treatment where the address bar
matters. A skin that needs to shorten the frame for its own HUD bars does so with
a `height` using `calc()` and leaves `min-height` alone, as blueprint does.

Where a skin genuinely needs viewport height in its own furniture (background
layers, fixed decorations, the corner flourishes that must not be clipped), it
may use `100dvh` on its own elements. The rule is about the frame element
specifically, which is the host's box.

Adaptation pull requests that add this block are held at intake with the reason
named, even when the skin does not currently shorten its frame. The block is
inert today and becomes a regression the first time that skin grows a HUD bar —
which is the same edit that motivated the five skins to write the ban down.
black-gold and cafe-roastery were held on exactly this ground, and blueprint's
identical block was removed before merge.

## Alternatives considered

- **Accept it on the three adaptation pull requests, since none of them
  shortens its frame.** Rejected. The three are the same author's parallel
  branches, so the rule would enter the catalog three times per adaptation round,
  and the next skin to add a bottom HUD bar would inherit the defect from a
  merged precedent rather than from its own change. The convention is cheap to
  follow and expensive to unwind across the catalog.
- **Fold the rule into the CSS safety pipeline and strip it mechanically.**
  Rejected. `transformSkinCss` scopes and bounds selectors; it does not decide
  which declarations a skin may make about the host's own box, and a silent
  rewrite would hide the constraint from the contributor instead of teaching it.
  The identity of the element, not the declaration's syntax, is what makes this
  rule conditional.
- **Leave the rule implicit in the reproduction cases (blueprint's 26px).**
  Rejected as the sole record. The reproduction lives in one skin's stylesheet
  and in a comment duplicated five times; both are easy to miss when adapting an
  unrelated skin, which is precisely what happened.
- **State the rule as "never use `100dvh`".** Rejected as over-broad. The
  address-bar problem is real for a skin's own viewport-sized decorations, and
  the host's treatment only covers the frame below 768px.

## Consequences

- The constraint is discoverable from the repository rather than from a review
  comment, so a contributor adapting a skin finds it before opening the pull
  request.
- A skin that does shorten its frame is now protected by a rule instead of by
  the coincidence that no sibling added the block.
- Reviewers owe the contributor the reasoning, not just the refusal: the rule
  looks inert in the skin under review and only bites in a sibling, so the hold
  cites the mechanism (separate `height`/`min-height` resolution) and the
  reproduction (blueprint's bottom bar) rather than pointing at the convention
  alone.
- Verification: on the 2026-09-26 round, `git merge-tree`-style enumeration of
  all twelve skin pull requests showed the block present in exactly two
  (black-gold, cafe-roastery) and absent from the ten others, including the five
  that document the ban and the six merged in this round; a headless Chrome probe
  of the host's frame rules confirmed that `min-height: 100dvh` has no effect on
  a frame whose containing block is already the viewport.
