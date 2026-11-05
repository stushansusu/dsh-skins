/**
 * The skin-center card: rendered as the content of a first-level settings
 * section, listing the official stock look plus every installed skin in the
 * v2 catalog (package-shipped built-ins + user dirs under $DSH_HOME/skins).
 *
 * v2 architecture (issue #506): skins are pure asset directories loaded by
 * the skin-center runtime. Try-on and apply both go through the same atomic
 * switch engine (src/client/runtime/skin-controller.ts) — try-on simply
 * skips persistence, and apply is one click with NO page reload, no
 * cordis.patch.yml rewrite, no boot-graph regeneration. The "trying on"
 * badge tracks the controller's live state, so closing and reopening the
 * settings panel keeps showing the skin that is still being previewed.
 * Copy rides the standard `t` seat; the theme preview control drives the
 * official theme service (persisted, same as the Appearance row).
 */
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { DelegatedThemeState } from './runtime/delegated-theme.ts'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ThemeSnapshot } from '@deepseek-ai/dsh-client-ui-theme/client'
import type { SkinActivationOptions } from './runtime/skin-controller.ts'
import type { CatalogSkin, SkinRuntimeStore } from './runtime/boot.ts'
import { isDelegatedCatalogSkin } from './runtime/boot.ts'
import type { SkinBackgroundHandle } from './background.ts'
import type { ExternalWallpaperHandle } from './external-wallpaper-handle.ts'
import type { PreviewCoordinator } from './preview-coordinator.ts'
import type { CustomThemeController } from './custom-theme-controller.ts'
import { ExternalWallpaperNotice } from './ExternalWallpaperNotice.tsx'
import { DelegatedSkinCard } from './DelegatedSkinCard.tsx'
import { createDelegatedSkinHandle, type DelegatedSkinHandle } from './delegated-skin-handle.ts'
import { CustomThemeCard } from './CustomThemePanel.tsx'
import { SegmentGroup } from './SegmentGroup.tsx'
import { StepperControl } from './StepperControl.tsx'
import css from './skin-center.module.css'

/** Business face the skin-center apply() injects into the card. */
export interface SkinCenterInjected {
  /** The v2 skin runtime store (controller + catalog). */
  runtime: SkinRuntimeStore
  theme: {
    getTheme(): ThemeSnapshot
    subscribe(listener: () => void): () => void
    setTheme(id: 'light' | 'dark'): void
  }
  /** Background occluder over the shared skin-background namespace. */
  background: SkinBackgroundHandle
  /** The delegated Wallpaper Engine plugin this card points at (issue #39). */
  externalWallpaper: ExternalWallpaperHandle
  /** Skins whose visual is another plugin's (see core/delegated-skins.ts). */
  delegated: DelegatedSkinHandle
  /** One serialized preview session shared by skins, wallpapers and themes. */
  preview: PreviewCoordinator
  /** User palette derived from the official stock theme. */
  customTheme: CustomThemeController
}

/** Plugin-card component props: locale seat + injected face. */
export type SkinCenterComponentProps =
  PropsLocale<'skinCenter'> & SkinCenterInjected

/** The apply target of the official stock-look card. */
const OFFICIAL = 'official'

/** Stand-in for a host that injects no delegated-skin face: nothing is live. */
const INERT_DELEGATED = createDelegatedSkinHandle(
  () => ({ live: false, canYield: false }),
  () => () => {},
)

/**
 * Render the skin-center card: a static header naming the plugin, with the
 * always-visible skin list (official default + every installed skin; try-on /
 * theme preview / one-click apply) rendered below it.
 * @param props - card props.
 * @returns the plugin card.
 */
