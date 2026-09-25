/**
 * Blue Fantasy 0.1.7 adaptation gaps (issue #1714).
 *
 * 0.1.7 split the conversation's "process" display into a per-step row and made
 * the turn-process row a non-interactive elapsed-time bar. The skin's patch
 * layer predated both, leaving two defects:
 *
 * 1. the new step title line had no plate, so bare text sat directly on the
 *    illustration while its sibling rows (turn-process, tool calls) all carried
 *    the translucent readability layer;
 * 2. the skin's global `button:disabled` outranked the shell's own
 *    `cursor: default` on the elapsed-time bar, which is always disabled, so the
 *    bar rendered as a greyed-out control with a not-allowed cursor.
 *
 * Both are single declarations that an unrelated edit could silently undo, and
 * the plate has two traps worth pinning: the row root contains the expanded
 * body (a plate there stacks a second background behind every member row), and
 * the label span uses `background-clip: text` (a plate there erases the glyphs).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const PATCHES = readFileSync(resolve(__dirname, '../skins/blue-fantasy/patches.css'), 'utf8')
/** Comments removed: the assertions must read declarations, not prose. */
const CSS = PATCHES.replace(/\/\*[\s\S]*?\*\//g, '')

/** The declaration block of the rule whose selector starts a line. */
function block(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp('^' + escaped + ' \\{', 'm').exec(CSS)
  expect(match, 'rule not found: ' + selector).not.toBeNull()
  const start = CSS.indexOf('{', match!.index)
  return CSS.slice(start + 1, CSS.indexOf('}', start))
}

/** The step-process plate rule as authored (light and dark variants share this shape). */
const STEP_PLATE = '[data-slot="main.conversation"] [data-step-process] [data-process-activity]'

describe('blue-fantasy step-process row plate (issue #1714)', () => {
  it('user gets the same readability layer the sibling process rows carry', () => {
    // Given the step title button, targeted by the semantic attribute the shell stamps
    const plate = block(STEP_PLATE)
    // When the skin's readability layer applies
    // Then it matches the turn-process row: translucent fill, blur, 8px radius
    expect(plate).toContain('background: rgb(242 245 250 / calc(var(--dsh-skin-bubble-alpha, .5) * 1))')
    expect(plate).toContain('backdrop-filter: blur(var(--dsh-skin-bubble-blur, 10px)) saturate(1.3)')
    expect(plate).toContain('border-radius: 8px')
    expect(plate).toContain('padding: 1px 8px')
  })

  it('user keeps the activity icon aligned with the member rows below it', () => {
    // Given the plate adds 8px of left padding
    const plate = block(STEP_PLATE)
    // When the icon must keep the x it shares with the expanded member rows
    // Then the padding is cancelled so the plate grows leftwards instead of
    // pushing the text column right by 8px
    expect(plate).toContain('margin-left: -8px')
  })

  it('operator gets a dark variant that follows the same bubble-opacity family', () => {
    // Given the dark theme
    const dark = block('body[data-ds-dark-theme] ' + STEP_PLATE)
    // When the plate paints
    // Then it uses the dark fill the sibling rows use, so both rows track the
    // bubble-opacity slider together
    expect(dark).toContain('background: rgb(16 22 42 / calc(var(--dsh-skin-bubble-alpha, .5) * .8))')
  })

  it('never plates the row root or the shimmer label span', () => {
    // Given the two traps the report names
    // When the skin is read for a plate on either one
    // Then neither carries a background: on the root it would stack a second
    // plate behind every expanded member row, and on the label span (which uses
    // background-clip: text) it would erase the glyphs
    expect(CSS).not.toMatch(/^\s*\[data-slot="main\.conversation"\] \[data-step-process\] \{/m)
    expect(CSS).not.toContain('[data-step-process] .leading')
    expect(CSS).not.toContain('[data-step-process] [data-step-process-icon]')
  })
})

describe('blue-fantasy disabled-control styling (issue #1714)', () => {
  it('user does not get the elapsed-time bar styled as a disabled control', () => {
    // Given the skin's global disabled-button rule
    const rule = block('button:disabled:not([data-turn-process]), .aionui-btn:disabled, .aionui-menu-item-disabled')
    // When it paints a disabled button
    // Then it still greys real controls
    expect(rule).toContain('opacity: .55')
    expect(rule).toContain('cursor: not-allowed')
    // And the shell's always-disabled info bar is excluded, so the shell's own
    // `cursor: default` wins and the bar is not dimmed
    expect(CSS).toContain('button:disabled:not([data-turn-process])')
    expect(CSS).not.toMatch(/^\s*button:disabled,\s*$/m)
  })
})
