/**
 * The delegated-skin row: a skin whose visual is another plugin's.
 *
 * It renders where the wallpaper controls used to live and where a skin's own
 * card lives now, because it is both: it is a selection (apply it, and it is
 * remembered across a reload) and an install prompt (the plugin that paints it
 * is a separate package). The row is listed whether or not that package is
 * installed, because an installed-and-enabled plugin that the card hid until
 * the user went to the store is a plugin nobody finds.
 *
 * It sits in the plugin-looks group at the head of the page, beside the
 * Wallpaper Engine card, not among the skin tiles: it has no preview image
 * (the plugin paints, and this package holds no screenshot of it), so a tile
 * sized for a 16:9 thumbnail would be mostly empty. It carries the same
 * head / description / actions shape as the card beside it, and the catalog
 * tagline stays off the card because the localized description already says
 * what applying it gives you.
 *
 * The body is the LOOK, not the row's state: a short description of what
 * applying it gives you. State belongs to the badge (this row is active) and
 * to the buttons (you can pick it, or you cannot, and here is the button that
 * fixes that). Prose about the row's own state sat where a reader looks for a
 * description of the theme, and said nothing they could not already see.
 *
 * Two states still earn one line each, because in both the row withholds the
 * selection buttons and silence would read as a bug: a plugin that cannot hand
 * the page back yet, and a descriptor the installed package has outgrown.
 *
 * Three states, all read from two sources and never guessed:
 *
 *  - not installed: the one-click install through whichever plugin-management
 *    face the host publishes, or the exact command when it publishes none;
 *  - installed but not live: the plugin is wired into this profile but its
 *    browser half is not on the page, so this row cannot paint yet. The row
 *    says so instead of offering an apply that would deliver nothing;
 *  - live: the plugin paints. Try-on and apply are offered, because from here
 *    the selection is a normal one and every other skin, the stock look and a
 *    running wallpaper all take the page back.
 *
 * A live plugin that does NOT advertise the handoff attribute is a build that
 * cannot stand down. Offering apply on it would let the user select this skin
 * and then pick a real skin over it, which is the broken overlap the whole
 * delegation exists to prevent, so the row says the plugin has to be updated
 * and still lets them look at it.
 *
 * The state that needs care is ABSENT markers while a skin is painted. That is
 * what a working handoff looks like from out here: the plugin is installed,
 * running, and standing down because this card's own skin owns the page. Read
 * as "not running" it both lies and strands the reader — no buttons, no way
 * back — so the row takes {@link DelegatedSkinCardProps.yieldedToSkin} from the
 * card (which knows what is painted), says the plugin yielded, and keeps the
 * try-on / apply buttons: switching back is exactly the action that hands the
 * page over again.
 *
 * Everything the peer publishes is read, never written: the two attributes
 * (see runtime/delegated-theme.ts) and the install call the host itself makes.
 * @module @linxin666/dsh-client-ui-skin-center/DelegatedSkinCard
 */
import { useState, useSyncExternalStore, type ReactNode } from 'react'
import type { PropsLocale } from '@deepseek-ai/dsh-client-ui-slots'

import type { SkinCenterKey } from './locales.ts'

import {
  getInstallFaces,
  installPluginSpec,
  isInstallSpecValid,
  subscribeInstallFaces,
} from './plugin-install-faces.ts'
import type { CatalogSkin } from './runtime/boot.ts'
import type { DelegatedThemeState } from './runtime/delegated-theme.ts'
import css from './skin-center.module.css'

/** The delegated payload a delegated row's manifest carries. */
interface DelegatedPayload {
  package: string
  repository: string
  installCommand: string
  bodyAttr: string
  handoffAttr: string
  installed: boolean
  signals: string[]
  descriptorMatches: boolean | null
}