export function SkinCenter({ t, runtime, theme, background, externalWallpaper, delegated, preview, customTheme }: SkinCenterComponentProps) {
  const snapshot = useSyncExternalStore((listener) => theme.subscribe(listener), () => theme.getTheme())
  const enabled = useSyncExternalStore(background.subscribe, background.enabled)
  const opacity = useSyncExternalStore(background.subscribe, background.opacity)
  const blurEmpty = useSyncExternalStore(background.subscribe, background.blurEmpty)
  const blurContent = useSyncExternalStore(background.subscribe, background.blurContent)
  const inputCardBlur = useSyncExternalStore(background.subscribe, background.inputCardBlur)
  const bubbleOpacity = useSyncExternalStore(background.subscribe, background.bubbleOpacity)
  const bubbleBlur = useSyncExternalStore(background.subscribe, background.bubbleBlur)
  const catalog = useSyncExternalStore(runtime.subscribe, runtime.catalog)
  // Delegated rows render as cards at the head of the page; the grid holds only
  // the asset skins this package loads, each with a preview image to show.
  const delegatedEntries = (catalog ?? []).filter(isDelegatedCatalogSkin)
  const isAssetSkin = (entry: CatalogSkin): boolean => !isDelegatedCatalogSkin(entry)
  const state = useSyncExternalStore(runtime.subscribe, runtime.controller.getState)
  const customThemeState = useSyncExternalStore(customTheme.subscribe, customTheme.getState)
  const activeId = state.active
  const previewing = state.previewing
  const tryingId = state.trying
  const activeEntry = activeId === null ? null : runtime.find(activeId)
  const backdropActive = activeEntry?.manifest.contributes?.backgroundMedia !== undefined
  // A delegated row re-renders on the plugin's own markers, not on the catalog.
  // The handle is a pure read, so a host that renders the card without it
  // gets every delegated row reported as not running rather than a blank card.
  const delegatedSkins = delegated ?? INERT_DELEGATED
  const [delegatedStates, setDelegatedStates] = useState<Record<string, DelegatedThemeState>>({})
  useEffect(() => {
    const read = (): void => {
      const next: Record<string, DelegatedThemeState> = {}
      for (const id of delegatedSkins.ids()) next[id] = delegatedSkins.state(id)
      setDelegatedStates(next)
    }
    read()
    return delegatedSkins.subscribe(read)
  }, [delegatedSkins])
  /**
   * Whether an asset skin this card selected is standing on the delegated
   * plugin.
   *
   * The plugin's markers vanish while it yields, which from out here looks
   * exactly like a plugin that never loaded. The card knows the difference:
   * with the delegated row itself selected, absent markers mean the plugin
   * owns the page; with a real skin selected, absent markers mean the plugin
   * stood down for that skin, which is the handoff working. Stock look
   * (activeId null) is neither, and says so.
   */
  const delegatedSelected = activeEntry !== null && isDelegatedCatalogSkin(activeEntry)
  const assetSkinPainted = activeId !== null && !delegatedSelected
  const paintsOverDelegated = (entry: CatalogSkin, state: DelegatedThemeState | undefined): boolean =>
    assetSkinPainted && activeId !== entry.manifest.id && state?.live !== true
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifySummary, setVerifySummary] = useState<{
    total: number
    valid: number
    issues: number
    repaired?: string[]
    repairFailed?: Array<{ id: string; error: string }>
  } | null>(null)
  const [verifyReports, setVerifyReports] = useState<Record<string, { status: string; hooksTrusted: boolean; mismatches: string[]; missing: string[] }>>({})
  const [confirmUninstallId, setConfirmUninstallId] = useState<string | null>(null)
  const [uninstallingId, setUninstallingId] = useState<string | null>(null)
  // Bulk maintenance (update all / uninstall all). The two buttons drive the
  // existing per-skin repair and uninstall routes one id at a time rather than
  // adding a second mutating endpoint: the report route is the only new
  // surface, and every write still goes through the individually tested path.
  const [bulk, setBulk] = useState<{ phase: 'idle' | 'checking' | 'updating' | 'uninstalling'; done: number; total: number; failed: number; note: string } | null>(null)
  const [uninstallAllArmed, setUninstallAllArmed] = useState(false)
  // Unmount guard: once the card is gone, pending async completions must not
  // setState (the controller itself owns the skin state and lives on).
  const mounted = useRef(false)
  // Latest-click-wins token; a newer click invalidates older completions.
  const requestSeq = useRef(0)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const run = (target: string, action: () => Promise<string | null>): void => {
    const seq = ++requestSeq.current
    setError(null)
    setBusyId(target)
    void action()
      .catch(() => {
        if (!mounted.current || seq !== requestSeq.current) return
        setError(t('applyFailed'))
      })
      .finally(() => {
        if (!mounted.current || seq !== requestSeq.current) return
        setBusyId(null)
      })
  }

  // Try-on and apply are the two activations the user just asked for, so
  // they CLAIM THE STAGE: while the delegated wallpaper plugin renders, one of
  // them still paints once, which flips the public `html[data-dsh-skin]` stamp
  // that plugin keys its hand-back on (issue #49). Every other path - the boot
  // activation, the persisted-selection follower, refresh() - honors the
  // stand-down unchanged.
  const tryOn = (entry: CatalogSkin): void => {
    run(entry.manifest.id, () => preview.runSkin(() => runtime.controller.tryOn(entry.manifest.id, entry, { userInitiated: true })))
  }

  const tryOnOfficial = (): void => {
    run(OFFICIAL, () => preview.runSkin(() => runtime.controller.tryOn(null, null)))
  }

  const exitTryOn = (): void => {
    run(tryingId ?? OFFICIAL, () => preview.runSkin(() => runtime.controller.exitTryOn()))
  }

  const restoreCommittedSkin = async (state: { active: string | null }): Promise<void> => {
    const entry = state.active === null ? null : runtime.find(state.active)
    if (state.active !== null && entry === null) {
      throw new Error(`cannot restore skin ${state.active}`)
    }
    const restored = await runtime.controller.switchTo(state.active, entry)
    if (restored !== state.active) {
      throw new Error(`skin ${state.active ?? 'stock'} did not restore`)
    }
  }

  const switchAndDeactivateCustomTheme = async (
    target: string | null,
    entry: CatalogSkin | null,
    options?: SkinActivationOptions,
  ): Promise<string | null> => {
    const previous = { ...runtime.controller.getState() }
    const active = await runtime.controller.switchTo(target, entry, options)
    if (active !== target) {
      throw new Error(`${target === null ? 'stock theme' : `skin ${target}`} did not activate`)
    }
    try {
      await customTheme.deactivate()
      return active
    } catch (error) {
      try {
        await restoreCommittedSkin(previous)
      } catch (rollbackError) {
        throw new AggregateError([error, rollbackError], 'skin switch cleanup and rollback failed')
      }
      throw error
    }
  }

  const restoreOfficialLook = async (): Promise<string | null> => {
    // The delegated wallpaper plugin owns its own selection, so restoring the
    // stock skin never touches it (issue #39): the skin center only manages
    // skins, the wallpaper keeps rendering behind them.
    return await switchAndDeactivateCustomTheme(null, null)
  }

  /**
   * One-click apply: atomic client-side switch + persisted selection. No
   * reload, no boot-graph wait — the tapIndex adapter makes the next page
   * load boot straight into this skin.
   * @param target - skin id, or `official` for the stock look.
   */
  const applySkin = (target: string): void => {
    if (target === OFFICIAL) {
      run(OFFICIAL, () => preview.runSkin(restoreOfficialLook))
      return
    }
    const entry = runtime.find(target)
    if (entry === null) {
      setError(t('applyFailed'))
      return
    }
    run(target, () => preview.runSkin(() => switchAndDeactivateCustomTheme(target, entry, { userInitiated: true })))
  }

  const tryOnCustomTheme = (): void => {
    run('custom-theme', () => preview.runCustomTheme(async () => {
      const active = await runtime.controller.tryOn(null, null)
      if (active !== null) throw new Error('stock preview did not activate')
      customTheme.tryOn()
      return active
    }))
  }

  const exitCustomThemeTryOn = (): void => {
    run('custom-theme', () => preview.runCustomTheme(async () => {
      customTheme.exitTryOn()
      return await runtime.controller.exitTryOn()
    }))
  }

  const applyCustomTheme = (): void => {
    run('custom-theme', () => preview.runCustomTheme(async () => {
      await customTheme.apply()
      const active = await runtime.controller.switchTo(null, null)
      if (active !== null) {
        await customTheme.deactivate()
        throw new Error('stock theme did not activate')
      }
      return active
    }))
  }

  const handleVerify = async (): Promise<void> => {
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/skin-center/v2/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ autoRepair: true }),
      })
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        total?: number
        valid?: number
        issues?: number
        repaired?: string[]
        repairFailed?: Array<{ id: string; error: string }>
        details?: Array<{ id: string; status: string; hooksTrusted: boolean; mismatches: string[]; missing: string[] }>
      } | null
      if (!res.ok || json?.ok !== true) {
        throw new Error('verify failed')
      }
      if (!mounted.current) return
      setVerifySummary({
        total: json.total ?? 0,
        valid: json.valid ?? 0,
        issues: json.issues ?? 0,
        repaired: json.repaired ?? [],
        repairFailed: json.repairFailed ?? [],
      })
      const map: Record<string, { status: string; hooksTrusted: boolean; mismatches: string[]; missing: string[] }> = {}
      for (const item of json.details ?? []) {
        map[item.id] = item
      }
      setVerifyReports(map)
      if (json.repaired && json.repaired.length > 0) {
        await runtime.refreshCatalog()
        if (activeId && json.repaired.includes(activeId)) {
          const freshEntry = runtime.find(activeId)
          if (freshEntry) {
            await preview.runSkin(() => switchAndDeactivateCustomTheme(activeId, freshEntry))
          }
        }
      }
    } catch {
      if (mounted.current) setError(t('applyFailed'))
    } finally {
      if (mounted.current) setVerifying(false)
    }
  }

  /** Repair every installed skin the market publishes a newer release of. */
  const handleUpdateAll = async (): Promise<void> => {
    setError(null)
    setBulk({ phase: 'checking', done: 0, total: 0, failed: 0, note: '' })
    let targets: string[]
    try {
      const res = await fetch('/api/skin-center/v2/skins/versions', { cache: 'no-store' })
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        rows?: Array<{ id: string; outdated: boolean }>
      } | null
      if (!res.ok || json?.ok !== true || !Array.isArray(json.rows)) {
        throw new Error('versions-unavailable')
      }
      targets = json.rows.filter((row) => row.outdated).map((row) => row.id)
    } catch {
      if (mounted.current) {
        setBulk(null)
        setError(t('marketUnreachable'))
      }
      return
    }
    if (!mounted.current) return
    if (targets.length === 0) {
      setBulk({ phase: 'idle', done: 0, total: 0, failed: 0, note: t('updateAllNone') })
      return
    }
    let done = 0
    let failed = 0
    for (const id of targets) {
      setBulk({ phase: 'updating', done, total: targets.length, failed, note: '' })
      try {
        const res = await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(id)}/repair`, { method: 'POST' })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      done++
    }
    await runtime.refreshCatalog()
    if (!mounted.current) return
    if (activeId !== null) {
      const freshEntry = runtime.find(activeId)
      if (freshEntry) {
        await preview.runSkin(() => switchAndDeactivateCustomTheme(activeId, freshEntry))
      }
    }
    setBulk({
      phase: 'idle',
      done,
      total: targets.length,
      failed,
      note: failed === 0 ? t('updateAllDone', { count: done }) : t('updateAllFailed', { count: failed }),
    })
  }

  /**
   * Uninstall every market-installed skin, including the active one. Builtins
   * are never touched: they ship inside the package and are replaced by
   * upgrading it. The first tap only arms the button, matching the per-skin
   * uninstall affordance, because this cannot be undone.
   */
  const handleUninstallAll = async (): Promise<void> => {
    const targets = (catalog ?? []).filter((skin) => skin.origin === 'user')
    if (!uninstallAllArmed) {
      if (targets.length === 0) {
        setBulk({ phase: 'idle', done: 0, total: 0, failed: 0, note: t('bulkNoUserSkins') })
        return
      }
      setUninstallAllArmed(true)
      return
    }
    setUninstallAllArmed(false)
    setError(null)
    const wasActive = activeId
    const wasTrying = tryingId
    if (wasTrying !== null && targets.some((skin) => skin.manifest.id === wasTrying)) {
      await preview.runSkin(() => runtime.controller.exitTryOn())
    }
    let done = 0
    let failed = 0
    for (const skin of targets) {
      setBulk({ phase: 'uninstalling', done, total: targets.length, failed, note: '' })
      try {
        const res = await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(skin.manifest.id)}/uninstall`, { method: 'POST' })
        if (!res.ok) failed++
      } catch {
        failed++
      }
      done++
    }
    await runtime.refreshCatalog()
    if (wasActive !== null && targets.some((skin) => skin.manifest.id === wasActive)) {
      await preview.runSkin(restoreOfficialLook)
    }
    if (!mounted.current) return
    setBulk({
      phase: 'idle',
      done,
      total: targets.length,
      failed,
      note: failed === 0 ? t('uninstallAllDone', { count: done }) : t('uninstallAllFailed', { count: failed }),
    })
  }

  const handleUninstall = async (entry: CatalogSkin): Promise<void> => {
    const id = entry.manifest.id
    setUninstallingId(id)
    setError(null)
    try {
      if (tryingId === id) {
        await preview.runSkin(() => runtime.controller.exitTryOn())
      }
      if (activeId === id) {
        await preview.runSkin(restoreOfficialLook)
      }
      const res = await fetch(`/api/skin-center/v2/skins/${encodeURIComponent(id)}/uninstall`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      })
      const json = (await res.json().catch(() => null)) as { ok?: boolean } | null
      if (!res.ok || json?.ok !== true) {
        throw new Error('uninstall failed')
      }
      await runtime.refreshCatalog()
      if (mounted.current) setConfirmUninstallId(null)
    } catch {
      if (mounted.current) setError(t('uninstallFailed'))
    } finally {
      if (mounted.current) setUninstallingId(null)
    }
  }

  const dark = document.body.hasAttribute('data-ds-dark-theme')
  // Asset root for the preview thumbnails (the store exposes it; tests that
  // stub the store without it fall back to the default mount point).
  const apiBase = runtime.apiBase ?? '/api/skin-center/v2'

  /** One row: try-on control + apply button + optional uninstall. Shared by the official card and every skin card. */
  const actionButtons = (opts: {
    key: string
    entry?: CatalogSkin
    isActive: boolean
    isTrying: boolean
    onTryOn: () => void
    applyLabel: string
  }): ReactNode => {
    const isUser = opts.entry?.origin === 'user'
    const isConfirming = isUser && confirmUninstallId === opts.key
    return (
      <div className={css.actions}>
        {opts.isActive && !opts.isTrying ? (
          <button type="button" className={`${css.button} ${css.buttonGhost}`} disabled>
            {t('tryOn')}
          </button>
        ) : opts.isTrying ? (
          <button type="button" className={`${css.button} ${css.buttonPrimary}`} disabled={busyId !== null || uninstallingId !== null} onClick={exitTryOn}>
            {t('exitTryOn')}
          </button>
        ) : (
          <button
            type="button"
            className={`${css.button} ${css.buttonPrimary}`}
            disabled={busyId !== null || uninstallingId !== null}
            onClick={opts.onTryOn}
          >
            {busyId === opts.key ? t('loading') : t('tryOn')}
          </button>
        )}
        <button
          type="button"
          className={css.button}
          disabled={busyId !== null || uninstallingId !== null}
          onClick={() => { applySkin(opts.key) }}
        >
          {busyId === opts.key ? t('applying') : opts.applyLabel}
        </button>
        {isUser && (
          isConfirming ? (
            <>
              <button
                type="button"
                className={`${css.button} ${css.buttonDangerConfirm}`}
                disabled={busyId !== null || uninstallingId !== null}
                onClick={() => { if (opts.entry) void handleUninstall(opts.entry) }}
              >
                {uninstallingId === opts.key ? t('uninstalling') : t('confirm')}
              </button>
              <button
                type="button"
                className={css.button}
                disabled={uninstallingId !== null}
                onClick={() => { setConfirmUninstallId(null) }}
              >
                {t('cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${css.button} ${css.buttonDanger}`}
              disabled={busyId !== null || uninstallingId !== null}
              onClick={() => { setConfirmUninstallId(opts.key) }}
            >
              {t('uninstall')}
            </button>
          )
        )}
      </div>
    )
  }

  return (
    <li className={css.pluginCard} data-dsh-plugin="skin-center" data-dsh-part="panel">
      <div className={css.cardHeaderStatic}>
        <span className={css.headText}>
          <span className={css.pluginName}>
            {t('title')}
            <span className={css.titleBadge}>{String(catalog?.length ?? 0)}</span>
          </span>
          <span className={css.cardDescription} title={t('cardDescription')}>{t('cardDescription')}</span>
        </span>
      </div>

      <div className={css.cardBody}>
            {/* The looks other plugins paint lead the page as cards of their
                own: they are installed and managed apart from the asset skins
                below, so they read as neighbours of this page, not entries in
                its grid. Selection waits for the skin center to be on. */}
            <section className={css.pluginLooks} aria-labelledby="skin-center-plugin-looks">
              <h3 className={css.groupHeading} id="skin-center-plugin-looks">{t('pluginLooksTitle')}</h3>
              <div className={css.pluginLookGrid}>
                <ExternalWallpaperNotice t={t} />
                {delegatedEntries.map(entry => {
                  const id = entry.manifest.id
                  return (
                    <DelegatedSkinCard
                      key={id}
                      t={t}
                      skin={entry}
                      theme={delegatedStates[id] ?? { live: false, canYield: false }}
                      isActive={id === activeId && !previewing}
                      isTrying={previewing && id === tryingId}
                      yieldedToSkin={paintsOverDelegated(entry, delegatedStates[id])}
                      selectable={enabled}
                      busy={busyId === id}
                      disabled={busyId !== null || uninstallingId !== null}
                      onTryOn={() => { tryOn(entry) }}
                      onExitTryOn={exitTryOn}
                      onApply={() => { applySkin(id) }}
                      onInstalled={() => { void runtime.refreshCatalog() }}
                    />
                  )
                })}
              </div>
            </section>
            {state.stoodDown && (
              <div className={css.externalWallpaperNotice} role="status">
                <div className={css.externalWallpaperTitle}>{t('stoodDownTitle')}</div>
                <p className={css.externalWallpaperBody}>{t('stoodDownBody')}</p>
              </div>
            )}
            <div className={css.enableRow}>
              <span className={css.enableLabel} title={t('enabled')}>{t('enabled')}</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={t('enabled')}
                className={enabled ? css.switch + ' ' + css.switchOn : css.switch}
                onClick={() => { background.setEnabled(!enabled) }}
              >
                <span className={css.switchThumb} />
              </button>
              <p className={css.enableHint}>{t('enabledHint')}</p>
            </div>
            {enabled
              ? (
                <>
                  <div className={css.head}>
                    <div className={css.toolbar}>
                      <div className={css.themeRow}>
                        <span className={css.themeLabel}>{t('theme')}</span>
                        <SegmentGroup
                          label={t('theme')}
                          options={[
                            { key: 'light', label: t('themeLight'), active: !dark, onSelect: () => { theme.setTheme('light') } },
                            { key: 'dark', label: t('themeDark'), active: dark, onSelect: () => { theme.setTheme('dark') } },
                          ]}
                        />
                      </div>
                      <div className={css.actionRow}>
                      <button
                        type="button"
                        className={css.themeButton}
                        disabled={verifying || busyId !== null || uninstallingId !== null}
                        onClick={() => { void handleVerify() }}
                      >
                        {verifying ? t('verifyingIntegrity') : t('verifyIntegrity')}
                      </button>
                      <button
                        type="button"
                        className={css.themeButton}
                        disabled={bulk !== null && bulk.phase !== 'idle' || verifying || busyId !== null || uninstallingId !== null}
                        onClick={() => { void handleUpdateAll() }}
                      >
                        {bulk?.phase === 'checking'
                          ? t('updateAllChecking')
                          : bulk?.phase === 'updating'
                          ? t('updateAllRunning', { done: bulk.done, total: bulk.total })
                          : t('updateAll')}
                      </button>
                      <button
                        type="button"
                        className={`${css.themeButton} ${uninstallAllArmed ? css.buttonDangerConfirm : css.buttonDanger}`}
                        disabled={bulk !== null && bulk.phase !== 'idle' || verifying || busyId !== null || uninstallingId !== null}
                        onClick={() => { void handleUninstallAll() }}
                      >
                        {bulk?.phase === 'uninstalling'
                          ? t('uninstallAllRunning', { done: bulk.done, total: bulk.total })
                          : uninstallAllArmed
                          ? t('confirm')
                          : t('uninstallAll')}
                      </button>
                      </div>
                    </div>
                    {bulk !== null && bulk.note !== '' && (
                      <div className={bulk.failed > 0 ? css.verifySummaryWarning : css.verifySummarySuccess}>
                        {bulk.note}
                      </div>
                    )}
                    {verifySummary !== null && (
                      <div className={`${css.verifySummary} ${verifySummary.issues === 0 ? css.verifySummarySuccess : css.verifySummaryWarning}`}>
                        {verifySummary.repaired && verifySummary.repaired.length > 0 && verifySummary.issues === 0
                          ? t('verifyRepaired', { count: verifySummary.repaired.length })
                          : verifySummary.issues === 0
                          ? t('verifyAllPassed', { count: verifySummary.total })
                          : verifySummary.repaired && verifySummary.repaired.length > 0
                          ? `${t('verifyRepaired', { count: verifySummary.repaired.length })}, ${t('verifyFoundIssues', { count: verifySummary.issues })}`
                          : t('verifyFoundIssues', { count: verifySummary.issues })}
                      </div>
                    )}
                  </div>

                  <div className={css.backgroundRow}>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('backgroundOpacity')}</span>
                      <StepperControl
                        id="skin-center-background-opacity"
                        min={0}
                        max={100}
                        step={5}
                        unit="%"
                        value={opacity}
                        ariaLabel={t('backgroundOpacity')}
                        onChange={(value) => { background.set(value) }}
                      />
                    </div>
                    <p className={backdropActive ? css.backgroundHint : css.backgroundHintMuted}>
                      {backdropActive ? t('backgroundHint') : t('backgroundHintInert')}
                    </p>
                  </div>
                  <div className={css.backgroundRow}>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('backgroundBlurEmpty')}</span>
                      <StepperControl
                        id="skin-center-background-blur-empty"
                        min={0}
                        max={20}
                        step={1}
                        unit="px"
                        value={blurEmpty}
                        ariaLabel={t('backgroundBlurEmpty')}
                        onChange={(value) => { background.setBlurEmpty(value) }}
                      />
                    </div>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('backgroundBlurContent')}</span>
                      <StepperControl
                        id="skin-center-background-blur-content"
                        min={0}
                        max={20}
                        step={1}
                        unit="px"
                        value={blurContent}
                        ariaLabel={t('backgroundBlurContent')}
                        onChange={(value) => { background.setBlurContent(value) }}
                      />
                    </div>
                    <p className={backdropActive ? css.backgroundHint : css.backgroundHintMuted}>
                      {backdropActive ? t('backgroundBlurHint') : t('backgroundBlurInert')}
                    </p>
                  </div>

                  <div className={css.backgroundRow}>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('inputCardBlur')}</span>
                      <StepperControl
                        id="skin-center-input-card-blur"
                        min={0}
                        max={20}
                        step={1}
                        unit="px"
                        value={inputCardBlur}
                        ariaLabel={t('inputCardBlur')}
                        onChange={(value) => { background.setInputCardBlur(value) }}
                      />
                    </div>
                    <p className={css.backgroundHint}>{t('inputCardBlurHint')}</p>
                  </div>

                  <div className={css.backgroundRow}>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('bubbleOpacity')}</span>
                      <StepperControl
                        id="skin-center-bubble-opacity"
                        min={0}
                        max={100}
                        step={5}
                        unit="%"
                        value={bubbleOpacity}
                        ariaLabel={t('bubbleOpacity')}
                        onChange={(value) => { background.setBubbleOpacity(value) }}
                      />
                    </div>
                    <p className={css.backgroundHint}>{t('bubbleOpacityHint')}</p>
                  </div>

                  <div className={css.backgroundRow}>
                    <div className={css.backgroundHead}>
                      <span className={css.backgroundLabel}>{t('bubbleBlur')}</span>
                      <StepperControl
                        id="skin-center-bubble-blur"
                        min={0}
                        max={20}
                        step={1}
                        unit="px"
                        value={bubbleBlur}
                        ariaLabel={t('bubbleBlur')}
                        onChange={(value) => { background.setBubbleBlur(value) }}
                      />
                    </div>
                    <p className={css.backgroundHint}>{t('bubbleBlurHint')}</p>
                  </div>


                  {error !== null && <div className={css.error}>{error}</div>}

                  <div className={css.list}>
                    <div className={css.skinGrid}>
                    {(() => {
                      const isActive = activeId === null && !previewing && !customThemeState.applied
                      const isTrying = previewing && tryingId === null && !customThemeState.previewing
                      const badge = isActive ? t('active') : isTrying ? t('tryingOn') : null
                      return (
                        <div className={`${css.card} ${css.skinCard}`} key={OFFICIAL}>
                          <div className={css.thumbWrap}>
                            <div className={css.thumbEmpty} aria-hidden="true" />
                            {badge !== null && (
                              <span className={`${css.badge} ${isActive ? css.badgeActive : css.badgeTrying}`}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <div className={css.cardHead}>
                            <span className={css.swatch} style={{ background: '#98a1ab' }} aria-hidden="true" />
                            <span className={css.cardName} title={t('official')}>{t('official')}</span>
                          </div>
                          <div className={css.cardTagline} title={t('officialTagline')}>{t('officialTagline')}</div>
                          {actionButtons({
                            key: OFFICIAL,
                            isActive,
                            isTrying,
                            onTryOn: tryOnOfficial,
                            applyLabel: t('restore'),
                          })}
                        </div>
                      )
                    })()}

                    {(catalog ?? []).filter(isAssetSkin).map(entry => {
                      const id = entry.manifest.id
                      const isActive = id === activeId && !previewing
                      const isTrying = previewing && id === tryingId
                      const badge = isActive ? t('active') : isTrying ? t('tryingOn') : null
                      const report = verifyReports[id]
                      // The thumbnail follows the live light/dark scheme, falling
                      // back to the other variant when a skin ships only one.
                      const previewPath = dark
                        ? (entry.manifest.preview?.dark ?? entry.manifest.preview?.light)
                        : (entry.manifest.preview?.light ?? entry.manifest.preview?.dark)
                      const previewSrc = previewPath === undefined
                        ? null
                        : `${apiBase}/skins/${encodeURIComponent(id)}/${previewPath}`
                      return (
                        <div className={`${css.card} ${css.skinCard}`} key={id}>
                          <div className={css.thumbWrap}>
                            {previewSrc !== null
                              ? <img className={css.thumb} src={previewSrc} alt={entry.manifest.nameEn} loading="lazy" />
                              : (
                                <div
                                  className={css.thumbEmpty}
                                  style={{ background: entry.manifest.accent ?? undefined }}
                                  aria-hidden="true"
                                />
                              )}
                            {report && (
                              <span
                                className={`${css.badge} ${css.thumbReport} ${
                                  report.status === 'valid'
                                    ? css.badgeSuccess
                                    : report.status === 'tampered'
                                    ? css.badgeWarning
                                    : css.badgeDanger
                                }`}
                                title={
                                  report.status === 'valid'
                                    ? t('integrityValid')
                                    : [...report.mismatches, ...report.missing].join(', ') || report.status
                                }
                              >
                                {report.status === 'valid'
                                  ? t('integrityValid')
                                  : report.status === 'tampered'
                                  ? t('integrityTampered')
                                  : report.status === 'missing-files'
                                  ? t('integrityMissing')
                                  : t('integrityHooksRefused')}
                              </span>
                            )}
                            {badge !== null && (
                              <span className={`${css.badge} ${isActive ? css.badgeActive : css.badgeTrying}`}>
                                {badge}
                              </span>
                            )}
                          </div>
                          <div className={css.cardHead}>
                            <span
                              className={css.swatch}
                              style={{ background: entry.manifest.accent ?? '#98a1ab' }}
                              aria-hidden="true"
                            />
                            <span className={css.cardName} title={entry.manifest.nameEn}>{entry.manifest.nameEn}</span>
                          </div>
                          <div className={css.cardTagline} title={entry.manifest.tagline ?? ''}>
                            {entry.manifest.tagline ?? ''}
                          </div>
                          {report && report.status !== 'valid' && (
                            <div className={css.integrityNote}>
                              {[
                                report.mismatches.length > 0 ? `${t('integrityTampered')}: ${report.mismatches.join(', ')}` : null,
                                report.missing.length > 0 ? `${t('integrityMissing')}: ${report.missing.join(', ')}` : null,
                              ].filter(Boolean).join(' | ')}
                            </div>
                          )}
                          {actionButtons({
                            key: id,
                            entry,
                            isActive,
                            isTrying,
                            onTryOn: () => { tryOn(entry) },
                            applyLabel: t('apply'),
                          })}
                        </div>
                      )
                    })}
                    </div>

                    <CustomThemeCard
                      t={t}
                      customTheme={customTheme}
                      scheme={dark ? 'dark' : 'light'}
                      setScheme={scheme => { theme.setTheme(scheme) }}
                      isActive={customThemeState.applied && activeId === null && !previewing}
                      isTrying={customThemeState.previewing}
                      busy={busyId === 'custom-theme'}
                      disabled={busyId !== null}
                      onTryOn={tryOnCustomTheme}
                      onExitTryOn={exitCustomThemeTryOn}
                      onApply={applyCustomTheme}
                    />
                  </div>
                </>
              )
              : (
                <p className={css.offNote} role="status">{t('offNote')}</p>
              )}
          </div>
    </li>
  )
}

/** Props the settings section binds for the skin-center card page. */
export type SkinCenterSectionProps =
  (PropsRuntime<'settings.section'> | PropsRuntime<'web-ui.extension'>)
  & PropsLocale<'skinCenter'>
  & SkinCenterInjected

/** Render the skin-center card as a first-level settings page. */
export function SkinCenterSection(props: SkinCenterSectionProps): ReactNode {
  const { t, runtime, theme, background, externalWallpaper, delegated, preview, customTheme } = props
  return (
    <ul className={css.sectionList}>
      <SkinCenter
        t={t}
        runtime={runtime}
        theme={theme}
        background={background}
        externalWallpaper={externalWallpaper}
        delegated={delegated}
        preview={preview}
        customTheme={customTheme}
      />
    </ul>
  )
}
