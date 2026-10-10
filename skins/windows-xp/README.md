# Windows XP · Bliss (Win XP · 蓝天绿丘)

English | [中文](README.zh.md)

A **dual-theme** dsh skin that disassembles the shell into a Windows XP machine: the
application's own window bar is the top 40 px (the 应用 / 编辑 menu on the left, the system
minimise / restore / close keys on the right), the sidebar is one XP window whose top row
is a task pane header band, the conversation column's header is a single 76 px tool band,
the composer is a small XP window with an inset edit box and a toolbar, and the bottom
24 px of the viewport is drawn as the taskbar.

The two themes are **not** a light/dark twin of one palette. They are the two real
Windows XP visual styles, and each is anchored to one of the author's own photographs:

| | light · Luna Blue | dark · Royale Noir |
| --- | --- | --- |
| wallpaper | day: blue sky over green hills | night: the same composition after dark |
| window face | `#ECE9D8` | `#2B2B2B` |
| client area | `#FFFFFF` | `#1C1C1C` |
| title bar | Luna blue gradient | graphite blue gradient |
| selection blue | `#316AC5` | `#2A5C9E` |
| body text | `#000000` | `#E8E8E8` |

There are no constants shared between the two groups.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full `--dsw-alias-*` token
  remap) + `patches.css` (L3 free selectors) + 17 hand-authored SVGs and the two
  wallpapers. No package.json, no build step, **no hooks** — nothing in this skin
  executes.
- **A photographic background** (`backgroundMedia.type = "image"`, one WebP per theme)
  with a `scrim` that only darkens the two ends, so the middle of the picture — the
  hill the composition is about — is left alone.
- **Both themes are first-class**: light and dark each get their own palette, their own
  wallpaper and their own chrome gradient.
- The ground is fully transparent (`glassBase: 0`): the wallpaper **is** the desktop, and
  every panel is an opaque XP window on top of it.

## What it recreates

| XP element | where it lands | how |
| --- | --- | --- |
| window title bar | top 40 px of the viewport (`[data-dsh-frame]::before`) | eight-stop Luna gradient (graphite blue in dark) with a dark bottom hairline. This strip **is** the application's real caption — the OS window keys are drawn at its right end |
| 应用 / 编辑 menu | `body > div[data-windows-menu]` (injected by the desktop preload, inside a shadow root) | a shadow root only lets a stylesheet reach **inherited** tokens, so the skin re-declares those few on the host element: white labels, translucent white hover |
| system window keys | Electron `titleBarOverlay` (not reachable from CSS) | the preload measures a probe span's `--dsw-specific-sidebar-fill` and `--dsw-alias-label-primary` and forwards them to `setTitleBarOverlay()`; the skin sets those two tokens **on that span** — transparent fill, white symbols — so the keys land on the blue bar |
| four-colour window icon | left of the brand row | inline SVG as a background-image |
| sidebar task pane header | the sidebar's top row (`logoRow`) | white highlight fading into pale blue, a white hairline on top and a brand-blue one below; 「Win XP」 is dark blue bold (9.5:1 light / 6.9:1 dark) |
| sidebar toggle | the shell's own toggle | a uniform light key with a dark blue glyph (inverted in dark). It has two landing spots a stylesheet cannot tell apart — the sidebar's task pane header in the browser, the caption's top-left corner on the desktop — so one style has to read on both |
| task pane | lower half of the sidebar | face-coloured band over a white list box with a 1px inset blue-grey outline |
| yellow folder / white document icons | workspace group rows / session rows | full-colour SVGs as background-images; the shell's own glyph is hidden with `visibility`, not `display`, so the 16 px slot does not move |
| XP selection blue | selected session row | `#316AC5` fill, white label, 1px dark blue inner edge |
| menu / tool band | conversation header, 76 px | one beige tool band (the title row plus the tab row), the 1 px bottom separator baked into the gradient |
| XP tabs | 对话 / 轨迹 / 工具统计 | square; unselected is plain text, selected is a white face with a 2 px brand underline |
| inset edit box | the whole composer card | client-area fill with the same `#7F9DB9` border the shell's own inputs get, so every input in the app matches |
| toolbar grip | left end of the composer toolbar | a 5x9 two-column dot glyph drawn into the row's left padding |
| blue default button | send | Luna blue gradient, dark blue outline, white top highlight; disabled falls back to the window face |
| amber hot state | every toolbar button | XP's button hot state is yellow, not blue |
| pale yellow tooltip | `role="tooltip"` | `#FFFFE1` fill, 1px black outline, square corners — kept in both themes |
| 16 px scrollbar | everywhere | raised track and thumb with the two arrow keys at each end |
| task pane header band | top 38 px of the right rail | the same white-to-face band the sidebar's task pane header uses |
| taskbar | bottom 24 px of the viewport | the frame reserves the space with `padding-bottom`; the bar itself is a stack of 14 background layers on `::after`: start key, twelve layers of task button and tray, and the bar gradient. The task button is flag → caption → blue key, in that order |
| window frame | dragging a column divider | hovering the resize handle lights a 3 px Luna blue line, the way XP shows a window edge |

