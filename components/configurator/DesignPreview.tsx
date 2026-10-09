'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Crop, Loader2, Sparkles } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import CornerAdjuster from './CornerAdjuster'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import {
  selectConfident,
  useDesignStore,
} from '@/lib/store/design-store'
import {
  baseTypeById,
  finishById,
  fromCm,
  toPieceConfig,
  type DesignConfiguration,
} from '@/lib/data/design'
import { edgeById, marbleById, pieceById } from '@/lib/data/configurator'
import {
  approximations,
  buildShading,
  createSource,
  maskFromQuad,
  renderComposite,
  type CompositeSource,
} from '@/lib/design/composite'
import { loadImage } from '@/lib/design/image'
import { cn } from '@/lib/utils'
import type { DictKey } from '@/lib/i18n/dictionaries'

/**
 * The preview, which is mounted once and never unmounted while the studio is
 * open. Steps change what is on the left; this stays.
 *
 * It has two renderers and picks whichever the customer has given it:
 *
 *   - a photograph, retextured on a canvas by `lib/design/composite`;
 *   - the app's own drawn scene (`PieceScene`), when no photograph was uploaded,
 *     which already understands dimensions, outline, edge and base.
 *
 * Neither is ever remounted by a step change, and no selection triggers a
 * network request. The specification panel underneath reads straight from the
 * store, so it is correct the instant a value changes even if the canvas has not
 * repainted yet.
 */

const APPROXIMATION_COPY: Record<string, DictKey> = {
  edge: 'design.approx.edge',
  base: 'design.approx.base',
  shape: 'design.approx.shape',
  dimensions: 'design.approx.dimensions',
}

