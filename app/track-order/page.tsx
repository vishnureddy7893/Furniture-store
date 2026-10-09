'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Info, Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import type { Localized } from '@/lib/i18n/config'

/** Simulated tracking states for the demo. */
const stages: { id: string; label: Localized; done: boolean }[] = [
  { id: 'received', label: { ar: 'تم استلام الطلب', en: 'Order received' }, done: true },
  { id: 'slab', label: { ar: 'اختيار اللوح والقص', en: 'Slab selected and cut' }, done: true },
  { id: 'finishing', label: { ar: 'الصقل وتجهيز القاعدة', en: 'Polishing and base assembly' }, done: true },
  { id: 'dispatch', label: { ar: 'التغليف والشحن', en: 'Crated and dispatched' }, done: false },
  { id: 'install', label: { ar: 'التوصيل والتركيب', en: 'Delivery and installation' }, done: false },
]

export default function TrackOrderPage() {
  const { t, l } = useI18n()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <main className="container py-12 md:py-20">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-primary text-3xl font-semibold text-ink md:text-4xl">
          {t('track.title')}
        </h1>
        <p className="mt-3 text-ink-soft">{t('track.subtitle')}</p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitted(true)
          }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <div className="flex-1">
            <label htmlFor="order-number" className="sr-only">
              {t('success.orderNumber')}
            </label>
            <input
              id="order-number"
              dir="ltr"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('track.placeholder')}
              className="field"
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            <Search className="h-4 w-4" aria-hidden />
            {t('track.button')}
          </button>
        </form>

        <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('track.demoNotice')}
        </p>

        {submitted && (
          <section className="mt-8 rounded-2xl border border-sand-300 bg-white p-6" aria-live="polite">
            <p className="text-xs uppercase tracking-wide text-ink-muted">
              {t('success.orderNumber')}
            </p>
            <p dir="ltr" className="mt-1 font-primary text-lg font-semibold text-ink">
              {query}
            </p>

            <ol className="mt-6 space-y-4">
              {stages.map((stage) => (
                <li key={stage.id} className="flex items-center gap-3">
                  {stage.done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-verde" aria-hidden />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-sand-400" aria-hidden />
                  )}
                  <span className={stage.done ? 'text-ink' : 'text-ink-muted'}>
                    {l(stage.label)}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </main>
  )
}
