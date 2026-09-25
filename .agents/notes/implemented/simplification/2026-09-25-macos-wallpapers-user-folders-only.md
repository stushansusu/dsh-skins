# Agent Note: macOS wallpapers come from the user's own folders

Status: implemented

## Problem

Wallpaper Engine ships Windows-only, so the skin center originally filled the
macOS inventory by scanning the wallpaper stores macOS itself manages: the
Apple aerial `.mov` wallpapers under `com.apple.wallpaper` / `idleassetsd`,
and the Desktop Pictures `*.heic` set (converted to JPEG through `sips` on a
dedicated `GET /image/<token>` route). Those entries were marked `source:
'system'` and could never be imported.

Two things were wrong with that. Apple's built-in wallpapers are essentially
unused as GUI backdrops, so auto-listing them earned nothing but a crowded
grid; and on macOS the feature still opened *enabled* while its real use —
pointing the panel at a folder of the user's own videos — sat below a list
nobody wanted.

Separately, the panel's Browse button never worked on any platform. The client
read the picker through `ctx.remote.directoryPicker`, but only `remote` was
declared in the plugin's `inject`. A generated Remote namespace is its own
Cordis service (`remote.<namespace>`), not a property of `remote`, so the
context proxy refused the lookup and the panel reported
`cannot get property "remote.directoryPicker" without inject`.

## Decision

**macOS has no built-in wallpaper source.** The macOS scanner
(`src/macos-library.ts`), its test, and the `/image` route with the `sips`
HEIC converter are deleted. `WallpaperType` loses `'image'` and
`WallpaperSource` loses `'system'`, so the vocabulary now describes only
what a Wallpaper Engine library or a user folder can produce. The macOS
library is exactly the folders the user adds, scanned by the existing
`scanManualWallpaperRoot` / `synthesizeMediaEntries` path, which already
turns a folder of `.mp4`/`.webm` files into playable video wallpapers paired
with same-stem previews.

**The feature starts off on macOS.** `defaultWallpaperEnabled(platform)` in
the Host schema returns false for `darwin`, so `skin-wallpaper.enabled`
defaults off there and the switch reads enabled everywhere else. The fallback
in `WallpaperController.readAll` stays `true`: the Host schema owns the
platform default, and `process.platform` must not be read in the browser
bundle. An explicit persisted value still wins on every platform, so an
existing macOS user who had toggled the feature keeps that choice.

**The picker namespace is declared.** `inject` gains
`'remote.directoryPicker'`, matching the official `dsh-client-ui-workspace`
client, which injects the same name before reading `ctx.remote.directoryPicker`.
Naming it parks this plugin until the namespace is really mounted, so
`pickDir` exists precisely when the Host serves it and the browse button stays
hidden where it does not.

## Alternatives considered

- **Keep the macOS scanners but default the feature off.** Rejected: leaves a
  large dead subsystem (a scanner, a HEIC route, an image type) that no
  default ever reaches, and keeps two wallpaper vocabularies alive.
- **Keep only the static Desktop Pictures scan.** Rejected: the static Apple
  artwork is the least wanted half and still needs the `sips` conversion route
  and the `'image'` type for HEIC.
- **Derive the browser default from `navigator`/`process.platform`.** Rejected:
  it re-derives a Host fact in the wrong half and broke every client test that
  mounts a controller with no platform stub.
- **Resolve the picker lazily via `ctx.get('remote.directoryPicker')`.** Rejected:
  it works, but hides the dependency from Cordis' activation graph and diverges
  from the official client's declared-inject precedent.

## Consequences

- A macOS user's persisted selection pointing at a removed `macos-aerial/*` or
  `macos-image/*` entry no longer resolves; `resolveSelection` returns
  undefined, so the wallpaper simply does not mount and the panel re-resolves
  on open. No migration code is needed.
- `/image/<token>` now 404s. Nothing in the shipped client references it.
- The HEIC conversion cache under `<store>/.cache/images` is orphaned on disk;
  it is cheap and never re-read.
- Wallpaper Engine on Windows and Linux is untouched: Steam detection, the
  workshop scan, imports and the manual-folder path behave as before, and its
  enabled default stays `true`.
- The marketplace try-on shell pins `dsh-client-ui-skin-center@0.2.9`, which
  predates the picker, so it carries neither this bug nor this removal.
