# Whale Girl - Ink Wash (鲸鱼娘·水墨丹青)

English | [中文](README.zh.md)

A dark-only dsh skin on a **video background**: a sheet of rice paper that ink floods
into from the left, then settles into a still painting. The chrome is drawn as
**five shades of ink with one point of ink-green** - the footage carries no green at
all (0.000 % of its pixels), so that one colour can only come from the interface, and
it is reserved strictly for state. No blur anywhere: matte rice-paper grain where the
workspace needs texture, and a single ink gradient under the workspace rows.

## What it is

| | |
| --- | --- |
| id | shuimo-danqing (order 51) |
| name | 鲸鱼娘 · 水墨丹青 / Whale Girl - Ink Wash |
| theme | **dark-only** - the light half renders the same dark palette |
| background | assets/shuimo-danqing-loop.mp4 - 608 frames / 25.333 s / 1920x1080 / 24 fps / H.264 / 21.54 MB |
| loop | **seamless by construction**: the last 1.2 s cross-dissolves into a clone of frame 0, so the final frame is pixel-identical to the first - **seam 0.01** against a p95 frame step of 8.70 |
| codec | **H.264, re-encoded from the delivered HEVC** - HEVC support in the Chromium family is platform-dependent (measured on one machine: Edge 123 says no, Chrome 154 says yes), and the desktop shell this skin installs into is Electron. The encoder had to change anyway, so the loop is seamed in the same pass; frame count, frame rate, duration and resolution are all untouched |
| textures | assets/sm-paper-grain.webp (2.9 % paper veil), sm-paper-grain-strong.webp (5.7 %) - both procedural, 256x256, lossless |
| fonts | Noto Serif SC / SimSun for prose, KaiTi for headings, Cascadia Mono for readouts |

## The background video

The source the contributor delivered is 25.333 s / 608 frames / 1920x1080 / 24 fps /
**HEVC** / 21.96 MB, and the container metadata says it was exported by ffmpeg
(`encoder: Lavf61.1.100`, `te_is_reencode: 1`, `creation_time 2026-10-05T14:21:51Z`).

Frame by frame the clip runs: t 0.0-2.0 s a full sheet of paper (mean 237.8, uniform
to within 3 levels across the frame), 2.0-6.0 s ink floods in from the left, 6.0-10.0 s
it fills the frame and turns deep blue (mean 58.5), and 10.0-25.333 s a **still
painting** (mean 58-73; the 3x3 block means at t=12/14/18/22 are nearly identical).

**Why the shipped asset is H.264 rather than the delivered HEVC.** HEVC is a
platform-dependent codec in the Chromium family, and shipping it broke the wallpaper on
the machine this skin was developed on. The evidence is two engines asked the same
question on the same machine:

| engine | `hvc1` / `hev1` | `avc1` |
| --- | --- | --- |
| Edge 123 | **empty - not supported** | probably |
| Chrome 154 | probably | probably |

The desktop shell the skin installs into is Electron, which behaves like the first row:
with the HEVC copy installed, the background rendered a frame and stopped.

So the encoder had to change - and once one re-encode is unavoidable, the loop point is
seamed in the same pass. The shipped file comes out of `bake-sm-loop.py bake`
(CRF 20 / preset slow / tune film): the last 1.2 s cross-dissolves into a clone of
frame 0 (`trim` one frame plus `tpad stop_mode=clone`), so the final frame is
pixel-identical to the first. That measures **seam 0.01** where the p95 frame-to-frame
step is 8.70, costs one generation of encoding (SSIM **0.9930** against the source), and
leaves frame count, frame rate, duration and resolution exactly as delivered.

The dissolve reads as "the ink washes out and returns to the paper", not as an
artifact. The delivered clip never comes back to paper on its own - it ends on ink
(mean 67.6) while its first frame is paper (mean 237.8) - so without the dissolve the
loop point is a **171.06** jump once every 25.333 s, twenty times the largest ordinary
frame-to-frame step. Getting the seaming right took three attempts; the two failures
are recorded as `seam 9.84` (reusing the opening 1.2 s, which itself drifts) and
`seam 5.42` (the offset one frame short of the last frame, leaving 2.8 % of ink).

The store ships a skin as a single zip asset and Cloudflare Workers caps one asset at
25 MiB. The margin that matters is the **packaged zip**, not the file: the shipped
`.mp4` is 21,539,098 bytes (20.54 MiB), and the 11 files of this directory zip to
**22,047,529 bytes (21.03 MiB)** in store mode - **3.97 MiB** under the cap.

## The palette: 14 colours, every one with a role

The contributor supplied fourteen hex values. Each one was measured against the
footage (stable segment, Euclidean distance d < 20) and each one has exactly one role:

