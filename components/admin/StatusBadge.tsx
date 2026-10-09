'use client'

import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { RequestStatus } from '@/types'
import type { DictKey } from '@/lib/i18n/dictionaries'

export const statusLabelKey: Record<RequestStatus, DictKey> = {
  new: 'admin.status.new',
  contacted: 'admin.status.contacted',
  quoted: 'admin.status.quoted',
  production: 'admin.status.production',
  delivered: 'admin.status.delivered',
}

const statusStyle: Record<RequestStatus, string> = {
  new: 'bg-bronze-wash text-bronze-deep border-bronze/30',
  contacted: 'bg-verde-wash text-verde border-verde/30',
  quoted: 'bg-bronze text-white border-bronze',
  production: 'bg-ink text-sand-50 border-ink',
  delivered: 'bg-verde text-white border-verde',
}

export default function StatusBadge({
  status,
  className,
}: {
  status: RequestStatus
  className?: string
}) {
  const { t } = useI18n()

  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold',
        statusStyle[status],
        className,
      )}
    >
      {t(statusLabelKey[status])}
    </span>
  )
}
