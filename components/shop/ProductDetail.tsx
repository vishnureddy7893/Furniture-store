'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Info,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import PieceScene, { type SceneView } from '@/components/marble/PieceScene'
import DimensionDiagram from '@/components/shop/DimensionDiagram'
import ProductCard from '@/components/ui/ProductCard'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { discountPercent, relatedProducts } from '@/lib/mock-data'
import { edgeById, marbleById, shapeById } from '@/lib/data/configurator'
import { cn } from '@/lib/utils'
import type { MarbleProduct } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

const views: { id: SceneView; key: DictKey }[] = [
  { id: 'scene', key: 'customize.preview' },
  { id: 'plan', key: 'pdp.dimensionsDiagram' },
  { id: 'edge', key: 'customize.step3.edge' },
  { id: 'stone', key: 'pdp.marble' },
]

export default function ProductDetail({ product }: { product: MarbleProduct }) {
  const { t, l, price, num } = useI18n()
  const addToCart = useCartStore((state) => state.addToCart)
  const [view, setView] = useState<SceneView>('scene')
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  const marble = marbleById(product.marbleId)
  const name = l(product.name)
  const discount = discountPercent(product)
  const { length, width, height } = product.config.dimensions
  const related = relatedProducts(product, 3)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i += 1) addToCart(product)
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 2000)
  }

  // `ltr` keeps mixed number/symbol runs (240 × 105 × 75) in reading order
  // even when the document direction is RTL.
  const specs: { label: string; value: string; ltr?: boolean }[] = [
    { label: t('pdp.sku'), value: product.sku, ltr: true },
    { label: t('pdp.marble'), value: l(marble.name) },
    {
      label: t('pdp.dimensions'),
      value: `${num(length)} × ${num(width)} × ${num(height)} ${t('pdp.cm')}`,
      ltr: true,
    },
    { label: t('pdp.weight'), value: `${num(product.weightKg)} ${t('pdp.kg')}` },
    { label: t('customize.step3.shape'), value: l(shapeById(product.config.shape).name) },
    { label: t('customize.step3.edge'), value: l(edgeById(product.config.edge).name) },
    { label: t('pdp.leadTime'), value: t('pdp.leadTimeValue', { count: num(product.leadTimeDays) }) },
  ]

  return (
    <main className="pb-20">
      {/* Breadcrumb */}
      <nav className="container flex items-center gap-2 py-5 text-sm text-ink-muted" aria-label="Breadcrumb">
        <Link href="/shop" className="inline-flex items-center gap-1.5 transition-colors hover:text-ink">
          <ChevronLeft className="h-4 w-4 rtl-flip" aria-hidden />
          {t('nav.shop')}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-ink-soft">{l(product.categoryName)}</span>
      </nav>

      <div className="container grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Gallery */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
            <PieceScene
              config={product.config}
              view={view}
              label={name}
              className="aspect-[4/3] w-full"
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3" role="tablist" aria-label={t('pdp.specs')}>
            {views.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={view === item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  'overflow-hidden rounded-xl border bg-white transition-colors',
                  view === item.id ? 'border-ink' : 'border-sand-300 hover:border-bronze',
                )}
              >
                <PieceScene config={product.config} view={item.id} className="scene-defer aspect-[4/3] w-full" />
                <span className="block px-1 py-1.5 text-[10px] font-medium text-ink-soft">
                  {t(item.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Natural stone disclosure — the single most important trust signal. */}
          <div className="mt-6 flex gap-3 rounded-2xl border border-bronze/25 bg-bronze-wash p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-bronze-deep" aria-hidden />
            <div>
              <h2 className="font-primary text-sm font-semibold text-ink">
                {t('pdp.variationTitle')}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t('pdp.variationBody')}</p>
            </div>
          </div>
        </div>

        {/* Buy box */}
        <div className="lg:col-span-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
            {l(product.categoryName)}
          </p>
          <h1 className="mt-2 font-primary text-3xl font-semibold leading-tight text-ink md:text-4xl">
            {name}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="font-primary text-3xl font-semibold text-ink">
              {price(product.price)}
            </span>
            {product.oldPrice && (
              <>
                <span className="text-lg text-ink-muted line-through">{price(product.oldPrice)}</span>
                <span
                  dir="ltr"
                  className="rounded-full bg-bronze px-2.5 py-1 text-xs font-bold text-white"
                >
                  −{discount}%
                </span>
              </>
            )}
          </div>

          <p className="mt-3 flex items-center gap-2 text-sm">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                product.stock > 3 ? 'bg-verde' : product.stock > 0 ? 'bg-bronze' : 'bg-red-500',
              )}
              aria-hidden
            />
            <span className={product.stock > 0 ? 'text-verde' : 'text-red-600'}>
              {product.stock === 0
                ? t('pdp.outOfStock')
                : product.stock > 3
                  ? t('pdp.inStock')
                  : t('pdp.lowStock', { count: num(product.stock) })}
            </span>
          </p>

          <p className="mt-5 text-base leading-relaxed text-ink-soft">{l(product.description)}</p>

          {/* Quantity + add to cart */}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-1 rounded-full border border-sand-300 bg-white p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label={t('cart.decrease')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="min-w-10 text-center text-sm font-semibold" aria-live="polite">
                {num(quantity)}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                disabled={quantity >= product.stock}
                aria-label={t('cart.increase')}
                className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={cn('btn flex-1', isAdded ? 'bg-verde text-white' : 'btn-primary')}
            >
              {isAdded ? (
                <>
                  <Check className="h-4 w-4" aria-hidden />
                  {t('pdp.added')}
                </>
              ) : (
                t('pdp.addToCart')
              )}
            </button>
          </div>

          <Link href="/cart" className="btn-secondary mt-3 w-full">
            {t('cart.checkout')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>

          {/* Service facts */}
          <ul className="mt-7 space-y-3 rounded-2xl border border-sand-300 bg-white p-5 text-sm">
            <li className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-bronze" aria-hidden />
              <span className="text-ink-soft">
                {t('pdp.leadTime')}:{' '}
                <span className="font-medium text-ink">
                  {t('pdp.leadTimeValue', { count: num(product.leadTimeDays) })}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-bronze" aria-hidden />
              <span className="text-ink-soft">{t('cart.shippingNote')}</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-bronze" aria-hidden />
              <span className="text-ink-soft">{l(product.warranty)}</span>
            </li>
          </ul>

          {/* Specifications */}
          <section className="mt-8">
            <h2 className="eyebrow mb-3">{t('pdp.specs')}</h2>
            <dl className="divide-y divide-sand-200 rounded-2xl border border-sand-300 bg-white">
              {specs.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between gap-4 px-5 py-3">
                  <dt className="text-sm text-ink-muted">{spec.label}</dt>
                  <dd dir={spec.ltr ? 'ltr' : undefined} className="text-sm font-medium text-ink">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Features */}
          <section className="mt-8">
            <h2 className="eyebrow mb-3">{t('pdp.features')}</h2>
            <ul className="space-y-2.5">
              {product.features.map((feature) => (
                <li key={feature.en} className="flex items-start gap-2.5 text-sm text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-bronze" aria-hidden />
                  {l(feature)}
                </li>
              ))}
            </ul>
          </section>

          {/* Dimensions diagram */}
          <section className="mt-8 rounded-2xl border border-sand-300 bg-white p-5">
            <h2 className="eyebrow mb-3">{t('pdp.dimensionsDiagram')}</h2>
            <DimensionDiagram config={product.config} />
          </section>

          {/* Customisation CTA */}
          <section className="mt-8 rounded-2xl border border-verde/25 bg-verde-wash p-6">
            <h2 className="font-primary text-lg font-semibold text-ink">
              {t('pdp.customCta.title')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t('pdp.customCta.body')}</p>
            <Link href="/customize" className="btn-bronze mt-4">
              {t('pdp.customCta.button')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>
          </section>
        </div>
      </div>

      {/* Related */}
      <section className="container mt-20">
        <h2 className="mb-8 font-primary text-2xl font-semibold text-ink">{t('pdp.related')}</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.id}>
              <ProductCard product={item} className="h-full" />
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
