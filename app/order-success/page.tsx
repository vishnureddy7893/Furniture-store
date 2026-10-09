'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Info } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import OrderSummary from '@/components/checkout/OrderSummary'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { CITIES } from '@/lib/data/configurator'
import type { CartItem, PaymentMethod, ShippingAddress } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

interface StoredOrder {
  orderNumber: string
  items: CartItem[]
  shippingAddress: ShippingAddress
  paymentMethod: PaymentMethod
  subtotal: number
  shipping: number
  total: number
  estimatedDelivery: string
}

const nextSteps: DictKey[] = ['success.step1', 'success.step2', 'success.step3']

export default function OrderSuccessPage() {
  const { t, l, price, num, date } = useI18n()
  const clearCart = useCartStore((state) => state.clearCart)
  const [order, setOrder] = useState<StoredOrder | null>(null)
  const [ready, setReady] = useState(false)
  const cleared = useRef(false)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('lastOrder')
      if (stored) setOrder(JSON.parse(stored) as StoredOrder)
    } catch {
      /* ignore malformed demo state */
    }
    setReady(true)

    if (!cleared.current) {
      cleared.current = true
      clearCart()
    }
  }, [clearCart])

  if (!ready) return null

  if (!order) {
    return (
      <main className="container py-20 md:py-28">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-primary text-3xl font-semibold text-ink">{t('cart.empty.title')}</h1>
          <Link href="/shop" className="btn-primary mt-8">
            {t('cart.empty.cta')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        </div>
      </main>
    )
  }

  const city = CITIES.find((c) => c.id === order.shippingAddress.city)?.name

  return (
    <main className="container py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde">
            <Check className="h-8 w-8 text-white" aria-hidden />
          </span>
          <h1 className="mt-6 font-primary text-3xl font-semibold text-ink md:text-4xl">
            {t('success.title')}
          </h1>
          <p className="mt-3 text-ink-soft">{t('success.body')}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-sand-300 bg-white p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {t('success.orderNumber')}
            </p>
            <p dir="ltr" className="mt-1.5 font-primary text-lg font-semibold text-ink">
              {order.orderNumber}
            </p>
          </div>
          <div className="rounded-2xl border border-sand-300 bg-white p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {t('success.estimatedDelivery')}
            </p>
            <p className="mt-1.5 font-primary text-lg font-semibold text-ink">
              {date(order.estimatedDelivery)}
            </p>
          </div>
        </div>

        <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('success.demoNotice')}
        </p>

        {/* Order summary */}
        <section className="mt-8 rounded-2xl border border-sand-300 bg-white p-6">
          <h2 className="font-primary text-lg font-semibold text-ink">{t('success.summary')}</h2>
          <ul className="mt-4 divide-y divide-sand-200">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-3">
                <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                  {item.config && (
                    <PieceScene config={item.config} view="scene" className="h-full w-full" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {item.name ? l(item.name) : item.title}
                  </span>
                  <span className="block text-xs text-ink-muted">
                    {t('common.quantity')}: {num(item.quantity)}
                  </span>
                </span>
                <span className="text-sm font-semibold text-ink">
                  {price(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <OrderSummary
            subtotal={order.subtotal}
            delivery={order.shipping}
            className="mt-4 border-t border-sand-200 pt-4"
          />
        </section>

        {/* Delivery address */}
        <section className="mt-6 rounded-2xl border border-sand-300 bg-white p-6">
          <h2 className="eyebrow mb-3">{t('checkout.review.address')}</h2>
          <p className="text-sm leading-relaxed text-ink-soft">
            {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            <br />
            {order.shippingAddress.address}
            {city && (
              <>
                <br />
                {l(city)}
              </>
            )}
            <br />
            <span dir="ltr">{order.shippingAddress.phone}</span>
          </p>
        </section>

        {/* Next steps */}
        <section className="mt-6 rounded-2xl border border-sand-300 bg-sand-50 p-6">
          <h2 className="font-primary text-lg font-semibold text-ink">{t('success.nextSteps')}</h2>
          <ol className="mt-4 space-y-3">
            {nextSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-ink-soft">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bronze-wash text-xs font-semibold text-bronze-deep"
                >
                  {num(index + 1)}
                </span>
                {t(step)}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/shop" className="btn-primary">
            {t('success.continueShopping')}
          </Link>
          <Link href="/track-order" className="btn-secondary">
            {t('success.trackOrder')}
          </Link>
        </div>
      </div>
    </main>
  )
}
