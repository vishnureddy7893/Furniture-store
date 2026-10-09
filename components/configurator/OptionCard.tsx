'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionCardProps {
  selected: boolean
  onSelect: () => void
  title: string
  description?: string
  /** Small badge, e.g. stone availability. */
  badge?: string
  /** Preview drawing rendered above the label. */
  preview?: React.ReactNode
  className?: string
}

/**
 * One selectable option in the configurator. A real `<button>` with
 * `aria-pressed` rather than a clickable div, so it is keyboard reachable.
 */
export default function OptionCard({
  selected,
  onSelect,
  title,
  description,
  badge,
  preview,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white text-start transition-all duration-200',
        selected
          ? 'border-ink shadow-stone'
          : 'border-sand-300 hover:border-bronze hover:shadow-stone',
        className,
      )}
    >
      {preview && (
        <span className="block overflow-hidden border-b border-sand-200 bg-sand-100">
          {preview}
        </span>
      )}

      <span className="block p-4">
        <span className="flex items-start justify-between gap-2">
          <span className="font-primary text-sm font-semibold text-ink">{title}</span>
          <span
            aria-hidden
            className={cn(
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
              selected ? 'border-ink bg-ink text-sand-50' : 'border-sand-300',
            )}
          >
            {selected && <Check className="h-3 w-3" />}
          </span>
        </span>

        {description && (
          <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">{description}</span>
        )}

        {badge && (
          <span className="mt-2.5 inline-block rounded-full bg-sand-200 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
            {badge}
          </span>
        )}
      </span>
    </button>
  )
}
