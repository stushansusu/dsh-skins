import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// Both atelier skins copy the host's desktop hero contract, which floors the
// content width at 560px. On a 390px phone that floor is wider than the viewport,
// so the hero's own layout could not fit: phoebe's three-column title pushed the
// preview badge into the same space, and maid's badge hangs off the title's right
// edge by design. Each skin now carries its own phone block — a skin is a
// self-contained asset directory, so there is deliberately no shared stylesheet —
// and the checks below pin the block that releases the floor, the values the
// phone layout asks for, and the desktop values it must leave alone.

interface CssRule {
  selector: string
  body: string
}

interface MediaBlock {
  condition: string
  rules: CssRule[]
}

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim()

const strip = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '')

const rulesOf = (css: string): CssRule[] => {
  const source = strip(css)
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
        rules.push({ selector: normalize(prelude), body: source.slice(bodyStart, index) })
        preludeStart = index + 1
      }
    }
  }
  return rules
}

// The top-level media blocks whose condition is the phone breakpoint, with the
// rules they hold. Both the classic (max-width: 480px) and the range
// (width <= 480px) spelling count, so reformatting a skin cannot hide a block.
const phoneBlocks = (css: string): MediaBlock[] => {
  const source = strip(css)
  const blocks: MediaBlock[] = []
  const opening = /@media\s*\(([^)]*)\)\s*\{/g
  let match: RegExpExecArray | null
  while ((match = opening.exec(source)) !== null) {
    const condition = normalize(match[1])
    const phone = /max-width:\s*480px/.test(condition) || /width\s*<=\s*480px/.test(condition)
    let depth = 1
    let index = opening.lastIndex
    while (index < source.length && depth > 0) {
      if (source[index] === '{') depth += 1
      else if (source[index] === '}') depth -= 1
      index += 1
    }
    if (phone) blocks.push({ condition, rules: rulesOf(source.slice(opening.lastIndex, index - 1)) })
    opening.lastIndex = index
  }
  return blocks
}

const declarations = (body: string): Map<string, string> => {
  const found = new Map<string, string>()
  for (const part of body.split(';')) {
    const colon = part.indexOf(':')
    if (colon < 0) continue
    const name = part.slice(0, colon).trim()
    if (!name) continue
    found.set(name, normalize(part.slice(colon + 1)))
  }
  return found
}

interface SkinPhone {
  skin: string
  file: string
  // The hero scope that owns the content-width floor.
  hero: string
  headline: string
  crest: string
  hairline: string
  badge: string
  // How this skin's phone block has to neutralise the desktop badge placement.
  badgeFix: { property: string; value: string }
}

const SKINS: SkinPhone[] = [
  {
    skin: 'phoebe-atelier',
    file: 'skin.css',
    hero: "body [data-phase='hero']",
    headline: "body [data-phase='hero'] [class*='headline']:has(> [class*='fish'])",
    crest: "body [data-phase='hero'] [class*='headline']:has(> [class*='fish']) > [class*='fish']",
    hairline: "body [data-phase='hero'] [class*='headline']:has(> [class*='fish'])::before",
    badge: "body [data-phase='hero'] [class*='previewBadge']",
    // The desktop badge is the third grid column of the headline.
    badgeFix: { property: 'grid-column', value: '1 / -1' },
  },
  {
    skin: 'maid-atelier',
    file: 'patches.css',
    hero: '[data-phase="hero"]',
    headline: '[data-phase="hero"] :is([class*="headline"], [class*="Headline"]):has([class*="fish"])',
    crest:
      '[data-phase="hero"] :is([class*="headline"], [class*="Headline"]) :is([class*="fishHitbox"], [class*="fish"])',
    hairline: '[data-phase="hero"] :is([class*="headline"], [class*="Headline"]):has([class*="fish"]):before',
    badge: '[data-phase="hero"] [class*="previewBadge"]',
    // The desktop badge hangs off the title with left: calc(100% + 8px) !important.
    badgeFix: { property: 'position', value: 'static !important' },
  },
]

const readSkin = (skin: string, file: string): string =>
  readFileSync(resolve(__dirname, '..', 'skins', skin, file), 'utf-8')

const withRule = (rules: CssRule[], selector: string, label: string): CssRule => {
  const wanted = normalize(selector)
  const matches = rules.filter((rule) => rule.selector === wanted)
  expect(matches.length, 'expected one phone rule for ' + label + ': ' + selector).toBe(1)
  return matches[0]
}

