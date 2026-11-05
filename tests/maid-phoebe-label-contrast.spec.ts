import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Issue #87: maid-atelier and phoebe-atelier shipped a light-theme caption token
// that measures about 2.3:1 on the darkest light surface the skins paint, and a
// dark-theme caption at 3.97:1 on the lightest dark layer, so both fell below the
// WCAG AA floor of 4.5:1. The checks below pin the shipped values, every scope
// that re-declares them (duplicated blocks included), and the contrast floor.
//
// The expected colours here are intentionally independent constants: the test
// never reads an expectation back out of the stylesheets it inspects, and it
// computes contrast itself instead of trusting a token name.

const MIN_CONTRAST = 4.5

// Darkest light surface either skin can paint behind label text: the cordis
// panel gradient floor (#cfdcf4 at 94%) composited over the light shell.
const WORST_LIGHT_SURFACE = '#d0ddf4'
// Lightest dark surface: --dsw-alias-bg-layer-3 in dark mode (#20315b).
const WORST_DARK_SURFACE = '#20315b'

type SkinId = 'maid-atelier' | 'phoebe-atelier'
type TokenName = 'secondary' | 'tertiary' | 'caption'

const TOKEN_PROPERTY: Record<TokenName, string> = {
  secondary: '--dsw-alias-label-secondary',
  tertiary: '--dsw-alias-label-tertiary',
  caption: '--dsw-alias-label-caption',
}

const LIGHT_INK: Record<SkinId, Record<TokenName, string>> = {
  'maid-atelier': { secondary: '#2d3a55', tertiary: '#404d67', caption: '#53607c' },
  'phoebe-atelier': { secondary: '#3a4361', tertiary: '#48526f', caption: '#56617c' },
}

// Dark caption family repaired with the light pass: the four maid blocks and the
// three phoebe blocks that still carried the old #7f90b4 caption.
const DARK_CAPTION = '#899cc2'

// The dark-surface sidebar blocks are out of scope for #87 and must stay as
// they are: light text painted on the skins' own navy sidebar in light mode.
const SIDEBAR_DARK_SURFACE_INK: Record<TokenName, string> = {
  secondary: '#d7def0',
  tertiary: '#b5c1dd',
  caption: '#96a8ce',
}

interface ScopeSpec {
  label: string
  file: string
  selector: string
  // How many blocks declare these tokens for this selector. A count pins the
  // duplicated blocks, so dropping one of them fails instead of passing.
  blocks: number
  tokens: TokenName[]
}

