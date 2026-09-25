# Cafe Roastery (咖啡工坊)

English | [中文](README.zh.md)

A warm, two-theme dsh skin built on a roastery motif. Dark is the espresso
shift: deep-roast bean panels with caramel and cream highlights, like a
roastery still open at midnight. Light is the latte shift: milk-foam panels,
coffee-ink text and caramel interaction — no pure white and no cool hue
anywhere.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full
  `--dsw-alias-*` token remap) + `patches.css` (L3 free selectors) + the two
  background bitmaps the manifest contributes. No package.json, no build step,
  no hooks.
- **Two themes, one room**: the palette is declared for both schemes, so
  `preview/light.png` and `preview/dark.png` are two renders of the same
  roastery, not a recolour of one.
- **Structure**: the hero draws a cup-mouth rosetta with rising steam, the
  composer card is cut like a paper cup sleeve, the sidebar reads as the
  roastery wall, and the right column and session header share the same warm
  sheet and chalkboard underline.

## Palette

- Ground — light: latte foam `#f3e9d2` .. `#efe3c8`; dark: espresso
  `#4a331b` .. `#3f2c19`
- Ink — coffee ink `#3f2c19` on light, cream `#f2e9d4` on dark
- Accent — caramel `#e2a84e`
- Hairlines — `#7d6848` tints on light, `#f2c98a2e` on dark

## Backdrop

`skin.json` contributes one bitmap per scheme through `backgroundMedia`:
`assets/bg-final-latte.png` for light, `assets/bg-final-espresso.png` for
dark, both placed right-bottom.

## Host adaptation (0.1.7)

- **Right column** — painted through the official `[data-rightbar-col]`
  element (which the skin center also stamps `data-dsh-surface="details"`);
  the legacy `[data-slot="details"]` / `[data-pane="details"]` dialects stay
  first so an older host keeps the same paint.
- **Session header** — 0.1.7 stamps `data-dsh-surface="session-header"` on a
  0x0 slot outlet, where a box-shadow paints nothing. The rule anchors the real
  `<header>` under `[data-slot='conversation.header']`, and keeps the legacy
  shape last.
- **Small screens and preferences** — at `max-width: 768px` the
  square-drawn hero rings are dropped and the composer ring thins out;
  `prefers-reduced-transparency` swaps the right column's veil for a solid
  fill, `prefers-reduced-motion` freezes the hero.

## Assets and licence

- `assets/bg-final-latte.png` and `assets/bg-final-espresso.png` were made
  with a text-to-image model for this skin, then selected and finished by its
  author. No third-party material is bundled, nothing is traced from an
  existing work, and the stylesheets reference no remote resources or fonts.
- Rights holder: the skin author (`stushansusu`). Redistribution is covered
  by the repository licence — BSD-3-Clause, see the root `LICENSE`.

## Preview

`preview/light.png` and `preview/dark.png` — the same session in both
schemes.