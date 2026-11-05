// @vitest-environment jsdom
/**
 * The delegated row's place in the card.
 *
 * It is a card at the head of the page, beside the Wallpaper Engine card, not a
 * tile in the skin grid: the plugin paints this look, so there is no preview
 * image to fill a 16:9 thumbnail with. The grid is for the asset directories
 * this package loads, each with an image to show.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SkinCenter } from '../src/client/SkinCenter.tsx'
import { zh, type SkinCenterKey } from '../src/client/locales.ts'
import type { CatalogSkin } from '../src/client/runtime/boot.ts'
import type { DelegatedThemeState } from '../src/client/runtime/delegated-theme.ts'
import { CUSTOM_THEME_DEFAULTS } from '../src/core/custom-theme.ts'

;((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT) = true

const t = (key: SkinCenterKey, params?: Record<string, string>): string => {
  const copy = zh[key] ?? key
  return params === undefined ? copy : copy.replace(/{(\w+)\}/g, (match, name: string) => params[name] ?? match)
}

const assetSkin: CatalogSkin = {
  origin: 'user',
  warnings: [],
  manifest: {
    id: 'harbor',
    name: 'Harbor',
    nameEn: 'Harbor',
    tagline: 'Harbor skin',
    contributes: { stylesheet: 'skin.css' },
  },
} as unknown as CatalogSkin

const delegatedSkin: CatalogSkin = {
  origin: 'delegated',
  warnings: [],
  manifest: {
    id: 'claude-style',
    name: 'Claude Code Style',
    nameEn: 'Claude Code Style',
    tagline: 'Claude Code Desktop theme',
    descriptionKey: 'delegatedSkinDescriptionClaudeStyle',
    accent: '#d97757',
    delegated: {
      package: 'dsh-claude-style',
      repository: 'https://github.com/Nwflower/dsh-claude-style',
      installCommand: 'dsh plugin --profile web add dsh-claude-style',
      bodyAttr: 'data-dsh-claude-style',
      handoffAttr: 'data-dsh-claude-style-handoff',
      installed: false,
      signals: [],
      descriptorMatches: null,
    },
  },
} as unknown as CatalogSkin

let root: Root
let host: HTMLDivElement

// useSyncExternalStore re-reads its snapshot on every render and loops forever
// when each read is a fresh object, so both stores below hand back one
// reference for the whole test.
const CONTROLLER_STATE = { active: null, stoodDown: false, trying: null, previewing: false }
const CUSTOM_THEME_STATE = { applied: false, previewing: false }
const THEME_SNAPSHOT = { active: { colorScheme: 'light' } }

/** The catalog the card reads: one asset skin plus the delegated row. */
function render(options: { installed?: boolean; theme?: DelegatedThemeState; delegated?: unknown } = {}): Promise<void> {
  const installed = options.installed ?? false
  const catalog = [assetSkin, { ...delegatedSkin, manifest: { ...delegatedSkin.manifest, delegated: { ...(delegatedSkin.manifest as never as { delegated: Record<string, unknown> }).delegated, installed } } } as unknown as CatalogSkin]
  const theme: DelegatedThemeState = options.theme ?? { live: false, canYield: false }
  const runtime = {
    controller: {
      active: null,
      layers: {},
      getState: () => CONTROLLER_STATE,
      subscribe: () => () => {},
      tryOn: async () => null,
      exitTryOn: async () => null,
      switchTo: async (id: string | null) => id,
      refresh: async () => null,
      shutdown: () => {},
    },
    apiBase: '/api/skin-center/v2',
    catalog: () => catalog,
    diagnostics: () => [],
    refreshCatalog: async () => {},
    find: (id: string) => catalog.find(entry => entry.manifest.id === id) ?? null,
    subscribe: () => () => {},
    shutdown: () => {},
  }
  const noop = () => {}
  return act(async () => {
    root.render(
      <SkinCenter
        t={t as never}
        runtime={runtime as never}
        externalWallpaper={{ active: () => false, subscribe: () => () => {}, repository: '', packageName: '' }}
        delegated={options.delegated ?? {
          ids: () => ['claude-style'],
          state: () => theme,
          subscribe: () => () => {},
        }}
        preview={{ runSkin: async (action: () => Promise<string | null>) => await action() } as never}
        customTheme={{
          subscribe: () => () => {},
          getState: () => CUSTOM_THEME_STATE,
          profile: () => CUSTOM_THEME_DEFAULTS.light,
          setProfileValue: noop,
          reset: noop,
        } as never}
        theme={{ getTheme: () => THEME_SNAPSHOT as never, subscribe: () => () => {}, setTheme: noop } as never}
        background={{
          enabled: () => true, opacity: () => 0, blurEmpty: () => 0, blurContent: () => 0,
          inputCardBlur: () => 0, bubbleOpacity: () => 0, bubbleBlur: () => 0,
          subscribe: () => () => {}, setEnabled: noop, set: noop, setBlurEmpty: noop,
          setBlurContent: noop, setInputCardBlur: noop, setBubbleOpacity: noop,
          setBubbleBlur: noop, dispose: noop,
        } as never}
      />,
    )
  })
}