| role | supplied | in the footage | used for |
| --- | --- | --- | --- |
| canvas (deep ink blue) | #0F1A30 | 25.4 % hit | ground, scrim |
| panel (night blue) | #152747 | 30.0 % | panels, glass, overlays |
| deeper step (long-hair blue-black) | #1B2A44 | 29.0 % | code blocks, wells |
| deep teal (bamboo ink) | #1E3A44 | 11.2 % | accentBg |
| raised (indigo) | #254570 | 9.5 % | hover surfaces, pills |
| structure line (peacock blue) | #35678C | 2.1 % | 1px rules, inset edges |
| brand (water glint) | #6F9CB5 | 0.16 % | solid buttons, borders, links |
| highlight end (long-hair highlight) | #4A7FB0 | 0.06 % | gradient ends, hover edges |
| ink (rice-paper white) | #E8E3D2 | 0.44 % | body text |
| secondary (pale grey ink) | #B8BEB7 | 1.8 % | process lines, timestamps |
| **alive (her eyes, ink-green)** | #3FB460 | **0.000 %** | state only |
| success (ink-green highlight) | #7ED98A | 0.000 % | ok state |
| seal (vermilion) | #D84B3A | 0.067 % | imprints only |
| warn (warm lantern) | #F2A53A | 0.009 % | warnings |

Across the whole clip 79 % of the hue sits inside 210-230 degrees (blue) and warm
pixels are 4.4 % (that is the warm white of the paper). So the green is not in the
picture - like the warm gold of the sibling skin, it can only be added by the
interface:

> skeleton = peacock blue (lines) | alive = **ink-green** (state) | seal = vermilion
> (imprints) | warn = warm lantern

Two adjustments were made on review, both recorded in the notes:

- **Grey-ink.** The surfaces read as a blue user interface rather than as ink, so the
  whole "surface" family (seven colours) is passed through an `inkify()` step that
  mixes each one toward a grey of the **same relative luminance**. The originals stay
  in the source as inputs. Because the luminance is preserved (every colour moves by
  less than 0.002), every contrast pair survives: body/panel 11.57 to **11.67:1**.
  Desaturating with HSV instead would have raised all three channels of a dark blue and
  roughly doubled the canvas luminance.