/** Business face the card injects; the row needs only the theme state. */
export interface DelegatedSkinCardProps {
  t: PropsLocale<'skinCenter'>['t']
  skin: CatalogSkin
  /** Whether the delegated plugin is on this page, and whether it can yield. */
  theme: DelegatedThemeState
  isActive: boolean
  isTrying: boolean
  /**
   * True when this row has no markers of its own but a real skin is painted:
   * the delegated plugin is running and standing down for that skin, which is
   * the handoff working, not a plugin that failed to load.
   */
  yieldedToSkin: boolean
  /**
   * False while the skin center is switched off: the row still installs and
   * links to its plugin, but offers no try-on or apply. Omitted means true.
   */
  selectable?: boolean
  busy: boolean
  disabled: boolean
  onTryOn: () => void
  onExitTryOn: () => void
  onApply: () => void
  /** Re-read the catalog after a successful install (the probe moves). */
  onInstalled: () => void
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
 * Render one delegated-skin row.
 * @param props - the row's locale seat, its catalog entry and the card's actions.
 * @returns the row.
 */
export function DelegatedSkinCard(props: DelegatedSkinCardProps): ReactNode {
  const { t, skin, theme, isActive, isTrying, yieldedToSkin, busy, disabled } = props
  const manifest = skin.manifest as CatalogSkin['manifest'] & { delegated: DelegatedPayload }
  const payload = manifest.delegated
  const accent = manifest.accent ?? '#98a1ab'
  // The registry names the dictionary key rather than carrying the words, so
  // the body follows the interface language. The one narrowing cast lives here:
  // core cannot import the client's key union, and a missing key would render
  // the key itself, which is loud enough to catch.
  const description = t(manifest.descriptionKey as SkinCenterKey)
  const faces = useSyncExternalStore(subscribeInstallFaces, getInstallFaces)
  const [installing, setInstalling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<'copied' | 'failed' | null>(null)

  const canInstall = faces.native !== null || faces.family !== null
  const spec = payload.package
  // The row is applicable when the plugin can own the page: it owns it now
  // (live and able to yield back), or it will the moment nothing else paints
  // (yielded to the skin this card has selected). A plugin that is installed
  // but neither live nor yielding is not on this page at all.
  const applicable = props.selectable !== false && (payload.installed && theme.live
    ? theme.canYield
    : payload.installed && yieldedToSkin)
  const claimable = payload.installed && theme.live && !theme.canYield

  const onInstall = (): void => {
    if (installing || !isInstallSpecValid(spec)) return
    setInstalling(true)
    setError(null)
    const cryptoObj = typeof window === 'undefined' ? undefined : window.crypto
    const requestId = cryptoObj && typeof cryptoObj.randomUUID === 'function'
      ? cryptoObj.randomUUID()
      : 'skin-center-delegated-' + spec
    void installPluginSpec(spec, requestId).then((outcome) => {
      if (outcome.kind === 'failed') {
        setError(outcome.message)
        return
      }
      if (outcome.kind === 'installed') props.onInstalled()
    }).finally(() => { setInstalling(false) })
  }

  const onCopy = (): void => {
    void copyText(payload.installCommand).then((ok) => { setNotice(ok ? 'copied' : 'failed') })
  }

  // One line, and only where the row withholds the selection buttons: the
  // reason it withholds them. Everything else about the state is already on
  // screen (the badge says active, the buttons say pickable).
  const blocker = props.selectable === false
    ? null
    : claimable
    ? t('delegatedSkinNoHandoff')
    : payload.installed && !applicable && !yieldedToSkin
      ? t('delegatedSkinNotRunning')
      : null

  return (
    <div className={`${css.card} ${css.delegatedCard} ${css.pluginLookCard}`} data-delegated-skin={manifest.id}>
      <div className={css.cardHead}>
        <span className={css.swatch} style={{ background: accent }} aria-hidden="true" />
        <span className={css.cardName} title={manifest.nameEn}>{manifest.nameEn}</span>
        <span className={css.headPills}>
          <span className={css.delegatedBadge}>{t('delegatedSkinBadge')}</span>
          {(isActive || isTrying) && (
            <span className={`${css.badge} ${isActive && !isTrying ? css.badgeActive : css.badgeTrying}`}>
              {isActive && !isTrying ? t('active') : t('tryingOn')}
            </span>
          )}
        </span>
      </div>
      <p className={css.delegatedDescription}>{description}</p>
      {blocker !== null && <p className={css.delegatedStatus} role="status">{blocker}</p>}
      {error !== null && (
        <p className={css.delegatedStatus} role="alert">{t('delegatedSkinInstallFailed', { reason: error })}</p>
      )}
      {payload.descriptorMatches === false && (
        <p className={css.delegatedStatus} role="alert">{t('delegatedSkinDescriptorMismatch')}</p>
      )}
      <div className={css.actions}>
        {!payload.installed && (
          <>
            {canInstall ? (
              <button
                type="button"
                className={`${css.button} ${css.buttonPrimary}`}
                disabled={installing || disabled}
                onClick={onInstall}
              >
                {installing ? t('delegatedSkinInstalling') : t('delegatedSkinInstall')}
              </button>
            ) : (
              <code className={css.externalWallpaperCommand}>{payload.installCommand}</code>
            )}
            <button type="button" className={css.button} disabled={installing || disabled} onClick={onCopy}>
              {notice === 'copied' ? t('externalWallpaperCopied') : t('externalWallpaperCopyCommand')}
            </button>
          </>
        )}
        {payload.installed && faces.navigation !== null && (
          <button type="button" className={css.button} onClick={() => { faces.navigation?.openBundle(spec) }}>
            {t('delegatedSkinManage')}
          </button>
        )}
        {applicable && (
          isActive && !isTrying ? (
            <button type="button" className={`${css.button} ${css.buttonGhost}`} disabled>
              {t('tryOn')}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={`${css.button} ${css.buttonPrimary}`}
                disabled={busy || disabled}
                onClick={isTrying ? props.onExitTryOn : props.onTryOn}
              >
                {isTrying ? t('exitTryOn') : t('tryOn')}
              </button>
              <button type="button" className={css.button} disabled={busy || disabled} onClick={props.onApply}>
                {busy ? t('applying') : t('apply')}
              </button>
            </>
          )
        )}
      </div>
      <a
        className={css.delegatedLink}
        href={payload.repository}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('delegatedSkinLink')}
      </a>
    </div>
  )
}
