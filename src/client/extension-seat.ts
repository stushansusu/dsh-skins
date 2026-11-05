/**
 * The skin page's contribution to the family settings entry.
 *
 * The Web Extensions parent owns page mounting through its registration
 * service. A standalone install keeps the original first-level settings
 * section through the shared fallback adapter.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SettingsSectionOwnerProps } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { SkinCenterInjected, SkinCenterSection } from './SkinCenter.tsx'
import { installWebExtensionPage } from './web-extension-page.ts'

/** The consolidated family page's child seat. */
export const WEB_UI_EXTENSION_SLOT = 'web-ui.extension' as const
/** The pre-consolidation first-level settings seat. */
export const LEGACY_SETTINGS_SLOT = 'settings.section' as const
/** This package's stable key in either seat. */
export const SKIN_CENTER_ENTRY_KEY = 'skin-center' as const

/** Optional service published by the family Web Extensions parent. */
export interface WebUiExtensions {
  /** Open one installed-item page by key; deep-link owners call this, not the skin page. */
  open(id: string): boolean
  /** The parent first-level section id, retained for deep-link compatibility. */
  readonly sectionId: string
  /** The parent section's localized label. */
  label(): string
  /** Register this page with the parent; the returned disposer unmounts it. */
  registerPage(page: never): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Present only while the consolidated Web Extensions parent is available. */
    webUiExtensions?: WebUiExtensions
  }
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** One keyed installed-item page inside the family Web Extensions section. */
    'web-ui.extension': {
      kind: 'keyed'
      scope: 'root'
      owner: SettingsSectionOwnerProps
    }
  }
}

/** Everything about the contribution that is independent of its seat. */
export interface SkinCenterSeatRegistration {
  /** Business face shared by the component in either seat. */
  inject: () => SkinCenterInjected
  /** The page's label in both the TAB strip and a standalone section. */
  label: () => string
  /** The same component mounts in either seat; no view-state owner changes. */
  component: typeof SkinCenterSection
}

/**
 * Install the one live skin-page contribution.
 * @param ctx - browser plugin context.
 * @param registration - seat-independent component, locale and business face.
 * @returns cleanup for whichever registration is currently live.
 */
export function installSkinCenterSeat(
  ctx: ClientContext,
  registration: SkinCenterSeatRegistration,
): () => void {
  return installWebExtensionPage(ctx, {
    key: SKIN_CENTER_ENTRY_KEY,
    order: 120,
    locale: 'skinCenter',
    label: registration.label,
    inject: registration.inject,
    component: registration.component,
  })
}
