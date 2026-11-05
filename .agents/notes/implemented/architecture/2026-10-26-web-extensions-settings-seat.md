# Agent Note: Skin Center Web Extensions settings seat

Status: implemented

## Problem

Skin Center needs to share the Web Extensions settings parent without breaking standalone installs. Its long stack of library, theme and background controls underuses wide settings panels, and positional skin patches misidentify pages as soon as another plugin changes the first-level navigation roster.

## Decision

The skin page registers into `web-ui.extension` with key `skin-center` when `webUiExtensions` is available and otherwise retains its first-level `settings.section` id `skin-center`, order 120. One slot-change reconciliation loop owns the migration and keeps exactly one live entry. Keyed registrations carry no list-only id, order or label.

On wide containers the card body is a two-column grid: the library toolbar, delegated rows, preview grid and custom theme stay in the main column, while background and blur controls form a compact side column. Narrow containers restore one column and the preview grid remains responsive. All activation, preview, maintenance and background behavior stays on the existing controller and business face.

The settings card exposes `data-dsh-plugin="skin-center"`. DIY Journal selects Web, skin, pet, Workshop and usage decorations through semantic panel roots instead of first-level `nth-child` positions. The Web selector excludes panels containing a different integrated child, so the shared parent does not masquerade as the Web Plugins TAB.

## Alternatives considered

- Permanent integration without a legacy seat. Rejected because it removes the settings page from standalone installs.
- Splitting background controls into a separate settings section. Rejected because it would separate related appearance actions and add navigation rather than reduce it.
- Keeping positional illustration selectors. Rejected because third-party plugins make positions unstable and the integrated parent remains mounted for every child TAB.

## Consequences

- Full family installs show Skins inside Web Extensions; standalone installs keep the original entry.
- `tests/extension-seat.spec.ts` pins migration, while existing Skin Center suites cover activation and layout composition.
- The semantic-attributes contract records the parent and child roots, and skin-specific decoration no longer depends on navigation count.
