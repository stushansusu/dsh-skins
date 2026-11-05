# Agent Note: The 2026-10-28 skin intake round

Status: implemented

## Problem

Ten PRs sat open against `main` with no review record on any of them: four new skins (zzz-zenless #86, md3 and md3-blue #80, pixel-whale #84, whale-watercolour #77), two updates to existing skins (verdandi 1.0.4 #91, endfield-baker #93), a package-size reduction for diy-journal #83, a non-commercial artwork statement for the same skin #82, a delegated-theme handoff for the skin center #85, and the model-dorm floating-surface token fix #68. Every fork PR's CI run was parked at `action_required`, so "required check missing" was an artifact of an unapproved workflow rather than a failing build.

## Decision

**#82 merges; the other nine come back with concrete asks.** The artwork statement carries all four elements the intake gate asks for across NOTICE, both READMEs and ARTWORK.json, removes no existing rights text, and the six-item list in [the diy-journal intake note](2026-10-21-diy-journal-intake.md) does not include "unaffiliated with this repository", so its absence is not a blocker here.

**A recoloured variant is not an independent skin.** md3-blue is pixel-identical to md3 apart from the accent hue, its composer placeholder is unreadable in both modes and its input surface still carries md3's violet. It is rejected for listing under the "no background image, simple recolour only" rule; the recommended shape is an accent variant of md3 rather than a second catalogue entry. md3 itself returns for changes: its preview is a designed mock rather than a running shell, and its dropdown carets sit below the baseline.

**Evidence must be a capture of the change, not a copy of the preview.** #86's `evidence/zzz-zenless-{light,dark}.jpg` are byte-identical to the skin's `preview/{light,dark}.jpg`, and #84's previews are single frames of its background GIF with no DSH surface in them. Both return for a real two-mode capture.

**A two-theme skin whose two themes are the same asset has to say so.** #84 points both `light` and `dark` at `assets/sea.gif` with the same scrim; the light-only precedent recorded on 2026-10-20 requires the manifest and both READMEs to state the single theme, which #84 does not do.

**The aesthetic gate also covers the collision between picture focus and interface focus.** #77 was accepted on 2026-10-20 on contrast measurements alone; this round's look at the rendered shell found the empty-session title crossing the character's eyes, the branch chip landing on the left iris and the composer cutting through the nose. That is a composition defect the earlier measurement could not see, so the acceptance is refined rather than overturned: the skin returns for a background offset or a local scrim.

**#91 returns on code, not on looks.** `patches.css` declares `@keyframes vd-vd-verdandi-chibi-arrive` while the same file animates `vd-verdandi-chibi-arrive`, so the entry animation never runs; `hooks.mjs` moved the asset variables back to inline `body.style.setProperty` and dropped the note recording the skin-center double-activation cleanup bug, which leaves the raster variables without a `:root` fallback empty until the next activation. Its three screenshots are genuine, but none shows a running timer, which is the change the PR is about.

## Consequences

One of ten merged. Each of the other nine carries a specific, checkable ask in its thread, and the two structural rules above (evidence is a capture of the change; a single-theme skin must declare it) now apply to every later intake. Approving the parked workflow runs is what turns the checks from "missing" into green, so the next round should approve them up front instead of reading the empty check list as a failure.

## Alternatives considered

Merging #77 on the strength of the 2026-10-20 acceptance was rejected: that acceptance measured text contrast and did not look at where the interface lands on the artwork, and shipping the current framing puts the store's showcase image across the character's eyes.

Holding #82 until the artwork statement also said "unaffiliated with this repository" was rejected: the diy-journal intake note lists the six statements this repository actually requires, and adding a seventh through a review would make the gate stricter than the note that owns it.

Treating #84's previews as user-visible evidence was rejected: previews of a background animation show the asset, not the skin applied to a shell, which is what the intake template asks for.
