# Agent Note: The orca-link macOS caption-strip adaptation

Status: implemented

## Problem

The official desktop client marks `<html data-platform="darwin">` on macOS, and
on that shell the sidebar column opens with a 52px caption strip
(`.topStrip`, `data-window-drag`, carrying the collapse toggle) whose job is to
clear the `hiddenInset` traffic lights. The brand row is therefore the **second**
child of the sidebar pane there, not the first.

orca-link addressed the brand row positionally — `[data-slot='sidebar'] >
:first-child > :first-child` — so on that shell it mounted its DSH wordmark and
link chip into the caption strip. The wordmark is absolutely positioned
(`top: 15px; left: 4px`) against the strip, which put it at the window's top edge
directly under the traffic lights, and the strip's `justify-content: flex-end`
parked the link chip beside the window buttons.

The shell's brand host differs too: the expanded brand is a New Session
`button` on the browser shell but a plain `span` on the desktop shell. The
marker the stylesheet uses to hide the shell's own brand artwork
(`[data-orca-link-brand]`) was written from a button match, so it was never
written there and the official "DeepSeek Harness" mark and wordmark stayed
visible under the skin's own wordmark. The desktop top-left read as two brands
and a wordmark under the window buttons (reported as 左上角严重错位).

## Decision

**The brand row is resolved by the brand slot, not by position.**
`[data-slot='sidebar'] > :first-child > :has([data-slot='sidebar.brand.mark'])` is
the row, with the positional first child kept as the fallback for a shell that
renders no brand at all (the collapsed rail, whose row holds only the expand
toggle). The caption strip hosts no brand slot, so it is skipped on every shell
that inserts one, and the selector names no hashed class, no platform attribute,
and no localized label.

**The resolved row is stamped `data-orca-logo-row`** and the stylesheet anchors
the row's `position: relative` and the wordmark scan line on that attribute. The
row is what the skin's own chrome positions against, so the marker carries the
same fact the resolver used; the marker is removed by the cleanup.

**The brand host is resolved from the brand slots.** The host is the row's direct
child that contains `sidebar.brand.mark` or `sidebar.brand.name`, which is the
New Session button on the browser shell and the brand span on the desktop shell,
so `[data-orca-link-brand]` is written on both and the shell's brand artwork is
replaced on both. The button-shape match stays as the first choice.

**A row change sweeps the previous row's chrome.** If the shell re-renders the
brand row (a strip that arrives after the first mount, a collapse/expand round),
the wordmark and chip left in the old row are removed before the new row is
mounted, so one row always holds exactly one copy.

**The pane-anchored pricing light follows the row.** The caption strip pushes the
shell's rows — and therefore the brand row the light is designed to sit under —
down by its own 52px minus the neighbouring margins. The hooks measure that
offset (row top minus the pane's content-box top: 0 on the browser shell, 34px
under the darwin strip) into `--orca-shell-top-inset` and the light's `top` is
`calc(<base> + var(--orca-shell-top-inset, 0px))`. The variable is declared in the
activation's style bookkeeping, so the cleanup restores whatever was there
before.

## Alternatives considered

- **Key the row on the official `.*_logoRow` / `.*_topStrip` class names.**
  Rejected: those names are CSS-Modules hashes the safety pipeline warns about
  and any official rebuild can rotate; [the 0.1.7 composer and process-row
  note](2026-09-25-composer-and-process-row-adaptations.md) rejected the same
  approach for the composer dock.
- **Branch on `html[data-platform="darwin"]`**, the predicate the official
  sidebar itself uses. Rejected: it makes the skin depend on a platform claim
  rather than on the DOM it reads, the preload marks it as late as
  DOMContentLoaded (a first mount can precede it), and it covers the macOS strip
  only — the slot-bearing row needs no shell detection and also holds for the
  Windows caption, whose own layout leaves the brand row as the first pane child.
- **Anchor on `[data-slot="sidebar.brand.name"]` instead of the mark.**
  Rejected as the sole anchor: the name slot and the mark slot arrive as one
  registration set here, but the mark is the slot the collapsed rail keeps, so it
  is the more durable of the two.
- **Hide the shell's brand with a global `body[data-dsh-orca-link]` rule.**
  Rejected: the `[data-orca-link-brand]` scope keeps the skin's write surface on
  the one host it actually replaces, and it is already the anchor of the existing
  hide rules.
- **Keep the chip in the caption strip and move only the wordmark.** Rejected:
  the strip's right end is the collapse toggle's seat, and the chip is part of the
  brand row's composition, not window chrome.
- **Make the pricing light a child of the brand row so `top` is relative to it.**
  Rejected: the collapsed rail's row is 36px tall with `overflow: hidden`, and the
  light's rail position (`top: 55px`, centred) sits outside that box, so the light
  would be clipped away on the rail.
- **Hard-code the strip height in the stylesheet.** Rejected: the height is the
  shell's, not the skin's; the measured variable keeps the browser shell at its
  exact current geometry (`0px` inset) and follows any future caption height.

## Consequences

- On the macOS desktop shell the wordmark and link chip land in the brand row
  below the traffic lights, the shell's own brand artwork is hidden, and the
  pricing light keeps its browser-shell relationship to the wordmark. The
  browser shell's measured geometry is unchanged (wordmark 16,21 118x30; chip
  148,27 97x11 before and after).
- The skin's chrome is no longer tied to the pane's child order; a shell that
  inserts another caption row only needs the brand slot to stay on the row.
- Pinned by `tests/orca-link-hooks.spec.ts`: one case asserts the darwin fixture
  seats both nodes in the brand row, marks only that row, and writes
  `[data-orca-link-brand]` on the span; another asserts a strip that arrives
  after the first mount leaves exactly one wordmark and chip in the row.
- Verification: `pnpm test` (46 of 47 files pass; `tests/legacy-bridge.spec.ts`
  fails 2 cases on the clean tree as well), `pnpm typecheck`,
  `pnpm skin-center:check`, `pnpm skin-hooks:check`, and the rebuilt
  `lib/index.js`. A headless render of the live GUI with the official 52px strip
  inserted reproduced the reported overlap (wordmark at 4,15 inside the strip)
  and, after the fix, seats it at 16,55 in the brand row with the pricing light
  at 4,80.
- The skin is content of this repository, but the Workshop copy installed under
  `$DSH_HOME/skins/orca-link` keeps serving the previous bytes — provenance
  pins the reviewed hooks — until the market build is refreshed and the user
  updates the skin.