const LIGHT_SCOPES: Record<SkinId, ScopeSpec[]> = {
  'maid-atelier': [
    { label: 'root', file: 'skin.css', selector: ':root', blocks: 1, tokens: ['secondary', 'tertiary', 'caption'] },
    {
      label: 'cordis panel',
      file: 'patches.css',
      selector: '[data-cordis-panel]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'better sidebar (first block)',
      file: 'patches.css',
      selector: '[data-dsh-better-sidebar]',
      blocks: 2,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'terminal',
      file: 'patches.css',
      selector: '[data-terminal]',
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'chat-flow variant',
      file: 'patches.css',
      selector: 'body:not([data-ds-dark-theme]) :is([data-variant], [data-chat-flow-kind="context"])',
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'session header tree',
      file: 'patches.css',
      selector: 'body:not([data-ds-dark-theme]) [data-slot="conversation.session.header.actions"] [role="tree"]',
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'question takeover',
      file: 'patches.css',
      selector: '[data-question-key]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'todo panel',
      file: 'patches.css',
      selector: '[data-testid="todo-panel"]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'dialog and menu surfaces',
      file: 'patches.css',
      selector: ':is([role="dialog"], [role="menu"], [data-radix-popper-content-wrapper] > *)',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
  ],
  'phoebe-atelier': [
    { label: 'root', file: 'skin.css', selector: ':root', blocks: 1, tokens: ['secondary', 'tertiary', 'caption'] },
    {
      label: 'cordis panel',
      file: 'skin.css',
      selector: 'body [data-cordis-panel]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'better sidebar',
      file: 'skin.css',
      selector: 'body [data-dsh-better-sidebar]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'terminal',
      file: 'skin.css',
      selector: 'body [data-terminal]',
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'chat-flow variant',
      file: 'skin.css',
      selector: "body:not([data-ds-dark-theme]) :is([data-variant], [data-chat-flow-kind='context'])",
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'session header tree',
      file: 'skin.css',
      selector: "body:not([data-ds-dark-theme]) [data-slot='conversation.session.header.actions'] [role='tree']",
      blocks: 1,
      tokens: ['secondary', 'tertiary'],
    },
    {
      label: 'question takeover',
      file: 'skin.css',
      selector: 'body [data-question-key]',
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'todo panel',
      file: 'skin.css',
      selector: "body [data-testid='todo-panel']",
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
    {
      label: 'dialog and menu surfaces',
      file: 'skin.css',
      selector: "body :is([role='dialog'], [role='menu'], [data-radix-popper-content-wrapper] > *)",
      blocks: 1,
      tokens: ['secondary', 'tertiary', 'caption'],
    },
  ],
}

const DARK_CAPTION_SCOPES: Record<SkinId, ScopeSpec[]> = {
  'maid-atelier': [
    { label: 'root', file: 'skin.css', selector: 'body[data-ds-dark-theme]', blocks: 1, tokens: ['caption'] },
    {
      label: 'better sidebar (both blocks)',
      file: 'patches.css',
      selector: 'body[data-ds-dark-theme] [data-dsh-better-sidebar]',
      blocks: 2,
      tokens: ['caption'],
    },
    {
      label: 'dialog and menu surfaces',
      file: 'patches.css',
      selector: 'body[data-ds-dark-theme] :is([role="dialog"], [role="menu"], [data-radix-popper-content-wrapper] > *)',
      blocks: 1,
      tokens: ['caption'],
    },
  ],
  'phoebe-atelier': [
    { label: 'root', file: 'skin.css', selector: 'body[data-ds-dark-theme]', blocks: 1, tokens: ['caption'] },
    {
      label: 'better sidebar',
      file: 'skin.css',
      selector: 'body[data-ds-dark-theme] [data-dsh-better-sidebar]',
      blocks: 1,
      tokens: ['caption'],
    },
    {
      label: 'dialog and menu surfaces',
      file: 'skin.css',
      selector: "body[data-ds-dark-theme] :is([role='dialog'], [role='menu'], [data-radix-popper-content-wrapper] > *)",
      blocks: 1,
      tokens: ['caption'],
    },
  ],
}

// Light-mode blocks that paint the skins' porcelain text on their own navy
// plate. The footer seat root used to be one of them, but in the light theme it
// covers the ivory pilaster, so the porcelain palette now lives on the two leaf
// controls that paint navy themselves (see the footer seat checks below).
const SIDEBAR_DARK_SURFACE_SELECTORS = [
  ':is([data-pane="sidebar"], [class*="sidebarCol"])',
  "body :is([data-pane='sidebar'], [class*='sidebarCol'])",
  "body [data-phoebe-sidebar-footer] [data-slot='sidebar.settings'] > :is(button, [role='button'])",
  'body [data-cordis-badge]',
]

interface CssRule {
  selector: string
  body: string
}

const normalizeSelector = (selector: string): string => selector.replace(/\s+/g, ' ').trim()

const parseRules = (css: string): CssRule[] => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: CssRule[] = []
  let depth = 0
  let prelude = ''
  let preludeStart = 0
  let bodyStart = 0
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (char === '{') {
      if (depth === 0) {
        prelude = source.slice(preludeStart, index)
        bodyStart = index + 1
      }
      depth += 1
      continue
    }
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        rules.push({ selector: normalizeSelector(prelude), body: source.slice(bodyStart, index) })
        preludeStart = index + 1
      }
    }
  }
  return rules
}

const declarations = (body: string): Map<string, string> => {
  const found = new Map<string, string>()
  for (const part of body.split(';')) {
    const colon = part.indexOf(':')
    if (colon < 0) continue
    const name = part.slice(0, colon).trim()
    if (!name) continue
    found.set(name, part.slice(colon + 1).trim())
  }
  return found
}

const readSkin = (skin: SkinId, file: string): CssRule[] =>
  parseRules(readFileSync(resolve(__dirname, '..', 'skins', skin, file), 'utf-8'))

