# Hatsune Miku · Electronic Diva (初音未来 · 电子歌姬)

English | [中文](README.zh.md)

A Hatsune Miku theme for dsh-web, built on two illustrations and two
independent colour schemes: a cold cyan-white **sky stage** in light, a neon
**night sea** in dark. Neither mode is a filter over the other — each has its own
palette, so panels stay readable against both backdrops.

## What it is

- `skin.json` — the v2 manifest.
- `skin.css` — a full remap of the `--dsw-alias-*` token set, one block per mode.
- `patches.css` — L3 free selectors for the surfaces the token set cannot reach.
- `assets/miku-art-light.jpg` / `assets/miku-art.webp` — the light and dark
  illustrations.
- `hooks.mjs` — optional. `skin.json` declares its `SkinHooks` requirement with
  `optional: true`, so the declarative half (stylesheets, patches, artwork) still
  loads when the hooks facet is refused.

The session column is left fully transparent so the artwork shows through it;
panels use mecha chamfers, brushed metal and cyan/magenta gradient keylines, and
the composer is drawn as a cockpit recess with a themed caret.

The linework is deliberately restrained. The chamfer bevel is a **single**
highlight on the small, high-frequency surfaces (menus, bubbles, code blocks,
rows, buttons) and a two-line bevel only on the two hero surfaces — the settings
dialog and the composer card. Menus carry a 1px edge and one soft shadow instead
of the earlier "2px gradient ring + three-line bevel + a drop shadow" stack, and
their fill is near-opaque so the sidebar's dot screen no longer reads through the
panel. Measured across the stylesheet, drawn lines drop from 49 to 24, and a
200x328 menu goes from seven outlines to two.

Inside the settings dialog the skin draws no dividers at all: the shell's per-row
hairline (`.5px` on `--dsw-alias-border-l2`, one per settings row) and the skin's
own 1px frame around every section/card are both removed, and the dialog keeps a
1px gradient edge instead of the earlier 2px ring. A full pass over the ten
settings tabs leaves only the controls that need an outline — buttons, selects,
cards and the dialog itself.

## Host compatibility

Written against DSH 0.1.7:

- Shadows are bound on **both** `--dsw-alias-shadow-lv*` and the un-prefixed
  `--dsw-shadow-lv*` names that the shell reads.
- The skin deliberately sets **no** `height` / `min-height` on
  `[data-dsh-frame]`: the host already sizes the frame at `100dvh`, and forcing
  it back to full height would break skins that shorten the frame to make room
  for HUD bars.
- On the Windows desktop the shell paints an opaque fill on the whole app
  frame, which is an ancestor of the session column; that crushed the artwork,
  so the skin clears it (`[data-dsh-frame] { background: none }`). The shell's
  titlebar strip keeps its own fill — it is the window drag region and backs the
  native menu bar.
- Below 768px the only additions are safe-area insets
  (`env(safe-area-inset-*)`) on the two injected bars, plus `cursor: auto` on
  coarse pointers so the custom PNG cursors are dropped on touch devices.

## Preview

`preview/light.jpg` and `preview/dark.jpg` — 1440×900 captures of the running
skin.

## Credits and license

| Part | Author / rights holder |
| --- | --- |
| Artwork — `assets/miku-art-light.jpg`, `assets/miku-art.webp` | 涂山苏苏, original artwork for this skin |
| Skin code — `skin.json`, `skin.css`, `patches.css`, `hooks.mjs` | zhu1090093659 |
| Character — 「初音未来 / Hatsune Miku」 | © Crypton Future Media, INC. |

The character is used under the [Piapro Character
License](https://piapro.jp/license/pcl/summary). This skin is an **unofficial,
non-commercial fan work**: it is not affiliated with, sponsored by, or endorsed
by Crypton Future Media, INC., and it grants no right to the character beyond
what that licence allows. All rights to the character and its design remain with
Crypton Future Media, INC. and the respective rights holders.
