'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useDesignStore } from '@/lib/store/design-store'
import type { Quad } from '@/lib/design/analysis'
import type { DictKey } from '@/lib/i18n/dictionaries'

/**
 * The manual fallback: four handles the customer drags onto the corners of
 * their own tabletop.
 *
 * This exists because no automatic method understands every photograph, and
 * pretending otherwise produces a preview with marble on the floor. When the
 * heuristic is unsure it routes here, and the customer is simply asked to show
 * us the surface — which they can always do correctly, in a few seconds.
 *
 * The copy never mentions detection, masks, models or confidence. From the
 * customer's side this is a framing tool, which is a thing they already
 * understand from every photo app they own.
 *
 * Pointer events (not mouse events) so this works with a finger, and each handle
 * is 44px of touch target even though it looks like a small ring.
 */

/** Index order matches `Quad`: back-left, back-right, front-right, front-left. */
const CORNER_LABELS: DictKey[] = [
  'design.corner.backLeft',
  'design.corner.backRight',
  'design.corner.frontRight',
  'design.corner.frontLeft',
]

export default function CornerAdjuster({
  quad,
  onDone,
}: {
  quad: Quad
  onDone: () => void
}) {
  const { t } = useI18n()
  const setQuad = useDesignStore((s) => s.setQuad)
  const resetQuad = useDesignStore((s) => s.resetQuad)

  const frameRef = useRef<HTMLDivElement>(null)
  // Dragging is local so a 60Hz pointer stream never touches the store; the
  // store is written once, when the drag ends.
  const [draft, setDraft] = useState<Quad>(quad)
  const [dragging, setDragging] = useState<number | null>(null)

  useEffect(() => setDraft(quad), [quad])

  const pointFromEvent = useCallback((clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) return null
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    }
  }, [])

  const move = useCallback(
    (index: number, clientX: number, clientY: number) => {
      const point = pointFromEvent(clientX, clientY)
      if (!point) return
      setDraft((current) => {
        const next = [...current] as Quad
        next[index] = point
        return next
      })
    },
    [pointFromEvent],
  )

  // Listening on the window rather than the handle means the pointer can leave
  // the small target mid-drag without dropping it.
  useEffect(() => {
    if (dragging === null) return

    const onMove = (event: PointerEvent) => {
      event.preventDefault()
      move(dragging, event.clientX, event.clientY)
    }
    const onUp = () => setDragging(null)

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, move])

  /** Arrow keys nudge by a quarter of a percent — enough to be precise. */
  const nudge = (index: number, dx: number, dy: number) => {
    setDraft((current) => {
      const next = [...current] as Quad
      next[index] = {
        x: Math.min(1, Math.max(0, next[index].x + dx)),
        y: Math.min(1, Math.max(0, next[index].y + dy)),
      }
      return next
    })
  }

  const polygon = draft.map((p) => `${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`).join(', ')

  return (
    <div ref={frameRef} className="absolute inset-0 touch-none">
      {/* Everything outside the surface dims, so the shape being described is
          unmistakable without any explanatory diagram. */}
      <div
        className="absolute inset-0 bg-ink/45"
        style={{
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${polygon}, 0% 0%)`,
        }}
      />
      <div
        className="absolute inset-0 border-transparent"
        style={{
          clipPath: `polygon(${polygon})`,
          boxShadow: 'inset 0 0 0 2px rgba(251,249,246,0.9)',
        }}
      />

      {CORNER_LABELS.map((label, key) => (
        <button
          key={label}
          type="button"
          aria-label={t(label)}
          onPointerDown={(event) => {
            event.preventDefault()
            setDragging(key)
          }}
          onKeyDown={(event) => {
            const s = event.shiftKey ? 0.01 : 0.0025
            if (event.key === 'ArrowLeft') nudge(key, -s, 0)
            else if (event.key === 'ArrowRight') nudge(key, s, 0)
            else if (event.key === 'ArrowUp') nudge(key, 0, -s)
            else if (event.key === 'ArrowDown') nudge(key, 0, s)
            else return
            event.preventDefault()
          }}
          className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ left: `${draft[key].x * 100}%`, top: `${draft[key].y * 100}%` }}
        >
          <span
            aria-hidden
            className={[
              'block h-4 w-4 rounded-full border-2 border-white bg-bronze shadow-md transition-transform',
              dragging === key ? 'scale-150' : 'scale-100',
            ].join(' ')}
          />
        </button>
      ))}

      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-[60%] rounded-lg bg-ink/80 px-2.5 py-1.5 text-[11px] leading-snug text-sand-50 backdrop-blur-sm">
          {t('design.corner.hint')}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => resetQuad()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-ink-soft backdrop-blur-sm transition-colors hover:text-ink"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            {t('design.corner.reset')}
          </button>
          <button
            type="button"
            onClick={() => {
              setQuad(draft)
              onDone()
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-[11px] font-semibold text-sand-50 transition-colors hover:bg-ink-soft"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t('design.corner.done')}
          </button>
        </div>
      </div>
    </div>
  )
}
