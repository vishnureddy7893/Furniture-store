'use client'

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { fromCm, toCm, type Unit } from '@/lib/data/design'
import { cn } from '@/lib/utils'

/**
 * One dimension: a slider, a stepper, and a field you can type an exact number
 * into. Three ways to reach the same value, because customers reach for
 * different ones — a slider to explore, a keyboard when they already know the
 * measurement their space needs.
 *
 * The typed field is the fiddly one, and it is handled as follows: while the
 * field has focus the text is held locally, so a half-typed "2" on the way to
 * "250" never becomes the configuration. Each keystroke that parses to a number
 * inside the range is committed immediately (so the preview follows as you
 * type); anything else is simply not committed, and on blur the field snaps back
 * to the value that is actually stored. Nothing a customer can type — empty,
 * "abc", "-", "99999" — can put a bad number into the design.
 *
 * All values in and out are centimetres. The unit is a display concern and is
 * converted at this boundary only.
 */

interface DimensionControlProps {
  id: string
  label: string
  /** Centimetres. */
  value: number
  /** Centimetres. */
  range: { min: number; max: number; step: number }
  unit: Unit
  onChange: (valueCm: number) => void
  onNudge: (direction: 1 | -1) => void
  disabled?: boolean
  /** Shown under the row, e.g. when the width follows the diameter. */
  note?: string
}

export default function DimensionControl({
  id,
  label,
  value,
  range,
  unit,
  onChange,
  onNudge,
  disabled,
  note,
}: DimensionControlProps) {
  const { t } = useI18n()

  const decimals = unit === 'cm' ? 0 : 1
  const display = (cm: number) => (Math.round(fromCm(cm, unit) * 10) / 10).toFixed(decimals)

  const [text, setText] = useState(() => display(value))
  const [editing, setEditing] = useState(false)

  // Follow the store whenever the customer is not the one typing — the slider,
  // the stepper, a unit switch and a change of piece type all land here.
  useEffect(() => {
    if (!editing) setText(display(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, unit, editing])

  const commit = (raw: string) => {
    // Accept Arabic-Indic digits too: an Arabic keyboard may well produce them.
    const normalised = raw
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[^\d.]/g, '')
    if (normalised === '') return
    const parsed = Number(normalised)
    if (!Number.isFinite(parsed)) return
    onChange(toCm(parsed, unit))
  }

  const sliderStep = unit === 'cm' ? range.step : 1
  const minDisplay = display(range.min)
  const maxDisplay = display(range.max)

  return (
    <div className={cn(disabled && 'opacity-55')}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink-soft">
          {label}
        </label>

        {/* −  [ 220 ]  +   cm */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onNudge(-1)}
            disabled={disabled || value <= range.min}
            aria-label={`${t('design.dimensions.decrease')} ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sand-300 bg-white text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden />
          </button>

          <input
            id={id}
            // `text` rather than `number`: a number input on mobile hides the
            // value behind spinners and fights the stepper buttons.
            type="text"
            inputMode="decimal"
            dir="ltr"
            disabled={disabled}
            value={text}
            aria-label={`${label} (${unit})`}
            onFocus={() => setEditing(true)}
            onChange={(event) => {
              setText(event.target.value)
              commit(event.target.value)
            }}
            onBlur={() => {
              setEditing(false)
              setText(display(value))
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                onNudge(1)
              }
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                onNudge(-1)
              }
            }}
            className="h-8 w-[4.5rem] rounded-lg border border-sand-300 bg-white text-center font-primary text-sm font-semibold text-ink transition-colors focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={() => onNudge(1)}
            disabled={disabled || value >= range.max}
            aria-label={`${t('design.dimensions.increase')} ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sand-300 bg-white text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>

          <span className="ms-1 w-6 text-xs font-medium text-ink-muted">{unit}</span>
        </div>
      </div>

      <input
        type="range"
        aria-label={`${label} — ${t('design.dimensions.slider')}`}
        min={range.min}
        max={range.max}
        step={sliderStep}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-sand-300 accent-ink disabled:cursor-not-allowed"
      />

      <div className="mt-1 flex justify-between text-[11px] text-ink-muted" dir="ltr">
        <span>{minDisplay}</span>
        <span>{maxDisplay}</span>
      </div>

      {note && <p className="mt-1 text-[11px] text-ink-muted">{note}</p>}
    </div>
  )
}