- **Ink-green, in two steps.** The bright jade green was replaced by an ink-green of
  the same hue (H 137 degrees) at lower saturation and value (#3FB460 to #3D6649). That
  one only reaches 2.28:1 on a dark panel, so green now has two steps, the same
  discipline the blues already followed: the deep one fills, the light one (#6FA87F,
  5.41:1) carries text, icons and the focus ring.

## Design language: five shades of ink, one point of ink-green

The decoration language was rebuilt rather than recoloured (an earlier revision of a
sibling skin was rejected for being a recolour). Sixteen vocabulary changes:

| | sibling video skins | this skin |
| --- | --- | --- |
| line vocabulary | continuous 1px neon lines / 2px dotted | **brush strokes**: a taper plus two uneven dry-brush periods (3px/8px and 7px/18px) |
| corner marks | L-shaped brackets / star nodes | **ink dots** (solid, 0.6px feather, 1.2px falloff) |
| state marker | solid bar / dotted rail | **two-part: one ink dot plus one brush stroke** |
| hover feedback | skewed light sweep / star bloom | **water ripple** (expanding ring) plus an ink bleed |
| workspace folder | nothing | **one ink gradient** (ink loaded at the left, washing out to the right) |
| new session | brand-to-gold solid fill | ink-loaded board with **a drop falling into water** |
| geometry | 8-12px soft / 3px hard | **2px cut-paper edge** |
| borders | the engine's 1px | **drawn borders** (two horizontal brush strokes, menus and new-session) |
| section labels | gold / bright star | **serif small caps plus one vermilion dot** |
| brand row | 2px bar / four-point star | **a vermilion seal** (11px face with two carved strokes) |
| user turn | tinted row, warm left edge | **vermilion annotation**: a red brush stroke plus a red wash |
| the only solid fill | new session | **the send key**, with a rice-paper-white glyph |
| fonts | DengXian plus monospace everywhere | **serif body, kai headings, monospace only for numbers** |
| empty session | nothing / tried and removed | **nothing** - at t=0 the footage is a sheet of paper with no ink on it |

## Readability: both phases have to pass

This footage has two extreme phases and measuring only one of them misses half the
problem - the paper phase (t about 2.0 s, mean 226) covers 26 % of the loop and is what
forced every parameter in this skin to be thicker than in its siblings. Measured on
the real shell, sampling the median composite per region:

| region | paper phase | body contrast | ink phase | body contrast |
| --- | --- | --- | --- | --- |
| sidebar | rgb(68,78,96) | 6.53:1 | rgb(45,59,81) | 8.81:1 |
| conversation column, upper | rgb(86,91,104) | **5.29:1** | rgb(24,36,60) | 12.06:1 |
| conversation column, middle | rgb(70,76,92) | 6.68:1 | rgb(27,41,65) | 11.35:1 |
| composer | rgb(66,72,88) | 7.11:1 | rgb(34,48,71) | 10.33:1 |

Per glyph (median including the text glow): paper phase **8.27-10.20:1**, ink phase
**9.21-11.34:1** across four targets. Three changes were forced by the paper phase:
the panel alpha went from 0.50 to **0.62** (a fully transparent composer drops to
1.1:1 in the paper phase); the scrim was thickened (the first attempt measured only
**4.19:1** in the upper conversation column, where the scrim is thinnest and the
footage is brightest, and body text does not sit on a panel there); and secondary text
inside the conversation column is lifted toward paper white because the raw secondary
colour only reaches 3.59:1 there. Links inside the body use paper-white text with an
ink-green underline, because ink-green on that column is 2.7:1.

There is no backdrop-filter anywhere: a blur drops the correlation between screen
pixels and the decoded frame from 0.996 to 0.87, and it would turn the painting into a
smeared block.

## Rice-paper grain, one ink gradient, a water ripple

Three texture-level elements, all measured, all procedural:

- **Rice paper.** `make-sm-paper.py` builds two 256x256 lossless tiles from fine grain,
  two crossed bundles of long fibres (anisotropy 1.59) and a few stalks. The blur is
  done as a circular convolution in the FFT, so the tiles are seamless by construction
  and the check is mechanical: the four border strips differ from the whole-tile mean by
  0.0036, below 3/255. The soft tile covers the frame, the strong one the sidebar, the
  workspace list and the dock panels. Measured per layer: +4.85 levels and +19 % local
  high-frequency energy for the frame, +9.37 levels and +24 % for the workspace list.
- **The ink gradient under the workspace rows.** Ink is loaded at the left and washes
  out to the right, at 96 degrees (a dead-flat 90 degrees reads as a colour band). The
  three states are three concentrations of the same stroke. A horizontal profile across
  the row, in six slices with no text in them, falls from 60.16 to 48.66 - a drop of
  **11.5 levels**, monotone. An earlier revision used an ink-blot texture and then a
  full-height dry-brush stroke; both were withdrawn, and the reason is written down:
  the row is 34px tall, and **texture needs area** - a water stain or a dry-brush gap is
  compressed into a noisy band at that height, while a gradient has no shape, only
  concentration.
- **The water ripple under new session.** A drop (one ink-green dot) plus two ripple
  sources, drawn with radial gradients whose ring spacing grows (3.4 to 17.8px) and
  whose amplitude decays (0.30 to 0.08), because that is what real water does. On hover
  a ring expands and fades, animated with transform and opacity only, so it stays on the
  compositor. Measured: +2.139 local high-frequency energy (+27 %) from the static
  ripple train, and 12.5 % of the button's pixels change across 420 ms of hovering -
  the water is moving, it is not a still image.

## Verification

Every number above was measured on the real shell, not estimated. The measurements
live with the skin engineering as `diag-sm-coverage.mjs` (0 BARE, 0 LIGHT across five
states), `diag-sm-contrast.mjs` (per glyph, two phases), `diag-sm-phase.mjs` (per
region composite, two phases, without touching the live session) and
`probe-sm-paper.mjs` (per layer A/B for textures and gradients, which need different
criteria: a texture raises local standard deviation, a gradient does not). The official
gate passes with zero warnings.

One measurement bug is worth recording: the coverage probe first reported 22-36 BARE
after the grey-ink pass. Every one was a false positive - the probe still carried the
old night-blue feature colours. It now reads the effective colours out of the skin
itself (`SM_SHELL`), so it cannot go stale again; the same file later reported a single
BARE because it only knew the deep green and not the light one.

## Preview

`preview/light.jpg` and `preview/dark.jpg` are the same render - the skin is dark-only.
Both were taken from the market try-on page against **this skin's own footage**, not from
a colour card.

## Licence and provenance

| part | where it comes from | rights holder |
| --- | --- | --- |
| skin engineering — `skin.json`, `skin.css`, `patches.css`, the 14-colour palette, the geometry, every ink-wash rule and the generators for the two procedural paper tiles | the author's original work | stushansusu |
| background video — `assets/shuimo-danqing-loop.mp4` | **AI-generated for this skin**: the author wrote the prompt and supplied the reference images, rendered it with a generative video model, and exported it with ffmpeg (the container metadata is quoted above). No third-party footage, music or illustration is bundled, and none of it is a re-upload. The shipped file is an **H.264 re-encode** (HEVC to H.264) of that material: the only change to the picture is that the last 1.2 s cross-dissolves into a clone of frame 0, so the loop point is seamed; frame count, frame rate, duration and resolution are unchanged | stushansusu |
| character — 「鲸鱼娘」/ Whale Girl | the author's own character line, shared with the sibling skins `whale-fantasy` (未至之境) and `rainy-night` (雨夜) | stushansusu |

The skin engineering is released under [CC BY-NC-SA 4.0](LICENSE): attribution required,
non-commercial, share-alike. **The artwork — the video and the character design — is not
covered by that licence.** It is the author's own material, published here so the skin can
ship; ask the author before reusing or redistributing it.

**Copyright and compliance responsibility rests with the contributor (stushansusu).**
This skin is an **unofficial, non-commercial fan work**. It is not created by, affiliated
with, sponsored by or endorsed by DeepSeek, and nothing here grants any right in
DeepSeek's name, marks or logos.
