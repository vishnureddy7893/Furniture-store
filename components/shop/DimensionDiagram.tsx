'use client'

import { useI18n } from '@/lib/i18n/LocaleProvider'
import { planPath } from '@/lib/marble/geometry'
import type { PieceConfig } from '@/lib/data/configurator'

/**
 * A simple measured plan of the piece. Text is positioned with `text-anchor`
 * rather than fixed sides, and the whole drawing is mirrored under RTL so the
 * measurement arrows read in the direction of the language.
 */
export default function DimensionDiagram({ config }: { config: PieceConfig }) {
  const { t, num, isRTL } = useI18n()
  const { length, width, height } = config.dimensions
  const depth = config.shape === 'round' ? length : width

  const w = 520
  const h = 300
  const scale = Math.min(340 / length, 150 / depth)
  const halfLen = (length * scale) / 2
  const halfWidth = (depth * scale) / 2
  const cx = w / 2 - 20
  const cy = h / 2 - 10

  const label = (value: number) => `${num(value)} ${t('pdp.cm')}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label={`${t('pdp.dimensions')}: ${label(length)} × ${label(depth)} × ${label(height)}`}
    >
      <g transform={isRTL ? `translate(${w} 0) scale(-1 1)` : undefined}>
        <path
          d={planPath(config.shape, cx, cy, halfLen, halfWidth)}
          fill="#EFE9E0"
          stroke="#1E1B18"
          strokeOpacity="0.25"
          strokeWidth="1.5"
        />

        {/* Length */}
        <g stroke="#9C7A54" strokeWidth="1.25">
          <line x1={cx - halfLen} y1={cy + halfWidth + 26} x2={cx + halfLen} y2={cy + halfWidth + 26} />
          <line x1={cx - halfLen} y1={cy + halfWidth + 20} x2={cx - halfLen} y2={cy + halfWidth + 32} />
          <line x1={cx + halfLen} y1={cy + halfWidth + 20} x2={cx + halfLen} y2={cy + halfWidth + 32} />
        </g>

        {/* Width */}
        <g stroke="#9C7A54" strokeWidth="1.25">
          <line x1={cx + halfLen + 26} y1={cy - halfWidth} x2={cx + halfLen + 26} y2={cy + halfWidth} />
          <line x1={cx + halfLen + 20} y1={cy - halfWidth} x2={cx + halfLen + 32} y2={cy - halfWidth} />
          <line x1={cx + halfLen + 20} y1={cy + halfWidth} x2={cx + halfLen + 32} y2={cy + halfWidth} />
        </g>
      </g>

      {/* Labels are outside the mirrored group so text is never reversed. */}
      <text
        x={isRTL ? w - cx : cx}
        y={cy + halfWidth + 48}
        textAnchor="middle"
        className="fill-ink text-[13px] font-medium"
      >
        {label(length)}
      </text>
      <text
        x={isRTL ? w - (cx + halfLen + 34) : cx + halfLen + 34}
        y={cy + 4}
        textAnchor={isRTL ? 'end' : 'start'}
        className="fill-ink text-[13px] font-medium"
      >
        {label(depth)}
      </text>
      <text
        x={isRTL ? w - 24 : 24}
        y={28}
        textAnchor={isRTL ? 'end' : 'start'}
        className="fill-ink-muted text-[12px]"
      >
        {`${t('pdp.height')}: ${label(height)}`}
      </text>
    </svg>
  )
}
