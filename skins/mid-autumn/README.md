# Osmanthus Moonlight (桂影月华)

English | [中文](README.zh.md)

A dark-only mid-autumn skin for the dsh web GUI: one moonlit osmanthus night
painted across the whole shell, with the interface stepped back to night glass
so the artwork carries the screen. Both colour schemes resolve to the same
treatment, so the two preview slots show two *states* of the skin rather than
two themes — see [Preview](#preview).

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (the full
  `--dsw-alias-*` token remap) + `patches.css` (L3 free selectors) + four
  generated SVGs and two raster backdrops. No package.json, no build step, no
  hooks.
- **Dark-only by construction**: the palette is declared on both `:root` and
  `body[data-ds-dark-theme]`, so the shell renders the same night whether the
  system asks for light or dark, and `html { color-scheme: dark !important }`
  pins the native widgets to match.
- **No second moon**: the backdrop already carries one, so the skin only adds
  furniture.

## Palette

| Role | Value |
| --- | --- |
| Canvas | `#09090C` |
| Panel | `#141419` |
| Raised surface | `#1F1F26` |
| Body text | `#F5EBD5` |
| Secondary text | `#CFC2A6` |
| Border | `#33333D` |
| Accent (osmanthus gold) | `#E7B44E` |
| Attention (jade) | `#6BC6B0` |

Body text on the panel measures 15.50:1 in both schemes.

## Composition

- **Backdrop** — the moonlit night illustration, used by both themes, with a
  three-band scrim that spends its weight on the bright right half and the
  bottom edge so the artwork stays visible where it is dark.
- **Sidebar** — an "indigo outside, gold inside" double rule down the right
  edge, plus a whisper of gold bloom.
- **Hero** — two soft moon glows (one off the canvas's moon, one warm).
- **Masthead** — a full illustration in the top-left panel: moon over
  osmanthus, cloud heads, three sky lanterns, a meander border.
- **Composer** — night glass with a single osmanthus-gold keyline.
- **Conversation header** — night glass with a 1px gold rule along its bottom
  edge.
- **Workspace group rows** — drawn as lantern-riddle tags.
- **User turn** — osmanthus gold outside, jade inside: mid-autumn does not use
  cinnabar, so the "vermillion annotation" is gold and jade instead.

## Preview

`preview/light.jpg` and `preview/dark.jpg` are real renders, not swatches.
The skin is dark-only, so instead of two colour schemes the two slots carry the
two states a user actually sees:

| File | State |
| --- | --- |
| `preview/light.jpg` | the home / hero screen |
| `preview/dark.jpg` | inside a conversation |

## Assets and credits

All artwork in this skin is the author's own, or generated from it by the
author's build script:

- `assets/zq-bg.webp` — the author's moonlit night illustration (the same file
  serves both themes).
- `assets/zq-masthead.webp` — derived from the author's own source image.
- `assets/zq-folder-mooncake.png` — the workspace folder icon, generated from
  the author's artwork.
- `assets/zq-row-tag.svg`, and the sidebar / header / composer rules — drawn
  in-repo by the skin generator.

No third-party assets are bundled. The artwork is redistributed here with the
author's permission.

## Install

Copy this directory to `$DSH_HOME/skins/mid-autumn/` and pick it in the skin
center.
