# Whale Girl · Rainy Night (鲸鱼娘 · 雨夜)

English | [中文](README.zh.md)

A dark-only dsh skin on a **video background**: a blue-haired girl under a clear
umbrella in the rain, warm street-light bokeh on wet asphalt. The chrome is a **cold
pane of glass in a rainy night — only what is alive glows with the street light**.
Every surface is thin translucent glass with the footage moving behind it, structure is
a 1px ice-blue hairline, and the warm amber is reserved for state.

It is the sibling of [`whale-fantasy`](../whale-fantasy): same character, same shell
language, one colour apart.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (full `--dsw-alias-*` token
  remap) + `patches.css` (L3 free selectors) + one video. No package.json, no build
  step, no hooks.
- **A video background** (`backgroundMedia.type = "video"`): 1920x988, 851 frames,
  35.46s, 32.49 MB (31.0 MiB) — the second skin in this repository to exercise that path.
- **Dark only**: the same dark palette is declared for light and dark, and the skin is
  rendered identically whichever theme the system asks for.

## Palette

| role | value | where it came from |
| --- | --- | --- |
| night | `#0C111A` | the canvas, one step below the night base |
| panel | `#1A2436` | the environment shadow / night base given with the artwork |
| raised | `#243247` | hover surfaces, pills, code blocks |
| hairline | `#2E5388` | the hair base, lifted until a 1px line reads over a bright frame |
| brand | `#38B9E8` | the iris of the eye |
| accent | `#F79C58` | the street-light bokeh — **states only** |
| ink | `#E8F2F5` | body text, the skin base |
| muted | `#A8C0D2` | secondary text (process rows, timestamps) |

The footage was measured rather than eyeballed. Per-frame mean is `rgb(75,93,106)` with
**R − B ≈ −33**: cold blue dominates the frame, and warm pixels (the `#CB8D76` family)
cover only **3.2%**. So the amber is the rare colour by construction, and on screen the
accent lines read as the city lights reflected in the glass.

## The background video

Source clip: the author's **2026-09-29 delivery** of the same take — 35.48s / 1920x1080 /
HEVC / 7.11 Mbps / 31.6 MB, **30 fps nominal but only 24 unique pictures a second** (one
frame in five is a duplicate), with **46px of pure black top and bottom** (`cropdetect`
reports `1920:988:0:46`). Shipping it as-is would let `object-fit: cover` spread those bars
across the viewport and would pay for the duplicated frames twice, so the bake drops them
first.

| step | what happens |
| --- | --- |
| cadence | `fps=24` — the master's duplicated frames are dropped, not encoded |
| crop | `crop=1920:988:0:46` |
| encode | **1920 native width** / 24fps / **CRF 19** / preset slow / **tune film** / level 5.1 |
| grade | **none** — the author's footage is not recoloured |
| loop | the last 1.2s fades to pure black; the source's first frame is already black, so the join is black-to-black: **851 frames / 35.458s / 32.49 MB**, join difference **0.00** |

The clip is a four-stage reveal, which is why it is kept whole: black -> animated
outline -> a grid grows inside the outline -> a scan band converts the grid into the
finished character -> about 28 seconds of finished scene.

**The encode is deliberately lossy, and 32.5 MB is the size the author asked for.** The
first revision of this skin shipped a 48.5 MB / 10.94 Mbps encode of the 2026-09-27 export;
that one blob was 41.7% of every byte in this repository and larger than every other skin's
assets combined, and a repository with no Git LFS makes every clone pay for it. This is the
2026-09-29 delivery of the same take at **CRF 19** — still native width, still one encode —
which lands at 32.49 MB and encodes *better* than the leaner revision it replaces: SSIM
0.991 against 0.984, because the newer master carries less grain for the encoder to spend
bits on.

