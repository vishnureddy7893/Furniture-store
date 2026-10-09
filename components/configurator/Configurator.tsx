'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Send } from 'lucide-react'
import StepIndicator, { STEP_KEYS } from './StepIndicator'
import DesignPreview from './DesignPreview'
import RequestConfirmation from './RequestConfirmation'
import InspirationStep from './steps/InspirationStep'
import DimensionsStep from './steps/DimensionsStep'

import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useRequestsStore } from '@/lib/store/requests-store'
import { STEPS, useDesignStore } from '@/lib/store/design-store'
import { toPieceConfig } from '@/lib/data/design'
import { describeDesign } from '@/lib/design/describe'
import type { CustomRequest, RequestCustomer } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

/**
 * The design studio shell.
 *
 * Its whole job is: keep the preview mounted, swap what is on the left, and
 * submit at the end. It holds no design state of its own — that lives in
 * `useDesignStore`, which every step and the preview read directly. Which is why
 * pressing Next cannot disturb the preview: nothing about the preview is
 * downstream of the step index.
 *
 * The later steps are code-split. Marble search, the option grids and the review
 * screen (which pulls in Anime.js) are not needed to render step one, and the
 * studio is the heaviest route in the app; they are warmed on idle, so reaching
 * them is still instant.
 */

const MaterialStep = dynamic(() => import('./steps/MaterialStep'), {
  loading: () => <StepPlaceholder />,
})
const EdgeStep = dynamic(() => import('./steps/DetailSteps').then((m) => m.EdgeStep), {
  loading: () => <StepPlaceholder />,
})
const BaseStep = dynamic(() => import('./steps/DetailSteps').then((m) => m.BaseStep), {
  loading: () => <StepPlaceholder />,
})
const FinishStep = dynamic(() => import('./steps/DetailSteps').then((m) => m.FinishStep), {
  loading: () => <StepPlaceholder />,
})
const DesignReviewStep = dynamic(() => import('./steps/DesignReviewStep'), {
  loading: () => <StepPlaceholder />,
})

function StepPlaceholder() {
  return <div className="min-h-64 rounded-2xl border border-sand-300 bg-white" aria-hidden />
}

const stepCopy: { title: DictKey; body: DictKey }[] = [
  { title: 'design.step1.title', body: 'design.step1.body' },
  { title: 'design.step2.title', body: 'design.step2.body' },
  { title: 'design.step3.title', body: 'design.step3.body' },
  { title: 'design.step4.title', body: 'design.step4.body' },
  { title: 'design.step5.title', body: 'design.step5.body' },
  { title: 'design.step6.title', body: 'design.step6.body' },
  { title: 'design.step7.title', body: 'design.step7.body' },
]

const emptyCustomer: RequestCustomer = { name: '', phone: '', email: '', city: '' }

/** Saudi mobile numbers: 05XXXXXXXX, 5XXXXXXXX or +9665XXXXXXXX. */
const SAUDI_PHONE = /^(?:\+?966|0)?5\d{8}$/