const skinRules = (skin: SkinId, file: string): CssRule[] => readSkin(skin, file)

const rulesFor = (rules: CssRule[], selector: string): CssRule[] => {
  const wanted = normalizeSelector(selector)
  return rules.filter((rule) => rule.selector === wanted)
}

const toRgb = (hex: string): [number, number, number] => {
  const value = hex.replace('#', '')
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16)) as [number, number, number]
}

const relativeLuminance = (hex: string): number => {
  const [red, green, blue] = toRgb(hex).map((channel) => {
    const unit = channel / 255
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

const contrastRatio = (foreground: string, background: string): number => {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

const isDarkSurfaceSidebar = (selector: string): boolean =>
  SIDEBAR_DARK_SURFACE_SELECTORS.some((expected) => normalizeSelector(selector) === normalizeSelector(expected))

const skins: SkinId[] = ['maid-atelier', 'phoebe-atelier']

describe.each(skins)('%s label tokens', (skin) => {
  const expected = LIGHT_INK[skin]

  it('user sees every light scope carry the unified, darker label tokens', () => {
    // Given the light scopes that re-declare the label tokens in this skin
    // When each declared block is read from the stylesheet
    for (const scope of LIGHT_SCOPES[skin]) {
      const blocks = rulesFor(skinRules(skin, scope.file), scope.selector)
      // Then the block is still there, as many times as the skin declares it
      expect(
        blocks.length,
        scope.label + ': expected ' + scope.blocks + ' block(s) for ' + scope.selector,
      ).toBe(scope.blocks)

      for (const rule of blocks) {
        const found = declarations(rule.body)
        for (const token of scope.tokens) {
          // And each token equals the expected colour, not the old one
          expect(
            found.get(TOKEN_PROPERTY[token]),
            scope.label + ' (' + scope.file + ') declares ' + TOKEN_PROPERTY[token],
          ).toBe(expected[token])
        }
      }
    }
  })

  it('user sees no light scope left behind on an older label token', () => {
    // Given every rule in this skin's stylesheets
    const files = skin === 'maid-atelier' ? ['skin.css', 'patches.css'] : ['skin.css']
    // When a rule that is neither a dark-theme rule nor one of the out-of-scope
    // sidebar blocks declares one of the label tokens
    const unified = new Set(Object.values(expected))
    for (const file of files) {
      for (const rule of skinRules(skin, file)) {
        if (rule.selector.includes('data-ds-dark-theme')) continue
        if (isDarkSurfaceSidebar(rule.selector)) continue
        const found = declarations(rule.body)
        for (const token of ['secondary', 'tertiary', 'caption'] as TokenName[]) {
          const value = found.get(TOKEN_PROPERTY[token])
          if (value === undefined) continue
          // Then it already carries the unified value: no duplicate block is missed
          expect(
            unified.has(value),
            file + ' ' + rule.selector + ' still sets ' + TOKEN_PROPERTY[token] + ': ' + value,
          ).toBe(true)
        }
      }
    }
  })

  it('user sees the light label tokens clear 4.5:1 on the darkest light surface', () => {
    // Given the darkest light surface the skin can paint behind label text
    // When every light label token is measured against it
    for (const token of ['secondary', 'tertiary', 'caption'] as TokenName[]) {
      const ratio = contrastRatio(expected[token], WORST_LIGHT_SURFACE)
      // Then the text clears the WCAG AA floor
      expect(
        ratio,
        skin + ' ' + token + ' ' + expected[token] + ' on ' + WORST_LIGHT_SURFACE,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST)
    }
  })

  it('user sees the dark caption family repaired on every affected block', () => {
    // Given the dark-theme blocks that carried the old caption
    for (const scope of DARK_CAPTION_SCOPES[skin]) {
      const blocks = rulesFor(skinRules(skin, scope.file), scope.selector)
      expect(
        blocks.length,
        scope.label + ': expected ' + scope.blocks + ' dark block(s)',
      ).toBe(scope.blocks)
      for (const rule of blocks) {
        // When their caption token is read
        const caption = declarations(rule.body).get(TOKEN_PROPERTY.caption)
        // Then it is the repaired caption
        expect(caption, scope.label + ' (' + scope.file + ') dark caption').toBe(DARK_CAPTION)
      }
    }
  })

  it('user sees the sidebar dark-surface blocks left exactly as they were', () => {
    // Given the light-mode sidebar blocks that paint light text on a navy sidebar
    const files = skin === 'maid-atelier' ? ['patches.css'] : ['skin.css']
    const blocks = files.flatMap((file) =>
      skinRules(skin, file)
        .filter((rule) => isDarkSurfaceSidebar(rule.selector))
        .filter((rule) => declarations(rule.body).has(TOKEN_PROPERTY.secondary)),
    )
    // When their label tokens are read
    expect(blocks.length, 'sidebar dark-surface blocks not found').toBeGreaterThan(0)
    for (const rule of blocks) {
      const found = declarations(rule.body)
      for (const token of ['secondary', 'tertiary', 'caption'] as TokenName[]) {
        // Then #87 changed none of them
        expect(found.get(TOKEN_PROPERTY[token]), rule.selector + ' ' + TOKEN_PROPERTY[token]).toBe(
          SIDEBAR_DARK_SURFACE_INK[token],
        )
      }
    }
  })

  it('user sees the dark caption clear 4.5:1 on the lightest dark surface', () => {
    // Given the lightest dark surface the skins paint
    // When the repaired dark caption is measured against it
    expect(DARK_CAPTION, 'dark caption token').toBe('#899cc2')
    // Then it clears the WCAG AA floor
    expect(
      contrastRatio(DARK_CAPTION, WORST_DARK_SURFACE),
      'dark caption on ' + WORST_DARK_SURFACE,
    ).toBeGreaterThanOrEqual(MIN_CONTRAST)
  })

  it('user sees the old caption values fall below the floor this test enforces', () => {
    // Given the values #87 replaced
    // When the same surfaces are measured
    // Then the regression guard would have caught them, so this file cannot go quiet
    expect(contrastRatio('#8a94aa', WORST_LIGHT_SURFACE)).toBeLessThan(MIN_CONTRAST)
    expect(contrastRatio('#7f90b4', WORST_DARK_SURFACE)).toBeLessThan(MIN_CONTRAST)
  })
})

describe('no skin keeps the retired dark caption', () => {
  it('user sees #7f90b4 gone from every caption declaration in both skins', () => {
    // Given both skins' stylesheets
    // When every rule is scanned for the retired caption value
    const offenders: string[] = []
    for (const skin of skins) {
      const files = skin === 'maid-atelier' ? ['skin.css', 'patches.css'] : ['skin.css']
      for (const file of files) {
        for (const rule of skinRules(skin, file)) {
          if (declarations(rule.body).get(TOKEN_PROPERTY.caption) === '#7f90b4') {
            offenders.push(skin + '/' + file + ' ' + rule.selector)
          }
        }
      }
    }
    // Then no caption declaration still names it
    expect(offenders, offenders.join(', ')).toEqual([])
  })
})
// ---------------------------------------------------------------------------
// The seat's own cascade is the second half of the badge defect. The footer
// trigger rule and the Cordis badge rule both target a button in the same seat,
// and the trigger rule out-specifies the badge (0,3,2 against 0,1,1), so the
// badge's porcelain label was repainted in the trigger's dark gold. A real host
// measured that combination; the checks below pin the exclusion that keeps the
// two apart, and prove the surviving pair clears the floor on the plate the
// badge actually paints.
const PHOEBE_BADGE = 'body [data-cordis-badge]'
const PHOEBE_BADGE_LIGHT = 'body:not([data-ds-dark-theme]) [data-cordis-badge]'
const FOOTER_TRIGGER_LIGHT =
  "body:not([data-ds-dark-theme]) [data-phoebe-sidebar-footer] [data-slot='sidebar.footer.action'] button:not([data-cordis-badge])"
const FOOTER_TRIGGER_LIGHT_OLD =
  "body:not([data-ds-dark-theme]) [data-phoebe-sidebar-footer] [data-slot='sidebar.footer.action'] button"
const FOOTER_TRIGGER_DARK =
  "body[data-ds-dark-theme] [data-phoebe-sidebar-footer] [data-slot='sidebar.footer.action'] button"

// The brightest plate behind the seat: the ivory pilaster's gradient top stop.
const IVORY_TOP = '#faf7f0'
// The trigger's gold, which used to win the cascade on the badge.
const TRIGGER_GOLD = '#8a6b2f'

interface RgbaStop {
  rgb: [number, number, number]
  alpha: number
}

const gradientStops = (value: string): RgbaStop[] =>
  [...value.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([0-9.]+)\s*)?\)/g)].map((match) => ({
    rgb: [Number(match[1]), Number(match[2]), Number(match[3])] as [number, number, number],
    alpha: match[4] === undefined ? 1 : Number(match[4]),
  }))

const overPlate = (stop: RgbaStop, plate: string): string => {
  const base = toRgb(plate)
  return (
    '#' +
    stop.rgb
      .map((channel, index) => Math.round(channel * stop.alpha + base[index] * (1 - stop.alpha)).toString(16).padStart(2, '0'))
      .join('')
  )
}

describe('phoebe footer seat cascade', () => {
  const skin: SkinId = 'phoebe-atelier'
  const rules = skinRules(skin, 'skin.css')
  const badgeInk = (): string => declarations(rulesFor(rules, PHOEBE_BADGE)[0].body).get('color') as string

  it('user sees the footer trigger rule exclude the Cordis badge', () => {
    // Given the light-theme footer trigger rule
    const blocks = rulesFor(rules, FOOTER_TRIGGER_LIGHT)
    expect(blocks.length, 'expected one light footer trigger rule').toBe(1)
    // Then it still colours the seat's plain triggers
    expect(declarations(blocks[0].body).get('color'), 'footer trigger colour').toBe(TRIGGER_GOLD)
    // And the un-excluded selector that repainted the badge is gone
    expect(rulesFor(rules, FOOTER_TRIGGER_LIGHT_OLD).length, 'un-excluded trigger selector').toBe(0)
  })

  it('user sees the dark footer trigger rule left as it was', () => {
    // Given the dark-theme counterpart the fix must not touch
    const blocks = rulesFor(rules, FOOTER_TRIGGER_DARK)
    expect(blocks.length, 'expected one dark footer trigger rule').toBe(1)
    // Then it keeps its own gold, which already clears the floor on the badge
    expect(declarations(blocks[0].body).get('color'), 'dark footer trigger colour').toBe('#e9d7ae')
  })

  it('user sees the badge keep its own porcelain label', () => {
    // Given the badge rule
    const blocks = rulesFor(rules, PHOEBE_BADGE)
    expect(blocks.length, 'expected one badge rule').toBe(1)
    // Then its label is the badge's porcelain, not a seat trigger's ink
    expect(badgeInk(), 'badge label').toBe('#f4e3bf')
  })

  it('user sees the badge label clear 4.5:1 on the light end of its own plate', () => {
    // Given the badge's light-theme plate
    const light = rulesFor(rules, PHOEBE_BADGE_LIGHT)
    expect(light.length, 'expected one light badge plate rule').toBe(1)
    const stops = gradientStops(declarations(light[0].body).get('background') as string)
    expect(stops.length, 'expected two gradient stops').toBe(2)
    // When the label is measured over the light stop composited on the ivory
    // plate the seat paints behind the badge
    const ink = badgeInk()
    const plate = overPlate(stops[0], IVORY_TOP)
    // Then it clears the floor at the weakest point of the plate
    expect(contrastRatio(ink, plate), ink + ' on ' + plate).toBeGreaterThanOrEqual(MIN_CONTRAST)
    // And the trigger gold that used to win here cannot
    expect(contrastRatio(TRIGGER_GOLD, plate), TRIGGER_GOLD + ' on ' + plate).toBeLessThan(MIN_CONTRAST)
    // The depth is what buys the floor: the original stop measured 3.70:1
    const shallow = overPlate({ ...stops[0], alpha: 0.74 }, IVORY_TOP)
    expect(contrastRatio(ink, shallow), ink + ' on ' + shallow).toBeLessThan(MIN_CONTRAST)
  })
})


// ---------------------------------------------------------------------------
// The footer seat and the skin center's state pills.
//
// phoebe-atelier's ivory pilaster (skin.css: the light-theme sidebar gradient)
// replaced the navy panel, but the footer seat [data-slot='sidebar.footer.action']
// kept the near-white palette that was written for the navy one. A card mounted
// there inherits its text instead of painting it, so it landed porcelain on ivory:
// 1.08:1. The seat root now carries the light-surface ink and the porcelain
// palette moved to the two leaf controls that paint a navy plate themselves.
//
// The skin center's state pills had the mirror-image problem: their text came
// from --dsw-alias-brand-primary and --dsw-alias-state-success-primary, which are
// affordance colours that do not follow a skin's label remap, so a skin could
// change the card's body ink while the pill kept the host's. The pills now paint
// their text with the label token and keep the semantic colour in the fill and a
// non-zero border.

// The ivory pilaster's own gradient floor: the darkest light surface behind the
// seat, so the worst case for a dark ink.
const IVORY_FLOOR = '#e8ebf4'
// The navy the seat's leaf controls paint themselves.
const NAVY_LEAF = '#0a173b'

type InkToken = 'primary' | TokenName

const LABEL_PROPERTY: Record<InkToken, string> = {
  primary: '--dsw-alias-label-primary',
  ...TOKEN_PROPERTY,
}

interface SeatInk {
  file: string
  root: string
  light: string
  navyLeaves: string[]
  lightInk: Record<InkToken, string>
  navyInk: Record<InkToken, string>
}

const PHOEBE_SEAT: SeatInk = {
  file: 'skin.css',
  root: "body [data-slot='sidebar.footer.action']",
  light: "body:not([data-ds-dark-theme]) [data-slot='sidebar.footer.action']",
  navyLeaves: [
    "body [data-phoebe-sidebar-footer] [data-slot='sidebar.settings'] > :is(button, [role='button'])",
    'body [data-cordis-badge]',
  ],
  lightInk: { primary: '#17284f', secondary: '#3a4361', tertiary: '#48526f', caption: '#56617c' },
  navyInk: { primary: '#f8f3e8', secondary: '#d7def0', tertiary: '#b5c1dd', caption: '#96a8ce' },
}

const inkTokens: InkToken[] = ['primary', 'secondary', 'tertiary', 'caption']

describe('phoebe footer seat ink', () => {
  const skin: SkinId = 'phoebe-atelier'
  const seat = PHOEBE_SEAT

  it('user sees the light footer seat hand an inheriting card the light-surface ink', () => {
    // Given the light-theme block that covers the footer seat
    const blocks = rulesFor(skinRules(skin, seat.file), seat.light)
    expect(blocks.length, 'expected exactly one light-theme seat block').toBe(1)
    const found = declarations(blocks[0].body)
    // When its label tokens are read
    for (const token of inkTokens) {
      // Then they are the ivory-surface ink, not the porcelain palette
      expect(found.get(LABEL_PROPERTY[token]), 'light seat ' + LABEL_PROPERTY[token]).toBe(seat.lightInk[token])
    }
  })

  it('user sees no near-white palette left on the bare seat root', () => {
    // Given the seat root itself, which every card in the slot inherits from
    const blocks = rulesFor(skinRules(skin, seat.file), seat.root)
    expect(blocks.length, 'expected exactly one bare seat root block').toBe(1)
    const found = declarations(blocks[0].body)
    // Then it still owns the surface, border and hover tokens
    expect(found.get('--dsw-alias-bg-base'), 'seat root surface').toBe('rgba(5, 14, 43, 0.96)')
    // But it hands the label palette to the theme block and the navy leaves, so
    // it cannot blanket the extension boundary with porcelain ink again
    for (const token of inkTokens) {
      expect(found.has(LABEL_PROPERTY[token]), 'seat root still declares ' + LABEL_PROPERTY[token]).toBe(false)
    }
    // Its own colour still resolves through the label token, which is what makes
    // the dark theme keep the porcelain ink instead of going dark on navy
    expect(found.get('color'), 'seat root color').toBe('var(--dsw-alias-label-primary)')
  })

  it('user sees both navy leaf controls keep the porcelain palette they paint for', () => {
    // Given the two leaf controls that paint their own navy plate
    for (const selector of seat.navyLeaves) {
      const blocks = rulesFor(skinRules(skin, seat.file), selector)
      expect(blocks.length, 'expected one block for ' + selector).toBe(1)
      const found = declarations(blocks[0].body)
      // When their label tokens are read
      for (const token of inkTokens) {
        // Then each one still carries the porcelain ink
        expect(found.get(LABEL_PROPERTY[token]), selector + ' ' + LABEL_PROPERTY[token]).toBe(seat.navyInk[token])
      }
    }
  })

  it('user sees the seat ink clear 4.5:1 where it is painted, and the old ink fail', () => {
    // Given the ivory plate and the navy leaf plate
    // When every seat ink is measured against the plate it is painted on
    for (const token of inkTokens) {
      expect(
        contrastRatio(seat.lightInk[token], IVORY_FLOOR),
        'light seat ' + LABEL_PROPERTY[token] + ' on ' + IVORY_FLOOR,
      ).toBeGreaterThanOrEqual(MIN_CONTRAST)
    }
    expect(
      contrastRatio(seat.navyInk.primary, NAVY_LEAF),
      'porcelain leaf ink on ' + NAVY_LEAF,
    ).toBeGreaterThanOrEqual(MIN_CONTRAST)
    // Then the porcelain ink the seat used to inherit is below the floor on the
    // ivory plate, so this guard cannot go quiet if the palette moves back
    expect(
      contrastRatio(seat.navyInk.primary, IVORY_FLOOR),
      'porcelain ink on the ivory plate',
    ).toBeLessThan(MIN_CONTRAST)
  })
})

interface BadgeRule {
  className: string
  fillToken: string
  strokeToken: string
}

const BADGE_RULES: BadgeRule[] = [
  { className: '.badgeActive', fillToken: '--dsw-alias-state-success-tertiary', strokeToken: '--dsw-alias-state-success-primary' },
  { className: '.badgeTrying', fillToken: '--dsw-alias-button-primary-dimmed', strokeToken: '--dsw-alias-brand-primary' },
  { className: '.delegatedBadge', fillToken: '--dsw-alias-bg-layer-3', strokeToken: '--dsw-alias-border-l2' },
]

// Neither atelier skin repaints the two semantic tokens, so the host's own light
// values are the fill the pills paint; the values are the ones the module
// carried before this change.
const HOST_LIGHT_FILL: Record<string, string> = {
  '--dsw-alias-state-success-tertiary': '#dcf3e5',
  '--dsw-alias-button-primary-dimmed': '#e2edfc',
}

// Root layer-3 base that the delegated pill paints on, per skin and theme. Both
// skins own this token, so the fill follows the skin rather than the host.
const DELEGATED_FILL: Record<SkinId, Record<'light' | 'dark', string>> = {
  'maid-atelier': { light: '#e0e7f6', dark: '#20315b' },
  'phoebe-atelier': { light: '#e8ebf5', dark: '#20315b' },
}

const moduleRules = (): CssRule[] =>
  parseRules(readFileSync(resolve(__dirname, '..', 'src', 'client', 'skin-center.module.css'), 'utf-8'))

const badgeRule = (className: string): CssRule => {
  const selector = 'body[data-dsh-skin-center] ' + className
  const blocks = rulesFor(moduleRules(), selector)
  expect(blocks.length, 'expected one rule for ' + selector).toBe(1)
  return blocks[0]
}

const rootInk = (skin: SkinId, theme: 'light' | 'dark'): string => {
  const selector = theme === 'light' ? ':root' : 'body[data-ds-dark-theme]'
  const blocks = rulesFor(skinRules(skin, 'skin.css'), selector)
  expect(blocks.length, 'expected one root block for ' + skin + ' ' + theme).toBe(1)
  const value = declarations(blocks[0].body).get('--dsw-alias-label-primary')
  expect(value, skin + ' ' + theme + ' root label primary').toBeDefined()
  return value as string
}

describe('skin center state pills', () => {
  it('user sees every pill paint its text with the label token', () => {
    // Given the three state pills the skin center renders
    for (const badge of BADGE_RULES) {
      // When each rule is read
      const found = declarations(badgeRule(badge.className).body)
      // Then its text comes from the label token, so a skin's remap applies
      expect(found.get('color'), badge.className + ' color').toBe('var(--dsw-alias-label-primary)')
    }
  })

  it('user sees the semantic colour kept in the fill and a non-zero border', () => {
    for (const badge of BADGE_RULES) {
      const found = declarations(badgeRule(badge.className).body)
      // Then the semantic colour survives as the fill and as a real outline
      expect(found.get('background'), badge.className + ' background').toBe('var(' + badge.fillToken + ')')
      const border = found.get('border')
      expect(border, badge.className + ' border').toBeDefined()
      expect(
        /^([1-9]\d*(?:\.\d+)?)px\s+solid\s+var\(--dsw-[a-z0-9-]+\)$/.test(border as string),
        badge.className + ' border must be a non-zero token outline, got: ' + border,
      ).toBe(true)
      expect(border, badge.className + ' border token').toContain(badge.strokeToken)
    }
  })

  it('user sees no bare hex and no brand blue left as pill text', () => {
    for (const badge of BADGE_RULES) {
      const rule = badgeRule(badge.className)
      // Then the rule carries no literal colour at all
      expect(rule.body, badge.className + ' bare hex').not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      // And brand blue is not what the text resolves to
      const color = declarations(rule.body).get('color') as string
      expect(color, badge.className + ' text colour').not.toContain('brand-primary')
      expect(color, badge.className + ' text colour').not.toContain('state-success-primary')
    }
  })

  it('user sees the dark trying pill keep semantic blue with a readable plate', () => {
    // Given the dark-theme trying pill and its previous mid-blue plate
    const darkRule = rulesFor(moduleRules(), 'body[data-ds-dark-theme][data-dsh-skin-center] .badgeTrying')
    expect(darkRule).toHaveLength(1)
    const background = declarations(darkRule[0].body).get('background')
    // When the semantic fill is read
    // Then it uses the darker business tertiary plate instead of that mid-blue
    expect(background).toBe('var(--dsw-alias-state-business-tertiary)')
    for (const skin of skins) {
      const darkInk = rootInk(skin, 'dark')
      // And the actual label ink clears AA on the new plate, but failed on the old one
      expect(contrastRatio(darkInk, '#293d73'), skin + ' dark trying ink on business tertiary').toBeGreaterThanOrEqual(MIN_CONTRAST)
      expect(contrastRatio(darkInk, '#687aa6'), skin + ' dark trying ink on the previous dimmed plate').toBeLessThan(MIN_CONTRAST)
    }
  })

  it('user sees each skin ink clear 4.5:1 on the fill its own theme paints', () => {
    for (const skin of skins) {
      const lightInk = rootInk(skin, 'light')
      const darkInk = rootInk(skin, 'dark')
      // Given the fills the pills paint in the light theme
      const lightFills = [
        DELEGATED_FILL[skin].light,
        HOST_LIGHT_FILL['--dsw-alias-state-success-tertiary'],
        HOST_LIGHT_FILL['--dsw-alias-button-primary-dimmed'],
      ]
      for (const fill of lightFills) {
        // When the skin's light ink is measured on each of them
        expect(contrastRatio(lightInk, fill), skin + ' light ink ' + lightInk + ' on ' + fill).toBeGreaterThanOrEqual(
          MIN_CONTRAST,
        )
      }
      // Then the dark theme pairs the light ink with the dark plate the skin
      // paints, which is the worst case for a light ink
      const darkFill = DELEGATED_FILL[skin].dark
      expect(contrastRatio(darkInk, darkFill), skin + ' dark ink ' + darkInk + ' on ' + darkFill).toBeGreaterThanOrEqual(
        MIN_CONTRAST,
      )
      // And the polarity holds in both themes: the ink is always on the safe
      // side of its own fill, so a darker or lighter fill only raises the ratio
      expect(relativeLuminance(lightInk), skin + ' light ink darker than its fill').toBeLessThan(
        relativeLuminance(DELEGATED_FILL[skin].light),
      )
      expect(relativeLuminance(darkInk), skin + ' dark ink lighter than its fill').toBeGreaterThan(
        relativeLuminance(darkFill),
      )
    }
  })
})