| setting | bitrate | SSIM |
| --- | --- | --- |
| source stream, whole file | 7.11 Mbps | 1.0 |
| **CRF 19 (shipped) — 32.49 MB whole file** | **7.33 Mbps (whole file)** | **0.9917** |
| CRF 17 | 9.62 Mbps (15-20s sample) | 0.9924 |
| CRF 21 | 5.65 Mbps (15-20s sample) | 0.9892 |

The shipped row is the whole file's own arithmetic (`32,494,969 bytes x 8 / 35.458 s`) and
its SSIM is measured over all 822 picture frames (the 29 tail-fade frames excluded); the
15-20s bright-picture window reads 0.9909 and the alternative rows are 5-second samples,
which is the distinction the first revision's table got wrong — it advertised 12.21 Mbps
for a file that measures 10.94. What the number is measured against matters too: this
bake's master. At frame-aligned instants the 2026-09-27 export carries about 3% more
high-frequency detail than the 2026-09-29 one, but the shipped CRF 19 encode keeps more of
what it is given than the CRF 25 one does, so the picture on screen is not softer than the
revision it replaces (a wash at t=25s, about 2% more detail at t=20s).

Every other number in this README — the compositing regression, the contrast table, the
screenshots — was measured on the first (CRF 17) bake of this same take. The shipped encode
keeps the same 851 frames, moves no geometry and preserves the same high-frequency detail,
so those readings still describe this skin; they have not been re-measured.

An earlier revision of this skin downscaled to 1792 and used CRF 28 (2.5 Mbps, SSIM
0.9699). It was visibly soft and the author caught it immediately — which is why CRF, not
width, is the knob this skin turns. **Do not downscale below the source width**: the
video is composited at about 1939 CSS px wide, so native width is the only 1:1 option.

### Two half-frame traps

Both showed up in the loop self-check, and both pass a naive "join <= p95" gate while
leaving a visible bright seam:

1. **Frame count must not be derived from `Duration`.** ffmpeg prints two decimals:
   `int(round(35.48 * 24))` is 852, the real count is **851**. One frame too many
   truncates the fade at 96.7% and the join jumps to **4.74**.
2. **The fade must end on the last frame's timestamp** (`(frames-1)/fps`), not "the
   moment after the last frame" (`frames/fps`). Off by one frame, the last frame only
   reaches 96.5% and leaves 3% of the picture behind: join **1.69**. Aligned: **0.00**.

### The zero-re-encode alternative

The same black bars can be removed without re-encoding at all:
`-c copy -bsf:v h264_metadata=crop_top=50:crop_bottom=50` rewrites only the SPS
`frame_cropping` rectangle, so the picture is cropped at decode time and the bitstream
stays byte-identical (45.89 MB on the 2026-09-27 H.264 export, zero encodes). It cannot
provide the tail fade, so that variant loops with a hard cut to black every 35.5s, and the
2026-09-29 master is HEVC, where the same trick needs `hevc_metadata`. Both paths are kept
in the authoring script; the shipped one is the fade.

## How far the footage survives compositing

A translucent skin can dim its own background without anyone noticing. The check takes
the decoded video frame and the composited screenshot of the same frame and runs a
least-squares regression between them over a patch of pure picture: the **slope** is how
much contrast survives, the **correlation** is whether the image was smeared.

| | slope | corr |
| --- | --- | --- |
| composited session view | **0.967** | **0.970** |
| other pure-picture regions | 0.986 - 0.998 | 0.985 - 0.997 |

There is no `backdrop-filter` anywhere in this skin. Correlation 0.97 is the scrim's
gradient over the measurement patch plus the shell's own compositing, not blur.

## A real bug this skin fixes (also present in `whale-fantasy`)

The session header's glass used to live on a `::before` of
`[data-dsh-surface='session-header']`. **That element is `display: contents` in the real
shell — it generates no box**, so the absolutely positioned `::before` resolved against
the nearest positioned ancestor, `[data-phase='active']` — the whole conversation column
(1400x1000). A rule meant to fill a 76px band was painting a **58% dark veil over the
entire chat area**.

