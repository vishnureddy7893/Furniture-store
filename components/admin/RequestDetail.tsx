'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronLeft,
  FileImage,
  FileText,
  MessageCircle,
  Phone,
  Receipt,
  UserCheck,
} from 'lucide-react'
import StatusBadge, { statusLabelKey } from './StatusBadge'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useRequestsStore } from '@/lib/store/requests-store'
import { useHydrated } from '@/lib/hooks/useHydrated'
import {
  baseById,
  cityById,
  edgeById,
  marbleById,
  pieceById,
  shapeById,
} from '@/lib/data/configurator'
import { designSpecRows } from '@/lib/design/describe'
import { cn } from '@/lib/utils'
import { REQUEST_STATUSES, type RequestStatus, type TimelineEvent } from '@/types'

export default function RequestDetail({ id }: { id: string }) {
  const { t, l, num, price, dateTime } = useI18n()
  const hydrated = useHydrated()

  const request = useRequestsStore((state) => state.requests.find((r) => r.id === id))
  const setStatus = useRequestsStore((state) => state.setStatus)
  const addNote = useRequestsStore((state) => state.addNote)
  const prepareQuote = useRequestsStore((state) => state.prepareQuote)

  const [note, setNote] = useState('')
  const [flash, setFlash] = useState<string | null>(null)

  if (!hydrated) return null

  if (!request) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 py-16 text-center">
        <p className="text-ink-soft">{t('admin.detail.notFound')}</p>
        <Link href="/admin/requests" className="btn-secondary mt-6">
          {t('admin.detail.backToList')}
        </Link>
      </div>
    )
  }

  const { config, customer, brief, design } = request
  const { length, width, height } = config.dimensions
  const depth = config.shape === 'round' ? length : width
  const city = cityById(customer.city)

  const notify = (message: string) => {
    setFlash(message)
    window.setTimeout(() => setFlash(null), 2600)
  }

  const configRows = [
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

  const customerRows = [
    { label: t('common.name'), value: customer.name },
    { label: t('common.phone'), value: customer.phone, ltr: true },
    { label: t('common.email'), value: customer.email || '—', ltr: true },
    { label: t('common.city'), value: city ? l(city) : '—' },
  ]

  return (
    <div>
      <Link
        href="/admin/requests"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t('admin.detail.backToList')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p dir="ltr" className="font-primary text-2xl font-semibold text-ink">
            {request.id}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{dateTime(request.createdAt)}</p>
        </div>
        <StatusBadge status={request.status} className="px-3 py-1.5 text-xs" />
      </div>

      {/* Simulated-action feedback */}
      <AnimatePresence>
        {flash && (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-4 rounded-xl border border-verde/30 bg-verde-wash px-4 py-3 text-sm text-verde"
          >
            {flash}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Visual — the same renderer the customer configured with */}
          <section className="overflow-hidden rounded-2xl border border-sand-300 bg-white">
            <h2 className="border-b border-sand-200 p-5 font-primary text-base font-semibold text-ink">
              {t('admin.detail.visual')}
            </h2>
            <PieceScene
              config={config}
              view="scene"
              label={t('admin.detail.visual')}
              className="aspect-[16/9] w-full bg-sand-100"
            />
            <div className="grid grid-cols-3 gap-px bg-sand-200">
              <PieceScene config={config} view="plan" className="aspect-[4/3] w-full bg-white" />
              <PieceScene config={config} view="edge" className="aspect-[4/3] w-full bg-white" />
              <PieceScene config={config} view="stone" className="aspect-[4/3] w-full bg-white" />
            </div>
          </section>

          <Panel title={t('admin.detail.configuration')}>
            <dl className="divide-y divide-sand-200">
              {configRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd dir={row.ltr ? 'ltr' : undefined} className="text-sm font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          {/* Everything the design studio captured beyond the storefront shape.
              Only present on requests that came from there. */}
          {design && (
            <Panel title={t('admin.detail.designSpec')}>
              <dl className="divide-y divide-sand-200">
                {designSpecRows(design).map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
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

              {design.notes && (
                <p className="mt-4 border-t border-sand-200 pt-4 text-sm leading-relaxed text-ink-soft">
                  {design.notes}
                </p>
              )}

              {(design.referenceImage || request.generatedPreview) && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {design.referenceImage && (
                    <figure>
                      <img
                        src={design.referenceImage}
                        alt={t('admin.detail.customerReference')}
                        className="aspect-[4/3] w-full rounded-xl border border-sand-200 bg-sand-100 object-contain"
                      />
                      <figcaption className="mt-1.5 text-[11px] text-ink-muted">
                        {t('admin.detail.customerReference')}
                      </figcaption>
                    </figure>
                  )}
                  {request.generatedPreview && (
                    <figure>
                      <img
                        src={request.generatedPreview}
                        alt={t('admin.detail.generatedPreview')}
                        className="aspect-[4/3] w-full rounded-xl border border-sand-200 bg-sand-100 object-contain"
                      />
                      <figcaption className="mt-1.5 text-[11px] text-ink-muted">
                        {t('admin.detail.generatedPreview')}
                      </figcaption>
                    </figure>
                  )}
                </div>
              )}
            </Panel>
          )}

          <Panel title={t('admin.detail.project')}>
            <p className="text-sm leading-relaxed text-ink-soft">
              {brief.projectDescription || <span className="text-ink-muted">—</span>}
            </p>
            {brief.notes && (
              <p className="mt-3 border-t border-sand-200 pt-3 text-sm leading-relaxed text-ink-soft">
                {brief.notes}
              </p>
            )}

            <h3 className="eyebrow mb-2 mt-5">{t('admin.detail.reference')}</h3>
            {brief.referenceFiles.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('admin.detail.noReference')}</p>
            ) : (
              <ul className="space-y-2">
                {brief.referenceFiles.map((file) => (
                  <li
                    key={file}
                    className="flex items-center gap-2 rounded-lg border border-sand-200 bg-sand-50 px-3 py-2 text-sm"
                  >
                    <FileImage className="h-4 w-4 shrink-0 text-bronze" aria-hidden />
                    <span dir="ltr" className="truncate text-ink-soft">
                      {file}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={t('admin.detail.timeline')}>
            <ol className="space-y-4">
              {request.timeline.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-bronze"
                  />
                  <div>
                    <p className="text-sm text-ink">{describeEvent(event, t)}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{dateTime(event.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel title={t('admin.detail.internalNotes')}>
            {request.notes.length === 0 ? (
              <p className="text-sm text-ink-muted">{t('admin.detail.noNotes')}</p>
            ) : (
              <ul className="space-y-3">
                {request.notes.map((item) => (
                  <li key={item.id} className="rounded-xl border border-sand-200 bg-sand-50 p-4">
                    <p className="text-sm leading-relaxed text-ink">{item.body}</p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                      <FileText className="h-3.5 w-3.5" aria-hidden />
                      {item.author} · {dateTime(item.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!note.trim()) return
                addNote(request.id, note)
                setNote('')
                notify(t('admin.event.note'))
              }}
              className="mt-5 border-t border-sand-200 pt-5"
            >
              <label htmlFor="internal-note" className="field-label">
                {t('admin.detail.addNote')}
              </label>
              <textarea
                id="internal-note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('admin.detail.notePlaceholder')}
                className="field resize-y"
              />
              <button type="submit" disabled={!note.trim()} className="btn-primary mt-3">
                {t('admin.detail.saveNote')}
              </button>
            </form>
          </Panel>
        </div>

        {/* Workflow rail */}
        <div className="space-y-6 lg:col-span-1">
          <Panel title={t('admin.detail.customer')}>
            <dl className="divide-y divide-sand-200">
              {customerRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd dir={row.ltr ? 'ltr' : undefined} className="text-sm font-medium text-ink">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel title={t('admin.detail.changeStatus')}>
            <div className="flex flex-wrap gap-2">
              {REQUEST_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (status === request.status) return
                    setStatus(request.id, status)
                    notify(t('admin.event.status', { status: t(statusLabelKey[status]) }))
                  }}
                  aria-pressed={request.status === status}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    request.status === status
                      ? 'border-ink bg-ink text-sand-50'
                      : 'border-sand-300 bg-white text-ink-soft hover:border-ink hover:text-ink',
                  )}
                >
                  {t(statusLabelKey[status as RequestStatus])}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title={t('admin.detail.actions')}>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  prepareQuote(request.id)
                  notify(t('admin.detail.quotePrepared'))
                }}
                className="btn-primary w-full"
              >
                <Receipt className="h-4 w-4" aria-hidden />
                {t('admin.detail.prepareQuote')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus(request.id, 'contacted')
                  notify(t('admin.event.contacted'))
                }}
                className="btn-secondary w-full"
              >
                <UserCheck className="h-4 w-4" aria-hidden />
                {t('admin.detail.markContacted')}
              </button>

              <button
                type="button"
                onClick={() => notify(t('admin.event.contacted'))}
                className="btn-secondary w-full"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t('admin.detail.whatsapp')}
              </button>

              <button
                type="button"
                onClick={() => notify(t('admin.event.contacted'))}
                className="btn-secondary w-full"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {t('admin.detail.callCustomer')}
              </button>
            </div>

            {request.estimate !== undefined && (
              <div className="mt-5 rounded-xl border border-bronze/25 bg-bronze-wash p-4">
                <p className="text-xs uppercase tracking-wide text-bronze-deep">
                  {t('admin.detail.estimatedValue')}
                </p>
                <p className="mt-1 font-primary text-xl font-semibold text-ink">
                  {price(request.estimate)}
                </p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-bronze-deep">
                  {t('customize.estimateNote')}
                </p>
              </div>
            )}

            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              {t('admin.detail.actionsNote')}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-sand-300 bg-white p-5 md:p-6">
      <h2 className="mb-3 font-primary text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function describeEvent(
  event: TimelineEvent,
  t: (key: Parameters<ReturnType<typeof useI18n>['t']>[0], vars?: Record<string, string>) => string,
): string {
  switch (event.kind) {
    case 'created':
      return t('admin.event.created')
    case 'note':
      return t('admin.event.note')
    case 'quote':
      return t('admin.event.quote')
    case 'contacted':
      return t('admin.event.contacted')
    default:
      return t('admin.event.status', {
        status: event.value ? t(statusLabelKey[event.value as RequestStatus]) : '',
      })
  }
}