beforeEach(() => {
  document.head.innerHTML = ''
  document.body.innerHTML = '<div id="root"></div>'
  host = document.getElementById('root') as HTMLDivElement
  root = createRoot(host)
})

afterEach(() => { act(() => { root.unmount() }) })

describe('the delegated row placement', () => {
  it('renders as a card above the skin grid, not as a tile in it', async () => {
    // Given a catalog holding one asset skin and the delegated row
    await render()

    // When the card renders
    const row = host.querySelector('[data-delegated-skin="claude-style"]')
    const grid = host.querySelector('[class*="skinGrid"]')
    const asset = Array.from(host.querySelectorAll('[class*="skinCard"]'))

    // Then the row exists and sits BEFORE the grid
    expect(row).not.toBeNull()
    expect(grid).not.toBeNull()
    const position = row!.compareDocumentPosition(grid!)
    // eslint-disable-next-line no-bitwise
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // And the grid holds only tiles: the official one and the asset skin. The
    // delegated row is a sibling of the grid, never one of its cells.
    expect(asset).toHaveLength(2)
    expect(grid!.querySelector('[data-delegated-skin]')).toBeNull()
    expect(row!.parentElement).not.toBe(grid)
  })

  it('leads the page in the plugin-looks group, ahead of the skin settings', async () => {
    // Given the same catalog
    await render()

    // When the card renders
    const group = host.querySelector('section[aria-labelledby="skin-center-plugin-looks"]')
    const enableSwitch = host.querySelector('[role="switch"]')

    // Then the delegated card sits in the titled group, and the group comes
    // before the skin center's own switch and settings
    expect(group?.querySelector('h3')?.textContent).toBe(zh.pluginLooksTitle)
    expect(group?.querySelector('[data-delegated-skin="claude-style"]')).not.toBeNull()
    // eslint-disable-next-line no-bitwise
    expect(group!.compareDocumentPosition(enableSwitch!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('reads its state from the injected delegated handle, not from the catalog', async () => {
    // Given a handle reporting the plugin live and able to yield
    await render({
      installed: true,
      theme: { live: true, canYield: true },
      delegated: {
        ids: () => ['claude-style'],
        state: () => ({ live: true, canYield: true }),
        subscribe: () => () => {},
      },
    })

    // Then the row offers the selection instead of the install, and its body
    // is the dictionary's copy in the interface language, not English words
    expect(host.textContent).toContain(zh.delegatedSkinDescriptionClaudeStyle)
    expect(Array.from(host.querySelectorAll('button')).map(b => b.textContent))
      .toContain(zh.apply)
  })
})
