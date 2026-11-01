# Agent Note: The 2026-11-01 skin intake round

Status: implemented

## Problem

Nine PRs sat open against `main` at the start of the round:
- Four new skins: zzz-zenless #97, pixel-whale #84, md3 #80, and whale-watercolour #77.
- Two updates to existing skins: endfield-baker #93 and verdandi 1.0.4 #91.
- One package-size reduction: diy-journal #83.
- One skin center source handover protocol: diy-journal #85.
- One floating-surface token fix: model-dorm #68.

Approving two parked workflow runs for #97 and #80 enabled their primary CI checks to turn green. Zero PRs were merged this round.

## Decision

**#83 (diy-journal) clears all three intake gates but is held by branch synchronization.**
- Gate 1 (evidence): submitted evidence files match git assets byte-for-byte.
- Gate 2 (rights): copyright notices and the #82 non-commercial rights statements are preserved verbatim.
- Gate 3 (aesthetics): pixel-by-pixel aesthetic audit confirms that SVG assets with stripped embedded images match original bytes, alpha transparency matches pixel-by-pixel, and rendering achieves 36.2 dB PSNR. Directory size drops from 102,794,469 B to 39,390,921 B (-61.7%).
- Maintainer approval was granted, but GitHub rejected the merge because the branch sits 26 commits behind `main` (`Head branch is out of date`).

**#91 and #97 return with required changes.**
- #91 (verdandi 1.0.4) resolved both previous code issues: dual-prefixed keyframes were removed, and `hooks.mjs` `setProperty` was restricted to the teardown path with dual-activation comments restored. However, evidence diverges from the code: the sole screenshot of the running-line takeover displays the host completed state ("已完成，用时 6 秒") rather than the contracted takeover phrases ("深度求索中" and "Deep diving"). Light mode lacks evidence entirely, leaving `preview/light.jpg` on the 1.0.3 asset. Visible tiara height varies by nearly 2x across screenshots, indicating disparate CSS sources; two framed avatars are cropped ~38% by `background-size: 162%`; and `patches.css` is minified into a 54,873-character single line stripping all 48 comments (unique among all 62 repository skins). While `packages/dsh-market` stores `version` as `assetVersion` at install time rather than using semver to detect updates—meaning users still receive updates—omitting a version bump remains a release hygiene failure.
- #97 (zzz-zenless) passes Gate 1 (evidence and preview files differ in bytes; embedded description images match git tree sha256) and conditionally passes Gate 2 (Zenless Zone Zero key visual with character, work, and © miHoYo/HoYoverse non-commercial fanwork attribution in NOTICE, `skin.json`, and README without claiming authorization). Gate 3 fails: all four screenshots include an extraneous chibi whale character rendered by the pet plugin, contradicting the claim that no third-party assets are bundled; light mode `--dsw-alias-label-tertiary` `#8a8a93` against rice-paper `#eeebe2` measures 2.64:1 contrast (2.87:1 theoretical); the DATA BANK nameplate overlaps session list items by two characters; version is set to 8.7.11; accent `#FFD84D` conflicts with rendered `#d4cf01`; token count is 107 versus 127/119 measured; `skin.css` self-references break L1-only loading; and the template checklist is missing.

**#68 receives a deadline; #80, #77, and #84 receive narrowed action items.**
- #68 (model-dorm) passes code review (76 `--dsw-*` declarations, 1:1 mode parity, 26 tokens collapsed to 2), but floating-surface evidence has been missing across four rounds, with current evidence byte-identical to pre-change preview; a deadline of 2026-11-15 is set before closing as stale.
- #80 addressed two items; only dropdown caret baseline alignment remains.
- #77 corrected code; evidence must be updated to reflect the new scrim.
- #84 addressed two items; description still carries contradictory "no GUI overlays" text, and character 40px legibility plus `sea-plain.gif` (3.25 MB) remain unaddressed.
- #93 and #85 maintain prior review demands (#93 four feedback items unanswered, evidence stuck at empty landing page; #85 unresolved conflicts and unanswered question on versioned install source).

## Consequences

Zero skins were merged or listed, and the pinned submodule gitlink in `dsh-web` remains unchanged. The market continues serving the previous release.

#83 awaits only an author branch rebase; #91, #97, #80, #77, and #84 have unambiguous itemized checklists; #68 operates under an explicit expiration date.

## Alternatives considered

Merging #83 with `--admin` to bypass branch policies was rejected: while rulesets permit owner bypass, the 2026-10-28 precedent explicitly forbids overriding branch protection.

Accepting #91's single-line `patches.css` as a permissible formatting choice was rejected: although tolerated previously, stripping all 48 comments across 54,873 characters creates an unreviewable outlier among all 62 skins.
