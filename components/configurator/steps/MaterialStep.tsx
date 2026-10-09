'use client'

import { useMemo, useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useDesignStore } from '@/lib/store/design-store'
import {
  COLOR_FAMILIES,
  MARBLES,
  searchMarbles,
  type ColorFamilyId,
  type PieceConfig,
} from '@/lib/data/configurator'
import { cn } from '@/lib/utils'

/**
 * Step three: the stone.
 *
 * A real catalogue rather than a row of colour chips: searchable in Arabic and
 * English, filterable by colour family, and scalable — `searchMarbles` is the
 * only thing that touches the list, so the day this becomes three hundred stones
 * behind an API, this component does not change.
 *
 * Selecting a stone writes one id to the store. The preview repaints locally
 * from a cached texture, which is why clicking through the whole catalogue costs
 * nothing and calls nothing.
 */
/**
 * The swatch renderer only reads the stone out of a config, so one fixed config
 * is shared by every card rather than rebuilt per stone per render.
 */
const SWATCH_CONFIG: PieceConfig = {
  piece: 'dining',
  marble: 'calacatta',
  shape: 'rectangle',
  edge: 'straight',
  base: 'metal',
  dimensions: { length: 220, width: 100, height: 75 },
}

export default function MaterialStep() {
  const { t, l, locale } = useI18n()

  const design = useDesignStore((s) => s.design)
  const setMaterial = useDesignStore((s) => s.setMaterial)

  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<ColorFamilyId | 'all'>('all')

  const results = useMemo(() => searchMarbles(query, family), [query, family])

  // Families with nothing in them under the current search are not offered.
  const familiesInPlay = useMemo(() => {
    const present = new Set(searchMarbles(query, 'all').map((m) => m.colorFamily))
    return COLOR_FAMILIES.filter((f) => present.has(f.id))
  }, [query])

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------ search */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted start-4"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('design.material.searchPlaceholder')}
          aria-label={t('design.material.searchLabel')}
          className="field ps-11 pe-11"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('common.close')}
            className="absolute top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sand-200 hover:text-ink end-2.5"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------ filter */}
      <div className="flex flex-wrap gap-2">
        <FamilyChip
          label={t('design.material.allColours')}
          selected={family === 'all'}
          onSelect={() => setFamily('all')}
        />
        {familiesInPlay.map((option) => (
          <FamilyChip
            key={option.id}
            label={l(option.name)}
            swatch={option.swatch}
            selected={family === option.id}
            onSelect={() => setFamily(family === option.id ? 'all' : option.id)}
          />
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        {t('design.material.count', { count: results.length, total: MARBLES.length })}
      </p>

      {/* ----------------------------------------------------------- results */}
      {results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 py-14 text-center">
          <p className="text-sm text-ink-soft">{t('design.material.empty')}</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setFamily('all')
            }}
            className="btn-secondary mt-5"
          >
            {t('design.material.clear')}
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((marble) => {
            const selected = design.materialId === marble.id
            return (
              <li key={marble.id}>
                <button
                  type="button"
                  onClick={() => setMaterial(marble.id)}
                  aria-pressed={selected}
                  className={cn(
                    'group h-full w-full overflow-hidden rounded-2xl border bg-white text-start transition-all duration-200',
                    selected
                      ? 'border-ink shadow-stone'
                      : 'border-sand-300 hover:border-bronze hover:shadow-stone',
                  )}
                >
                  {/* The sample is generated by the same renderer that draws
                      every marble surface in the app, so what the customer
                      chooses here is what they see on the right. */}
                  <span className="relative block border-b border-sand-200">
                    <PieceScene
                      config={{ ...SWATCH_CONFIG, marble: marble.id }}
                      view="stone"
                      className="scene-defer aspect-[16/9] w-full"
                    />
                    {selected && (
                      <span
                        aria-hidden
                        className="absolute top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-sand-50 end-2"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </span>

                  <span className="block p-4">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-primary text-sm font-semibold text-ink">
                        {l(marble.name)}
                      </span>
                      <span
                        dir={locale === 'ar' ? 'rtl' : 'ltr'}
                        className="shrink-0 text-[10px] font-medium text-ink-muted"
                      >
                        {l(COLOR_FAMILIES.find((f) => f.id === marble.colorFamily)!.name)}
                      </span>
                    </span>

                    <span className="mt-1.5 block text-xs leading-relaxed text-ink-soft">
                      {l(marble.description)}
                    </span>

                    <span
                      className={cn(
                        'mt-2.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium',
                        marble.availability === 'ready'
                          ? 'bg-verde-wash text-verde'
                          : 'bg-sand-200 text-ink-soft',
                      )}
                    >
                      {t(
                        marble.availability === 'ready'
                          ? 'customize.availability.ready'
                          : 'customize.availability.order',
                      )}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- bits */

function FamilyChip({
  label,
  swatch,
  selected,
  onSelect,
}: {
  label: string
  swatch?: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all',
        selected
          ? 'border-ink bg-ink text-sand-50'
          : 'border-sand-300 bg-white text-ink-soft hover:border-bronze hover:text-ink',
      )}
    >
      {swatch && (
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-full ring-1 ring-inset ring-ink/15"
          style={{ backgroundColor: swatch }}
        />
      )}
      {label}
    </button>
  )
}
