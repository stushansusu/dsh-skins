// @vitest-environment jsdom
/**
 * The stepper's coarse slider bubble: resting the pointer on the stepper
 * raises a slider over the whole range, the shown value follows the thumb,
 * and the store is written once, when the thumb is released.
 */
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { StepperControl } from '../src/client/StepperControl.tsx'

;((globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT) = true

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.useFakeTimers()
  document.body.innerHTML = '<div id="root"></div>'
  host = document.getElementById('root') as HTMLDivElement
  root = createRoot(host)
})

afterEach(() => {
  act(() => { root.unmount() })
  vi.useRealTimers()
})

/**
 * Render one stepper over 0..100 holding 40.
 * @returns the recorded writes.
 */
function renderStepper(): number[] {
  const writes: number[] = []
  act(() => {
    root.render(
      <StepperControl
        id="opacity"
        min={0}
        max={100}
        step={5}
        unit="%"
        value={40}
        ariaLabel="Opacity"
        onChange={(value) => { writes.push(value) }}
      />,
    )
  })
  return writes
}

/** The bubble element around the slider. */
function bubble(): HTMLElement {
  const node = host.querySelector('input[type="range"]')?.closest('[data-side]')
  if (!(node instanceof HTMLElement)) throw new Error('the slider bubble did not render')
  return node
}

/** Set the range input's value the way React's change tracking sees it. */
function drag(slider: HTMLInputElement, value: number): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(slider, String(value))
  slider.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('stepper coarse slider bubble', () => {
  it('user resting on the stepper sees the bubble open after a short pause', () => {
    // Given a stepper with its bubble closed
    renderStepper()
    expect(bubble().hasAttribute('data-open')).toBe(false)

    // When the pointer rests on the stepper
    const anchor = bubble().parentElement as HTMLElement
    act(() => { anchor.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })) })
    act(() => { vi.advanceTimersByTime(300) })

    // Then the bubble is open and its slider sits on the current value
    expect(bubble().hasAttribute('data-open')).toBe(true)
    expect((host.querySelector('input[type="range"]') as HTMLInputElement).value).toBe('40')
  })

  it('user dragging the thumb sees the value follow it and writes once on release', () => {
    // Given an open bubble
    const writes = renderStepper()
    const slider = host.querySelector('input[type="range"]') as HTMLInputElement

    // When the thumb is dragged through two values and released
    act(() => { slider.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })) })
    act(() => { drag(slider, 70) })
    expect(host.querySelector('output')?.textContent).toBe('70')
    act(() => { drag(slider, 85) })
    expect(host.querySelector('output')?.textContent).toBe('85')
    expect(writes).toEqual([])
    act(() => { slider.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })) })

    // Then the store received only the released value
    expect(writes).toEqual([85])
  })
})
