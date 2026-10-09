'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { statusLabelKey } from './StatusBadge'
import { REQUEST_STATUSES, type CustomRequest, type RequestStatus } from '@/types'

/**
 * Requests-by-status distribution.
 *
 * Bklit UI's chart registry was evaluated for this (see
 * docs/DEMO-COMPLETION.md): it targets Tailwind v4 tokens plus shadcn
 * primitives and pulls five alpha `@visx` packages, which this Tailwind 3
 * project has no other use for. The chart below instead follows Bklit's
 * conventions — the `--chart-1..5` token ramp declared in `globals.css`, a
 * single-hue warm theme, and motion-driven bar growth — in about eighty lines
 * with no new dependencies.
 */
export default function StatusChart({ requests }: { requests: CustomRequest[] }) {
  const { t, num, isRTL } = useI18n()
  const reduced = useReducedMotion()

  const counts = REQUEST_STATUSES.map((status) => ({
    status,
    count: requests.filter((request) => request.status === status).length,
  }))
  const max = Math.max(1, ...counts.map((c) => c.count))
  const total = requests.length

  if (total === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-sand-300 py-12 text-center text-sm text-ink-muted">
        {t('admin.chart.empty')}
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {counts.map((item, index) => (
        <li key={item.status}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">
              {t(statusLabelKey[item.status as RequestStatus])}
            </span>
            <span className="text-sm tabular-nums text-ink-soft">
              <bdi>{num(item.count)}</bdi>
              <bdi className="ms-1.5 text-xs text-ink-muted">
                {num(Math.round((item.count / total) * 100))}%
              </bdi>
            </span>
          </div>

          <div
            className="h-2.5 w-full overflow-hidden rounded-full bg-sand-200"
            role="img"
            aria-label={`${t(statusLabelKey[item.status as RequestStatus])}: ${num(item.count)}`}
          >
            {/* Scaled rather than animated on `width`: animating width runs
                layout on every frame for every bar, which was the largest cost
                of opening this page. `scaleX` is composited, and the bar grows
                from the inline start in both directions. */}
            <motion.div
              className="h-full w-full rounded-full"
              style={{
                backgroundColor: `var(--chart-${index + 1})`,
                transformOrigin: isRTL ? 'right center' : 'left center',
              }}
              initial={reduced ? false : { scaleX: 0 }}
              animate={{ scaleX: item.count / max }}
              transition={{ duration: 0.7, delay: index * 0.07, ease: [0.22, 0.61, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
