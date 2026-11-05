# Agent Note: the fullscreen sidebar panel and the settings dialog are opaque surfaces

Status: implemented

## Problem

Issue #102: with a translucent skin applied, opening a file in the right sidebar
and switching the panel to fullscreen left the conversation readable *through*
the document preview, and the settings dialog showed the same bleed.

The panel is not a card that sits beside the conversation — in fullscreen it is
the conversation's overlay. `SidebarRight.tsx` gives the same element
`position: absolute; top/right/bottom: 0`, `data-sidebar-right-panel="fullscreen"`
and `--dsh-sidebar-width: 100vw`. Nothing in that stack paints an opaque
surface:

| Layer | Fill | Owner |
| --- | --- | --- |
| `.panel` (the overlay box) | none | host |
| `.tabHost` / `.emptyTabHost` | `var(--dsw-alias-bg-base)` | host, remapped by the skin |
| `[data-dockkit-content]` | skin's own rule | 4 skins, `#0a102057`-style (~34%) |

50 of the 62 catalog skins remap `--dsw-alias-bg-base` to a translucent value
(typically ~10%; `#ffffff00` in `miku`). So this is a property of the skin
*catalog*, not of the three skins the report named.

The settings dialog has the same shape one layer up: its plate is
`background: var(--dsw-alias-bg-layer-2)` (`SettingsRoot.module.css`), and skins
remap that token to anything from 42% to 96% alpha.

## Decision

Two rules in the skin center's shared shell-rendering stylesheet
(`src/client/runtime/shell-rendering.ts`, the `#954` adapter): the fullscreen
panel and the settings dialog are painted with the *skin's own colour at full
alpha*, via relative colour syntax, which drops the alpha channel and keeps the
hue — the alpha must be written out as `/ 1`, because relative colour syntax
otherwise inherits the origin colour's alpha (measured: `rgb(from #ff000080 r g b)`
stays 50% pink, `rgb(from #ff000080 r g b / 1)` is opaque red).

```css
html[data-dsh-skin] [data-sidebar-right-panel="fullscreen"] {
  background-color: var(--dsw-alias-bg-base, #05070d) !important;
  background-color: rgb(from var(--dsw-alias-bg-base, #05070d) r g b / 1) !important;
}
html[data-dsh-skin] [data-shortcut-modal="settings"] {
  background-color: var(--dsw-alias-bg-layer-2, #ffffff) !important;
  background-color: rgb(from var(--dsw-alias-bg-layer-2, #ffffff) r g b / 1) !important;
}
```

Why here rather than per skin:

- The sheet is the established home for shell corrections that must hold for
  every skin (`#954`, `#1117`, the macOS drag guard). It is installed once per
  runtime and is scoped to `html[data-dsh-skin]` / the custom-theme head, so the
  stock look is untouched.
- Fifty skins share the defect; a per-skin fix is fifty copies that every new
  skin has to remember to add, and the next skin without it re-opens #102.
- No skin has to declare a new token. `rgb(from …)` reads the colour the skin
  already published.

Deliberate scope:

- **Docked (push) mode is untouched.** The reporter explicitly wants the column
  to stay see-through beside the artwork; only the overlay is a bug. A test pins
  the absence of a `push` target.
- **Floating panels are unaffected** — they sit at z-index 60, above the
  fullscreen panel's 40, and keep their own fills.
- The plain `var(…)` declaration is the fallback for an engine without relative
  colour syntax: it degrades to today's translucency rather than to an unstyled
  box.

## Alternatives considered

- **Fix the three reported skins.** Rejected: 47 other skins keep the same
  defect and the report is about a class of skins, not three files.
- **Add a `--dsh-skin-surface-opaque` token that skins declare.** Rejected: it
  puts the burden on every skin author and needs a migration across 50 files
  before anything improves.
- **`background-color: color-mix(in srgb, var(--dsw-alias-bg-base) 100%, …)`.**
  Rejected: `color-mix` keeps the source alpha, so it cannot make an opaque
  colour out of a translucent one.
- **Keep the translucency and blur what is behind it.** Rejected on the report's
  own terms ("可读性极差"): a blur leaves the text legible as smudges, and
  `backdrop-filter` on a surface this large is exactly the "blur washes out the
  background video" trap recorded for the composer card.
- **Set `--dsw-alias-bg-base` on the panel with a self-reference.** Rejected: a
  custom property that references itself on the same element is a cycle, so it
  is invalid at computed-value time regardless of where the inherited value came
  from.

## Consequences

- Fullscreen right-sidebar content, and the settings dialog, are opaque in every
  skin; the conversation no longer reads through either.
- A skin that *wants* a translucent fullscreen overlay can no longer have one
  without overriding this rule. That is the intended trade for #102.
- The rules depend on relative colour syntax; the fallback keeps an older engine
  on today's behaviour. `tests/shell-rendering.spec.ts` pins both declarations
  and the scoping, and asserts no `push` target exists.
- The fix travels with the plugin package, so it reaches users on the next
  `dsh-skins` release, not merely with the market content.
