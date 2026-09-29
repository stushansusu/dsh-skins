# Agent Note: The session header's glass moved off a display:contents stamp

Status: implemented

## Problem

Both video skins hung the session header's glass on a `::before` of
`[data-dsh-surface='session-header']` with `position: absolute; inset: 0`. The shell
stamps that attribute on the `conversation.session.header` **slot outlet**, which is
`display: contents` — it generates no box. The pseudo-element's containing block
therefore resolved to the nearest positioned ancestor, `[data-phase='active']`, the whole
conversation column (measured 280,0,**1400x1000**). A rule written to fill a 76px band
painted a 58% veil — the glass is `alpha(panel, 0.58)` — over the entire chat area.

The layer is invisible to both of the repository's usual finders: the stamp's own rect is
0x0, and an `elementsFromPoint` scan cannot see a `pointer-events: none` layer. It was
found by hiding layers one at a time and re-measuring a patch's mean (49.4 -> 63.7 against
a decoded frame's 65.0), then confirmed by regressing the screen pixels on the decoded
frame: `screen = 0.412 x video + 21.0`, exactly `alpha(panel, 0.58)`.

## Decision

The glass belongs on the element that owns the band's box:
`[data-slot='conversation.header'] > header` (measured 280,0,1400,76), as a
`background-color` on that element rather than a positioned pseudo-element. The
`::before` rule is deleted in `skins/rainy-night/patches.css` and the same retarget is
applied to the merged `skins/whale-fantasy/patches.css` in the same pull request. The
inert `position: relative` on the `display: contents` stamp stays, so the diff is one
rule.

After the retarget the same regression reads 0.967 / 0.970 over a pure-picture patch,
against the 0.986-0.998 that the same skin's untouched regions measure.

## Alternatives considered

- **Keep the `::before` and position the band's element instead.** Rejected: it
  re-creates the same "an absolutely positioned decoration depends on an ancestor" coupling
  one level down, and the glass has no reason to be a separate box.
- **Select the outlet's child with `> *`.** Rejected: it also matches any future sibling
  the outlet grows, while the band's element is what has the box.
- **Drop the glass entirely.** Rejected: it is the band's material; the bug is the
  containing block, not the fill.

## Consequences

- No skin in the catalog paints a conversation-wide veil; the header keeps its glass.
- Any rule that hangs an `inset: 0` decoration on a `data-dsh-*` stamp must first measure
  `getComputedStyle(el, '::before').width/height`: a 0x0 rect on the stamp is not evidence
  that the pseudo-element is anchored there.
