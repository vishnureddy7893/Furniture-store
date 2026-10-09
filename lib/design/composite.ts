/**
 * The live preview compositor.
 *
 * This is what makes the studio feel instant: every choice a customer makes —
 * stone, edge, finish, thickness, vein direction, base metal — is applied here,
 * locally, on a 2D canvas, in a few milliseconds. No network, no model, no key.
 * A generative model is called at most once, at the very end, by the customer,
 * on purpose.
 *
 * How the stone gets onto a photograph, and why it looks like it belongs:
 *
 *   1. The photograph is drawn as the ground truth.
 *   2. The tabletop region is clipped, and marble is painted flat inside it.
 *      Flat marble in the right shape looks like a sticker, because all of the
 *      photograph's lighting has been thrown away.
 *   3. So the photograph's own luminance — normalised so that the *average*
 *      brightness of the tabletop becomes neutral — is blended back over the
 *      marble with `overlay`. Neutral leaves the marble alone; darker areas
 *      darken it, brighter areas brighten it. The original shadows, the sheen
 *      across the top, the darker far edge: all of it returns, now wearing the
 *      new stone. This one step is the difference between a convincing preview
 *      and a paint bucket.
 *   4. The edge band, the finish and the base tint are drawn on top.
 *
 * Everything here is an approximation of a physical piece, and the module is
 * written to be honest about that rather than to hide it — see `approximations`
 * at the bottom, which is what the UI uses to tell the customer the truth.
 */

import { edgeRamp } from '@/lib/marble/geometry'
import { marbleTile, mix, rng } from '@/lib/marble/texture'
import type { EdgeId, MarbleOption, ShapeId } from '@/lib/data/configurator'
import type { FinishId, VeinId } from '@/lib/data/design'
import type { AnalysisResult, Quad } from './analysis'

/* ------------------------------------------------------------------ scratch */

/** Reused between renders: allocating canvases per frame is what makes this slow. */
const scratch = new Map<string, HTMLCanvasElement>()

function scratchCanvas(key: string, width: number, height: number): HTMLCanvasElement {
  let canvas = scratch.get(key)
  if (!canvas) {
    canvas = document.createElement('canvas')
    scratch.set(key, canvas)
  }
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  } else {
    canvas.getContext('2d')?.clearRect(0, 0, width, height)
  }
  return canvas
}

/* ------------------------------------------------------------------- source */

export interface CompositeSource {
  image: HTMLImageElement
  width: number
  height: number
  /**
   * The tabletop, as found by the analysis. This — not a polygon — is what the
   * stone is clipped to, which is why a round table gets a round top and a
   * shaped one keeps its shape.
   */
  tabletopMask: HTMLCanvasElement | null
  /** The whole piece; keeps a base recolour off the floor. */
  objectMask: HTMLCanvasElement | null
  baseRegion: { top: number; bottom: number } | null
}

function canvasFrom(data: ImageData | null): HTMLCanvasElement | null {
  if (!data) return null
  const canvas = document.createElement('canvas')
  canvas.width = data.width
  canvas.height = data.height
  canvas.getContext('2d')?.putImageData(data, 0, 0)
  return canvas
}

/** Built once per upload. Holds no per-selection state. */
export function createSource(
  image: HTMLImageElement,
  analysis: AnalysisResult,
): CompositeSource {
  return {
    image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    tabletopMask: canvasFrom(analysis.tabletopMask),
    objectMask: canvasFrom(analysis.objectMask),
    baseRegion: analysis.baseRegion,
  }
}

/**
 * Rasterises a customer-placed quad into the same kind of mask the analysis
 * produces, so the manual path and the automatic path are the same pipeline
 * from here on. The chosen outline is inscribed into the quad, which is what
 * makes "round" round even when the customer dragged a rectangle.
 */
export function maskFromQuad(
  quad: Quad,
  shape: ShapeId,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#fff'
    ctx.fill(tabletopPath(quad, shape, width, height))
  }
  return canvas
}

/* ------------------------------------------------------------------ shading */

const shadingCache = new WeakMap<HTMLImageElement, { key: string; canvas: HTMLCanvasElement }>()

