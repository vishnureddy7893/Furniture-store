/**
 * Shared marble texture maths.
 *
 * Both renderers in the app are driven from here, so a stone looks the same
 * wherever it appears:
 *   - `components/marble/MarbleDefs` turns this into SVG `<pattern>` content
 *     (product imagery, the studio preview, swatches);
 *   - `paintMarbleTile` below paints the same stone onto a 2D canvas, which is
 *     what the photo compositor needs in order to retexture an uploaded top.
 *
 * Everything is derived from a per-stone integer seed (never `Math.random`), so
 * server and client render identically and a stone never shuffles between
 * renders.
 */

import type { MarbleOption } from '@/lib/data/configurator'

/* ------------------------------------------------------------ colour maths */

export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ]
}

const clamp255 = (n: number) => Math.max(0, Math.min(255, Math.round(n)))

const mixCache = new Map<string, string>()

/**
 * Blend two hex colours; `amount` 0 gives a, 1 gives b. Memoised: the edge
 * ramps ask for the same handful of blends on every scene that is drawn.
 */
export function mix(a: string, b: string, amount: number): string {
  const t = Math.max(0, Math.min(1, amount))
  const key = `${a}|${b}|${t.toFixed(4)}`
  const hit = mixCache.get(key)
  if (hit) return hit

  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const to = (x: number, y: number) =>
    clamp255(x + (y - x) * t)
      .toString(16)
      .padStart(2, '0')
  const out = `#${to(r1, r2)}${to(g1, g2)}${to(b1, b2)}`
  mixCache.set(key, out)
  return out
}

/* --------------------------------------------------------------- vein maths */

/** Deterministic pseudo-random sequence (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One quadratic segment of a vein. */
interface VeinSegment {
  cx: number
  cy: number
  x: number
  y: number
}

export interface Vein {
  /** Where the vein enters the tile (off-canvas on the left). */
  x0: number
  y0: number
  segments: VeinSegment[]
  width: number
  opacity: number
  /** Hairline veins use the softer of the two vein colours. */
  soft: boolean
}

/**
 * A set of gently drifting polylines across the tile. The SVG renderer warps
 * these with a turbulence filter; the canvas renderer warps them with value
 * noise. Either way the smooth guides become organic stone veining.
 */
function buildVeins(seed: number, w: number, h: number, count: number): Vein[] {
  const rand = rng(seed)
  const veins: Vein[] = []

  for (let i = 0; i < count; i += 1) {
    // Veins run broadly on a diagonal, entering and leaving off-canvas.
    const startY = (rand() * 1.6 - 0.3) * h
    const drift = (rand() * 0.9 - 0.45) * h
    const bow = (rand() * 0.5 - 0.25) * h
    const parts = 4
    const segments: VeinSegment[] = []

    for (let s = 1; s <= parts; s += 1) {
      const p = s / parts
      const q = p - 0.5 / parts
      segments.push({
        cx: (-0.15 + 1.3 * q) * w,
        cy: startY + drift * q + Math.sin(q * Math.PI) * bow + (rand() * 0.12 - 0.06) * h,
        x: (-0.15 + 1.3 * p) * w,
        y: startY + drift * p + Math.sin(p * Math.PI) * bow,
      })
    }

    const major = i % 3 === 0
    veins.push({
      x0: -0.15 * w,
      y0: startY,
      segments,
      width: major ? 3 + rand() * 5 : 0.6 + rand() * 1.8,
      opacity: major ? 0.55 + rand() * 0.35 : 0.25 + rand() * 0.3,
      soft: !major,
    })
  }

  return veins
}

const veinCache = new Map<string, Vein[]>()

export function veinsFor(seed: number, w: number, h: number, count: number): Vein[] {
  const key = `${seed}:${w}:${h}:${count}`
  let veins = veinCache.get(key)
  if (!veins) {
    veins = buildVeins(seed, w, h, count)
    veinCache.set(key, veins)
  }
  return veins
}

/** SVG path data for one vein. */
export function veinPath(v: Vein): string {
  let d = `M ${v.x0.toFixed(1)} ${v.y0.toFixed(1)}`
  for (const s of v.segments) {
    d += ` Q ${s.cx.toFixed(1)} ${s.cy.toFixed(1)} ${s.x.toFixed(1)} ${s.y.toFixed(1)}`
  }
  return d
}

/* ------------------------------------------------------------- canvas tile */

/** Smooth 2D value noise, seeded: the canvas stand-in for feTurbulence. */
function valueNoise(seed: number) {
  const rand = rng(seed)
  const size = 64
  const grid = new Float32Array(size * size)
  for (let i = 0; i < grid.length; i += 1) grid[i] = rand() * 2 - 1

  const at = (x: number, y: number) => grid[(y & (size - 1)) * size + (x & (size - 1))]
  const smooth = (t: number) => t * t * (3 - 2 * t)

  return (x: number, y: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const tx = smooth(x - xi)
    const ty = smooth(y - yi)
    const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * tx
    const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * tx
    return a + (b - a) * ty
  }
}

