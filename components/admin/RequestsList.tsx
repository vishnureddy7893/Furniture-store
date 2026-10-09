'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import StatusBadge, { statusLabelKey } from './StatusBadge'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useRequestsStore } from '@/lib/store/requests-store'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { cityById, marbleById, pieceById } from '@/lib/data/configurator'
import { cn } from '@/lib/utils'
import { REQUEST_STATUSES, type RequestStatus } from '@/types'

export default function RequestsList() {
  const { t, l, num, date } = useI18n()
  const requests = useRequestsStore((state) => state.requests)
  const hydrated = useHydrated()
  const searchParams = useSearchParams()

  const initial = searchParams.get('status') as RequestStatus | null
  const [filter, setFilter] = useState<RequestStatus | 'all'>(
    initial && REQUEST_STATUSES.includes(initial) ? initial : 'all',
  )

  const list = hydrated ? requests : []
  const filtered = filter === 'all' ? list : list.filter((r) => r.status === filter)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-primary text-xl font-semibold text-ink">
            {t('admin.requests.title')}
          </h2>
          <p className="mt-1 text-sm text-ink-soft" aria-live="polite">
            {t('admin.requests.count', { count: num(filtered.length) })}
          </p>
        </div>
      </div>

      <div
        className="-mx-4 mb-6 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0"
        role="group"
        aria-label={t('admin.requests.filter')}
      >
        <div className="flex w-max gap-2">
          <FilterChip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={t('admin.requests.all')}
          />
          {REQUEST_STATUSES.map((status) => (
            <FilterChip
              key={status}
              active={filter === status}
              onClick={() => setFilter(status)}
              label={t(statusLabelKey[status])}
            />
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 py-16 text-center">
          <p className="text-ink-soft">{t('admin.requests.empty')}</p>
          <Link href="/customize" className="btn-primary mt-6">
            {t('nav.customize')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        </div>
      ) : (
        <>
          {/* Cards on small screens, a table from md up. */}
          <ul className="space-y-3 md:hidden">
            {filtered.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/admin/requests/${request.id}`}
                  className="flex gap-3 rounded-2xl border border-sand-300 bg-white p-4"
                >
                  <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                    <PieceScene config={request.config} view="scene" className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span dir="ltr" className="text-xs font-medium text-ink-muted">
                        {request.id}
                      </span>
                      <StatusBadge status={request.status} />
                    </span>
                    <span className="mt-1 block truncate text-sm font-semibold text-ink">
                      {request.customer.name}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">
                      {l(pieceById(request.config.piece).name)} ·{' '}
                      {l(marbleById(request.config.marble).name)}
                    </span>
                    <span className="mt-1 block text-[11px] text-ink-muted">
                      {date(request.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-hidden rounded-2xl border border-sand-300 bg-white md:block">
            <table className="w-full text-start text-sm">
              <thead className="border-b border-sand-200 bg-sand-50">
                <tr>
                  <Th>{t('admin.table.id')}</Th>
                  <Th>{t('admin.table.customer')}</Th>
                  <Th>{t('admin.table.piece')}</Th>
                  <Th>{t('admin.table.marble')}</Th>
                  <Th>{t('admin.table.city')}</Th>
                  <Th>{t('admin.table.status')}</Th>
                  <Th>{t('admin.table.date')}</Th>
                  <th className="p-3">
                    <span className="sr-only">{t('admin.table.open')}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {filtered.map((request) => {
                  const city = cityById(request.customer.city)
                  return (
                    <tr key={request.id} className="transition-colors hover:bg-sand-50">
                      <td dir="ltr" className="p-3 text-start font-medium text-ink">
                        {request.id}
                      </td>
                      <td className="p-3 text-ink">{request.customer.name}</td>
                      <td className="p-3 text-ink-soft">
                        {l(pieceById(request.config.piece).name)}
                      </td>
                      <td className="p-3 text-ink-soft">
                        {l(marbleById(request.config.marble).name)}
                      </td>
                      <td className="p-3 text-ink-soft">{city ? l(city) : '—'}</td>
                      <td className="p-3">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="p-3 text-ink-muted">{date(request.createdAt)}</td>
                      <td className="p-3 text-end">
                        <Link
                          href={`/admin/requests/${request.id}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-bronze-deep transition-colors hover:text-ink"
                        >
                          {t('admin.table.open')}
                          <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="p-3 text-start text-xs font-semibold uppercase tracking-wide text-ink-muted">
      {children}
    </th>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-sand-50'
          : 'border-sand-300 bg-white text-ink-soft hover:border-ink hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
