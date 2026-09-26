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

## Host compatibility

Written against DSH 0.1.7:

- Shadows are bound on **both** `--dsw-alias-shadow-lv*` and the un-prefixed
  `--dsw-shadow-lv*` names that the shell reads.
- The skin deliberately sets **no** `height` / `min-height` on
  `[data-dsh-frame]`: the host already sizes the frame at `100dvh`, and forcing
  it back to full height would break skins that shorten the frame to make room
  for HUD bars.
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