export default function DesignPreview({ className }: { className?: string }) {
  const { t, l, num, locale } = useI18n()

  const design = useDesignStore((s) => s.design)
  const workingImage = useDesignStore((s) => s.workingImage)
  const uploadStatus = useDesignStore((s) => s.uploadStatus)
  const analysis = useDesignStore((s) => s.analysis)
  const quad = useDesignStore((s) => s.quad)
  const generated = useDesignStore((s) => s.generated)
  const generateStatus = useDesignStore((s) => s.generateStatus)
  const confident = useDesignStore(selectConfident)
  const quadAdjusted = useDesignStore((s) => s.quadAdjusted)
  const adjusting = useDesignStore((s) => s.adjusting)
  const setAdjusting = useDesignStore((s) => s.setAdjusting)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef<CompositeSource | null>(null)
  const [sourceGeneration, setSourceGeneration] = useState(0)
  const [painted, setPainted] = useState(false)
  /** Which image the customer is looking at once an AI render exists. */
  const [showGenerated, setShowGenerated] = useState(true)

  const hasPhoto = workingImage !== null
  const aiImage = generated?.image ?? null

  /* ------------------------------------------------------------ the source */

  // Decoding the photograph and separating it from its backdrop happens once
  // per upload, never per selection.
  useEffect(() => {
    if (!workingImage) {
      sourceRef.current = null
      setPainted(false)
      return
    }

    let cancelled = false
    setPainted(false)

    loadImage(workingImage)
      .then((img) => {
        if (cancelled) return
        sourceRef.current = createSource(
          img,
          analysis ?? {
            tabletopMask: null,
            tabletopCorners: quad ?? [
              { x: 0.22, y: 0.38 },
              { x: 0.78, y: 0.38 },
              { x: 0.84, y: 0.56 },
              { x: 0.16, y: 0.56 },
            ],
            objectMask: null,
            baseMask: null,
            backgroundMask: null,
            baseRegion: null,
            confidence: 0,
            source: 'none',
            warnings: [],
          },
        )
        setSourceGeneration((g) => g + 1)
      })
      .catch(() => {
        /* the photograph is still shown as an <img>; only compositing is lost */
      })
    return () => {
      cancelled = true
    }
    // `quad` is intentionally excluded: moving a corner must not reload the
    // photograph, only repaint it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workingImage, analysis])

  /* ----------------------------------------------------------- the repaint */

  // Dragging a slider changes the length 60 times a second; the badge must
  // follow every one of them, but the canvas only needs the settled value.
  const deferredLength = useDeferredValue(design.dimensions.length)
  const baseTint = baseTypeById(design.baseType).tint

  /**
   * The tabletop mask: the region the analysis found, or the customer's own
   * corners once they have placed them.
   *
   * `null` means we do not know where the tabletop is — and in that case nothing
   * is painted at all. Showing the photograph untouched and asking for a moment
   * of help is the honest outcome; painting marble across a guess is not.
   */
  const maskCanvas = useMemo(() => {
    const source = sourceRef.current
    if (!source) return null
    if (quadAdjusted && quad) {
      return maskFromQuad(quad, design.shape, source.width, source.height)
    }
    return source.tabletopMask
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceGeneration, quadAdjusted, quad, design.shape])

  useEffect(() => {
    const canvas = canvasRef.current
    const source = sourceRef.current
    if (!canvas || !source || !quad || !maskCanvas) {
      setPainted(false)
      return
    }

    let frame = 0
    frame = requestAnimationFrame(() => {
      renderComposite(canvas, {
        source,
        shading: buildShading(source, quad),
        mask: maskCanvas,
        quad,
        marble: marbleById(design.materialId),
        finish: design.finish,
        edge: design.edgeProfile,
        thickness: design.thickness,
        lengthCm: deferredLength,
        vein: design.veinDirection,
        baseTint,
      })
      setPainted(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [
    sourceGeneration,
    maskCanvas,
    quad,
    design.materialId,
    design.finish,
    design.edgeProfile,
    design.thickness,
    design.veinDirection,
    deferredLength,
    baseTint,
  ])

  // A fresh render is the thing to look at; a new selection afterwards is not.
  useEffect(() => {
    if (aiImage) setShowGenerated(true)
  }, [aiImage])

  /* -------------------------------------------------------------- geometry */

  const source = sourceRef.current
  const frame = useMemo(() => {
    if (source) return { w: source.width, h: source.height }
    return { w: 16, h: 10 }
  }, [source, sourceGeneration]) // eslint-disable-line react-hooks/exhaustive-deps

  const pieceConfig = useMemo(() => toPieceConfig(design), [design])

  const notes = useMemo(
    () =>
      approximations({
        hasPhoto,
        edge: design.edgeProfile,
        baseType: design.baseType,
        shape: design.shape,
        confident,
      }),
    [hasPhoto, design.edgeProfile, design.baseType, design.shape, confident],
  )

  const busy = uploadStatus === 'analyzing' || generateStatus === 'working'
  const showingAi = Boolean(aiImage) && showGenerated

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-sand-300 bg-white',
        className,
      )}
    >
      {/* ------------------------------------------------------------ visual */}
      <div className="relative bg-sand-100">
        <div
          className="relative mx-auto w-full"
          style={{
            aspectRatio: `${frame.w} / ${frame.h}`,
            // Keeps a portrait screenshot from taking over the page while the
            // box still matches the image exactly, so the overlays stay aligned.
            maxWidth: `calc(62vh * ${frame.w / frame.h})`,
          }}
        >
          {hasPhoto ? (
            <>
              {/* The photograph itself, on screen from the first paint. */}
              <img
                src={workingImage ?? undefined}
                alt={t('design.preview.referenceAlt')}
                className="absolute inset-0 h-full w-full object-contain"
              />
              <canvas
                ref={canvasRef}
                // Read back by the review step to send the model a colour
                // reference alongside the original photograph.
                data-design-canvas
                aria-hidden
                className={cn(
                  'absolute inset-0 h-full w-full object-contain transition-opacity duration-300',
                  painted && !showingAi ? 'opacity-100' : 'opacity-0',
                )}
              />
              <AnimatePresence>
                {showingAi && aiImage && (
                  <motion.img
                    key="ai"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45 }}
                    src={aiImage}
                    alt={t('design.preview.generatedAlt')}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                )}
              </AnimatePresence>

              {adjusting && quad && (
                <CornerAdjuster quad={quad} onDone={() => setAdjusting(false)} />
              )}

              {/* Nothing could be identified, so nothing was painted. Ask for a
                  moment of help rather than showing a wrong result. */}
              {!adjusting && !maskCanvas && uploadStatus !== 'analyzing' && !showingAi && (
                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-ink/85 p-3 text-sand-50 backdrop-blur-sm">
                  <p className="text-[12px] font-semibold leading-snug">
                    {t('design.help.title')}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sand-300">
                    {t('design.help.body')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAdjusting(true)}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-sand-50 px-3.5 py-1.5 text-[11px] font-semibold text-ink transition-colors hover:bg-white"
                  >
                    <Crop className="h-3.5 w-3.5" aria-hidden />
                    {t('design.help.cta')}
                  </button>
                </div>
              )}
            </>
          ) : showingAi && aiImage ? (
            <img
              src={aiImage}
              alt={t('design.preview.generatedAlt')}
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : (
            /* No photograph: the app's own renderer, which the rest of the
               storefront uses, so the customer still sees their stone. */
            <PieceScene
              config={pieceConfig}
              view="scene"
              label={t('design.preview.drawnAlt')}
              className="absolute inset-0 h-full w-full"
            />
          )}

          {/* Dimension callouts. Driven by the store, so they move the instant
              a number changes — independently of the canvas. */}
          {!adjusting && <DimensionGuides design={design} />}
        </div>

        {/* Dimension badge. Technical string, so it stays left-to-right. */}
        <span
          dir="ltr"
          className="pointer-events-none absolute bottom-3 start-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-ink shadow-sm backdrop-blur-sm"
        >
          {formatDims(design, num)}
        </span>

        {/* Live / rendered toggle, only once there is something to toggle. */}
        {aiImage && (
          <div className="absolute bottom-3 end-3 flex overflow-hidden rounded-full bg-white/90 text-[10px] font-semibold shadow-sm backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShowGenerated(true)}
              className={cn('px-3 py-1.5 transition-colors', showGenerated ? 'bg-ink text-sand-50' : 'text-ink-soft')}
            >
              {t('design.preview.rendered')}
            </button>
            <button
              type="button"
              onClick={() => setShowGenerated(false)}
              className={cn('px-3 py-1.5 transition-colors', !showGenerated ? 'bg-ink text-sand-50' : 'text-ink-soft')}
            >
              {t('design.preview.live')}
            </button>
          </div>
        )}

        {/* Corner adjustment, offered rather than demanded. */}
        {hasPhoto && !adjusting && !showingAi && maskCanvas && (
          <button
            type="button"
            onClick={() => setAdjusting(true)}
            className="absolute top-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium text-ink-soft shadow-sm backdrop-blur-sm transition-colors hover:text-ink"
          >
            <Crop className="h-3.5 w-3.5" aria-hidden />
            {t('design.preview.adjustSurface')}
          </button>
        )}

        {/* Progressive status. Never covers the preview, never blocks a click. */}
        <AnimatePresence>
          {busy && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              role="status"
              className="pointer-events-none absolute top-3 start-3 inline-flex items-center gap-2 rounded-full bg-ink/85 px-3 py-1.5 text-[11px] font-medium text-sand-50 backdrop-blur-sm"
            >
              {generateStatus === 'working' ? (
                <Sparkles className="h-3.5 w-3.5 animate-pulse" aria-hidden />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              )}
              {t(
                generateStatus === 'working'
                  ? 'design.status.rendering'
                  : 'design.status.analyzing',
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --------------------------------------------------- specification */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:grid-cols-3 lg:grid-cols-2">
        <Spec label={t('design.spec.piece')} value={l(pieceById(design.pieceType).name)} />
        <Spec label={t('design.spec.marble')} value={l(marbleById(design.materialId).name)} />
        <Spec label={t('design.spec.edge')} value={l(edgeById(design.edgeProfile).name)} />
        <Spec label={t('design.spec.base')} value={l(baseTypeById(design.baseType).name)} />
        <Spec label={t('design.spec.finish')} value={l(finishById(design.finish).name)} />
        <Spec
          label={t('design.spec.thickness')}
          value={`${num(design.thickness)} ${t('design.unit.mm')}`}
          ltr
        />
      </dl>

      <p className="border-t border-sand-200 px-4 py-3 text-[11px] leading-relaxed text-ink-muted">
        {showingAi ? t('design.preview.aiNote') : t('design.preview.note')}
        {notes.length > 0 && !showingAi && (
          <>
            {' '}
            {notes.map((key) => t(APPROXIMATION_COPY[key])).join(' ')}
          </>
        )}
      </p>

      {/* Screen readers get the specification as a sentence, which is also the
          text a customer sees on the review step. */}
      <p className="sr-only" aria-live="polite">
        {locale === 'ar' ? describeForA11y(design, 'ar') : describeForA11y(design, 'en')}
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ pieces */

function Spec({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd dir={ltr ? 'ltr' : undefined} className="mt-0.5 text-sm font-medium text-ink">
        {value}
      </dd>
    </div>
  )
}

function formatDims(design: DesignConfiguration, num: (v: number, f?: number) => string): string {
  const { unit } = design.dimensions
  const f = unit === 'cm' ? 0 : 1
  const v = (cm: number) => num(Math.round(fromCm(cm, unit) * 10) / 10, f)
  return `${v(design.dimensions.length)} × ${v(design.dimensions.width)} × ${v(
    design.dimensions.height,
  )} ${unit}`
}

function describeForA11y(design: DesignConfiguration, locale: 'ar' | 'en'): string {
  const marble = marbleById(design.materialId).name[locale]
  const piece = pieceById(design.pieceType).name[locale]
  return locale === 'ar'
    ? `${piece} من رخام ${marble}`
    : `${piece} in ${marble} marble`
}

/**
 * Length and height callouts along the frame.
 *
 * Anchored to the preview frame rather than to the piece: a measurement drawn
 * across a photograph at a guessed scale would be a lie, whereas an annotation
 * on the edge of the visualisation is plainly an annotation. Plain elements
 * driven by the store, which is why a typed dimension appears with no repaint
 * of the canvas at all.
 */
function DimensionGuides({ design }: { design: DesignConfiguration }) {
  const { num, t } = useI18n()
  const { unit } = design.dimensions
  const f = unit === 'cm' ? 0 : 1
  const value = (cm: number) => num(Math.round(fromCm(cm, unit) * 10) / 10, f)

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Length, along the bottom. Sits clear of the dimension badge in the
          bottom corner, which on a phone is wide enough to reach the middle. */}
      <div className="absolute bottom-[15%] left-[16%] right-[16%] flex items-center gap-1.5">
        <span className="h-2 w-px bg-ink/25" />
        <span className="h-px flex-1 bg-ink/20" />
        <span
          dir="ltr"
          className="rounded bg-sand-100/90 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-ink-soft"
        >
          {value(design.dimensions.length)}
        </span>
        <span className="h-px flex-1 bg-ink/20" />
        <span className="h-2 w-px bg-ink/25" />
      </div>

      {/* height, up the trailing side */}
      <div className="absolute bottom-[24%] end-[3%] top-[16%] flex w-4 flex-col items-center gap-1.5">
        <span className="h-px w-2 bg-ink/25" />
        <span className="w-px flex-1 bg-ink/20" />
        <span
          dir="ltr"
          className="rounded bg-sand-100/90 px-1 py-0.5 text-[10px] font-semibold leading-none text-ink-soft"
        >
          {value(design.dimensions.height)}
        </span>
        <span className="w-px flex-1 bg-ink/20" />
        <span className="h-px w-2 bg-ink/25" />
      </div>

      <span className="sr-only">{t('design.spec.dimensions')}</span>
    </div>
  )
}
