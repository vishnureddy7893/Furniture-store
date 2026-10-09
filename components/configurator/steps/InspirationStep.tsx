'use client'

import { useCallback, useRef, useState, type DragEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ImagePlus, Loader2, RefreshCw, Sparkles, Trash2, UploadCloud, Wand2 } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useDesignStore } from '@/lib/store/design-store'
import { PIECES } from '@/lib/data/configurator'
import { ACCEPTED_IMAGE_TYPES } from '@/lib/design/image'
import { cn } from '@/lib/utils'
import type { DictKey } from '@/lib/i18n/dictionaries'

/**
 * Step one: the customer's own photograph.
 *
 * The one rule here is that the photograph goes on screen immediately. It is
 * decoded, resized and published to the store before anything looks at it, so
 * the preview on the right shows the real image on the next paint. Analysis runs
 * afterwards and is never allowed to gate the view — at worst the customer sees
 * their table and a quiet line saying we are looking at it.
 *
 * The piece type sits on this step rather than getting a step of its own: it is
 * one question, it is answered from the photograph the customer just uploaded,
 * and it is what tells the dimensions step which proportions to start from.
 */

const REJECTION_COPY: Record<string, DictKey> = {
  type: 'design.upload.errorType',
  size: 'design.upload.errorSize',
  decode: 'design.upload.errorDecode',
}

export default function InspirationStep() {
  const { t, l } = useI18n()

  const design = useDesignStore((s) => s.design)
  const uploadStatus = useDesignStore((s) => s.uploadStatus)
  const uploadError = useDesignStore((s) => s.uploadError)
  const upload = useDesignStore((s) => s.upload)
  const removeImage = useDesignStore((s) => s.removeImage)
  const setPieceType = useDesignStore((s) => s.setPieceType)
  const setAdjusting = useDesignStore((s) => s.setAdjusting)

  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const hasImage = design.referenceImage !== null
  const busy = uploadStatus === 'analyzing'

  const take = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (file) void upload(file)
    },
    [upload],
  )

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    take(event.dataTransfer.files)
  }

  return (
    <div className="space-y-7">
      {/* ------------------------------------------------------------ upload */}
      <section>
        {!hasImage ? (
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'rounded-2xl border border-dashed bg-white px-6 py-10 text-center transition-colors',
              dragging ? 'border-bronze bg-bronze-wash' : 'border-sand-300',
            )}
          >
            <span
              aria-hidden
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand-100 text-bronze-deep"
            >
              {busy ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </span>

            <p className="mt-4 font-primary text-base font-semibold text-ink">
              {t('design.upload.dropTitle')}
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
              {t('design.upload.dropBody')}
            </p>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="btn-primary mt-5"
            >
              <ImagePlus className="h-4 w-4" aria-hidden />
              {t('design.upload.choose')}
            </button>

            <p className="mt-3 text-[11px] text-ink-muted">{t('design.upload.hint')}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-300 bg-white p-4">
            <div className="flex items-center gap-4">
              {/* Small confirmation thumbnail. The real preview is on the right;
                  this is only here so the controls have something to attach to. */}
              <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100">
                <img
                  src={design.referenceImage ?? undefined}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="font-primary text-sm font-semibold text-ink">
                  {t('design.upload.received')}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
                  {t(
                    uploadStatus === 'analyzing'
                      ? 'design.upload.working'
                      : uploadStatus === 'needsHelp'
                        ? 'design.upload.needsHelp'
                        : 'design.upload.ready',
                  )}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-sand-200 pt-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {t('design.upload.replace')}
              </button>
              <button
                type="button"
                onClick={() => setAdjusting(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                <Wand2 className="h-3.5 w-3.5" aria-hidden />
                {t('design.upload.markSurface')}
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-red-300 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                {t('design.upload.remove')}
              </button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          // Lets a phone offer the camera as well as the gallery.
          className="sr-only"
          aria-label={t('design.upload.choose')}
          onChange={(event) => {
            take(event.target.files)
            // Clearing lets the customer pick the same file twice in a row.
            event.target.value = ''
          }}
        />

        <AnimatePresence>
          {uploadStatus === 'error' && uploadError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {t(REJECTION_COPY[uploadError])}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Skipping is a legitimate route, not a consolation prize. */}
        {!hasImage && (
          <p className="mt-4 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-[13px] leading-relaxed text-bronze-deep">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {t('design.upload.skipNote')}
          </p>
        )}
      </section>

      {/* -------------------------------------------------------- piece type */}
      <section>
        <h3 className="eyebrow mb-1">{t('design.piece.title')}</h3>
        <p className="mb-3 text-sm text-ink-soft">{t('design.piece.body')}</p>

        <div className="flex flex-wrap gap-2">
          {PIECES.map((piece) => {
            const selected = design.pieceType === piece.id
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => setPieceType(piece.id)}
                aria-pressed={selected}
                className={cn(
                  'rounded-full border px-4 py-2.5 text-sm font-medium transition-all',
                  selected
                    ? 'border-ink bg-ink text-sand-50'
                    : 'border-sand-300 bg-white text-ink-soft hover:border-bronze hover:text-ink',
                )}
              >
                {l(piece.name)}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
