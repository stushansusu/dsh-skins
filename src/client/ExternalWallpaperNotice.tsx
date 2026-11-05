/**
 * External Wallpaper Engine plugin pointer (issue #39, migration round).
 *
 * Wallpaper support no longer ships inside the skin center: it is delegated to
 * `dsh-plugin-wallpaper-engine`. This card leads the skin page beside the
 * delegated-skin cards, so the feature stays discoverable where users look.
 * The plugin is a recommended Workshop item, so the card offers a ONE-CLICK
 * INSTALL through whichever plugin-management face the host publishes
 * (see external-wallpaper-install.ts) and falls back to the copy-command line
 * when the host publishes none.
 *
 * Three states, all driven by the read-only host probe
 * (see src/external-wallpaper.ts):
 *  - not installed, with a management face: the recommended badge plus an
 *    Install button;
 *  - not installed, no face: the copy-command fallback;
 *  - installed: states that wallpapers are configured there, and that an
 *    active wallpaper pauses this card's skin.
 *
 * Nothing renders when the probe cannot be reached, so an older host never
 * shows a false "not installed" prompt.
 */
import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'
import {
  getWallpaperInstallFaces,
  installPluginSpec,
  isInstallSpecValid,
  subscribeWallpaperInstallFaces,
} from './external-wallpaper-install.ts'
import css from './skin-center.module.css'

/** Host base path of the probe (mirrors src/routes-v2.ts). */
const EXTERNAL_WALLPAPER_API = '/api/skin-center/v2/external-wallpaper'

/** The probe payload, as far as this pointer reads it. */
interface ExternalWallpaperPayload {
  ok?: boolean
  installed?: boolean
  packageName?: string
  repository?: string
  installCommand?: string
  /** npm spec the one-click install hands to the plugin manager. */
  npm?: string
}

/** The payload narrowed to what the pointer renders. */
interface ExternalWallpaperState {
  installed: boolean
  packageName: string
  repository: string
  installCommand: string
  npm: string
}

/** Fallbacks used only when the host omits a field. */
const FALLBACK = {
  packageName: 'dsh-plugin-wallpaper-engine',
  repository: 'https://github.com/elysia395/dsh-wallpaper-engine',
  installCommand: 'dsh plugin --profile web add dsh-plugin-wallpaper-engine',
  npm: 'dsh-plugin-wallpaper-engine',
}

/** The copyable command line, used when no management face is available. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Render the delegated-plugin pointer, or nothing when the probe cannot be
 * reached.
 * @param props - the card's locale seat.
 * @returns the pointer, or null.
 */
export function ExternalWallpaperNotice({ t }: { t: PropsLocale<'skinCenter'>['t'] }): ReactNode {
  const [state, setState] = useState<ExternalWallpaperState | null>(null)
  const faces = useSyncExternalStore(subscribeWallpaperInstallFaces, getWallpaperInstallFaces)
  const [installing, setInstalling] = useState(false)
  const [notice, setNotice] = useState<'copied' | 'failed' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(EXTERNAL_WALLPAPER_API)
      .then((res) => (res.ok ? res.json() as Promise<ExternalWallpaperPayload> : null))
      .then((payload) => {
        if (cancelled || payload?.ok !== true) return
        setState({
          installed: payload.installed === true,
          packageName: typeof payload.packageName === 'string' && payload.packageName !== ''
            ? payload.packageName
            : FALLBACK.packageName,
          repository: typeof payload.repository === 'string' && payload.repository !== ''
            ? payload.repository
            : FALLBACK.repository,
          installCommand: typeof payload.installCommand === 'string' && payload.installCommand !== ''
            ? payload.installCommand
            : FALLBACK.installCommand,
          npm: typeof payload.npm === 'string' && payload.npm !== '' ? payload.npm : FALLBACK.npm,
        })
      })
      .catch(() => {
        // Offline, fenced, or a host without the route: stay silent rather
        // than claim the plugin is missing.
      })
    return () => { cancelled = true }
  }, [])

  if (state === null) return null

  // A manager exists when either face is published; installPluginSpec itself
  // prefers the official in-process manager.
  const canInstall = faces.native !== null || faces.family !== null
  const spec = state.npm

  const onInstall = (): void => {
    if (installing || !isInstallSpecValid(spec)) return
    setInstalling(true)
    setError(null)
    setNotice(null)
    const cryptoObj = typeof window === 'undefined' ? undefined : window.crypto
    const requestId = cryptoObj && typeof cryptoObj.randomUUID === 'function'
      ? cryptoObj.randomUUID()
      : 'skin-center-wallpaper-' + spec
    void installPluginSpec(spec, requestId).then((outcome) => {
      // 'installed' needs no message: the probe re-reads on the next mount, and
      // a host that hot-reloads the row reports the new plugin itself.
      if (outcome.kind === 'failed') setError(outcome.message)
    }).finally(() => { setInstalling(false) })
  }

  const onCopy = (): void => {
    void copyText(state.installCommand).then((ok) => { setNotice(ok ? 'copied' : 'failed') })
  }

  // The same card shape as the delegated-skin row beside it: the plugin's
  // name, one line naming the state, the body, then the actions.
  return (
    <div className={`${css.card} ${css.pluginLookCard}`} role="status" data-external-wallpaper="">
      <div className={css.cardHead}>
        <span className={`${css.swatch} ${css.pluginLookMark}`} aria-hidden="true" />
        <span className={css.cardName}>{t('externalWallpaperName')}</span>
        {!state.installed && (
          <span className={css.headPills}>
            <span className={css.delegatedBadge}>{t('externalWallpaperRecommended')}</span>
          </span>
        )}
      </div>
      <div className={css.cardTagline}>
        {state.installed ? t('externalWallpaperReadyTitle') : t('externalWallpaperMissingTitle')}
      </div>
      <p className={css.delegatedDescription}>
        {state.installed
          ? t('externalWallpaperReadyBody')
          : t('externalWallpaperMissingBody', { package: state.packageName })}
      </p>
      {!state.installed && (
        <div className={css.actions}>
          {canInstall && (
            <button
              type="button"
              className={css.button + ' ' + css.buttonPrimary}
              disabled={installing}
              onClick={onInstall}
            >
              {installing ? t('externalWallpaperInstalling') : t('externalWallpaperInstall')}
            </button>
          )}
          {!canInstall && (
            <code className={css.externalWallpaperCommand}>{state.installCommand}</code>
          )}
          <button type="button" className={css.button} disabled={installing} onClick={onCopy}>
            {notice === 'copied' ? t('externalWallpaperCopied') : t('externalWallpaperCopyCommand')}
          </button>
        </div>
      )}
      {error !== null && (
        <p className={css.delegatedStatus} role="alert">
          {t('externalWallpaperInstallFailed', { reason: error })}
        </p>
      )}
      <a
        className={css.delegatedLink}
        href={state.repository}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('externalWallpaperLink')}
      </a>
    </div>
  )
}
