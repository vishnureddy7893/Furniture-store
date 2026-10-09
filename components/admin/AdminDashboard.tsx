'use client'

import Link from 'next/link'
import { ArrowRight, ClipboardList, Factory, PackageCheck, Sparkles } from 'lucide-react'
import StatusBadge from './StatusBadge'
import StatusChart from './StatusChart'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useRequestsStore } from '@/lib/store/requests-store'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { marbleById, pieceById } from '@/lib/data/configurator'
import type { RequestStatus } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

const cards: { key: DictKey; status: RequestStatus; icon: typeof Sparkles }[] = [
  { key: 'admin.card.new', status: 'new', icon: Sparkles },
  { key: 'admin.card.quote', status: 'contacted', icon: ClipboardList },
  { key: 'admin.card.production', status: 'production', icon: Factory },
  { key: 'admin.card.delivered', status: 'delivered', icon: PackageCheck },
]

export default function AdminDashboard() {
  const { t, l, num, date } = useI18n()
  const requests = useRequestsStore((state) => state.requests)
  const hydrated = useHydrated()

  const list = hydrated ? requests : []
  const recent = list.slice(0, 4)

  return (
    <div className="space-y-8">
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          const count = list.filter((request) => request.status === card.status).length
          return (
            <li key={card.key}>
              <Link
                href={`/admin/requests?status=${card.status}`}
                className="block rounded-2xl border border-sand-300 bg-white p-5 transition-all hover:border-bronze/50 hover:shadow-stone"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bronze-wash text-bronze-deep">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 font-primary text-3xl font-semibold text-ink">{num(count)}</p>
                <p className="mt-1 text-sm text-ink-soft">{t(card.key)}</p>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-sand-300 bg-white p-6 lg:col-span-2">
          <h2 className="font-primary text-lg font-semibold text-ink">{t('admin.chart.title')}</h2>
          <div className="mt-6">
            <StatusChart requests={list} />
          </div>
        </section>

        <section className="rounded-2xl border border-sand-300 bg-white lg:col-span-3">
          <div className="flex items-center justify-between gap-3 border-b border-sand-200 p-6">
            <h2 className="font-primary text-lg font-semibold text-ink">{t('admin.recent')}</h2>
            <Link
              href="/admin/requests"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-bronze-deep transition-colors hover:text-ink"
            >
              {t('common.viewAll')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-muted">{t('admin.requests.empty')}</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {recent.map((request) => (
                <li key={request.id}>
                  <Link
                    href={`/admin/requests/${request.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-sand-50"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                      <PieceScene config={request.config} view="scene" className="h-full w-full" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span dir="ltr" className="block text-xs font-medium text-ink-muted">
                        {request.id}
                      </span>
                      <span className="mt-0.5 block truncate text-sm font-semibold text-ink">
                        {request.customer.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-soft">
                        {l(pieceById(request.config.piece).name)} ·{' '}
                        {l(marbleById(request.config.marble).name)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusBadge status={request.status} />
                      <span className="text-[11px] text-ink-muted">{date(request.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