const GRAIN_SIZE = 96
let grainCanvasCache: HTMLCanvasElement | null = null

/** One shared scratch canvas for the grain pass. */
function grainScratch(): HTMLCanvasElement {
  if (!grainCanvasCache) {
    grainCanvasCache = document.createElement('canvas')
    grainCanvasCache.width = GRAIN_SIZE
    grainCanvasCache.height = GRAIN_SIZE
  }
  return grainCanvasCache
}

/**
 * Paints one marble tile onto a canvas context.
 *
 * Drawn rather than rasterised from the SVG pattern on purpose: an `<img>` of
 * an SVG that uses filters rasterises inconsistently across browsers, and
 * reading the result back (needed to serialise the preview when the design is
 * submitted) is not reliably permitted. Plain canvas drawing has neither
 * problem, and stays visually in step with the SVG because both read the same
 * palette and the same vein geometry.
 */
export function paintMarbleTile(
  ctx: CanvasRenderingContext2D,
  marble: MarbleOption,
  size: number,
): void {
  const { palette, seed, veinOpacity } = marble
  const noise = valueNoise(seed)
  const warp = size * 0.055

  // Body: a soft diagonal gradient between the three stone tones.
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, palette.light)
  grad.addColorStop(0.45, palette.mid)
  grad.addColorStop(0.78, mix(palette.mid, palette.light, 0.55))
  grad.addColorStop(1, palette.mid)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Broad cloudy mottling: a handful of large soft blobs.
  const rand = rng(seed + 3)
  const mottle = mix(palette.mid, palette.deep, 0.5)
  ctx.save()
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 9; i += 1) {
    const cx = rand() * size
    const cy = rand() * size
    const r = size * (0.18 + rand() * 0.3)
    const blob = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    blob.addColorStop(0, mottle)
    blob.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = blob
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }
  ctx.restore()

  // Veining. Each quadratic guide is subdivided and displaced by the noise
  // field, which is what turns a smooth curve into stone.
  const veins = veinsFor(seed, size, size, 26)
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (const v of veins) {
    const pts: [number, number][] = []
    let px = v.x0
    let py = v.y0
    pts.push([px, py])

    for (const s of v.segments) {
      const steps = 14
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps
        const mt = 1 - t
        const x = mt * mt * px + 2 * mt * t * s.cx + t * t * s.x
        const y = mt * mt * py + 2 * mt * t * s.cy + t * t * s.y
        const n = 12 / size
        pts.push([x + noise(x * n, y * n) * warp, y + noise(x * n + 41, y * n + 17) * warp])
      }
      px = s.x
      py = s.y
    }

    // Two passes: a diffuse halo, then the vein core.
    for (const pass of [0, 1]) {
      ctx.beginPath()
      ctx.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1])
      ctx.strokeStyle = v.soft ? palette.veinSoft : palette.vein
      ctx.globalAlpha = veinOpacity * v.opacity * (pass === 0 ? 0.28 : 1)
      ctx.lineWidth = (v.width / 512) * size * (pass === 0 ? 4.5 : 1)
      ctx.stroke()
    }
  }
  ctx.restore()

  // Fine crystalline grain, tiled from a small noise bitmap. The bitmap is
  // repainted per stone but the canvas holding it is shared: it is consumed
  // immediately and never referenced again, so allocating a new one per stone
  // would be pure churn.
  const grainCanvas = grainScratch()
  const grainSize = grainCanvas.width
  const grainCtx = grainCanvas.getContext('2d')
  if (grainCtx) {
    const grain = grainCtx.createImageData(grainSize, grainSize)
    const gr = rng(seed + 7)
    for (let i = 0; i < grainSize * grainSize; i += 1) {
      const v = 128 + (gr() - 0.5) * 150
      grain.data[i * 4] = v
      grain.data[i * 4 + 1] = v
      grain.data[i * 4 + 2] = v
      grain.data[i * 4 + 3] = 46
    }
    grainCtx.putImageData(grain, 0, 0)
  }

  ctx.save()
  ctx.globalCompositeOperation = 'overlay'
  for (let y = 0; y < size; y += grainSize) {
    for (let x = 0; x < size; x += grainSize) ctx.drawImage(grainCanvas, x, y)
  }
  ctx.restore()
}

const tileCache = new Map<string, HTMLCanvasElement>()

/**
 * A cached canvas tile for one stone. Built once per stone and reused for
 * every draw, so clicking through the catalogue never repaints a tile twice.
 */
export function marbleTile(marble: MarbleOption, size = 512): HTMLCanvasElement {
  const key = `${marble.id}:${size}`
  const hit = tileCache.get(key)
  if (hit) return hit

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) paintMarbleTile(ctx, marble, size)
  tileCache.set(key, canvas)
  return canvas
}
