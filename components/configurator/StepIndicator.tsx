'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { DictKey } from '@/lib/i18n/dictionaries'

export const STEP_KEYS: DictKey[] = [
  'design.step.inspiration',
  'design.step.dimensions',
  'design.step.material',
  'design.step.edge',
  'design.step.base',
  'design.step.finish',
  'design.step.review',
]

export default function StepIndicator({
  current,
  furthest,
  onSelect,
}: {
  current: number
  /** Highest step the visitor has reached; earlier steps stay clickable. */
  furthest: number
  onSelect: (index: number) => void
}) {
  const { t, num } = useI18n()

  return (
    <ol className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar sm:gap-2">
      {STEP_KEYS.map((key, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo'
        const reachable = index <= furthest

        return (
          <li key={key} className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => reachable && onSelect(index)}
              disabled={!reachable}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 transition-colors',
                state === 'current' && 'bg-ink text-sand-50',
                state === 'done' && 'text-ink hover:bg-sand-200',
                state === 'todo' && 'text-ink-muted',
                !reachable && 'cursor-not-allowed',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  state === 'current' && 'bg-sand-50 text-ink',
                  state === 'done' && 'bg-verde text-white',
                  state === 'todo' && 'border border-sand-300 bg-white',
                )}
              >
                {state === 'done' ? <Check className="h-3 w-3" /> : num(index + 1)}
              </span>
              <span className="whitespace-nowrap text-xs font-medium sm:text-sm">{t(key)}</span>
            </button>

            {index < STEP_KEYS.length - 1 && (
              <span
                aria-hidden
                className={cn('h-px w-4 sm:w-6', index < current ? 'bg-verde' : 'bg-sand-300')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
