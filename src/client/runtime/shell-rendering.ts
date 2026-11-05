/**
 * Shared shell rendering corrections for every visual mode owned by the skin
 * center (issue #954). The official shell exposes stable slot / composer
 * anchors, while the workspace-list fade itself is still a CSS-module class.
 * Keep that fallback scoped below sidebar.workspaces so an unrelated animation
 * or overlay whose class contains "fade" is never affected.
 *
 * The stylesheet is inert for the stock look: a catalog skin or a custom theme
 * must be active. The wallpaper mode left this adapter with the built-in
 * Wallpaper Engine bridge (issue #39): the delegated plugin owns the shell
 * corrections for its own backdrop, and this plugin's visual work stands down
 * entirely while that plugin renders. The sheet is installed once per runtime
 * and removed with that runtime, so disabling the plugin restores the shell
 * unchanged.
 * @module @linxin666/dsh-client-ui-skin-center/runtime/shell-rendering
 */

/** Marker owned by the shared shell-rendering stylesheet. */
export const SHELL_RENDERING_STYLE_ATTR = 'data-dsh-shell-rendering'

/** Fallback composer seat height for scrollport bottom clearance (px). */
export const DEFAULT_COMPOSER_CLEARANCE_PX = 100

const ACTIVE_VISUAL_SELECTOR = [
  'html[data-dsh-skin]',
  'html[data-dsh-custom-theme]:not([data-dsh-skin])',
].join(', ')

const COMPOSER_SEAT_SELECTORS = [
  '[data-slot="conversation.composer"]',
  '[data-composer-seat]',
  '[data-dsh-surface="composer"]',
]

