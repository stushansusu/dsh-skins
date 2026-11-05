// @vitest-environment jsdom

import { useState, type ReactNode } from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { SegmentGroup, type SegmentOption } from '../src/client/SegmentGroup.tsx'

;((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT) = true

// jsdom lays nothing out, so the measurement has to read something: every
// button is given a 48x26 box and a slot 50px wide, which is what the real
// control gives two options in one row.
function stubLayout(): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return this instanceof HTMLButtonElement ? 48 : 0 },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return this instanceof HTMLButtonElement ? 26 : 0 },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get() { return 0 },
  })
  Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
    configurable: true,
    get() {
      if (!(this instanceof HTMLButtonElement)) return 0
      const parent = this.parentElement
      if (parent === null) return 0
      return [...parent.querySelectorAll('button')].indexOf(this) * 50
    },
  })
}

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  stubLayout()
  document.body.innerHTML = '<div id="root"></div>'
  host = document.getElementById('root') as HTMLDivElement
  root = createRoot(host)
})

afterEach(() => {
  act(() => { root.unmount() })
})

/** The control as its owner renders it: the pressed option is state. */
function Host(): ReactNode {
  const [active, setActive] = useState('light')
  const options: SegmentOption[] = [
    { key: 'light', label: '亮色', active: active === 'light', onSelect: () => { setActive('light') } },
    { key: 'dark', label: '暗色', active: active === 'dark', onSelect: () => { setActive('dark') } },
  ]
  return <SegmentGroup label="主题预览" options={options} />
}

function pill(): HTMLElement {
  const element = host.querySelector<HTMLElement>('span[aria-hidden="true"]')
  if (element === null) throw new Error('the sliding pill is not rendered')
  return element
}

describe('SegmentGroup', () => {
  it('sits the highlight on the pressed option, measured against the group', () => {
    act(() => { root.render(<Host />) })

    expect(host.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('主题预览')
    expect(pill().style.transform).toBe('translate(0px, 0px)')
    expect(pill().style.width).toBe('48px')
    expect(pill().style.height).toBe('26px')
  })

  it('moves the highlight to the option that was pressed', () => {
    act(() => { root.render(<Host />) })
    const dark = [...host.querySelectorAll('button')].find(button => button.textContent === '暗色')

    act(() => { dark?.click() })

    expect(dark?.getAttribute('aria-pressed')).toBe('true')
    expect(pill().style.transform).toBe('translate(50px, 0px)')
  })
})
