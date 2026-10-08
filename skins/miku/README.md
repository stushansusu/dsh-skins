# Hatsune Miku · Electronic Diva (初音未来 · 电子歌姬)

English | [中文](README.zh.md)

A Hatsune Miku theme for dsh-web, built on two illustrations and two
independent colour schemes: a near-white **sky deck** in light, a night-blue
slab **night deck** in dark. Neither mode is a filter over the other — each has
its own palette, so panels stay readable against both backdrops.

## What it is

- `skin.json` — the v2 manifest.
- `skin.css` — a full remap of the `--dsw-alias-*` token set, one block per mode.
- `patches.css` — L3 free selectors for the surfaces the token set cannot reach.
- `assets/miku-art-light.jpg` / `assets/miku-art.webp` — the light and dark
  illustrations.
- `hooks.mjs` — optional. `skin.json` declares its `SkinHooks` requirement with
  `optional: true`, so the declarative half (stylesheets, patches, artwork) still
  loads when the hooks facet is refused.

The session column is left fully transparent so the artwork shows through it.
Panels are flat surfaces: a 1px hairline, 8–18px radii and one of three soft
shadows, and no glass except on the floating layers (menus, popovers, the two
injected HUD bars). The palette is a **single teal** — Miku's `#39C5BB` family —
split into two jobs: `#0b7a72` in light / `#39c5bb` in dark carry text and
icons, while `#2bc4b8` is used as a fill only, because the bright teal reaches
just 2.1:1 as ink on a white panel. One magenta accent (`#c02a72` / `#ff63ae`)
is reserved for the user's own turns. Type is **Inter** for Latin and numerals
with Noto Sans SC for Chinese.

The motif is a **waveform**: an equaliser row on the empty-session hero, a 2px
signal line under the composer that lights up as the composer takes focus, and a
`MIKU` chip in the brand row. The earlier mecha language — 12px chamfers, corner
rivets, brushed metal, `4px 4px 0` offset shadows, a rainbow gradient banner and
a 6px dot screen — is gone: the stylesheet now contains **no `clip-path` at
all**, so focus rings go back to a plain `outline` instead of the inset
work-around the chamfers forced, and there is **no `filter`** on anything that
could contain a fixed descendant.

Every one of the 140 custom properties the previous version declared is still
declared — same set, no additions, no drops — and the 20 foreground/background
pairs that matter were re-measured in both modes: body text 16.1:1 / 15.6:1,
secondary 6.9:1 / 8.9:1, tertiary 5.2:1 / 6.0:1, primary-button labels 5.2:1 /
7.3:1, the send glyph 7.8:1 / 8.0:1.

Two surfaces the shell paints itself are pinned by the skin, because they do not
read the token set: the floating status bubbles (the shell hard-codes `#f4f7ff`
for their text and their 1px edge in **both** modes, which is invisible over the
light artwork), and the usage card the `usage` plugin draws in the sidebar
footer, which ships with a 12px radius and no fill. Both are addressed through
the shell's own hooks (`[class*="bubble"]` excluding its layout wrapper, and
`data-dsh-part="foot-card*"`).

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