/** Build the inert-by-default public rendering corrections. */
export function shellRenderingCss(): string {
  const scopes = ACTIVE_VISUAL_SELECTOR.split(', ')
  const scoped = (selector: string): string => scopes.map(scope => `${scope} ${selector}`).join(',\n')
  /* A body child that owns a full-viewport box is the one case where every
     head above is wrong: these are host shells, not skin paint. ${scoped(...)}
     would keep the guard inert exactly where the defect lives (the stock
     install), so this block stays unscoped on purpose. */
  return `
    /* macOS window-drag guard. The official base stylesheet turns every DIRECT
       body child into a "-webkit-app-region: no-drag" region (its selector
       spares only the app's own root element), so a body-level element that
       spans the viewport subtracts the whole window from the macOS draggable
       region and cancels the official [data-window-drag] chrome rows with it:
       the window can no longer be dragged by its title area, and macOS no
       longer runs the system double-click action (zoom to fit the screen)
       there. "pointer-events: none" does not exempt an element from that
       computation - only a declaration of its own does.

       Every element in the list is a shell this runtime mounts as a body
       child and declares non-interactive, so the guard has to be inline here
       rather than imported from the aggregate patch layer (#1907): a
       standalone install of the skin center never loads that layer, and the
       decoration layers below are mounted for the stock look too, which is
       why this rule is NOT scoped under the active-visual heads above.

        - [data-dsh-skin-layer]: the six fixed decoration layers
          (runtime/decoration-layers.ts);
        - [data-dsh-composer-frost]: the composer frost follower
          (runtime/backdrop-scene.ts);
        - [aria-hidden="true"]: the skin backdrop-filter veil, which carries no
          data hook of its own (client/background.ts).

       "initial" is the initial value ("none"), which leaves the element and
       its whole subtree out of the app-region computation; the declaration
       must be !important because the official selector outranks this one. */
    html[data-platform="darwin"] body > :is(
      [data-dsh-skin-layer],
      [data-dsh-composer-frost],
      [aria-hidden="true"]
    ) {
      -webkit-app-region: initial !important;
    }
    /* Viewport lock: prevent outer page scrollbar and viewport
       displacement during element focus/scrollIntoView. */
    ${ACTIVE_VISUAL_SELECTOR},
    ${scoped('body')} {
      height: 100% !important;
      width: 100% !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    ${scoped('[data-slot="sidebar.workspaces"] [class*="_fade"]')} {
      background: none !important;
      background-image: none !important;
    }
    ${scoped('[data-composer-card] textarea[data-phase]::placeholder')},
    ${scoped('textarea[data-dsh-part="composer-input"]::placeholder')} {
      color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      -webkit-text-fill-color: var(--dsw-alias-label-secondary, var(--dsw-alias-label-caption)) !important;
      opacity: 1 !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.input.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] + *')} {
      /* One skin-driven accessory surface for task and statistics docks. Skins
         automatically follow their existing semantic theme tokens and may
         override the --dsh-composer-accessory-* variables for a stronger
         signature without coupling this adapter to a specific catalog skin.

         The third head covers an accessory that is a SIBLING of the dock slot
         host rather than a child of it. The slot host is display: contents, so
         the shell lays its children out as items of the surrounding dock row
         and the child heads reach them; 0.1.7's context meter was placed beside
         that host instead of inside it, so it shared the row with the
         statistics pill but stayed bare (issue #1715) -- one line, two looks.
         The adjacent-sibling head keeps the row uniform without naming any
         hashed class or localized label, and covers whatever future accessory
         the shell seats next to the dock. The plate lands on the accessory's
         own seat, never on a trigger inside it, so a component's own hover
         feedback keeps painting on top. */
      background: var(--dsh-composer-accessory-bg, var(--dsw-specific-tip, var(--dsw-alias-bg-layer-1))) !important;
      color: var(--dsh-composer-accessory-color, var(--dsw-alias-label-tertiary)) !important;
      border: var(--dsh-composer-accessory-border, none) !important;
      border-radius: var(--dsh-composer-accessory-radius, 12px) !important;
      box-shadow: var(--dsh-composer-accessory-shadow, var(--dsw-shadow-lv1, 0 2px 10px rgba(7, 20, 38, 0.18)));
      backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
      -webkit-backdrop-filter: blur(var(--dsh-composer-accessory-blur, var(--dsh-input-card-blur, 10px))) !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] > *')},
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] + *')} {
      /* Same metrics for a dock child and for the sibling seat beside the dock
         slot host, so the two accessories of one row end up the same height:
         the plate must not make one of them look like a different control. */
      margin-top: var(--dsh-composer-accessory-gap, 4px);
      margin-bottom: var(--dsh-composer-accessory-gap, 4px);
      padding-top: 2px;
      padding-bottom: 2px;
    }
    ${scoped('[data-slot="conversation.input.dock"] > [data-goal-bar="true"][data-goal-bar="true"][data-goal-bar="true"]')} {
      /* The host goal dock spans the full composer seat and contains its own
         centered compact bar. Do not paint the outer dock as an accessory: that
         creates a viewport-wide veil behind the active-goal chip. The repeated
         stable marker deliberately raises specificity above catalog-skin dock
         selectors that load after this shared adapter. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.input.dock"] > [data-queue-dock]')} {
      /* The native queue dock stacks two boxes inside the input dock: a root
         wrapper that only supplies the shared dock inset, and the panel inside
         it that paints its own --dsw-specific-tip fill. Painting the wrapper as
         an accessory adds a second opaque plate one dock inset (8px) wider than
         the panel on each side, which reads as an extra sheet of paper under
         the queue (issue #1572). Reset the accessory surface so the panel stays
         the single layer; the wrapper keeps its inset, so the panel remains
         aligned with the composer card. */
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped('[data-phase="active"] [data-slot="conversation.composer.dock"] + *')} {
      /* Dropping blur on the sibling seat only (issue #1757 / dsh-skins#21). The
         adjacent sibling head added for #1715 lands on ContextMeter's seat
         (span.JObwrW_root). A non-none backdrop-filter makes that seat the
         containing block for its position:fixed descendants, causing its hover
         tooltip and click-open panel to resolve against the seat instead of the
         viewport and push 740px+ horizontal scrollable overflow into the
         conversation scrollport (causing scrollbar flicker on mouse enter/leave).
         The seat's background (--dsh-composer-accessory-bg, default --dsw-specific-tip)
         is fully opaque, so the blur on that element is invisible anyway and
         dropping it restores viewport positioning with zero visual change. */
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    ${scoped('[data-conversation-scroll]')},
    ${scoped('[data-dsh-part="scrollport"]')} {
      /* The composer is the scrollport's final in-flow child. Reserving physical
         padding after it lifts the active dock by one composer height and also
         shifts the hero above center. */
      padding-bottom: 0 !important;
    }
    /* #978 / #1133: Line-level scroll-margin retains scrollIntoView() clearance
       above the sticky composer without placing a scrollport-level scroll-padding
       that breaks browser caret-reveal geometry (which caused micro-scrolling on
       every keystroke while reading history). */
    ${scoped('[data-conversation-scroll] [data-chat-anchor-key]')},
    ${scoped('[data-conversation-scroll] [data-chat-flow-kind]')},
    ${scoped('[data-conversation-scroll] [data-dsh-part="message-row"]')},
    ${scoped('[data-conversation-scroll] [data-turn-tail]')},
    ${scoped('[data-conversation-scroll] [class*="_userRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_compactionRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_contextRow"]')},
    ${scoped('[data-conversation-scroll] [class*="_turnErrorRow"]')} {
      scroll-margin-bottom: var(--dsh-composer-height, ${DEFAULT_COMPOSER_CLEARANCE_PX}px) !important;
    }
    /* dsh 0.1.7 turned the right sidebar panel shell into an always-mounted,
       always-visible positioning box (only its inner dockkit surfaces hide
       while the panel is closed). Skin rules written for the older shell plate
       that shell element and, with the panel closed, cover the conversation
       area with a phantom column. Strip paint from the closed shell whatever
       the active skin; an open panel ([data-sidebar-right-open]) keeps every
       skin paint. The attribute predates the layout change, so the rule is a
       no-op on older shells. */
    ${scoped('[data-slot="rightbar.session"] > [data-sidebar-right-panel]:not([data-sidebar-right-open])')} {
      background: none !important;
      background-color: transparent !important;
      background-image: none !important;
      border-color: transparent !important;
      box-shadow: none !important;
    }
    /* #1117: The upstream recommended badge pairs two background-fill tokens
       as bg + text — in dark mode, skins like Blue Fantasy collapse them to
       near-identical dark navy values (contrast ~1:1). Override the text
       color to a readable foreground and tweak the background for contrast.
       The dark-theme attribute lives on <body>, so it belongs inside the
       scoped selector: prefixing the already-scoped list produced
       "body ... html ...", a descendant chain that can never match (#1490). */
    ${scoped('body[data-ds-dark-theme] [data-question-key] [class*="_badge"]')},
    ${scoped('body[data-ds-dark-theme] [data-question-scroll] [class*="_badge"]')} {
      color: var(--dsw-alias-label-primary, #ffffff) !important;
      background: var(--dsw-alias-interactive-bg-active, color-mix(in srgb, var(--dsw-alias-button-info-fill, #4a5fa8) 50%, transparent)) !important;
    }
    /* #102: the fullscreen right-sidebar panel is a 100vw overlay (the same
       element carries --dsh-sidebar-width: 100vw), but every surface inside it
       inherits a translucent fill from the skin: the pane host takes
       --dsw-alias-bg-base (skins commonly remap it to a ~10% tint) and four
       skins paint [data-dockkit-content] at ~34%. With nothing opaque
       underneath, the conversation text reads straight through the document
       preview. Paint the panel itself with the skin own panel colour at full
       alpha, so one rule follows every skin and no skin must declare a new
       token. Relative colour syntax keeps the origin colour's alpha when the
       alpha component is omitted, so the alpha is stated explicitly as / 1;
       the plain declaration before it is the fallback for an engine without
       relative colours (translucent as before, never an unstyled box). Docked (push)
       mode is deliberately untouched: a see-through column beside the artwork
       is the intended look and is not what the report complains about. */
    ${scoped('[data-sidebar-right-panel="fullscreen"]')} {
      background-color: var(--dsw-alias-bg-base, #05070d) !important;
      background-color: rgb(from var(--dsw-alias-bg-base, #05070d) r g b / 1) !important;
    }
    /* #102, same root cause one layer up: the settings dialog own plate is
       --dsw-alias-bg-layer-2, which skins remap anywhere from 42% to 96% alpha,
       so the conversation stays readable through the dialog. Same technique. */
    ${scoped('[data-shortcut-modal="settings"]')} {
      background-color: var(--dsw-alias-bg-layer-2, #ffffff) !important;
      background-color: rgb(from var(--dsw-alias-bg-layer-2, #ffffff) r g b / 1) !important;
    }
  `
}

