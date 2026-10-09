'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight, Check, Info, MessageCircle, Phone } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import {
  baseById,
  cityById,
  edgeById,
  marbleById,
  pieceById,
  shapeById,
} from '@/lib/data/configurator'
import { designSpecRows } from '@/lib/design/describe'
import type { CustomRequest } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

const nextSteps: DictKey[] = ['request.next1', 'request.next2', 'request.next3']

export default function RequestConfirmation({
  request,
  onNewRequest,
}: {
  request: CustomRequest
  onNewRequest: () => void
}) {
  const { t, l, num, date } = useI18n()
  const { config, customer, brief, design } = request
  const { length, width, height } = config.dimensions
  const depth = config.shape === 'round' ? length : width
  const city = cityById(customer.city)

  // A request from the design studio has a fuller specification than the
  // storefront shape can express, so show that instead when it is there.
  const rows = design
    ? designSpecRows(design).map((row) => ({
        label: l(row.label),
        value: l(row.value),
        ltr: row.ltr,
      }))
    : [
    { label: t('customize.step1'), value: l(pieceById(config.piece).name) },
    { label: t('customize.step2'), value: l(marbleById(config.marble).name) },
    { label: t('customize.step3.shape'), value: l(shapeById(config.shape).name) },
    { label: t('customize.step3.edge'), value: l(edgeById(config.edge).name) },
    { label: t('customize.step4'), value: l(baseById(config.base).name) },
    {
      label: t('customize.dimensions'),
      value: `${num(length)} × ${num(depth)} × ${num(height)} ${t('pdp.cm')}`,
        ltr: true,
      },
    ]

  const contactRows = [
    { label: t('common.name'), value: customer.name },
    { label: t('common.phone'), value: customer.phone, ltr: true },
    { label: t('common.email'), value: customer.email || '—', ltr: true },
    { label: t('common.city'), value: city ? l(city) : '—' },
    { label: t('common.date'), value: date(request.createdAt) },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto max-w-3xl"
    >
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-verde">
          <Check className="h-8 w-8 text-white" aria-hidden />
        </span>
        <h1 className="mt-6 font-primary text-3xl font-semibold text-ink md:text-4xl">
          {t('request.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-ink-soft">{t('request.body')}</p>
      </div>

      <div className="mt-8 rounded-2xl border border-sand-300 bg-white p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-ink-muted">{t('request.number')}</p>
        <p dir="ltr" className="mt-2 font-primary text-2xl font-semibold tracking-wide text-ink">
          {request.id}
        </p>
      </div>

      {/* This is a request, not a paid order — say so plainly. */}
      <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t('request.notPaid')}
      </p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-sand-300 bg-white">
        {request.generatedPreview || design?.referenceImage ? (
          <img
            src={request.generatedPreview ?? design?.referenceImage ?? undefined}
            alt={t('request.summary')}
            className="aspect-[16/9] w-full bg-sand-100 object-contain"
          />
        ) : (
          <PieceScene
            config={config}
            view="scene"
            label={t('request.summary')}
            className="aspect-[16/9] w-full bg-sand-100"
          />
        )}
        <div className="p-5 md:p-6">
          <h2 className="font-primary text-base font-semibold text-ink">{t('request.summary')}</h2>
          <dl className="mt-3 divide-y divide-sand-200">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-sm text-ink-muted">{row.label}</dt>
                <dd dir={row.ltr ? 'ltr' : undefined} className="text-sm font-medium text-ink">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-sand-300 bg-white p-5 md:p-6">
        <h2 className="font-primary text-base font-semibold text-ink">{t('customize.contact')}</h2>
        <dl className="mt-3 divide-y divide-sand-200">
          {contactRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-sm text-ink-muted">{row.label}</dt>
              <dd dir={row.ltr ? 'ltr' : undefined} className="text-sm font-medium text-ink">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        {brief.projectDescription && (
          <p className="mt-4 border-t border-sand-200 pt-4 text-sm leading-relaxed text-ink-soft">
            {brief.projectDescription}
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-sand-300 bg-sand-50 p-6">
        <h2 className="font-primary text-base font-semibold text-ink">{t('request.next')}</h2>
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

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="btn-secondary cursor-default select-none opacity-80">
            <MessageCircle className="h-4 w-4" aria-hidden />
            {t('common.whatsapp')}
          </span>
          <span className="btn-secondary cursor-default select-none opacity-80">
            <Phone className="h-4 w-4" aria-hidden />
            {t('common.call')}
          </span>
        </div>
        <p className="mt-3 text-xs text-ink-muted">{t('admin.detail.actionsNote')}</p>
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={`/admin/requests/${request.id}`} className="btn-primary">
          {t('request.viewInAdmin')}
          <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
        </Link>
        <button type="button" onClick={onNewRequest} className="btn-secondary">
          {t('request.newRequest')}
        </button>
      </div>
    </motion.div>
  )
}
