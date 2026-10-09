'use client'

import OptionCard from '@/components/configurator/OptionCard'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useDesignStore } from '@/lib/store/design-store'
import { EDGES, SHAPES, type PieceConfig } from '@/lib/data/configurator'
import {
  BASE_TYPES,
  FINISHES,
  THICKNESS_MAX,
  THICKNESS_MIN,
  THICKNESS_OPTIONS,
  VEIN_DIRECTIONS,
  isOptionAvailable,
  toPieceConfig,
} from '@/lib/data/design'
import { cn } from '@/lib/utils'

/**
 * Steps four, five and six: edge, base, and the finishing detail.
 *
 * Each one writes a single field to the store and each preview thumbnail is
 * drawn by the app's own renderer, so the cards and the live preview cannot
 * disagree about what a choice looks like.
 */

/* ---------------------------------------------------------------- 4. edge */

export function EdgeStep() {
  const { t, l } = useI18n()
  const design = useDesignStore((s) => s.design)
  const setEdge = useDesignStore((s) => s.setEdge)
  const hasPhoto = useDesignStore((s) => s.workingImage !== null)

  const config = toPieceConfig(design)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EDGES.map((edge) => (
          <OptionCard
            key={edge.id}
            selected={design.edgeProfile === edge.id}
            onSelect={() => setEdge(edge.id)}
            title={l(edge.name)}
            description={l(edge.description)}
            preview={
              // The magnified cross-section: an edge profile is only legible
              // close up, which is exactly what this view is for.
              <PieceScene
                config={{ ...config, edge: edge.id } as PieceConfig}
                view="edge"
                className="scene-defer aspect-[16/9] w-full"
              />
            }
          />
        ))}
      </div>

      {hasPhoto && (
        <p className="rounded-xl border border-sand-300 bg-sand-50 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {t('design.edge.photoNote')}
        </p>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- 5. base */

export function BaseStep() {
  const { t, l } = useI18n()
  const design = useDesignStore((s) => s.design)
  const setBaseType = useDesignStore((s) => s.setBaseType)
  const hasPhoto = useDesignStore((s) => s.workingImage !== null)

  const config = toPieceConfig(design)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {BASE_TYPES.map((base) => {
          // Keeping the photographed base is meaningless with no photograph.
          if (base.id === 'original' && !hasPhoto) return null
          return (
            <OptionCard
              key={base.id}
              selected={design.baseType === base.id}
              onSelect={() => setBaseType(base.id)}
              title={l(base.name)}
              description={l(base.description)}
              badge={
                base.id === 'original' ? t('design.base.exactBadge') : undefined
              }
              preview={
                base.id === 'original' && design.referenceImage ? (
                  <span className="block aspect-[16/9] w-full">
                    <img
                      src={design.referenceImage}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>
                ) : (
                  <PieceScene
                    config={{ ...config, base: base.drawnAs } as PieceConfig}
                    view="scene"
                    className="scene-defer aspect-[16/9] w-full"
                  />
                )
              }
            />
          )
        })}
      </div>

      {hasPhoto && (
        <p className="rounded-xl border border-sand-300 bg-sand-50 px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {t('design.base.photoNote')}
        </p>
      )}
    </div>
  )
}

/* -------------------------------------------------- 6. finish and detail */

export function FinishStep() {
  const { t, l, num } = useI18n()
  const design = useDesignStore((s) => s.design)
  const setFinish = useDesignStore((s) => s.setFinish)
  const setThickness = useDesignStore((s) => s.setThickness)
  const setVeinDirection = useDesignStore((s) => s.setVeinDirection)
  const setShape = useDesignStore((s) => s.setShape)
  const setNotes = useDesignStore((s) => s.setNotes)

  const shapes = SHAPES.filter((shape) =>
    isOptionAvailable('shape', shape.id, design.pieceType),
  )
  const isPresetThickness = THICKNESS_OPTIONS.some(
    (option) => option.value === design.thickness,
  )

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------- finish */}
      <section>
        <h3 className="eyebrow mb-3">{t('design.finish.title')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {FINISHES.map((finish) => (
            <ChoiceRow
              key={finish.id}
              selected={design.finish === finish.id}
              onSelect={() => setFinish(finish.id)}
              title={l(finish.name)}
              description={l(finish.description)}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- thickness */}
      <section>
        <h3 className="eyebrow mb-3">{t('design.thickness.title')}</h3>
        <div className="flex flex-wrap gap-2">
          {THICKNESS_OPTIONS.map((option) => {
            const isCustom = option.value === 0
            const selected = isCustom ? !isPresetThickness : design.thickness === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setThickness(isCustom ? 25 : option.value)}
                aria-pressed={selected}
                dir={isCustom ? undefined : 'ltr'}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                  selected
                    ? 'border-ink bg-ink text-sand-50'
                    : 'border-sand-300 bg-white text-ink-soft hover:border-bronze hover:text-ink',
                )}
              >
                {l(option.name)}
              </button>
            )
          })}
        </div>

        {!isPresetThickness && (
          <div className="mt-4 rounded-xl border border-sand-300 bg-white p-4">
            <label htmlFor="design-thickness" className="field-label">
              {t('design.thickness.custom')}
            </label>
            <div className="flex items-center gap-3">
              <input
                id="design-thickness"
                type="range"
                dir="ltr"
                min={THICKNESS_MIN}
                max={THICKNESS_MAX}
                step={1}
                value={design.thickness}
                onChange={(event) => setThickness(Number(event.target.value))}
                className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-sand-300 accent-ink"
              />
              <span
                dir="ltr"
                className="w-20 shrink-0 text-end font-primary text-sm font-semibold text-ink"
              >
                {num(design.thickness)} {t('design.unit.mm')}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------ vein */}
      <section>
        <h3 className="eyebrow mb-3">{t('design.vein.title')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {VEIN_DIRECTIONS.map((vein) => (
            <ChoiceRow
              key={vein.id}
              selected={design.veinDirection === vein.id}
              onSelect={() => setVeinDirection(vein.id)}
              title={l(vein.name)}
              description={l(vein.description)}
            />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- shape */}
      {shapes.length > 1 && (
        <section>
          <h3 className="eyebrow mb-3">{t('design.shape.title')}</h3>
          <div className="flex flex-wrap gap-2">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                type="button"
                onClick={() => setShape(shape.id)}
                aria-pressed={design.shape === shape.id}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                  design.shape === shape.id
                    ? 'border-ink bg-ink text-sand-50'
                    : 'border-sand-300 bg-white text-ink-soft hover:border-bronze hover:text-ink',
                )}
              >
                {l(shape.name)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- notes */}
      <section>
        <label htmlFor="design-notes" className="field-label">
          {t('design.notes.label')}{' '}
          <span className="text-ink-muted">({t('common.optional')})</span>
        </label>
        <textarea
          id="design-notes"
          rows={3}
          value={design.notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder={t('design.notes.placeholder')}
          className="field resize-y"
        />
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------- bits */

/**
 * A compact selectable row. Used where a picture would add nothing — a finish or
 * a vein direction is a property of the surface, and the surface the customer
 * cares about is the one on the right.
 */
function ChoiceRow({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean
  onSelect: () => void
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'rounded-xl border bg-white p-4 text-start transition-all duration-200',
        selected
          ? 'border-ink shadow-stone'
          : 'border-sand-300 hover:border-bronze hover:shadow-stone',
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <span className="font-primary text-sm font-semibold text-ink">{title}</span>
        <span
          aria-hidden
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-colors',
            selected ? 'border-ink bg-ink' : 'border-sand-300',
          )}
        />
      </span>
      <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">{description}</span>
    </button>
  )
}