/** Install the shared corrections and return their idempotent teardown. */
export function installShellRenderingAdapter(doc: Document): () => void {
  if (doc.head === null) return () => {}
  const existing = doc.head.querySelector<HTMLStyleElement>(`style[${SHELL_RENDERING_STYLE_ATTR}]`)
  if (existing !== null) return () => {}

  const style = doc.createElement('style')
  style.setAttribute(SHELL_RENDERING_STYLE_ATTR, '')
  style.textContent = shellRenderingCss()
  doc.head.appendChild(style)

  const win = doc.defaultView
  try { win?.scrollTo?.(0, 0) } catch {}
  const composerSelector = COMPOSER_SEAT_SELECTORS.join(', ')
  let resizeObserver: ResizeObserver | null = null
  let mutationObserver: MutationObserver | null = null
  let observedComposer: Element | null = null
  let appliedHeight = ''
  let scheduledFrame: number | null = null
  let disposed = false

  // The shell mounts one composer seat per conversation; keep the resolved
  // element while it stays connected instead of re-querying the body for every
  // mutation batch (issue #954 follow-up: streaming produced many queries/s).
  const resolveComposer = (): Element | null => {
    if (observedComposer !== null && observedComposer.isConnected) return observedComposer
    return doc.body === null ? null : doc.body.querySelector(composerSelector)
  }

  const syncHeight = (): void => {
    if (doc.body === null) return
    const composer = resolveComposer()
    if (composer === null) return
    if (observedComposer !== composer) {
      if (observedComposer !== null && resizeObserver !== null) {
        resizeObserver.unobserve(observedComposer)
      }
      observedComposer = composer
      if (resizeObserver !== null) {
        resizeObserver.observe(composer)
      }
    }
    const rect = composer.getBoundingClientRect()
    if (rect.height <= 0) return
    const root = doc.documentElement
    const next = `${Math.ceil(rect.height)}px`
    // Skip the custom-property write (and its forced style invalidation) while
    // the measured height still matches what is already applied.
    if (next === appliedHeight || root === null) return
    appliedHeight = next
    root.style.setProperty('--dsh-composer-height', next)
  }

  // Coalesce mutation bursts into at most one measure/write per frame; the
  // disposer cancels whatever is still scheduled.
  const scheduleSync = (): void => {
    if (scheduledFrame !== null || disposed) return
    if (win === null || typeof win.requestAnimationFrame !== 'function') {
      syncHeight()
      return
    }
    scheduledFrame = win.requestAnimationFrame(() => {
      scheduledFrame = null
      if (disposed) return
      syncHeight()
    })
  }

  if (win !== null && typeof win.ResizeObserver === 'function') {
    resizeObserver = new win.ResizeObserver(() => syncHeight())
  }

  if (win !== null && typeof win.MutationObserver === 'function' && doc.body !== null) {
    mutationObserver = new win.MutationObserver(() => scheduleSync())
    mutationObserver.observe(doc.body, { childList: true, subtree: true })
  }

  syncHeight()

  return () => {
    if (disposed) return
    disposed = true
    if (scheduledFrame !== null) {
      if (win !== null && typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(scheduledFrame)
      scheduledFrame = null
    }
    if (resizeObserver !== null) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    if (mutationObserver !== null) {
      mutationObserver.disconnect()
      mutationObserver = null
    }
    observedComposer = null
    appliedHeight = ''
    doc.documentElement?.style.removeProperty('--dsh-composer-height')
    style.remove()
  }
}