Measured before the fix: `screen = 0.412 x video + 21.0`, i.e. exactly
`alpha(panel, 0.58)`. Hiding `[data-slot='main']` restored the patch from 49.4 to 63.7
against a decoded mean of 65.0. After moving the glass onto the element that actually
has the band's box (`[data-slot='conversation.header'] > header`, measured
280,0,1400,76), the same regression reads **0.967**.

The merged `whale-fantasy` carried the same rule; this pull request retargets it there
too (`skins/whale-fantasy/patches.css`, with the measurement in that file's comment), so
no skin in the catalog ships the veil.

## The holographic layer

Beyond the token remap, `patches.css` carries the rules that turn the shell's own chrome
into the panel described above:

- **Surfaces** — the engine's ground, its three global darkening coats and the reading
  veil are all zeroed, so the footage is the ground. Panels, menus, the composer card,
  tooltips, approval cards, the settings dialog and the right-hand dock all become glass
  with a 1px hairline; warm corner brackets mark entries and overlays only.
- **State** — the accent is spent only where something is alive: the current row, the
  focused composer, links, hovered icons, the new-session brackets, the left bar of the
  HUD log rows.
- **Icons** — the shell's icon set is already 1px line art, and every stroke resolved to
  one of five shell slate blues; they now rest in the brand blue and turn warm on
  hover/expanded/current.
- **Text** — the generator owns `label-primary/secondary/tertiary/dimmed/caption`; the
  shell re-declares them inside the composer and the session header, and those two scopes
  are re-pointed so the same semantic level does not render at two brightnesses.
- **Fonts** — chrome and readouts in Cascadia Mono with DengXian for the Chinese, plus
  Bahnschrift for the display face; prose stays in the proportional face.

## Accessibility notes

Because the reading veil is gone, contrast is carried by the text's own soft halo. The
numbers below are **glyph-masked**: the text layer is hidden, the screenshot is
differenced to find the actual glyph pixels, and the background is sampled only there
(median over an 9x9 neighbourhood, so the halo counts).

| element | median | worst 15% |
| --- | --- | --- |
| assistant paragraph | 12.1:1 | 7.7:1 |
| new-session label | 10.6:1 | 9.9:1 |
| usage card | 9.9:1 | 8.0:1 |
| model pill | 8.7:1 | 5.4:1 |
| process / tool rows | 3.8:1 | 2.0:1 |
| composer placeholder | 5.5:1 (hero) / 3.4:1 (session) | 2.5:1 |

The composer placeholder is the one element that can fall under 4.5:1, and only where
the footage is at its brightest behind it. The composer card is deliberately not filled
(the footage shows through), so this is the honest cost of that choice.

## Preview

`preview/light.jpg` and `preview/dark.jpg` are the same render — this skin is dark only.
They are captured from the try-on page against the skin's own video, not from a colour card.

## Licence and provenance

| part | where it comes from | rights holder |
| --- | --- | --- |
| skin engineering — `skin.json`, `skin.css`, `patches.css`, the palette and every holographic rule | the author's original work | stushansusu |
| background video — `assets/rainy-night-loop.mp4` | **AI-generated for this skin**: the author wrote the shot-by-shot prompt and supplied the reference still, rendered it with a generative video model, and delivered the master used here on 2026-09-29. No third-party footage, music or illustration is bundled, and none of it is a re-upload | stushansusu |
| character — 「鲸鱼娘」/ Whale Girl | the author's own character line, shared with the sibling skin `whale-fantasy` | stushansusu |

The skin engineering is released under [CC BY-NC-SA 4.0](LICENSE): attribution required,
non-commercial, share-alike. **The artwork — the video and the character design — is not
covered by that licence.** It is the author's own material, published here so the skin can
ship; ask the author before reusing or redistributing it.

This skin is an **unofficial, non-commercial fan work**. It is not created by, affiliated
with, sponsored by or endorsed by DeepSeek, and nothing here grants any right in
DeepSeek's name, marks or logos.
