'use client'

import Link from 'next/link'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Truck } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useHydrated } from '@/lib/hooks/useHydrated'
import OrderSummary, { deliveryFor } from '@/components/checkout/OrderSummary'

export default function CartPage() {
  const { t, l, price, num } = useI18n()
  const store = useCartStore()
  const hydrated = useHydrated()
  const { increaseQuantity, decreaseQuantity, removeFromCart } = store
  const { cartItems, totalQuantity, totalPrice } = store

  // Wait for the persisted cart before deciding whether it is empty.
  if (!hydrated) return <main className="container py-20" />

  if (cartItems.length === 0) {
    return (
      <main className="container py-20 md:py-28">
        <div className="mx-auto max-w-md text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sand-200">
            <ShoppingBag className="h-9 w-9 text-bronze-deep" aria-hidden />
          </span>
          <h1 className="mt-6 font-primary text-3xl font-semibold text-ink">
            {t('cart.empty.title')}
          </h1>
          <p className="mt-3 text-ink-soft">{t('cart.empty.body')}</p>
          <Link href="/shop" className="btn-primary mt-8">
            {t('cart.empty.cta')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="container py-10 md:py-16">
      <h1 className="font-primary text-3xl font-semibold text-ink md:text-4xl">{t('cart.title')}</h1>
      <p className="mt-2 text-ink-soft">{t('cart.itemsCount', { count: num(totalQuantity) })}</p>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-sand-200 rounded-2xl border border-sand-300 bg-white">
            {cartItems.map((item) => (
              <li key={item.id} className="flex gap-4 p-4 md:p-5">
                <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-100 md:h-24 md:w-24">
                  {item.config && (
                    <PieceScene config={item.config} view="scene" className="h-full w-full" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-primary text-base font-semibold text-ink">
                        {item.slug ? (
                          <Link href={`/shop/${item.slug}`} className="hover:text-bronze-deep">
                            {item.name ? l(item.name) : item.title}
                          </Link>
                        ) : item.name ? (
                          l(item.name)
                        ) : (
                          item.title
                        )}
                      </h2>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {item.categoryName ? l(item.categoryName) : item.category}
                      </p>
                      <p className="mt-2 font-medium text-ink">{price(item.price)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`${t('cart.remove')} — ${item.name ? l(item.name) : item.title}`}
                      className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-1 rounded-full border border-sand-300 p-0.5">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item.id)}
                        aria-label={t('cart.decrease')}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">
                        {num(item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item.id)}
                        aria-label={t('cart.increase')}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-100"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>

                    <div className="text-end">
                      <p className="text-xs text-ink-muted">{t('cart.itemTotal')}</p>
                      <p className="font-primary font-semibold text-ink">
                        {price(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/shop"
            className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            {t('cart.continue')}
          </Link>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-1">
          <div className="sticky top-[120px] rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="font-primary text-lg font-semibold text-ink">{t('cart.summary')}</h2>

            <OrderSummary
              subtotal={totalPrice}
              delivery={deliveryFor(totalPrice)}
              className="mt-5"
            />

            <Link href="/checkout" className="btn-primary mt-6 w-full">
              {t('cart.checkout')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
              <Truck className="mt-0.5 h-4 w-4 shrink-0 text-bronze" aria-hidden />
              {t('cart.shippingNote')}
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
