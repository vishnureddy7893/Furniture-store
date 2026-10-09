'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Banknote, Building2, Check, CreditCard, Info } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import OrderSummary, { deliveryFor } from '@/components/checkout/OrderSummary'
import { useCartStore } from '@/lib/store/cart-store'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { CITIES } from '@/lib/data/configurator'
import { cn } from '@/lib/utils'
import type { PaymentMethod, ShippingAddress } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

type Step = 'information' | 'payment' | 'review'

const steps: { id: Step; key: DictKey }[] = [
  { id: 'information', key: 'checkout.step.information' },
  { id: 'payment', key: 'checkout.step.payment' },
  { id: 'review', key: 'checkout.step.review' },
]

const paymentOptions: {
  id: PaymentMethod['type']
  icon: typeof Banknote
  label: DictKey
  body: DictKey
}[] = [
  { id: 'cod', icon: Banknote, label: 'checkout.payment.cod', body: 'checkout.payment.codBody' },
  {
    id: 'transfer',
    icon: Building2,
    label: 'checkout.payment.transfer',
    body: 'checkout.payment.transferBody',
  },
  { id: 'card', icon: CreditCard, label: 'checkout.payment.card', body: 'checkout.payment.cardBody' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { t, l, price, num } = useI18n()
  const { cartItems, totalPrice } = useCartStore()
  const hydrated = useHydrated()

  const [currentStep, setCurrentStep] = useState<Step>('information')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [address, setAddress] = useState<ShippingAddress>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'riyadh',
    state: '',
    zipCode: '',
    country: 'SA',
    accessNotes: '',
  })
  const [paymentType, setPaymentType] = useState<PaymentMethod['type']>('cod')

  const delivery = deliveryFor(totalPrice)
  const total = totalPrice + delivery
  const stepIndex = steps.findIndex((s) => s.id === currentStep)

  if (!hydrated) return <main className="container py-20" />

  if (cartItems.length === 0) {
    return (
      <main className="container py-20 md:py-28">
        <div className="mx-auto max-w-md text-center">
          <h1 className="font-primary text-3xl font-semibold text-ink">
            {t('checkout.emptyTitle')}
          </h1>
          <p className="mt-3 text-ink-soft">{t('checkout.emptyBody')}</p>
          <Link href="/shop" className="btn-primary mt-8">
            {t('cart.empty.cta')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        </div>
      </main>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Demo only: the order is handed to the success page through sessionStorage,
    // exactly as the original storefront did. Nothing is sent anywhere.
    const orderNumber = `AMA-${Math.floor(100000 + Math.random() * 900000)}`
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 14)

    sessionStorage.setItem(
      'lastOrder',
      JSON.stringify({
        orderNumber,
        items: cartItems,
        shippingAddress: address,
        paymentMethod: { type: paymentType },
        subtotal: totalPrice,
        shipping: delivery,
        total,
        estimatedDelivery: estimatedDelivery.toISOString(),
      }),
    )

    await new Promise((resolve) => setTimeout(resolve, 700))
    router.push('/order-success')
  }

  return (
    <main className="container py-10 md:py-16">
      <h1 className="font-primary text-3xl font-semibold text-ink md:text-4xl">
        {t('checkout.title')}
      </h1>

      <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t('checkout.demoNotice')}
      </p>

      {/* Progress */}
      <ol className="mt-8 flex items-center gap-2" aria-label={t('checkout.title')}>
        {steps.map((step, index) => {
          const state = index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'todo'
          return (
            <li key={step.id} className="flex flex-1 items-center gap-2">
              <span
                aria-current={state === 'current' ? 'step' : undefined}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  state === 'done' && 'bg-verde text-white',
                  state === 'current' && 'bg-ink text-sand-50',
                  state === 'todo' && 'border border-sand-300 bg-white text-ink-muted',
                )}
              >
                {state === 'done' ? <Check className="h-4 w-4" aria-hidden /> : num(index + 1)}
              </span>
              <span
                className={cn(
                  'hidden text-sm font-medium sm:block',
                  state === 'todo' ? 'text-ink-muted' : 'text-ink',
                )}
              >
                {t(step.key)}
              </span>
              {index < steps.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'h-px flex-1',
                    index < stepIndex ? 'bg-verde' : 'bg-sand-300',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {currentStep === 'information' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setCurrentStep('payment')
              }}
              className="rounded-2xl border border-sand-300 bg-white p-6 md:p-8"
            >
              <h2 className="font-primary text-xl font-semibold text-ink">
                {t('checkout.step.information')}
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label={t('checkout.firstName')}
                  value={address.firstName}
                  onChange={(v) => setAddress({ ...address, firstName: v })}
                  required
                />
                <Field
                  id="lastName"
                  label={t('checkout.lastName')}
                  value={address.lastName}
                  onChange={(v) => setAddress({ ...address, lastName: v })}
                  required
                />
                <Field
                  id="phone"
                  type="tel"
                  dir="ltr"
                  label={t('common.phone')}
                  placeholder={t('customize.phonePlaceholder')}
                  value={address.phone}
                  onChange={(v) => setAddress({ ...address, phone: v })}
                  required
                />
                <Field
                  id="email"
                  type="email"
                  dir="ltr"
                  label={t('common.email')}
                  placeholder={t('customize.emailPlaceholder')}
                  value={address.email}
                  onChange={(v) => setAddress({ ...address, email: v })}
                  required
                />

                <div className="sm:col-span-2">
                  <label htmlFor="city" className="field-label">
                    {t('common.city')}
                  </label>
                  <select
                    id="city"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="field"
                    required
                  >
                    {CITIES.map((city) => (
                      <option key={city.id} value={city.id}>
                        {l(city.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Field
                    id="address"
                    label={t('checkout.address')}
                    placeholder={t('checkout.addressPlaceholder')}
                    value={address.address}
                    onChange={(v) => setAddress({ ...address, address: v })}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="accessNotes" className="field-label">
                    {t('checkout.accessNotes')}{' '}
                    <span className="text-ink-muted">({t('common.optional')})</span>
                  </label>
                  <textarea
                    id="accessNotes"
                    rows={3}
                    placeholder={t('checkout.accessNotesPlaceholder')}
                    value={address.accessNotes}
                    onChange={(e) => setAddress({ ...address, accessNotes: e.target.value })}
                    className="field resize-y"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary mt-7 w-full sm:w-auto">
                {t('checkout.toPayment')}
                <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
              </button>
            </form>
          )}

          {currentStep === 'payment' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setCurrentStep('review')
              }}
              className="rounded-2xl border border-sand-300 bg-white p-6 md:p-8"
            >
              <h2 className="font-primary text-xl font-semibold text-ink">
                {t('checkout.payment.title')}
              </h2>

              <fieldset className="mt-6 space-y-3">
                <legend className="sr-only">{t('checkout.payment.title')}</legend>
                {paymentOptions.map((option) => {
                  const Icon = option.icon
                  const selected = paymentType === option.id
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors',
                        selected ? 'border-ink bg-sand-50' : 'border-sand-300 hover:border-bronze',
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={option.id}
                        checked={selected}
                        onChange={() => setPaymentType(option.id)}
                        className="mt-1 h-4 w-4 accent-ink"
                      />
                      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-bronze-deep" aria-hidden />
                      <span>
                        <span className="block font-medium text-ink">{t(option.label)}</span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{t(option.body)}</span>
                      </span>
                    </label>
                  )
                })}
              </fieldset>

              {paymentType === 'card' && (
                <div className="mt-5 grid gap-5 rounded-xl border border-dashed border-sand-300 bg-sand-50 p-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field
                      id="cardNumber"
                      dir="ltr"
                      label={t('checkout.payment.cardNumber')}
                      placeholder="0000 0000 0000 0000"
                      value=""
                      onChange={() => {}}
                      disabled
                    />
                  </div>
                  <Field
                    id="cardExpiry"
                    dir="ltr"
                    label={t('checkout.payment.expiry')}
                    placeholder="MM/YY"
                    value=""
                    onChange={() => {}}
                    disabled
                  />
                  <Field
                    id="cardCvv"
                    dir="ltr"
                    label={t('checkout.payment.cvv')}
                    placeholder="123"
                    value=""
                    onChange={() => {}}
                    disabled
                  />
                  <p className="text-xs text-ink-muted sm:col-span-2">
                    {t('checkout.payment.cardBody')}
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setCurrentStep('information')}
                  className="btn-secondary"
                >
                  {t('common.back')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('checkout.toReview')}
                  <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
                </button>
              </div>
            </form>
          )}

          {currentStep === 'review' && (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-sand-300 bg-white p-6 md:p-8"
            >
              <h2 className="font-primary text-xl font-semibold text-ink">
                {t('checkout.step.review')}
              </h2>

              <h3 className="eyebrow mb-3 mt-6">{t('checkout.review.items')}</h3>
              <ul className="divide-y divide-sand-200 rounded-xl border border-sand-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 p-3">
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

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="eyebrow mb-2">{t('checkout.review.address')}</h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {address.firstName} {address.lastName}
                    <br />
                    {address.address}
                    <br />
                    {l(CITIES.find((c) => c.id === address.city)?.name ?? { ar: '', en: '' })}
                    <br />
                    <span dir="ltr">{address.phone}</span>
                  </p>
                  {address.accessNotes && (
                    <p className="mt-2 text-xs text-ink-muted">{address.accessNotes}</p>
                  )}
                </div>
                <div>
                  <h3 className="eyebrow mb-2">{t('checkout.review.payment')}</h3>
                  <p className="text-sm text-ink-soft">
                    {t(paymentOptions.find((o) => o.id === paymentType)!.label)}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setCurrentStep('payment')}
                  className="btn-secondary"
                >
                  {t('common.back')}
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? t('checkout.placing') : t('checkout.placeOrder')}
                </button>
              </div>
            </form>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-[120px] rounded-2xl border border-sand-300 bg-white p-6">
            <h2 className="font-primary text-lg font-semibold text-ink">{t('cart.summary')}</h2>
            <OrderSummary subtotal={totalPrice} delivery={delivery} className="mt-5" />
          </div>
        </aside>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ field */

function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
  dir,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="field disabled:cursor-not-allowed disabled:bg-sand-100"
      />
    </div>
  )
}
