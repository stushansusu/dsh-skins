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
| empty session | nothing drawn | **a faint star chart**: two rings, a 12-star chain, one warm heart |

The star chart on the empty session is pure CSS: the engine forces
background-size: 100% 100% after this rule, so positions go inside each layer's
circle at X% Y% instead of a position list — 16 radial-gradient layers
(2 rings, 12 stars, 1 halo, 1 heart).

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

See the attribution field in skin.json. The skin engineering is the author's own; the
footage was delivered by the author. Licensed CC BY-NC-SA 4.0 for the engineering; the
artwork is carved out of that grant. This is an unofficial, non-commercial work with no
affiliation to this repository.
