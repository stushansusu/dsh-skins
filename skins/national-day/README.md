# National Day (国庆 · 山河华灯)

English | [中文](README.zh.md)

A dual-theme dsh skin built from two paintings: the light scheme rides a sunlit
Great Wall in autumn, the dark scheme rides a Forbidden City night of fireworks
and lanterns. The two palettes share no constants — this is not one set of
values lit two ways, it is two independent colour lines.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full
  `--dsw-alias-*` token remap) + `patches.css` (L3 free selectors) + three
  in-directory pieces. No package.json, no build step, no hooks.
- **The interface gives the painting room**: the sidebar and details column drop
  the engine's opaque wall fills for same-hue glass; on the Windows desktop the
  shell paints an opaque fill on the whole app frame, which this skin clears so
  the supplied artwork can show through.
- **Workspaces become fading five-star-flag banners** (flag red solid on the
  left, gone by the right edge, gold star at the pole, name centred), the
  composer gets a hairline brand edge, and its four pills share one capsule.
- **The conversation view carries a reading veil**, with three secondary-text
  tokens re-derived for the veiled ground — before that, the 13px process-row
  text measured 2.06:1 over the daylight painting.

## Palette

| Role | Light · autumn mountains | Dark · Forbidden City night |
| --- | --- | --- |
| Canvas | `#F7F0E3` | `#0B1020` |
| Panel | `#FFFCF5` | `#141A2E` |
| Raised | `#EFE3CF` | `#1E2542` |
| Body text | `#241A11` | `#F4EDE0` |
| Secondary text | `#7B6A52` | `#A99C86` |
| Keyline | `#DAC9AC` | `#2E3654` |
| Primary | `#BE2A26` flag red | `#E04A3C` lantern red |
| Accent | `#C8871F` maple gold | `#F2C55C` firework gold |

Body-on-panel contrast: 16.65:1 in light, 14.82:1 in dark.

## Two themes, two paintings

| | Light · autumn mountains | Dark · Forbidden City night |
| --- | --- | --- |
| Backdrop | blue sky, Great Wall in mist, red maple, flag | night sky, corner tower, fireworks, lanterns, ginkgo |
| Brand | flag red | lantern red |
| Accent | maple gold | firework gold |
| Body | warm ink | warm white |

## What the skin styles

| Surface | Treatment |
| --- | --- |
| "Workspaces" group heading | grey text promoted to a brand-coloured label (600 weight, 0.08em) |
| Brand row | "DSH local build" becomes **鲸鱼娘·人民万岁** (Noto Serif SC 700) |
| The three header icons | no resting fill; brand-tinted fill and glyph on hover |
| Workspace group rows | a **fading five-star-flag banner**: flag red solid at the left, gone by the right edge, gold star at the pole, name centred |
| Expanded group row | the same flag, denser, plus a 3px **gold** left bar |
| Session rows | resting is a looser body tone; the selected row gets a brand fill and left bar |
| Composer card | 1px brand hairline and a drop; focus adds a bright edge and a 4px halo |
| The four pills below the card | workspace / agent preset / model / access mode share one capsule, brand on hover |
| Conversation view | reading veil (not on the hero screen) and three re-derived secondary-text tokens |
| Conversation header | one step of themed glass plus a brand-coloured bottom edge |
| Workspace search, expanded | paper fill with a brand hairline |
| App frame | cleared on the Windows desktop so the painting shows (the titlebar drag strip stays) |

Every selector goes through ARIA (`role=treeitem[aria-expanded]`,
`[aria-selected]`) or an official `data-slot`; no hashed class names.

**The five-pointed star** replaces the shell's folder glyph: the shape lives in
the SVG's `d`, which CSS cannot reach, so the span keeps the svg as a spacer
with `visibility: hidden` and paints the star itself from `mask-image`. It may
not be `display: none` — the span's width comes from that svg, and hiding it
pulls the whole column 16px left.

**Once the background turns red, the gold has to be recomputed.** Maple gold
`#C8871F` sits at 1.6:1 on flag red, which is invisible; the star gold lifts it
45% toward white for 4.9:1 in light and 5.6:1 in dark.

## Assets, provenance and responsibility

`assets/` holds three pieces.

| File | What it is | Where it comes from |
| --- | --- | --- |
| `gq-light-bg.webp` | daylight backdrop (blue sky, Great Wall, autumn maples) | **AI-generated** |
| `gq-dark-bg.webp` | Forbidden City night backdrop (fireworks, lanterns) | **AI-generated** |
| `gq-star.svg` | five-point star mask for the workspace group rows | drawn for this skin (vector, not generated) |

The two backdrops are **AI-generated artwork**, not hand-drawn originals. The
contributor generated them on 2026-09-24 with OpenAI's **gpt-image** through the
ChatGPT image service; the character 「鲸鱼娘」 shown in them is part of that same
generated batch. The unmodified source PNGs carry the C2PA content credential
issued by OpenAI
(`softwareAgent = ChatGPT / gpt-image`, `digitalSourceType = trainedAlgorithmicMedia`);
the WebPs shipped here are re-encodes that no longer carry that manifest, and the
sources are retained by the contributor. `gq-star.svg` is a vector mask drawn
for this skin, not generated.

**Rights and responsibility.** Copyright and compliance responsibility for these
assets rest with the contributor (`stushansusu`), who declares that they hold the
right to distribute this skin and its assets under CC BY-NC-SA 4.0. Anyone
reusing the artwork commercially must clear that separately.

## Preview

`preview/light.jpg` and `preview/dark.jpg` are 1440x900 captures of the skin
applied in the GUI.

## License

This skin is released under CC BY-NC-SA 4.0. See `licenseUrl` in `skin.json`.
The licence is granted by the contributor, who also carries the copyright and
compliance responsibility for the assets described above.

## Install

Copy this directory to `~/.dsh/skins/national-day/` and select it in the Skin
Center.