function quadKey(quad: Quad): string {
  return quad.map((p) => `${p.x.toFixed(4)},${p.y.toFixed(4)}`).join(';')
}

function pointInQuad(quad: Quad, x: number, y: number): boolean {
  let inside = false
  for (let i = 0, j = 3; i < 4; j = i, i += 1) {
    const a = quad[i]
    const b = quad[j]
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

/**
 * The photograph's lighting, normalised against the average brightness of the
 * tabletop, as a greyscale image ready to blend with `overlay`.
 *
 * Cached per image and per quad: this is the only part of the pipeline that
 * reads pixels back, so it must not run on every selection. It does not depend
 * on the stone, the finish or anything else the customer clicks through.
 */
export function buildShading(source: CompositeSource, quad: Quad): HTMLCanvasElement | null {
  const key = quadKey(quad)
  const hit = shadingCache.get(source.image)
  if (hit && hit.key === key) return hit.canvas

  const { width, height } = source
  const read = scratchCanvas('shading-read', width, height)
  const rctx = read.getContext('2d', { willReadFrequently: true })
  if (!rctx) return null
  rctx.clearRect(0, 0, width, height)
  rctx.drawImage(source.image, 0, 0, width, height)

  let pixels: ImageData
  try {
    pixels = rctx.getImageData(0, 0, width, height)
  } catch {
    return null
  }

  // Average luminance inside the tabletop, sampled on a grid — a full pass adds
  // nothing to an average.
  let sum = 0
  let count = 0
  const stepX = Math.max(1, Math.floor(width / 120))
  const stepY = Math.max(1, Math.floor(height / 120))
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      if (!pointInQuad(quad, x / width, y / height)) continue
      const i = (y * width + x) * 4
      sum += 0.2126 * pixels.data[i] + 0.7152 * pixels.data[i + 1] + 0.0722 * pixels.data[i + 2]
      count += 1
    }
  }
  const mean = count > 8 ? sum / count : 128

  const out = new ImageData(width, height)
  for (let p = 0, i = 0; i < pixels.data.length; i += 4, p += 1) {
    const lum =
      0.2126 * pixels.data[i] + 0.7152 * pixels.data[i + 1] + 0.0722 * pixels.data[i + 2]
    // 0.5 is "leave the marble as it is"; deviation from the tabletop's own
    // average becomes shadow or highlight.
    const s = 0.5 * (lum / (mean || 128))
    const v = Math.max(16, Math.min(239, Math.round(s * 255)))
    out.data[i] = v
    out.data[i + 1] = v
    out.data[i + 2] = v
    out.data[i + 3] = 255
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.putImageData(out, 0, 0)
  shadingCache.set(source.image, { key, canvas })
  return canvas
}

/* --------------------------------------------------------------------- path */

type Pt = { x: number; y: number }

const BEZIER_K = 0.5523

function lerp(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/**
 * The tabletop outline in device pixels.
 *
 * The quad is the tabletop as found in the photograph; the chosen outline is
 * then inscribed into it, so picking "round" visibly rounds the top the
 * customer uploaded instead of only changing a label.
 */
export function tabletopPath(quad: Quad, shape: ShapeId, w: number, h: number): Path2D {
  const p = quad.map((q) => ({ x: q.x * w, y: q.y * h })) as [Pt, Pt, Pt, Pt]
  const path = new Path2D()

  if (shape === 'round' || shape === 'oval') {
    // An oval inscribed in the quad: the four edge midpoints are its cardinal
    // points, with control points pulled towards the corners. Holds up on a
    // trapezoid, which a plain ellipse would not.
    const m = [
      lerp(p[0], p[1], 0.5),
      lerp(p[1], p[2], 0.5),
      lerp(p[2], p[3], 0.5),
      lerp(p[3], p[0], 0.5),
    ]
    const corner = [p[1], p[2], p[3], p[0]]
    path.moveTo(m[0].x, m[0].y)
    for (let i = 0; i < 4; i += 1) {
      const from = m[i]
      const to = m[(i + 1) % 4]
      const c = corner[i]
      path.bezierCurveTo(
        from.x + (c.x - from.x) * BEZIER_K,
        from.y + (c.y - from.y) * BEZIER_K,
        to.x + (c.x - to.x) * BEZIER_K,
        to.y + (c.y - to.y) * BEZIER_K,
        to.x,
        to.y,
      )
    }
    path.closePath()
    return path
  }

  const radius =
    shape === 'organic'
      ? 0.34
      : shape === 'soft'
        ? 0.16
        : shape === 'custom'
          ? 0.05
          : 0

  if (radius <= 0.001) {
    path.moveTo(p[0].x, p[0].y)
    for (let i = 1; i < 4; i += 1) path.lineTo(p[i].x, p[i].y)
    path.closePath()
    return path
  }

  // Rounded corners, expressed as a fraction of each adjacent edge so a
  // trapezoid rounds evenly.
  for (let i = 0; i < 4; i += 1) {
    const prev = p[(i + 3) % 4]
    const cur = p[i]
    const next = p[(i + 1) % 4]
    const start = lerp(cur, prev, radius)
    const end = lerp(cur, next, radius)
    if (i === 0) path.moveTo(start.x, start.y)
    else path.lineTo(start.x, start.y)
    path.quadraticCurveTo(cur.x, cur.y, end.x, end.y)
  }
  path.closePath()
  return path
}

/* ------------------------------------------------------------------ texture */

function quadBounds(quad: Quad, w: number, h: number) {
  const xs = quad.map((q) => q.x * w)
  const ys = quad.map((q) => q.y * h)
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  }
}

/**
 * Paints stone across the clipped tabletop.
 *
 * The marble tile is stochastic, so it needs no true perspective transform —
 * a rotation matching the front edge plus a scale that reads at furniture
 * size is indistinguishable from one, and costs nothing. Vein direction is
 * expressed as extra rotation, scale, or a mirrored second pass.
 */
function paintStone(
  ctx: CanvasRenderingContext2D,
  quad: Quad,
  marble: MarbleOption,
  vein: VeinId,
  w: number,
  h: number,
) {
  const tile = marbleTile(marble)
  const b = quadBounds(quad, w, h)
  const front = { x: (quad[2].x - quad[3].x) * w, y: (quad[2].y - quad[3].y) * h }
  const baseAngle = Math.atan2(front.y, front.x)

  // Wide enough that a slab reads as a slab rather than as wallpaper.
  const coverage = Math.hypot(b.width, b.height) * 1.25
  let scale = coverage / tile.width
  let angle = baseAngle

  if (vein === 'vertical') angle = baseAngle + Math.PI / 2
  if (vein === 'horizontal') angle = baseAngle
  if (vein === 'continuous') scale *= 1.9

  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  const size = tile.width * scale

  const drawField = (mirror: boolean) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    if (mirror) ctx.scale(-1, 1)
    ctx.imageSmoothingQuality = 'high'
    const reach = Math.ceil(coverage / size) + 1
    for (let ty = -reach; ty <= reach; ty += 1) {
      for (let tx = -reach; tx <= reach; tx += 1) {
        ctx.drawImage(tile, tx * size - size / 2, ty * size - size / 2, size, size)
      }
    }
    ctx.restore()
  }

  if (vein === 'bookmatch') {
    // Two halves of the top, mirrored about the centre line.
    ctx.save()
    ctx.beginPath()
    ctx.rect(b.x - 4, b.y - 4, b.width / 2 + 4, b.height + 8)
    ctx.clip()
    drawField(false)
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.rect(cx, b.y - 4, b.width / 2 + 4, b.height + 8)
    ctx.clip()
    drawField(true)
    ctx.restore()
    return
  }

  drawField(false)
}