export default function Configurator() {
  const { t, l, locale } = useI18n()
  const createRequest = useRequestsStore((state) => state.createRequest)

  const step = useDesignStore((s) => s.step)
  const furthest = useDesignStore((s) => s.furthest)
  const goTo = useDesignStore((s) => s.goTo)
  const resetDesign = useDesignStore((s) => s.reset)

  const [customer, setCustomer] = useState<RequestCustomer>(emptyCustomer)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<CustomRequest | null>(null)

  // Warm the split steps once the first paint is done.
  useEffect(() => {
    const warm = () => {
      void import('./steps/MaterialStep')
      void import('./steps/DetailSteps')
      void import('./steps/DesignReviewStep')
    }
    const idle = window.requestIdleCallback
    if (typeof idle === 'function') {
      const handle = idle(warm)
      return () => window.cancelIdleCallback(handle)
    }
    const timer = window.setTimeout(warm, 1200)
    return () => window.clearTimeout(timer)
  }, [])

  const navigate = useCallback(
    (next: number) => {
      goTo(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [goTo],
  )

  const validate = useCallback((): boolean => {
    const next: Record<string, string> = {}
    if (!customer.name.trim()) next.name = t('customize.validation.required')
    if (!customer.city) next.city = t('customize.validation.required')
    if (!customer.phone.trim()) next.phone = t('customize.validation.required')
    else if (!SAUDI_PHONE.test(customer.phone.replace(/[\s-]/g, '')))
      next.phone = t('customize.validation.phone')

    setErrors(next)
    return Object.keys(next).length === 0
  }, [customer, t])

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)

    // Demo only: the request is written to local state, never to a server.
    await new Promise((resolve) => setTimeout(resolve, 800))

    const { design, generated } = useDesignStore.getState()
    const description = describeDesign(design)

    const request = createRequest({
      // The storefront's own shape, so the admin console, the renderer and the
      // estimate maths keep working unchanged.
      config: toPieceConfig(design),
      customer,
      brief: {
        // A written brief the sales team can read at a glance, in the language
        // the customer was using.
        projectDescription: locale === 'ar' ? description.ar : description.en,
        notes: design.notes,
        referenceFiles: design.referenceImage ? ['reference.jpg'] : [],
      },
      // Everything the studio added, kept structured rather than flattened into
      // the brief text.
      design,
      generatedPreview: generated?.image ?? null,
    })

    setSubmitted(request)
    setIsSubmitting(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reset = () => {
    resetDesign()
    setCustomer(emptyCustomer)
    setErrors({})
    setSubmitted(null)
  }

  const body = useMemo(() => {
    switch (step) {
      case STEPS.inspiration:
        return <InspirationStep />
      case STEPS.dimensions:
        return <DimensionsStep />
      case STEPS.material:
        return <MaterialStep />
      case STEPS.edge:
        return <EdgeStep />
      case STEPS.base:
        return <BaseStep />
      case STEPS.finish:
        return <FinishStep />
      default:
        return (
          <DesignReviewStep customer={customer} setCustomer={setCustomer} errors={errors} />
        )
    }
  }, [step, customer, errors])

  if (submitted) {
    return (
      <div className="container py-12 md:py-16">
        <RequestConfirmation request={submitted} onNewRequest={reset} />
      </div>
    )
  }

  const isReview = step === STEPS.review

  return (
    <div className="container py-8 md:py-12">
      <StepIndicator current={step} furthest={furthest} onSelect={navigate} />

      {/* Mobile puts the preview above the controls and keeps it stuck to the
          top while the customer works; desktop places it beside them. Either
          way it is one mounted component. */}
      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <div className="order-1 lg:order-2 lg:col-span-5">
          {/* Sticky at every width: on a phone the preview stays in view while
              the controls scroll under it, which is the whole point of the
              layout. Offsets clear the sticky header (88px, 104px from md).
              No negative margins — an element that cancels the container padding
              by hand goes 16px wide the moment either value changes. */}
          <div className="sticky top-[92px] z-10 rounded-2xl bg-sand-100/95 pb-3 backdrop-blur-sm md:top-[110px] lg:top-[124px] lg:bg-transparent lg:pb-0 lg:backdrop-blur-none">
            <DesignPreview />
          </div>
        </div>

        <div className="order-2 lg:order-1 lg:col-span-7">
          <p className="text-xs font-medium text-ink-muted">
            {t('common.step', { current: step + 1, total: STEP_KEYS.length })}
          </p>
          <h2 className="mt-1.5 font-primary text-2xl font-semibold text-ink md:text-3xl">
            {t(stepCopy[step].title)}
          </h2>
          <p className="mt-2 text-ink-soft">{t(stepCopy[step].body)}</p>

          <div className="mt-7">
            {/* Only the step content animates. The preview is outside this tree
                and is never touched by the transition. */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${step}-${locale}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
              >
                {body}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-9 flex flex-col-reverse gap-3 border-t border-sand-300 pt-6 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(step - 1)}
              disabled={step === 0}
              className="btn-secondary"
            >
              {t('common.previous')}
            </button>

            {isReview ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  t('customize.submitting')
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden />
                    {t('design.submit')}
                  </>
                )}
              </button>
            ) : (
              <button type="button" onClick={() => navigate(step + 1)} className="btn-primary">
                {t('common.next')}
                <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
              </button>
            )}
          </div>

          {/* Nothing here is a purchase — say so before the button, not after. */}
          {isReview && (
            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              {l({
                ar: 'إرسال الطلب لا يعني الشراء — سنراجع المقاسات وتوفّر اللوح ثم نتواصل معك بعرض السعر.',
                en: 'Sending this is not a purchase — we review the measurements and slab availability, then come back to you with a price.',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
