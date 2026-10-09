/**
 * Browser image plumbing for the design studio.
 *
 * Two sizes are kept for every upload, on purpose:
 *   - a *working* copy, large enough to composite against (1400px longest edge),
 *     held only in memory;
 *   - a *portable* copy (900px, JPEG), which is what travels into the saved
 *     quote request and to the AI provider.
 *
 * The original file is never held open: it is decoded once, resized, and the
 * object URL revoked. That keeps memory flat when a customer tries six photos.
 */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024

/** Longest edge of the copy the compositor draws from. */
const WORKING_EDGE = 1400
/** Longest edge of the copy that is persisted and sent to an AI provider. */
const PORTABLE_EDGE = 900

export interface PreparedImage {
  /** Data URL of the working copy — safe to keep across re-renders. */
  working: string
  /** Smaller JPEG data URL for storage and for the AI request. */
  portable: string
  width: number
  height: number
}

export type UploadRejection = 'type' | 'size' | 'decode'

/** Decodes a data/object URL into an image element. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode'))
    img.src = src
  })
}

function fit(width: number, height: number, edge: number) {
  const scale = Math.min(1, edge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function resizeToDataUrl(
  img: HTMLImageElement,
  edge: number,
  type: string,
  quality: number,
): { url: string; width: number; height: number } {
  const { width, height } = fit(img.naturalWidth, img.naturalHeight, edge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('decode')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)
  return { url: canvas.toDataURL(type, quality), width, height }
}

/**
 * Validates and prepares one uploaded file.
 *
 * Rejections are returned rather than thrown so the caller can show the right
 * message; nothing here touches the network.
 */
export async function prepareUpload(
  file: File,
): Promise<{ ok: true; image: PreparedImage } | { ok: false; reason: UploadRejection }> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'type' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'size' }
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    // PNG screenshots of furniture are usually photographic; JPEG at high
    // quality is a far smaller working copy with no visible difference.
    const working = resizeToDataUrl(img, WORKING_EDGE, 'image/jpeg', 0.9)
    const portable = resizeToDataUrl(img, PORTABLE_EDGE, 'image/jpeg', 0.78)
    return {
      ok: true,
      image: {
        working: working.url,
        portable: portable.url,
        width: working.width,
        height: working.height,
      },
    }
  } catch {
    return { ok: false, reason: 'decode' }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

/** Strips the `data:image/...;base64,` prefix, for API payloads. */
export function dataUrlToBase64(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl)
  if (!match) return null
  return { mediaType: match[1], data: match[2] }
}
