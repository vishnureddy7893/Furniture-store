'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ShoppingBag } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { discountPercent } from '@/lib/mock-data'
import { marbleById } from '@/lib/data/configurator'
import { cn } from '@/lib/utils'
import type { MarbleProduct } from '@/types'

interface ProductCardProps {
  product: MarbleProduct
  className?: string
  /** Priority cards get a slightly taller image area. */
  featured?: boolean
}

export default function ProductCard({ product, className, featured }: ProductCardProps) {
  const { t, l, price } = useI18n()
  const addToCart = useCartStore((state) => state.addToCart)
  const [isAdded, setIsAdded] = useState(false)

  const discount = discountPercent(product)
  const name = l(product.name)
  const href = `/shop/${product.slug}`

  const handleAddToCart = () => {
    addToCart(product)
    setIsAdded(true)
    window.setTimeout(() => setIsAdded(false), 1800)
  }

  return (
    <article
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-sand-300 bg-white transition-all duration-300 hover:border-bronze/40 hover:shadow-stone',
        className,
      )}
    >
      <Link
        href={href}
        className="relative block overflow-hidden bg-sand-100"
        tabIndex={-1}
        aria-hidden
      >
        <PieceScene
          config={product.config}
          view="scene"
          className={cn(
            'scene-defer w-full transition-transform duration-700 group-hover:scale-[1.04]',
            featured ? 'aspect-[4/3]' : 'aspect-[5/4]',
          )}
        />

        <div className="absolute top-3 start-3 flex flex-col items-start gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-verde px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              {l({ ar: 'جديد', en: 'New' })}
            </span>
          )}
          {discount > 0 && (
            <span
              dir="ltr"
              className="rounded-full bg-bronze px-2.5 py-1 text-[10px] font-bold text-white"
            >
              −{discount}%
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
          {l(product.categoryName)}
        </p>

        <h3 className="mt-1.5 font-primary text-base font-semibold leading-snug text-ink">
          <Link href={href} className="transition-colors hover:text-bronze-deep">
            {name}
          </Link>
        </h3>

        <p className="mt-1.5 text-xs text-ink-muted">{l(marbleById(product.marbleId).name)}</p>

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-primary text-lg font-semibold text-ink">
              {price(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-ink-muted line-through">{price(product.oldPrice)}</span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Link
              href={href}
              className="btn-secondary flex-1 px-4 py-2.5 text-xs"
            >
              {t('pdp.specs')}
            </Link>
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`${t('pdp.addToCart')} — ${name}`}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                isAdded ? 'bg-verde text-white' : 'bg-ink text-sand-50 hover:bg-bronze-deep',
              )}
            >
              {isAdded ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <ShoppingBag className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
