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
  35.46s, 48.5 MB — the second skin in this repository to exercise that path.
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

Source clip: **35.48s / 1920x1080 / 24fps / 10.35 Mbps / 47.3 MB** with **46px of pure
black top and bottom** (`cropdetect` reports `1920:988:0:46`). Shipping it as-is would
let `object-fit: cover` spread those bars across the viewport.

| step | what happens |
| --- | --- |
| crop | `crop=1920:988:0:46` |
| encode | **1920 native width** / 24fps / **CRF 17** / preset slow / **tune film** / level 4.1 |
| grade | **none** — the author's footage is not recoloured |
| loop | the last 1.2s fades to pure black; the source's first frame is already black, so the join is black-to-black: **851 frames / 35.458s / 48.52 MB**, join difference **0.00** |

The clip is a four-stage reveal, which is why it is kept whole: black -> animated
outline -> a grid grows inside the outline -> a scan band converts the grid into the
finished character -> about 28 seconds of finished scene.

**The encode is not lossy relative to the source.** It was picked by measurement, not by
habit:

| setting | bitrate | SSIM |
| --- | --- | --- |
| source video stream | 11.36 Mbps | 1.0 |
| **CRF 17 (shipped)** | **12.21 Mbps** | **0.9922** |
| CRF 14 | 18.39 Mbps | 0.9943 |

An earlier revision of this skin downscaled to 1792 and used CRF 28 (2.5 Mbps, SSIM
0.9699). It was visibly soft and the author caught it immediately — which is the reason
this table exists. **Do not downscale below the source width**: the video is composited
at about 1939 CSS px wide, so native width is the only 1:1 option.

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
stays byte-identical (45.89 MB, zero encodes). It cannot provide the tail fade, so that
variant loops with a hard cut to black every 35.5s. Both paths are kept in the authoring
script; the shipped one is the fade.

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

The merged `whale-fantasy` still carries the old rule and therefore still has the veil;
the same one-line retarget applies there. Happy to send it as a follow-up.

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
They are captured from the try-on page against the shipped video, not from a colour card.

## License

The skin engineering (`skin.json` / `skin.css` / `patches.css`, the palette and every
holographic rule) is the author's original work. The background video was provided by
the author as source footage and processed by the bake pipeline described above. Both are
released under [CC BY-NC-SA 4.0](LICENSE): attribution required, non-commercial,
share-alike.
