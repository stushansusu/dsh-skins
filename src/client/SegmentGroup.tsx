/**
 * A segmented control with the sliding highlight the reference design uses:
 * one pill sits under the pressed option and TRAVELS to the next one, instead
 * of each option fading its own background out and the next one in.
 *
 * The pill is a real element rather than a pseudo-element because the options
 * are React buttons whose boxes change with the copy, the font and the
 * container width. Each placement measures the active button against the
 * group's padding box (the same origin an absolutely positioned child uses),
 * writes x/y/width/height once, and lets CSS transition them, so a control
 * that wraps onto a second line still lands the pill on the right row.
 * A ResizeObserver re-measures when the group or one of its options changes
 * size (a longer locale, a zoom step, the panel growing); nothing animates on
 * the first placement, because the pill appears where it belongs.
 *
 * The slide deliberately keeps playing when the system asks for reduced
 * motion: a quarter-second move of one small box is how this control reads,
 * and the reference control it copies does the same.
 */
import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import css from './skin-center.module.css'

/** One option of the control: its copy, whether it is the pressed one, and what a press does. */
export interface SegmentOption {
  key: string
  label: string
  active: boolean
  disabled?: boolean
  onSelect(): void
}

/** Props of {@link SegmentGroup}. */
export interface SegmentGroupProps {
  /** Accessible name of the whole control. */
  label: string
  options: SegmentOption[]
}

/** The pill's box inside the group, in CSS pixels. */
interface PillBox {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Render a segmented control whose highlight slides to the pressed option.
 * @param props - the control's accessible name and its options.
 * @returns the control.
 */
export function SegmentGroup({ label, options }: SegmentGroupProps): ReactNode {
  const group = useRef<HTMLDivElement | null>(null)
  const items = useRef<Map<string, HTMLButtonElement>>(new Map())
  // The latest options, so the measurement callback stays stable: a control
  // that re-creates its observer on every render would restart it on the very
  // render its own setState causes.
  const latest = useRef(options)
  latest.current = options
  const [box, setBox] = useState<PillBox | null>(null)

  const measure = useCallback((): void => {
    const active = latest.current.find(option => option.active)
    const element = active === undefined ? undefined : items.current.get(active.key)
    if (element === undefined) {
      setBox(null)
      return
    }
    // offsetLeft/offsetTop are read from the group's padding edge, which is
    // exactly the containing block an absolutely positioned pill is placed in.
    const next = {
      x: element.offsetLeft,
      y: element.offsetTop,
      w: element.offsetWidth,
      h: element.offsetHeight,
    }
    setBox(current => (
      current !== null && current.x === next.x && current.y === next.y
        && current.w === next.w && current.h === next.h
        ? current
        : next
    ))
  }, [])

  // The placement follows the pressed option, in the same task as the paint,
  // so the press and the move land together.
  useLayoutEffect(() => { measure() })

  useLayoutEffect(() => {
    const element = group.current
    if (element === null || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => { measure() })
    observer.observe(element)
    for (const item of items.current.values()) observer.observe(item)
    return () => { observer.disconnect() }
  }, [measure, options.length])

  return (
    <div className={css.segmentGroup} role="group" aria-label={label} ref={group}>
      {box !== null && (
        <span
          className={css.segmentPill}
          aria-hidden="true"
          style={{
            width: `${box.w}px`,
            height: `${box.h}px`,
            transform: `translate(${box.x}px, ${box.y}px)`,
          }}
        />
      )}
      {options.map(option => (
        <button
          key={option.key}
          type="button"
          ref={(element) => {
            if (element === null) items.current.delete(option.key)
            else items.current.set(option.key, element)
          }}
          aria-pressed={option.active}
          disabled={option.disabled}
          className={option.active ? `${css.segmentButton} ${css.segmentButtonActive}` : css.segmentButton}
          onClick={option.onSelect}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
