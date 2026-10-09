'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import ProductCard from '@/components/ui/ProductCard'
import { CATEGORIES, products } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { CategorySlug } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'newest'

const sortOptions: { value: SortKey; key: DictKey }[] = [
  { value: 'featured', key: 'shop.sort.featured' },
  { value: 'priceAsc', key: 'shop.sort.priceAsc' },
  { value: 'priceDesc', key: 'shop.sort.priceDesc' },
  { value: 'newest', key: 'shop.sort.newest' },
]

const PAGE_SIZE = 9

export default function ShopBrowser() {
  const { t, l, num } = useI18n()
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as CategorySlug | null

  const [category, setCategory] = useState<CategorySlug | 'all'>(
    initialCategory && CATEGORIES.some((c) => c.slug === initialCategory) ? initialCategory : 'all',
  )
  const [sort, setSort] = useState<SortKey>('featured')
  const [visible, setVisible] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const list = category === 'all' ? products : products.filter((p) => p.categorySlug === category)
    const sorted = [...list]
    switch (sort) {
      case 'priceAsc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'priceDesc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        sorted.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false))
        break
      default:
        sorted.sort(
          (a, b) =>
            Number(b.isBestSeller ?? false) - Number(a.isBestSeller ?? false) ||
            (b.rating ?? 0) - (a.rating ?? 0),
        )
    }
    return sorted
  }, [category, sort])

  const shown = filtered.slice(0, visible)

  const selectCategory = (next: CategorySlug | 'all') => {
    setCategory(next)
    setVisible(PAGE_SIZE)
  }

  return (
    <>
      {/* Category chips scroll horizontally on small screens rather than wrapping. */}
      <div className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2" role="tablist" aria-label={t('home.categories.title')}>
          <CategoryChip
            active={category === 'all'}
            onClick={() => selectCategory('all')}
            label={t('shop.all')}
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.slug}
              active={category === c.slug}
              onClick={() => selectCategory(c.slug)}
              label={l(c.name)}
            />
          ))}
        </div>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-sand-300 pb-4">
        <p className="text-sm text-ink-soft" aria-live="polite">
          {t('shop.results', { count: num(filtered.length) })}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="shop-sort" className="text-sm text-ink-muted">
            {t('shop.sort')}
          </label>
          <select
            id="shop-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm text-ink focus:border-bronze focus:outline-none focus:ring-1 focus:ring-bronze"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-sand-300 py-16 text-center text-ink-soft">
          {t('shop.empty')}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* No `layout` / `popLayout` here: layout projection makes Motion
              measure every card with getBoundingClientRect on mount, which was
              the single largest scripting cost when navigating onto this page.
              The enter/exit animation is unchanged. */}
          <AnimatePresence initial={false}>
            {shown.map((product) => (
              <motion.li
                key={product.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <ProductCard product={product} className="h-full" />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {visible < filtered.length && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="btn-secondary"
          >
            {t('shop.loadMore')}
          </button>
        </div>
      )}
    </>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-sand-50'
          : 'border-sand-300 bg-white text-ink-soft hover:border-ink hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
