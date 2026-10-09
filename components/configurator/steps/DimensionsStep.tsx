'use client'

import DimensionControl from '@/components/configurator/DimensionControl'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useDesignStore } from '@/lib/store/design-store'
import { dimensionRange, type Unit } from '@/lib/data/design'
import { cn } from '@/lib/utils'

/**
 * Step two: the measurements.
 *
 * Every value written here lands in the store, and the preview reads the store,
 * so a change is on screen on the same frame — no request, no regeneration, no
 * remount. What the preview can honestly show is the *number*; the photograph is
 * not restretched to fake a longer table, because that would be a picture of a
 * lie. The numbers are what the workshop quotes from, and they are exact.
 */
export default function DimensionsStep() {
  const { t, l } = useI18n()

  const design = useDesignStore((s) => s.design)
  const setDimension = useDesignStore((s) => s.setDimension)
  const nudgeDimension = useDesignStore((s) => s.nudgeDimension)
  const setUnit = useDesignStore((s) => s.setUnit)

  const { unit } = design.dimensions
  // A circle has one diameter, so the width follows the length rather than
  // offering the customer a contradiction.
  const locked = design.shape === 'round' || design.shape === 'square'

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sand-300 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-primary text-base font-semibold text-ink">
              {t('design.dimensions.title')}
            </h3>
            <p className="mt-1 text-xs text-ink-muted">{t('design.dimensions.note')}</p>
          </div>

          {/* Unit is a display choice; the stored measurements never change. */}
          <div
            dir="ltr"
            className="flex overflow-hidden rounded-full border border-sand-300 text-xs font-semibold"
          >
            {(['cm', 'in'] as Unit[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setUnit(option)}
                aria-pressed={unit === option}
                className={cn(
                  'px-3 py-1.5 transition-colors',
                  unit === option ? 'bg-ink text-sand-50' : 'bg-white text-ink-soft hover:text-ink',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <DimensionControl
            id="design-length"
            label={t('design.dimensions.length')}
            value={design.dimensions.length}
            range={dimensionRange(design.pieceType, 'length')}
            unit={unit}
            onChange={(v) => setDimension('length', v)}
            onNudge={(d) => nudgeDimension('length', d)}
          />
          <DimensionControl
            id="design-width"
            label={t('design.dimensions.width')}
            value={design.dimensions.width}
            range={dimensionRange(design.pieceType, 'width')}
            unit={unit}
            onChange={(v) => setDimension('width', v)}
            onNudge={(d) => nudgeDimension('width', d)}
            disabled={locked}
            note={locked ? l({ ar: 'يتبع القطر', en: 'Follows the diameter' }) : undefined}
          />
          <DimensionControl
            id="design-height"
            label={t('design.dimensions.height')}
            value={design.dimensions.height}
            range={dimensionRange(design.pieceType, 'height')}
            unit={unit}
            onChange={(v) => setDimension('height', v)}
            onNudge={(d) => nudgeDimension('height', d)}
          />
        </div>
      </section>

      <p className="rounded-xl border border-sand-300 bg-sand-50 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
        {t('design.dimensions.help')}
      </p>
    </div>
  )
}
