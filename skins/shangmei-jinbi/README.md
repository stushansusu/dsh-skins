# Gold & Mineral (金碧重彩)

English | [中文](README.zh.md)

A dual-theme dsh skin drawn in the Shanghai-animation idiom: one ink keyline
around every shape, flat mineral fills inside, no gradients on surfaces, and
gilt kept for the primary action. The light scheme sits on ochre silk; the dark
scheme switches the ground to indigo so the gilt finally reads as gold.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full
  `--dsw-alias-*` token remap) + `patches.css` (L3 free selectors) + twelve
  in-directory WebP pieces referenced by `contributes.backgroundMedia`. No
  package.json, no build step, no hooks.
- **Two schemes, one drawing**: the light palette is ochre silk with earth red
  as the accent; the dark palette is indigo with the same gilt. A single radial
  light is the only wash on the hero screen.
- **Heavier drops**: hard offset shadows are one step thicker (3px) than usual,
  because the mineral keylines are heavy and a thinner drop is swallowed by the
  line.
- **Seal red is meaning, not decoration**: vermilion is reserved for the user's
  own turns and the pending-approval panel.

## Palette

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#F2E6CE` | `#07142E` |
| Panel | `#FBF2DF` | `#0D2246` |
| Raised | `#E9D5AF` | `#163363` |
| Body text | `#33261A` | `#F2E7CE` |
| Secondary text | `#7B6350` | `#C0A87E` |
| Keyline | `#D5BD92` | `#24406E` |
| Primary | `#A8462A` | `#D9593A` |
| Accent | `#BE9430` | `#E6B855` |

Body-on-panel contrast: 13.17:1 in light, 12.81:1 in dark.

## Assets

`assets/` holds the twelve generated WebP pieces (backdrop, masthead, header,
composer, scroll and sidebar pattern, light and dark of each). All artwork and
code in this skin are the author's original work.

## Preview

`preview/light.jpg` and `preview/dark.jpg` are 1440x900 captures of the skin
applied in the GUI.

## License

This skin is released under CC BY-NC-SA 4.0. See `licenseUrl` in
`skin.json`.

## Install

Copy this directory to `~/.dsh/skins/shangmei-jinbi/` and select it in the
Skin Center.
