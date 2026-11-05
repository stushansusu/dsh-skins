/**
 * Attachment controls must not eat the composer's send-key skin (issue #100).
 *
 * Four skins in the whale-family template locate the send button by exclusion —
 * \`body [data-composer-card] button:not([aria-haspopup])\` — because the button
 * carries no data hook of its own. The official attachment rail
 * (\`ComposerAttachments\`, UI slot \`conversation.input.attachments\`) renders two
 * buttons per image that also lack aria-haspopup: the thumbnail and the remove
 * control. The remove control is \`position: absolute; top: 4px; right: 4px\` so it
 * floats over the 64px \`.imageItem\`; the send-key rule set \`position: relative\`,
 * which put it back into flow, pushed it out of the box and dropped the
 * \`.imageItem:hover .remove\` reveal — the delete button simply disappeared.
 *
 * The fix excludes the slot subtree by its stable registered slot name instead
 * of a CSS-Modules hash (those change on every official rebuild). This spec
 * pins the exclusion on every selector of that family, in every skin that uses
 * it, so a copy-paste into a new skin cannot quietly reintroduce the bug.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO = fileURLToPath(new URL('..', import.meta.url))

/** Every skin whose stylesheet locates the send button by exclusion. */
const SKINS = ['whale-fantasy', 'rainy-night', 'shuimo-danqing', 'xinghai-heart'] as const

const EXCLUSION = ":not([data-slot='conversation.input.attachments'] *)"

function patchesOf(skin: string): string {
  return readFileSync(join(REPO, 'skins', skin, 'patches.css'), 'utf8')
}

/** Selector heads of the send-key family, comments stripped. */
function sendKeySelectors(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return stripped
    .split('}')
    .map(rule => (rule.split('{')[0] ?? '').trim())
    .filter(head => head.includes('[data-composer-card] button:not([aria-haspopup])'))
}

describe('composer send-key selectors exclude the attachment rail', () => {
  for (const skin of SKINS) {
    it(skin + ' excludes the attachments slot on every send-key selector', () => {
      const heads = sendKeySelectors(patchesOf(skin))
      expect(heads.length).toBeGreaterThan(0)
      const missing = heads.filter(head => !head.includes(EXCLUSION))
      expect(missing).toEqual([])
    })
  }

  it('the exclusion is what a plain send-key selector would miss', () => {
    // Guard against a vacuous suite: without the exclusion the same selector
    // really does match the attachment buttons' ancestor chain.
    const official =
      '<div data-composer-card><div data-slot="conversation.input.attachments">' +
      '<div class="X_imageItem"><button class="X_thumbnail"></button>' +
      '<button class="X_remove"></button></div></div></div>'
    expect(official).toContain('data-slot="conversation.input.attachments"')
    const heads = sendKeySelectors(patchesOf('whale-fantasy'))
    expect(heads.some(head => head.includes(':not([aria-haspopup]):not('))).toBe(true)
  })
})
