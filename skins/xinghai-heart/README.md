# Heart of the Starry Sea (星海之心)

English | [中文](README.zh.md)

A dark-only dsh skin on a **video background**: a deep-sea starfield that lights up
point by point out of black, with two star blooms at 11.5 s and 18.5 s. The chrome is
drawn as a **star chart** — the footage is pointillist (the stars above the 99.5th
percentile are 2 px across), so the shell is built from **points and dotted rules**
rather than the continuous 1px neon lines of the sibling skins.

## What it is

| | |
| --- | --- |
| id | xinghai-heart (order 50) |
| theme | **dark-only** — the light half renders the same dark palette |
| background | assets/xinghai-heart-loop.mp4 — 679 frames / 22.633 s / 1920x1080 / 30 fps / 14.26 MB |
| loop | seamless: the tail fades to black, the first frame is black, seam 0.00 |
| fonts | DengXian for text, Cascadia Mono for readouts |

## The palette is measured, not chosen

Everything comes from the footage, sampled frame by frame:

| role | colour | where it came from |
| --- | --- | --- |
| trench (canvas) | #03081A | the darkest large area is #00040F; lifted one step |
| panel (deep sea) | #081A3C | the footage's "night" #020C26, lifted to work as glass |
| raised | #122A55 | hover surfaces, pills, code blocks |
| structure line | #1F4C8E | the footage's structure blue #144187, lifted |
| star azure (brand) | #4FA6E8 | between the star blue #2960A9 and the bright star #60A0D2 |
| **warm gold (the heart)** | #F2C46A | **the footage contains 0.000 % warm pixels** — so this one comes from the interface |
| ink | #E9F2FB | the brightest 1 % #9ACAE6, lifted |
| **star (marker)** | #9ACAE6 | the brightest 1 % of the footage, kept verbatim as a third colour role |

Across the whole clip the hue sits 76.9 % inside 210-240°, R-B is about -46, and warm
pixels (R > B+10) are **0.000 %**. The cool structure therefore has nothing to play
against — which is why the warm gold is reserved strictly for **state** (current row,
focused composer, links, hover, node dots), and a third role was introduced:

> skeleton = star azure (lines, mostly dotted) | alive = warm gold (state only) |
> **star point = bright star #9ACAE6 (nodes and corners)**

## Design language: points instead of lines

The first draft of this skin was a colour swap of the sibling skins and was rejected
on sight for exactly that. The decoration language was reworked on evidence from the
footage:

| | whale-fantasy / rainy-night | this skin |
| --- | --- | --- |
| line vocabulary | continuous 1px solid | **dotted: 2px on, 4px off** |
| corners | L-shaped solid brackets | **four star nodes** (radial-gradient dots) |
| state marker | 2px solid bar | **2px dotted rail** |
| hover | skewed light sweep | **star bloom** (radial halo, hollow centre) |
| radius | 8-12px soft corners | **3px chart-like hard edges** |
| section labels | warm gold (same as state) | **bright star** — gold is state-only now |
| brand row | 2px gold bar | **four-point star mark** (cross plus centre dot) |
| empty session | nothing drawn | **nothing drawn** - the footage is the picture |

The empty session draws nothing. An earlier revision put a faint star chart there
(two concentric rings, 12 star points and a 2.4 px warm heart, 16 radial-gradient
layers). Review removed it: on this footage the whole first screen carries only
304 warm pixels (0.018 %), and that single saturated warm dot plus its rings read
as a gold circle decoration rather than as a star chart. The footage is the
picture on the empty session, as in the sibling skins.

## The soft readability layer

The background carries a soft two-layer scrim: a vertical ramp from 54 % to 0.38
(the input card) and a horizontal one that leaves the left 16 % — the near-black
trench the sidebar sits on — almost untouched and rises to 0.24 across the
conversation column. Measured per-glyph contrast (median, worst 15 % in brackets):

| element | before | after |
| --- | --- | --- |
| composer placeholder (session) | 8.16:1 (3.57) | **13.21:1 (8.56)** |
| composer placeholder (empty) | 9.85:1 (4.85) | **11.98:1 (5.92)** |
| assistant paragraph | 16.29:1 (10.73) | **16.68:1 (12.27)** |
| model pill | 9.67:1 (7.38) | **10.63:1 (9.54)** |

It is a gradient, not a blur: a backdrop-filter would destroy the wallpaper (screen
pixels versus the decoded frame drop from 0.996 to 0.87 correlation). The cost is
measured too — the conversation column now shows about 59-77 % of the footage.

## Why the video is 14.26 MB

The store ships a skin as a single zip asset and Cloudflare Workers caps one asset at
25 MiB. The first bake of this skin (the source bitstream, copied without re-encoding)
was 21.01 MB and had a hard cut at the loop point; the seamless CRF 15 bake was
29.47 MB, which does not fit. The shipped bake is 30 fps native, 1920 native width,
CRF 21 / tune film, tail faded to black: 14.26 MB and **SSIM 0.9932** against the
source, which is above the 0.9917 the accepted rainy-night bake carries.

## Verification

Every number above was measured on the real shell, not estimated: fidelity regression
(screen versus decoded frame), per-glyph contrast, and a coverage sweep that compares
every visible element's computed paint against the palette (0 BARE, 0 LIGHT across
five states). The official gate passes with zero warnings.

## Attribution and licence

- **Skin engineering** (skin.css, patches.css, the palette, the geometry and the
  point-based decoration language): original work by the author, stushansusu.
- **Footage: AI-generated.** The author declares the background video is a
  generative-video-model render, from the same pipeline as their 雨夜 (Whale
  Girl - Rainy Night) skin: the author's own prompts and reference images, not a
  repost, no third-party material. It was cut and delivered from CapCut /
  JianYing desktop, and the source file carries that export metadata
  (product=lv, os=windows, editType=default, videoId
  5360006b-7b52-417b-ab72-156b8a38411c).
- The shipped loop is derived from that source with bake-xh-loop.py; the numbers
  are in the background-video section above.
- The artwork is carved out of the CC BY-NC-SA 4.0 grant that covers the
  engineering; **rights remain with the original rights holder**.
- **Personal, non-commercial use only. Unofficial work, not affiliated with this
  repository.**
