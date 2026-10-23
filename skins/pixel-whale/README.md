# Pixel Whale Sea

[中文](README.zh.md) | English

A top-down pixel ocean. A whale girl floats on her back and swims a slow S-curve; the
sidebar is raining.

The water is computed, not painted: twelve sea tones, broken crest lines and drifting
spray are resolved per pixel on a 256×144 canvas and upscaled with nearest-neighbour, so
every cell on screen stays hard-edged. The whale girl is a pixel cut of an illustration
— forty pixels long, ten colours, one dark outline — lying flat on the water, her body
rolling with each stroke.

## What this is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full `--dsw-alias-*` token
  remap) + `patches.css` (L3 selectors) + generated GIF/SVG. No package.json, no build
  step, no hooks.
- **A dark skin**: light and dark both render the same night sea; `skin.css` pins all 96
  official alias tokens to the deep-sea palette, so the two modes cannot drift apart.

## Layers

| Layer | File | Notes |
| --- | --- | --- |
| Sea | `assets/sea.gif` | 256×144, 500 frames, 16.7 fps, 30 s loop |
| Settings | `assets/sea-plain.gif` | same sea without the swimmer, 192×108 |
| Rain | `assets/rain-a.gif`, `rain-b.gif` | 160×220 transparent GIFs, 4 s loops, offset |
| Workspace | `assets/*.svg` | dither grid, waterline, whale mark, corner brackets, bubbles |

The loop is arithmetically seamless: wave phases, the swim path and the stroke beat are
all integer multiples of the 500-frame cycle, so frame 501 is frame 1. Each raindrop
completes a whole number of falls in its 4 s loop, splash included.

## Palette

| Role | Value |
| --- | --- |
| Deepest water | `#050C15` |
| Crest | `#55A3AC` |
| Spray / highlight | `#86CDC9` |
| Character base | `#245AB4` |
| Outline | `#0A1522` |
| UI accent | `#3FB3A9` |

Twelve sea tones, twelve character tones and four vignette levels fill 96 palette slots,
well inside the 256-colour GIF ceiling.

## Workspace

The sidebar carries an 8 px dither grid, a stepped waterline along its bottom edge and a
20×10 pixel whale mark in the corner — all on the element's own `background-image`, so
they always sit behind the content. The composer card is squared with a 1 px teal border,
a 3 px hard drop shadow and four corner brackets; scrollbars become 6 px rails; every SVG
drops its anti-aliasing and squares its stroke caps.

## Notice

The character "Whale-chan" (jyn) is a fan design; the illustration was supplied by the
contributor and only the downsampled 40×30 pixel sprite ships here. See [NOTICE](NOTICE).
