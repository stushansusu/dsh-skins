/** A numeric stepper matching the harness's own font-size setting control. */

import { useState, type ReactNode } from 'react'
import { RangeBubble } from './RangeBubble.tsx'
import css from './skin-center.module.css'

export interface StepperControlProps {
  id?: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  disabled?: boolean
  ariaLabel: string
  onChange: (value: number) => void
}

/** Round a stepped value without float drift (0.3 + 0.1 style errors). */
function stepped(value: number, step: number): number {
  const precision = Math.max(0, (String(step).split('.')[1] ?? '').length)
  return Number(value.toFixed(precision))
}

/** Clamp one step; the bound owns the endpoint exactly. */
function adjacent(value: number, direction: 1 | -1, min: number, max: number, step: number): number {
  if (direction > 0 && value >= max) return max
  if (direction < 0 && value <= min) return min
  return stepped(Math.min(max, Math.max(min, value + direction * step)), step)
}

/**
 * Official-style numeric stepper: current value, stacked increment/decrement
 * arrows and a unit. Both buttons are ordinary buttons, so keyboard and
 * assistive activation behave natively. Resting the pointer on it raises the
 * coarse slider bubble (RangeBubble.tsx) across the whole range: the value
 * follows the thumb while it moves and is written once, on release, so a drag
 * never floods the store with every intermediate value.
 */
export function StepperControl(props: StepperControlProps): ReactNode {
  const { value, min, max, step, disabled = false, ariaLabel } = props
  const [live, setLive] = useState<number | null>(null)
  const change = (direction: 1 | -1): void => {
    const next = adjacent(value, direction, min, max, step)
    if (next !== value) props.onChange(next)
  }
  return (
    <div className={css.stepperControl}>
      <RangeBubble
        min={min}
        max={max}
        step={step}
        value={value}
        label={`${ariaLabel} ${min}–${max}`}
        disabled={disabled}
        onInput={setLive}
        onCommit={(next) => {
          setLive(null)
          if (next !== value) props.onChange(next)
        }}
      >
        <div id={props.id} className={css.stepper} role="group" aria-label={ariaLabel}>
          <output className={css.stepperValue}>{live ?? value}</output>
          <span className={css.stepperArrows}>
            <button
              type="button"
              className={css.stepperArrow}
              aria-label={`${ariaLabel} +${step}`}
              title={`${ariaLabel} +${step}`}
              disabled={disabled || value >= max}
              onClick={() => { change(1) }}
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true" strokeWidth="1">
                <path d="M12 10L8.70711 6.70711C8.31658 6.31658 7.68342 6.31658 7.29289 6.70711L4 10" stroke="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className={css.stepperArrow}
              aria-label={`${ariaLabel} -${step}`}
              title={`${ariaLabel} -${step}`}
              disabled={disabled || value <= min}
              onClick={() => { change(-1) }}
            >
              <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden="true" strokeWidth="1">
                <path d="M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6" stroke="currentColor" />
              </svg>
            </button>
          </span>
        </div>
      </RangeBubble>
      {props.unit === undefined ? null : <span className={css.stepperUnit}>{props.unit}</span>}
    </div>
  )
}
