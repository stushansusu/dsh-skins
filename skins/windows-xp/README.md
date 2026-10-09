# Windows XP · Bliss (Win XP · 蓝天绿丘)

English | [中文](README.zh.md)

A **dual-theme** dsh skin that disassembles the shell into a Windows XP machine: the
sidebar is one XP window (a Luna title bar over a task pane), the conversation column is
a second one sitting on the desktop, the composer is a small XP window with an inset
edit box and a toolbar, and the bottom 24 px of the viewport is drawn as the taskbar.

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
  remap) + `patches.css` (L3 free selectors) + 19 hand-authored SVGs and the two
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
| Luna title bar | sidebar, top 62 px | eight-stop vertical gradient: top highlight, body, a second highlight at the bottom edge, dark closing line |
| four-colour window icon | left of the brand row | inline SVG as a background-image |
| title bar buttons | the shell's own sidebar toggle | translucent white highlight plus a 1px outline |
| task pane | lower half of the sidebar | face-coloured band over a white list box with a 1px inset blue-grey outline |
| yellow folder / white document icons | workspace group rows / session rows | full-colour SVGs as background-images; the shell's own glyph is hidden with `visibility`, not `display`, so the 16 px slot does not move |
| XP selection blue | selected session row | `#316AC5` fill, white label, 1px dark blue inner edge |
| menu / tool band | conversation header, 76 px | 40 px Luna title bar over a 36 px tool band, the 1px separator baked into the gradient |
| XP tabs | 对话 / 轨迹 / 工具统计 | square; unselected is plain text, selected is a white face with a 2 px brand underline |
| inset edit box | the whole composer card | client-area fill with the same `#7F9DB9` border the shell's own inputs get, so every input in the app matches |
| toolbar grip | left end of the composer toolbar | a 5x9 two-column dot glyph drawn into the row's left padding |
| blue default button | send | Luna blue gradient, dark blue outline, white top highlight; disabled falls back to the window face |
| amber hot state | every toolbar button | XP's button hot state is yellow, not blue |
| pale yellow tooltip | `role="tooltip"` | `#FFFFE1` fill, 1px black outline, square corners — kept in both themes |
| 16 px scrollbar | everywhere | raised track and thumb with the two arrow keys at each end |
| task pane header band | top 38 px of the right rail | the same white-to-face band the sidebar's task pane header uses |
| taskbar | bottom 24 px of the viewport | the frame reserves the space with `padding-bottom`; the bar itself is a stack of 13 background layers on `::after`: start key, flag, task button, tray groove and two tray icons |
| window frame | dragging a column divider | hovering the resize handle lights a 3 px Luna blue line, the way XP shows a window edge |

The three atmosphere layers (`pane` / `sidebar` / `hero`) are all `none`: the wallpaper
is the whole picture and the only darkening is the declared `scrim`.

## Measured in the real shell

At 1296x828, on the desktop condition (`html[data-windows-titlebar]`):

| item | value |
| --- | --- |
| sidebar | `0,0,280,804` (viewport minus the 24 px taskbar), title bar 62 px |
| conversation header | `0..40` Luna gradient, `40..76` tool band with a 1px bottom separator |
| composer card | `928x116` on the empty session, `928x100` inside one; flat client fill, `#7F9DB9` outline, inset |
| taskbar | start key `0..72` (green key `0..71`, a 1 px dark green divider at `71..72`, flag `13..30`, the two glyphs `32..56`), task button `104..252`, tray from `right 96px` |
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

- The two labels baked into the taskbar (the start key's 「开始」 and the task button's
  caption) are fixed-size SVGs. CSS cannot draw text, so on an English UI they still
  read as the Chinese strings, and the caption is a static application name rather than
  the live session title. Making them live would need hooks, which this skin
  deliberately does not declare.
- The window minimise/maximise/close triple is not drawn: the conversation header only
  owns one or two real shell buttons, and three fake ones would lie about what they do.

## Install

Copy this directory to `$DSH_HOME/skins/windows-xp`, or install it from the skin
center. Both themes are declared, so the system theme switch works without a reload.

## Licence and provenance

The engineering of this skin (`skin.css`, `patches.css` and their entire token and
geometry system) and the 19 SVGs are the author's own work, released under
**CC BY-NC-SA 4.0**.

The two wallpapers are **the author's own photographs** — the day frame, and the night
frame shot from the same position after dark. They are the author's own artwork, they
carry no third-party material, and they are **not** covered by the CC BY-NC-SA 4.0 grant
above; they are included here with the author's permission for this skin only.

This skin is an unofficial, non-commercial homage. It is not affiliated with, endorsed
by, or licensed by Microsoft; "Windows XP" and the Luna and Royale visual styles are
referenced descriptively, and no Microsoft asset is redistributed — every ornament,
window frame, icon and gradient in this skin was drawn from scratch as an SVG or CSS.