describe.each(SKINS)('%s phone hero', (spec) => {
  const css = readSkin(spec.skin, spec.file)
  const blocks = phoneBlocks(css)

  it('user sees exactly one phone block release the desktop content floor', () => {
    // Given the skin stylesheet
    // When its phone breakpoint blocks are collected
    expect(blocks.length, 'expected exactly one @media (max-width: 480px) block').toBe(1)
    const rules = blocks[0].rules
    // Then the hero scope releases the 560px floor to the viewport instead of
    // keeping a desktop width on a phone screen
    const hero = declarations(withRule(rules, spec.hero, 'hero scope').body)
    expect(hero.get('--dsh-chat-content-width'), 'phone content width').toBe('100%')
    expect(hero.get('--dsh-composer-card-max-width'), 'phone composer width').toBe('100%')
    // And no rule in the block reintroduces the floor
    for (const rule of rules) {
      expect(rule.body, rule.selector + ' still floors the width').not.toContain('560px')
    }
    // The desktop floor itself stays where the desktop rules put it
    expect(css, 'desktop content floor').toContain('clamp(560px, 41vw, 740px)')
  })

  it('user sees the phone headline, crest and hairline take their phone sizes', () => {
    const rules = blocks[0].rules
    // Given the hero headline at the phone breakpoint
    const headline = declarations(withRule(rules, spec.headline, 'headline').body)
    // Then the grid cannot be wider than the viewport
    expect(headline.get('width'), 'headline width').toBe('100%')
    expect(headline.get('max-width'), 'headline max width').toBe('100%')
    expect(headline.get('min-width'), 'headline min width').toBe('0')
    expect(headline.get('box-sizing'), 'headline box sizing').toBe('border-box')
    // And the stacked rows and the title take the phone rhythm
    expect(headline.get('row-gap') ?? headline.get('gap'), 'headline row gap').toBe('22px')
    expect(headline.get('font-size'), 'headline font size').toBe('clamp(20px, 5.4vw, 27px)')
    expect(headline.get('transform'), 'headline translate').toBe('translateY(-2px)')
    // When the crest and the hairline under it are read
    const crest = declarations(withRule(rules, spec.crest, 'crest').body)
    const hairline = declarations(withRule(rules, spec.hairline, 'hairline').body)
    // Then the crest is 56px and the hairline rides it
    expect(crest.get('width'), 'crest width').toBe('56px')
    expect(crest.get('height'), 'crest height').toBe('56px')
    expect(hairline.get('top'), 'hairline top').toBe('28px')
    // And the desktop sizes this block replaces are gone from it
    expect(crest.get('width'), 'desktop crest width').not.toBe('70px')
    expect(hairline.get('top'), 'desktop hairline top').not.toBe('34px')
  })

  it('user sees the phone preview badge kept inside the content box', () => {
    // Given the phone preview badge rule
    const badge = withRule(blocks[0].rules, spec.badge, 'preview badge')
    const found = declarations(badge.body)
    // Then it cannot overflow the content column
    expect(found.get('max-width'), 'badge max width').toBe('100%')
    expect(found.get('box-sizing'), 'badge box sizing').toBe('border-box')
    // And the desktop placement that put it outside is neutralised
    expect(found.get(spec.badgeFix.property), 'badge ' + spec.badgeFix.property).toBe(spec.badgeFix.value)
    if (spec.skin === 'maid-atelier') {
      // The desktop rule hangs the badge off the title with !important, so the
      // phone rule has to answer it in kind
      expect(found.get('left'), 'badge left').toBe('auto !important')
      expect(found.get('top'), 'badge top').toBe('auto !important')
      expect(found.get('transform'), 'badge transform').toBe('none !important')
      expect(found.get('white-space'), 'badge wrapping').toBe('normal !important')
    }
  })
})

// The phone layout also owns the two mechanisms that put the page itself into a
// horizontal scroll on a 390px host: the desktop column-resize handles and the
// dock band. The handles are positioned from --dsh-chat-content-width, whose
// desktop floor (680px in the host's active phase) parks the right strip at
// 50% + 340px + 24px, past the viewport; the dock band is a centered flex line
// whose chips are nowrap and do not shrink, so a wide strip overflowed instead
// of wrapping. Both are fixed by removing the surplus, never by clipping the
// band away: a fix that hid the dock or clipped it would zero scrollWidth while
// destroying the strip.
describe.each(SKINS)('%s phone overflow ownership', (spec) => {
  const css = readSkin(spec.skin, spec.file)
  const blocks = phoneBlocks(css)

  const rule = (selector: string): Map<string, string> => {
    expect(blocks.length, 'expected exactly one phone block').toBe(1)
    return declarations(withRule(blocks[0].rules, selector, selector).body)
  }

  it('user sees the desktop column-resize handles gone from the phone layout', () => {
    // Given the phone block
    // When the handle rule is read
    const found = rule('body [data-width-handle]')
    // Then the strips the host positions from the desktop content width are not
    // rendered, so nothing can sit outside the viewport and extend the page
    expect(found.get('display'), 'width handle display').toBe('none')
  })

  it('user sees the dock band allowed to wrap instead of overflowing', () => {
    // Given the dock band's own container on the phone
    const found = rule('body [data-composer-dock]')
    // Then the line wraps when it does not fit
    expect(found.get('flex-wrap'), 'dock wrap').toBe('wrap')
    // And the band is neither hidden nor clipped: zeroing scrollWidth by taking
    // the strip away would be masking, not fixing
    expect(found.get('display'), 'dock display').toBeUndefined()
    expect(found.get('overflow'), 'dock overflow').toBeUndefined()
    expect(found.get('overflow-x'), 'dock overflow-x').toBeUndefined()
    expect(found.get('max-height'), 'dock height').toBeUndefined()
  })

  it('user sees the desktop content floor untouched outside the phone block', () => {
    // Given the phone block's own width release
    // Then it is the block, not a global edit, that consumes the floor
    expect(css.match(/clamp\(560px, 41vw, 740px\)/g)?.length, 'desktop floor occurrences').toBe(1)
  })
})
