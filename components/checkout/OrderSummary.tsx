'use client'

import { useI18n } from '@/lib/i18n/LocaleProvider'

/** Demo delivery pricing: flat fee, waived above the threshold. */
export const DELIVERY_FEE = 250
export const FREE_DELIVERY_FROM = 5000

export function deliveryFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE
}

/** Shared totals block for the cart and the checkout review. */
export default function OrderSummary({
  subtotal,
  delivery,
  className,
}: {
  subtotal: number
  delivery: number
  className?: string
}) {
  const { t, price } = useI18n()

  return (
    <dl className={className}>
      <div className="flex justify-between text-sm">
        <dt className="text-ink-soft">{t('common.subtotal')}</dt>
        <dd className="font-medium text-ink">{price(subtotal)}</dd>
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <dt className="text-ink-soft">{t('common.shipping')}</dt>
        <dd className={delivery === 0 ? 'font-medium text-verde' : 'font-medium text-ink'}>
          {delivery === 0 ? t('common.free') : price(delivery)}
        </dd>
      </div>
      <div className="mt-3 flex justify-between border-t border-sand-200 pt-3">
        <dt className="font-primary text-base font-semibold text-ink">{t('common.total')}</dt>
        <dd className="font-primary text-base font-semibold text-ink">
          {price(subtotal + delivery)}
        </dd>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{t('common.vatIncluded')}</p>
    </dl>
  )
}