/* ------------------------------------------------------------------- finish */

let noiseTile: HTMLCanvasElement | null = null

function grainTile(): HTMLCanvasElement {
  if (noiseTile) return noiseTile
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const data = ctx.createImageData(size, size)
    const rand = rng(9001)
    for (let i = 0; i < size * size; i += 1) {
      // Clustered rather than per-pixel noise: leather reads as a texture, not
      // as sensor grain.
      const v = 128 + (rand() - 0.5) * 190
      data.data[i * 4] = v
      data.data[i * 4 + 1] = v
      data.data[i * 4 + 2] = v
      data.data[i * 4 + 3] = 255
    }
    ctx.putImageData(data, 0, 0)
  }
  noiseTile = canvas
  return canvas
}

function paintFinish(
  ctx: CanvasRenderingContext2D,
  quad: Quad,
  finish: FinishId,
  w: number,
  h: number,
) {
  const b = quadBounds(quad, w, h)

  switch (finish) {
    case 'polished': {
      // A broad sweep of reflected light across the top.
      const g = ctx.createLinearGradient(b.x, b.y, b.x + b.width, b.y + b.height)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(0.42, 'rgba(255,255,255,0.26)')
      g.addColorStop(0.58, 'rgba(255,255,255,0.1)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(b.x, b.y, b.width, b.height)
      break
    }
    case 'honed': {
      // Pull the contrast down towards neutral: matte stone scatters light.
      ctx.fillStyle = 'rgba(140,138,134,0.16)'
      ctx.fillRect(b.x, b.y, b.width, b.height)
      break
    }
    case 'leathered': {
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = 0.3
      const tile = grainTile()
      const size = Math.max(48, Math.round(b.width / 9))
      for (let y = b.y; y < b.y + b.height; y += size) {
        for (let x = b.x; x < b.x + b.width; x += size) {
          ctx.drawImage(tile, x, y, size, size)
        }
      }
      ctx.restore()
      ctx.fillStyle = 'rgba(120,116,110,0.1)'
      ctx.fillRect(b.x, b.y, b.width, b.height)
      break
    }
    case 'brushed': {
      // Fine directional lines along the length of the top.
      const angle = Math.atan2(
        (quad[2].y - quad[3].y) * h,
        (quad[2].x - quad[3].x) * w,
      )
      ctx.save()
      ctx.translate(b.x + b.width / 2, b.y + b.height / 2)
      ctx.rotate(angle)
      ctx.globalAlpha = 0.16
      const span = Math.hypot(b.width, b.height)
      ctx.lineWidth = 1
      for (let y = -span / 2; y < span / 2; y += 3) {
        ctx.strokeStyle = y % 6 < 3 ? 'rgba(255,255,255,0.55)' : 'rgba(60,56,52,0.4)'
        ctx.beginPath()
        ctx.moveTo(-span / 2, y)
        ctx.lineTo(span / 2, y)
        ctx.stroke()
      }
      ctx.restore()
      ctx.fillStyle = 'rgba(134,131,126,0.1)'
      ctx.fillRect(b.x, b.y, b.width, b.height)
      break
    }
  }
}

/* --------------------------------------------------------------------- edge */

/**
 * Replaces the front lip of the photographed top with the chosen profile.
 *
 * The band is walked along the *bottom silhouette of the mask*, column by
 * column, so it follows a curve on a round table and a straight line on a
 * rectangular one. A single straight band drawn between two corners would sit
 * off the table everywhere except the middle.
 *
 * Its height comes from real units: the widest span of the mask is the
 * configured length, which gives pixels-per-centimetre, which gives the height
 * of a 20 / 30 / 40 mm slab in this photograph.
 */
function paintEdge(
  ctx: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  marble: MarbleOption,
  edge: EdgeId,
  thicknessMm: number,
  lengthCm: number,
  w: number,
  h: number,
): void {
  const bottom = bottomSilhouette(mask, w, h)
  if (!bottom || lengthCm <= 0) return

  const pxPerCm = bottom.widestSpan / lengthCm
  const thicknessPx = Math.max(2, Math.min(h * 0.14, (thicknessMm / 10) * pxPerCm))
  const steps = 14
  const ramp = edgeRamp(edge, marble.id, marble.palette, steps)

  const band = scratchCanvas('edge', w, h)
  const bctx = band.getContext('2d')
  if (!bctx) return
  bctx.clearRect(0, 0, w, h)

  // One thin strip per ramp step, following the silhouette.
  for (let i = 0; i < steps; i += 1) {
    const t0 = (i / steps) * thicknessPx
    const t1 = ((i + 1) / steps) * thicknessPx + 0.8
    bctx.fillStyle = ramp[i]
    bctx.beginPath()
    let started = false
    for (const point of bottom.points) {
      if (!started) {
        bctx.moveTo(point.x, point.y + t0)
        started = true
      } else {
        bctx.lineTo(point.x, point.y + t0)
      }
    }
    for (let k = bottom.points.length - 1; k >= 0; k -= 1) {
      bctx.lineTo(bottom.points[k].x, bottom.points[k].y + t1)
    }
    bctx.closePath()
    bctx.fill()
  }

  // The lit top arris.
  bctx.strokeStyle = mix(marble.palette.light, '#FFFFFF', 0.4)
  bctx.globalAlpha = 0.45
  bctx.lineWidth = Math.max(1, thicknessPx * 0.08)
  bctx.beginPath()
  bottom.points.forEach((point, i) =>
    i === 0 ? bctx.moveTo(point.x, point.y) : bctx.lineTo(point.x, point.y),
  )
  bctx.stroke()

  ctx.drawImage(band, 0, 0)
}

/**
 * The lowest set pixel in each column of the mask, sampled and smoothed.
 *
 * Columns where the silhouette jumps (the mask ending against a chair, say) are
 * dropped, so the band does not shoot down the image.
 */
function bottomSilhouette(
  mask: HTMLCanvasElement,
  w: number,
  h: number,
): { points: { x: number; y: number }[]; widestSpan: number } | null {
  const mw = mask.width
  const mh = mask.height
  const ctx = mask.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null

  let data: ImageData
  try {
    data = ctx.getImageData(0, 0, mw, mh)
  } catch {
    return null
  }

  const scaleX = w / mw
  const scaleY = h / mh
  const raw: { x: number; y: number }[] = []
  let minX = Infinity
  let maxX = -Infinity

  for (let col = 0; col < mw; col += 1) {
    let lowest = -1
    for (let row = mh - 1; row >= 0; row -= 1) {
      if (data.data[(row * mw + col) * 4 + 3] > 127) {
        lowest = row
        break
      }
    }
    if (lowest < 0) continue
    if (col < minX) minX = col
    if (col > maxX) maxX = col
    raw.push({ x: (col + 0.5) * scaleX, y: (lowest + 1) * scaleY })
  }

  if (raw.length < 4) return null

  // Light smoothing: the mask is low resolution, and an unsmoothed silhouette
  // reads as a staircase once it is scaled up.
  const points = raw.map((point, i) => {
    let sum = 0
    let count = 0
    for (let k = -2; k <= 2; k += 1) {
      const other = raw[i + k]
      if (other) {
        sum += other.y
        count += 1
      }
    }
    return { x: point.x, y: sum / count }
  })

  return { points, widestSpan: (maxX - minX + 1) * scaleX }
}

/* --------------------------------------------------------------------- base */

/**
 * Recolours the base of the photographed piece.
 *
 * `color` composition keeps the photograph's own luminance and takes only hue
 * and saturation from the new metal, so highlights and shadows on the legs
 * survive. It is a recolour, not a replacement: the *shape* of the base stays
 * whatever the customer photographed. See `approximations`.
 */
function paintBase(
  ctx: CanvasRenderingContext2D,
  tint: string,
  region: { top: number; bottom: number },
  mask: HTMLCanvasElement | null,
  w: number,
  h: number,
) {
  const top = region.top * h
  const height = Math.max(4, (region.bottom - region.top) * h)

  const layer = scratchCanvas('base', w, h)
  const lctx = layer.getContext('2d')
  if (!lctx) return
  lctx.clearRect(0, 0, w, h)
  lctx.fillStyle = tint
  lctx.fillRect(0, top, w, height)

  if (mask) {
    lctx.globalCompositeOperation = 'destination-in'
    lctx.drawImage(mask, 0, 0, w, h)
    lctx.globalCompositeOperation = 'source-over'
  }

  ctx.save()
  ctx.globalCompositeOperation = 'color'
  ctx.globalAlpha = 0.88
  ctx.drawImage(layer, 0, 0)
  ctx.restore()

  // A touch of the metal's own value, so brass does not read as tinted black.
  ctx.save()
  ctx.globalCompositeOperation = 'soft-light'
  ctx.globalAlpha = 0.45
  ctx.drawImage(layer, 0, 0)
  ctx.restore()
}

/* ------------------------------------------------------------------- render */

export interface CompositeInput {
  source: CompositeSource
  shading: HTMLCanvasElement | null
  /**
   * The tabletop, as an alpha mask. Either the region the analysis found or a
   * customer-placed quad rasterised by `maskFromQuad` — from here on they are
   * the same thing, which is why there is only one drawing path.
   */
  mask: HTMLCanvasElement
  /** Corners of the mask, used only to orient the stone and size the texture. */
  quad: Quad
  marble: MarbleOption
  finish: FinishId
  edge: EdgeId
  /** Millimetres. */
  thickness: number
  /** Centimetres — used to turn the thickness into pixels. */
  lengthCm: number
  vein: VeinId
  /** `null` keeps the photographed base untouched. */
  baseTint: string | null
}

/**
 * Draws one complete preview. Synchronous and allocation-light: safe to call
 * from a rAF callback on every change.
 *
 * The stone is built on its own layer and then cut to the mask with
 * `destination-in`. Nothing outside the mask is ever written to, so the wall,
 * the floor, the vase and the legs come through from the photograph untouched —
 * by construction, not by being careful.
 */
export function renderComposite(canvas: HTMLCanvasElement, input: CompositeInput): void {
  const { source, mask, quad, marble, finish, edge, vein, baseTint } = input
  const w = source.width
  const h = source.height
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(source.image, 0, 0, w, h)

  /* ----------------------------------------------------------- the stone */

  const layer = scratchCanvas('stone', w, h)
  const lctx = layer.getContext('2d')
  if (!lctx) return
  lctx.setTransform(1, 0, 0, 1, 0, 0)
  lctx.clearRect(0, 0, w, h)

  paintStone(lctx, quad, marble, vein, w, h)

  // The photograph's own light, put back over the stone.
  if (input.shading) {
    lctx.globalCompositeOperation = 'overlay'
    lctx.drawImage(input.shading, 0, 0, w, h)
    lctx.globalCompositeOperation = 'source-over'
  }

  paintFinish(lctx, quad, finish, w, h)

  // Cut the whole layer to the tabletop. The mask is low resolution by design;
  // drawing it scaled with smoothing gives a soft, anti-aliased edge, which is
  // what a real object boundary looks like.
  lctx.globalCompositeOperation = 'destination-in'
  lctx.imageSmoothingEnabled = true
  lctx.imageSmoothingQuality = 'high'
  lctx.drawImage(mask, 0, 0, w, h)
  lctx.globalCompositeOperation = 'source-over'

  ctx.drawImage(layer, 0, 0)

  /* ------------------------------------------------------------ the edge */

  paintEdge(ctx, mask, marble, edge, input.thickness, input.lengthCm, w, h)

  /* ------------------------------------------------------------ the base */

  if (baseTint && source.baseRegion) {
    paintBase(ctx, baseTint, source.baseRegion, source.objectMask, w, h)
  }
}

/* ------------------------------------------------------- honesty about this */

export type ApproximationKey = 'edge' | 'base' | 'shape' | 'dimensions'

/**
 * Which of the customer's choices the live preview can only approximate on a
 * photograph, given what was actually detected. The UI turns these into one
 * quiet line of copy — never a warning, never a confidence score — and the
 * final AI render is what resolves them.
 */
export function approximations(input: {
  hasPhoto: boolean
  edge: EdgeId
  baseType: string
  shape: ShapeId
  confident: boolean
}): ApproximationKey[] {
  if (!input.hasPhoto) return []
  const keys: ApproximationKey[] = ['dimensions']
  if (input.edge !== 'straight') keys.push('edge')
  if (input.baseType !== 'original') keys.push('base')
  if (!input.confident) keys.push('shape')
  return keys
}