The three atmosphere layers (`pane` / `sidebar` / `hero`) are all `none`: the wallpaper
is the whole picture and the only darkening is the declared `scrim`.

## Measured in the real shell

At 1296x828, on the desktop condition — `html[data-windows-titlebar]` **and**
`--dsh-windows-titlebar-height: 40px` (the preload sets both; with the attribute alone
`padding-top: var(…)` is invalid at computed-value time, so every column measures at y = 0
and the caption has no height):

| item | value |
| --- | --- |
| window caption | `0,0,1296,40`, the skin's Luna gradient and a `rgba(0,0,0,.3)` bottom hairline; the preload's probe span resolves to `rgba(0,0,0,0)` fill + `rgb(255,255,255)` symbol |
| sidebar | `0,40,280,764` (viewport minus the 40 px caption and the 24 px taskbar); its top 40 px is the task pane header band |
| conversation header | `40..116` one 76 px tool band with a 1 px bottom separator; the caption above it is the window bar |
| composer card | `928x116` on the empty session, `928x100` inside one; flat client fill, `#7F9DB9` outline, inset |
| taskbar | start key `0..72` (green key `0..71`, a 1 px dark green divider at `71..72`, flag `13..30`, the two glyphs `32..56`), task button `104..252` (flag `116..133`, caption `138..248`), tray from `right 96px` |
| composer toolbar | row `710x42`, `padding: 2px 8px 6px` raised to a 16 px left padding so the grip sits at 5 px and the "+" button keeps a 5 px gap |
| right rail band | tablist `714,0,582,38`; `#F6F5ED` to `#ECE9D8` with a `#ACA899` separator at 37.7 px |
| settings panel | `802x782`, left nav 188 px wide |

Text contrast was measured by sampling the composited pixels around each text box (not
inside it) and computing WCAG ratios against what is actually behind the glyphs:

| | segments | < 4.5:1 | < 3.0:1 | tightest |
| --- | --- | --- | --- | --- |
| empty session · light / dark | 36 / 36 | 1 / 1 | 0 / 0 | 3.95 / 3.97 |
| in a session · light / dark | 70 / 70 | 1 / 1 | 0 / 0 | 3.95 / 3.97 |
| settings · light / dark | 39 / 39 | 1 / 1 | 0 / 1 | 3.29 / 2.92 |

The single element under 4.5:1 is the composer placeholder, and it is deliberate: XP's
placeholder grey is `#808080` and darkening it stops looking like XP. The settings
figure is a plugin's own hard-coded orange, not this skin's.

## Accessibility notes

- Body text is pure black on `#FFFFFF` in light and `#E8E8E8` on `#1C1C1C` in dark;
  every measured segment clears 4.5:1 except the placeholder noted above.
- Nothing moves on hover except a background gradient; focus rings are the XP dotted
  rectangle rather than a removal, so keyboard focus stays visible.
- The taskbar is `pointer-events: none` — it never eats a click, and the frame reserves
  its height so no control is covered by it.

## Limitations

- The labels the skin draws are **fixed-size SVGs** (the start key's 「开始」 and the task
  button's caption). CSS cannot draw text, so on an English UI the start key still reads
  in Chinese, and the task button always shows the application name rather than the live
  session title. Making them live would need hooks, which this skin deliberately does not
  declare.
- The minimise / restore / close keys in the caption are **Electron's own
  `titleBarOverlay`**, not skin art: the skin can only make the overlay transparent and
  its symbols white so they sit on the blue bar. In the browser the caption strip is
  absent (`content: none`, height 0), so neither the menu nor those keys exist there.

## Install

Copy this directory to `$DSH_HOME/skins/windows-xp`, or install it from the skin
center. Both themes are declared, so the system theme switch works without a reload.

## Licence and provenance

The engineering of this skin (`skin.css`, `patches.css` and their entire token and
geometry system) and the 17 SVGs are the author's own work, released under
**CC BY-NC-SA 4.0**.

The two wallpapers are **the author's own photographs** — the day frame, and the night
frame shot from the same position after dark. They are the author's own artwork, they
carry no third-party material, and they are **not** covered by the CC BY-NC-SA 4.0 grant
above; they are included here with the author's permission for this skin only.

This skin is an unofficial, non-commercial homage. It is not affiliated with, endorsed
by, or licensed by Microsoft; "Windows XP" and the Luna and Royale visual styles are
referenced descriptively, and no Microsoft asset is redistributed — every ornament,
window frame, icon and gradient in this skin was drawn from scratch as an SVG or CSS.
