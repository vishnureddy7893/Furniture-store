'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { animate, stagger } from 'animejs'
import { Info, Loader2, Pencil, Sparkles } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { STEPS, useDesignStore } from '@/lib/store/design-store'
import { CITIES } from '@/lib/data/configurator'
import { designSpecRows, describeDesign } from '@/lib/design/describe'
import { generatePreview, previewAvailability } from '@/lib/design/ai-client'
import type { RequestCustomer } from '@/types'

/**
 * The last step: read it back, optionally render it, then ask for a quote.
 *
 * The specification rows come from `designSpecRows`, which reads the
 * configuration — the same function the confirmation screen and the admin
 * console use, so all three always agree.
 *
 * The AI render is opt-in and sits *here*, after the design is settled, because
 * it is the only expensive operation in the studio. If no provider is configured
 * the button is simply not shown and nothing else about this screen changes.
 */

interface DesignReviewStepProps {
  customer: RequestCustomer
  setCustomer: (customer: RequestCustomer) => void
  errors: Record<string, string>
}

export default function DesignReviewStep({
  customer,
  setCustomer,
  errors,
}: DesignReviewStepProps) {
  const { t, l, locale } = useI18n()

  const design = useDesignStore((s) => s.design)
  const goTo = useDesignStore((s) => s.goTo)
  const generated = useDesignStore((s) => s.generated)
  const generateStatus = useDesignStore((s) => s.generateStatus)
  const setGenerated = useDesignStore((s) => s.setGenerated)
  const setGenerateStatus = useDesignStore((s) => s.setGenerateStatus)

  const listRef = useRef<HTMLDivElement>(null)
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null)

  const rows = useMemo(() => designSpecRows(design), [design])
  const description = useMemo(() => describeDesign(design), [design])

  /** Asked once: whether a provider is configured is a server-side fact. */
  useEffect(() => {
    let cancelled = false
    previewAvailability().then((available) => {
      if (!cancelled) setAiAvailable(available)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Cinematic moment: the specification assembles rather than appearing, so the
  // review reads as the design being laid out.
  useEffect(() => {
    const root = listRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const animation = animate(root.querySelectorAll<HTMLElement>('[data-row]'), {
      opacity: [0, 1],
      y: [14, 0],
      duration: 520,
      delay: stagger(45),
      ease: 'out(3)',
    })
    return () => {
      animation.revert()
    }
  }, [])

  const render = useCallback(async () => {
    setGenerateStatus('working')
    // The canvas the preview already painted is the best colour reference the
    // model can get, so it is sent alongside the original photograph.
    const canvas = document.querySelector<HTMLCanvasElement>('[data-design-canvas]')
    let previewImage: string | null = null
    try {
      previewImage = canvas?.toDataURL('image/jpeg', 0.85) ?? null
    } catch {
      // A tainted canvas is not worth failing over; the reference is enough.
      previewImage = null
    }

    const result = await generatePreview({
      configuration: design,
      referenceImage: design.referenceImage,
      previewImage,
    })

    if (!result) {
      setGenerateStatus('error')
      return
    }
    setGenerated(result)
    setGenerateStatus('done')
  }, [design, setGenerated, setGenerateStatus])

  const working = generateStatus === 'working'

  return (
    <div ref={listRef} className="space-y-6">
      {/* ------------------------------------------------------- the render */}
      {aiAvailable !== false && (
        <section
          data-row
          className="rounded-2xl border border-bronze/30 bg-bronze-wash p-5 md:p-6"
        >
          <h3 className="font-primary text-base font-semibold text-ink">
            {t('design.ai.title')}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-bronze-deep">
            {t('design.ai.body')}
          </p>

          <button
            type="button"
            onClick={render}
            disabled={working}
            className="btn-bronze mt-4"
          >
            {working ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t('design.ai.working')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" aria-hidden />
                {t(generated ? 'design.ai.again' : 'design.ai.cta')}
              </>
            )}
          </button>

          <AnimatePresence>
            {generated && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 border-t border-bronze/20 pt-4"
              >
                <p className="text-sm leading-relaxed text-ink">
                  {locale === 'ar' ? generated.description.ar : generated.description.en}
                </p>
                {generated.mode === 'fallback' && (
                  <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-bronze-deep">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('design.ai.fallbackNote')}
                  </p>
                )}
              </motion.div>
            )}
            {generateStatus === 'error' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                role="alert"
                className="mt-3 text-xs text-red-700"
              >
                {t('design.ai.error')}
              </motion.p>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* -------------------------------------------------- specification */}
      <Section
        title={t('design.review.specification')}
        onEdit={() => goTo(STEPS.dimensions)}
        editLabel={t('customize.editStep')}
      >
        <dl className="divide-y divide-sand-200">
          {rows.map((row) => (
            <div key={row.key} data-row className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">{l(row.label)}</dt>
              <dd
                dir={row.ltr ? 'ltr' : undefined}
                className="text-end text-sm font-medium text-ink"
              >
                {l(row.value)}
              </dd>
            </div>
          ))}
        </dl>

        <p
          data-row
          className="mt-4 border-t border-sand-200 pt-4 text-sm leading-relaxed text-ink-soft"
        >
          {l(description)}
        </p>

        {design.notes && (
          <p data-row className="mt-3 text-sm leading-relaxed text-ink-soft">
            {design.notes}
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------------ contact */}
      <Section title={t('customize.contact')}>
        <div className="grid gap-4 pt-1 sm:grid-cols-2">
          <Field
            id="design-name"
            label={t('common.name')}
            placeholder={t('customize.namePlaceholder')}
            value={customer.name}
            onChange={(v) => setCustomer({ ...customer, name: v })}
            error={errors.name}
            required
          />
          <Field
            id="design-phone"
            type="tel"
            dir="ltr"
            label={t('common.phone')}
            placeholder={t('customize.phonePlaceholder')}
            value={customer.phone}
            onChange={(v) => setCustomer({ ...customer, phone: v })}
            error={errors.phone}
            required
          />
          <Field
            id="design-email"
            type="email"
            dir="ltr"
            label={t('common.email')}
            placeholder={t('customize.emailPlaceholder')}
            value={customer.email}
            onChange={(v) => setCustomer({ ...customer, email: v })}
          />
          <div>
            <label htmlFor="design-city" className="field-label">
              {t('common.city')}
              <span aria-hidden className="ms-1 text-bronze">
                *
              </span>
            </label>
            <select
              id="design-city"
              value={customer.city}
              onChange={(event) => setCustomer({ ...customer, city: event.target.value })}
              aria-invalid={errors.city ? true : undefined}
              className="field"
            >
              <option value="">{t('customize.cityPlaceholder')}</option>
              {CITIES.map((city) => (
                <option key={city.id} value={city.id}>
                  {l(city.name)}
                </option>
              ))}
            </select>
            {errors.city && (
              <p className="mt-1.5 text-xs text-red-600" role="alert">
                {errors.city}
              </p>
            )}
          </div>
        </div>
      </Section>

      <p
        data-row
        className="rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep"
      >
        {t('customize.estimateNote')}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------- bits */

function Section({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string
  onEdit?: () => void
  editLabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-sand-300 bg-white p-5 md:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-primary text-base font-semibold text-ink">{title}</h3>
        {onEdit && editLabel && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-bronze-deep transition-colors hover:text-ink"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {editLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  dir,
  error,
  required,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  dir?: 'ltr' | 'rtl'
  error?: string
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span aria-hidden className="ms-1 text-bronze">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
