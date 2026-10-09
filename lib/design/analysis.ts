/**
 * Finding the tabletop in a photograph.
 *
 * The previous implementation subtracted the image border colour and called
 * whatever remained "the piece". That works on a studio cut-out and fails badly
 * on a real interior photograph, where "everything that is not the border" is
 * most of the room — which is how a tabletop mask ended up as a diagonal band
 * across a dining room.
 *
 * This one segments the image properly and then asks which segment looks like a
 * tabletop:
 *
 *   1. Downscale and blur, so timber grain and fabric weave stop being edges.
 *   2. Grow regions over colour, in a space where brightness counts for less
 *      than hue — a tabletop runs from lit to shadowed across its width and must
 *      stay one region.
 *   3. Merge the specks back into their nearest neighbour.
 *   4. Score every region on the things that make a tabletop a tabletop: broad,
 *      horizontally elongated, solid, one unbroken run per row, sitting in the
 *      middle band of the frame, not touching the floor or the ceiling.
 *   5. Return the winning region *as a mask*, not as a rectangle. The mask is
 *      the true outline, so a round table gets a round mask for free.
 *
 * The score of the winner, and its margin over the runner-up, becomes the
 * confidence. Below `CONFIDENCE_FLOOR` nothing is painted at all and the
 * customer is asked to place the corners — the only honest thing to do, and far
 * better than painting marble across a wall.
 *
 * No dependencies, no service, no key.
 */

import { loadImage } from './image'

/** A point in normalised image space: 0–1 on both axes. */
export interface NormPoint {
  x: number
  y: number
}

/** Four corners, always in this order: back-left, back-right, front-right, front-left. */
export type Quad = [NormPoint, NormPoint, NormPoint, NormPoint]

export interface AnalysisResult {
  /**
   * The tabletop itself, as an alpha mask at analysis resolution. This is the
   * authoritative shape — whatever outline the table actually has. `null` when
   * nothing convincing was found.
   */
  tabletopMask: ImageData | null
  /**
   * The tabletop reduced to four corners. Used to orient the stone texture and
   * to seed the manual adjuster; it is never what gets clipped when a mask
   * exists.
   */
  tabletopCorners: Quad
  /** The whole piece — tabletop plus whatever sits under it. */
  objectMask: ImageData | null
  /** The base and legs alone: the piece minus the tabletop. */
  baseMask: ImageData | null
  /** Everything that is not the piece. */
  backgroundMask: ImageData | null
  /** Where the base sits, as a normalised y range below the tabletop. */
  baseRegion: { top: number; bottom: number } | null
  /** 0–1. Below `CONFIDENCE_FLOOR` the studio paints nothing and asks for help. */
  confidence: number
  /** How the mask was arrived at. */
  source: 'segmentation' | 'none'
  /** Diagnostic keys, for the console only — never rendered. */
  warnings: string[]
}

export interface ImageAnalysisProvider {
  readonly id: string
  analyze(imageDataUrl: string): Promise<AnalysisResult>
}

/**
 * Under this, the studio shows the photograph untouched and offers the corner
 * adjuster. Set so a clean table photograph passes and a busy room does not.
 */
export const CONFIDENCE_FLOOR = 0.55

/** Segmentation runs on a small copy: this is shape-finding, not image quality. */
const ANALYSIS_WIDTH = 320

/* ------------------------------------------------------------------ sampling */

interface Sampled {
  width: number
  height: number
  /** Blurred YCbCr, planar. Y is weighted down when distances are measured. */
  y: Float32Array
  cb: Float32Array
  cr: Float32Array
  /** Per-pixel gradient magnitude, used to refuse to grow across a real edge. */
  edge: Float32Array
}

function blur(src: Float32Array, width: number, height: number, passes = 1): Float32Array {
  let current = src
  for (let pass = 0; pass < passes; pass += 1) {
    const out = new Float32Array(current.length)
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        let sum = 0
        let count = 0
        for (let dy = -1; dy <= 1; dy += 1) {
          const ny = row + dy
          if (ny < 0 || ny >= height) continue
          for (let dx = -1; dx <= 1; dx += 1) {
            const nx = col + dx
            if (nx < 0 || nx >= width) continue
            sum += current[ny * width + nx]
            count += 1
          }
        }
        out[row * width + col] = sum / count
      }
    }
    current = out
  }
  return current
}

function sample(img: HTMLImageElement): Sampled | null {
  const width = ANALYSIS_WIDTH
  const height = Math.max(
    1,
    Math.round((img.naturalHeight / img.naturalWidth) * ANALYSIS_WIDTH),
  )
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  let raw: ImageData
  try {
    raw = ctx.getImageData(0, 0, width, height)
  } catch {
    return null
  }

  const n = width * height
  const y = new Float32Array(n)
  const cb = new Float32Array(n)
  const cr = new Float32Array(n)
  for (let p = 0, i = 0; p < n; p += 1, i += 4) {
    const r = raw.data[i]
    const g = raw.data[i + 1]
    const b = raw.data[i + 2]
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    y[p] = luma
    cb[p] = b - luma
    cr[p] = r - luma
  }

  // Blurring twice is what lets region growing ignore timber grain, rug pile and
  // fabric weave. But edges are found on the *once*-blurred signal: every extra
  // pass widens a boundary into a ramp, and every pixel of that ramp is a pixel
  // the edge guard withholds from the mask — which shows up as a rim of the
  // original surface around the new stone.
  const y1 = blur(y, width, height)
  const cb1 = blur(cb, width, height)
  const cr1 = blur(cr, width, height)
  return {
    width,
    height,
    y: blur(y1, width, height),
    cb: blur(cb1, width, height),
    cr: blur(cr1, width, height),
    edge: gradient(y1, cb1, cr1, width, height),
  }
}

/**
 * Gradient magnitude, per pixel.
 *
 * Blurring is what lets region growing ignore wood grain, but it also turns
 * every real boundary into a ramp — and a ramp is precisely what a region-growing
 * pass will happily walk down, which is how a dark leg gets absorbed into the
 * dark top above it. Colour thresholds alone cannot see the difference, because
 * every individual step along the ramp is small.
 *
 * So boundaries are detected before they are crossed, not after.
 */
function gradient(
  y: Float32Array,
  cb: Float32Array,
  cr: Float32Array,
  width: number,
  height: number,
): Float32Array {
  const out = new Float32Array(width * height)
  const at = (p: number, q: number) => {
    const dy = y[p] - y[q]
    const dcb = cb[p] - cb[q]
    const dcr = cr[p] - cr[q]
    return LUMA_WEIGHT * dy * dy + dcb * dcb + dcr * dcr
  }

  for (let row = 1; row < height - 1; row += 1) {
    for (let col = 1; col < width - 1; col += 1) {
      const p = row * width + col
      out[p] = Math.sqrt(
        Math.max(at(p + 1, p - 1), at(p + width, p - width)),
      )
    }
  }
  return out
}

/* -------------------------------------------------------------- segmentation */

/**
 * Brightness counts for less than colour, so a lit and a shaded stretch of the
 * same oak top stay one surface — but not so much less that a dark leg reads as
 * the same material as the top above it.
 */
const LUMA_WEIGHT = 0.45
/** Between neighbouring pixels: what it takes to call something an edge. */
const LOCAL_TOLERANCE = 26
/**
 * Between a pixel and the running mean of the region it would join.
 *
 * This is the one that matters. A tabletop, its apron and its legs form a smooth
 * ramp of browns, and each step of that ramp passes the local test — so without
 * a limit measured against the region as a whole, the top grows straight down
 * the legs and takes the whole table with it.
 */
const GLOBAL_TOLERANCE = 30
/**
 * A pixel whose gradient exceeds this sits on a boundary between two things, and
 * no region grows through it. Comfortably above the grain and weave left by the
 * blur, comfortably below the step from a tabletop to the leg beneath it.
 */
const EDGE_LIMIT = 11

interface Region {
  id: number
  area: number
  x1: number
  y1: number
  x2: number
  y2: number
  sumX: number
  sumRow: number
  meanY: number
  meanCb: number
  meanCr: number
}

interface Segmentation {
  labels: Int32Array
  regions: Map<number, Region>
}

function segment(s: Sampled): Segmentation {
  const { width, height, y, cb, cr } = s
  const n = width * height
  const labels = new Int32Array(n).fill(-1)
  const regions = new Map<number, Region>()
  const stack = new Int32Array(n)

  const dist2 = (p: number, ay: number, acb: number, acr: number) => {
    const dy = y[p] - ay
    const dcb = cb[p] - acb
    const dcr = cr[p] - acr
    return LUMA_WEIGHT * dy * dy + dcb * dcb + dcr * dcr
  }

  const localT2 = LOCAL_TOLERANCE * LOCAL_TOLERANCE
  const globalT2 = GLOBAL_TOLERANCE * GLOBAL_TOLERANCE
  let next = 0

  for (let seed = 0; seed < n; seed += 1) {
    if (labels[seed] >= 0) continue

    const id = next
    next += 1
    let top = 0
    stack[top] = seed
    top += 1
    labels[seed] = id

    let sumY = y[seed]
    let sumCb = cb[seed]
    let sumCr = cr[seed]
    let area = 1
    const seedX = seed % width
    const seedRow = (seed - seedX) / width
    let sumX = seedX
    let sumRow = seedRow
    let x1 = seedX
    let x2 = seedX
    let y1 = seedRow
    let y2 = seedRow

    while (top > 0) {
      top -= 1
      const p = stack[top]
      const px = p % width
      const py = (p - px) / width

      const meanY = sumY / area
      const meanCb = sumCb / area
      const meanCr = sumCr / area

      for (let k = 0; k < 4; k += 1) {
        const nx = px + (k === 0 ? -1 : k === 1 ? 1 : 0)
        const ny = py + (k === 2 ? -1 : k === 3 ? 1 : 0)
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
        const q = ny * width + nx
        if (labels[q] >= 0) continue

        // Three tests, and each one catches a different way of going wrong: the
        // edge test refuses to cross a boundary, the local test refuses a jump in
        // colour, and the global test stops a region drifting across a long
        // gradient into the floor — which is exactly how a tabletop ends up
        // swallowing a room.
        if (s.edge[q] > EDGE_LIMIT) continue
        if (dist2(q, y[p], cb[p], cr[p]) > localT2) continue
        if (dist2(q, meanY, meanCb, meanCr) > globalT2) continue

        labels[q] = id
        stack[top] = q
        top += 1
        sumY += y[q]
        sumCb += cb[q]
        sumCr += cr[q]
        area += 1
        sumX += nx
        sumRow += ny
        if (nx < x1) x1 = nx
        if (nx > x2) x2 = nx
        if (ny < y1) y1 = ny
        if (ny > y2) y2 = ny
      }
    }

    regions.set(id, {
      id,
      area,
      x1,
      y1,
      x2,
      y2,
      sumX,
      sumRow,
      meanY: sumY / area,
      meanCb: sumCb / area,
      meanCr: sumCr / area,
    })
  }

  return { labels, regions }
}

/**
 * Absorbs specks into the neighbour they resemble most.
 *
 * A highlight on a polished top, or a reflection, otherwise leaves a hole in the
 * middle of the region that ought to be the tabletop.
 */
function mergeSpecks(s: Sampled, seg: Segmentation, minArea: number): void {
  const { width, height } = s
  const { labels, regions } = seg

  for (let pass = 0; pass < 2; pass += 1) {
    const absorbInto = new Map<number, number>()

    for (const region of regions.values()) {
      if (region.area >= minArea) continue

      let best = -1
      let bestDistance = Infinity
      for (let row = region.y1; row <= region.y2; row += 1) {
        for (let col = region.x1; col <= region.x2; col += 1) {
          if (labels[row * width + col] !== region.id) continue
          for (let k = 0; k < 4; k += 1) {
            const nx = col + (k === 0 ? -1 : k === 1 ? 1 : 0)
            const ny = row + (k === 2 ? -1 : k === 3 ? 1 : 0)
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
            const other = labels[ny * width + nx]
            if (other === region.id || other < 0) continue
            const target = regions.get(other)
            if (!target || target.area < region.area) continue
            const dy = target.meanY - region.meanY
            const dcb = target.meanCb - region.meanCb
            const dcr = target.meanCr - region.meanCr
            const d = LUMA_WEIGHT * dy * dy + dcb * dcb + dcr * dcr
            if (d < bestDistance) {
              bestDistance = d
              best = other
            }
          }
        }
      }

      if (best >= 0) absorbInto.set(region.id, best)
    }

    if (absorbInto.size === 0) return

    for (let p = 0; p < labels.length; p += 1) {
      const into = absorbInto.get(labels[p])
      if (into !== undefined) labels[p] = into
    }

    for (const [from, into] of absorbInto) {
      const source = regions.get(from)
      const target = regions.get(into)
      regions.delete(from)
      if (!source || !target) continue
      target.area += source.area
      target.sumX += source.sumX
      target.sumRow += source.sumRow
      target.x1 = Math.min(target.x1, source.x1)
      target.y1 = Math.min(target.y1, source.y1)
      target.x2 = Math.max(target.x2, source.x2)
      target.y2 = Math.max(target.y2, source.y2)
    }
  }
}

/* ------------------------------------------------------------------ scoring */

interface Shape {
  region: Region
  score: number
  rowFill: number
  rows: { row: number; left: number; right: number }[]
}

/**
 * Measures the row structure of a region.
 *
 * The useful number is how *full* each row is between its own extremes. A
 * tabletop is nearly solid all the way across every row it occupies. A region
 * that has swallowed the legs is mostly empty across its lower rows, and that
 * shows up here immediately.
 *
 * Deliberately not "one unbroken run per row": a vase, a bowl or a lamp standing
 * on the table splits the rows behind it into two runs without making the thing
 * any less of a tabletop. Fill survives an occluder; run-counting does not.
 */
function rowStructure(s: Sampled, seg: Segmentation, region: Region) {
  const { width } = s
  const rows: { row: number; left: number; right: number }[] = []
  let fillSum = 0
  let occupied = 0

  for (let row = region.y1; row <= region.y2; row += 1) {
    let left = -1
    let right = -1
    let count = 0
    for (let col = region.x1; col <= region.x2; col += 1) {
      if (seg.labels[row * width + col] === region.id) {
        if (left < 0) left = col
        right = col
        count += 1
      }
    }
    if (left < 0) continue
    occupied += 1
    fillSum += count / (right - left + 1)
    rows.push({ row, left, right })
  }

  return { rows, rowFill: occupied > 0 ? fillSum / occupied : 0 }
}

/**
 * Whether something narrower sits underneath this region, holding it up.
 *
 * This is what separates a tabletop from a patch of floor. Both are flat,
 * horizontal, solid and nicely elongated; only one of them has legs under it.
 */
function isSupported(s: Sampled, regions: Iterable<Region>, candidate: Region): boolean {
  const { width, height } = s
  const candidateWidth = candidate.x2 - candidate.x1 + 1
  const reach = Math.round(height * 0.08)

  for (const other of regions) {
    if (other.id === candidate.id) continue
    if (other.area >= candidate.area) continue
    // Starts at or above the candidate's underside, and continues below it.
    if (other.y2 <= candidate.y2) continue
    if (other.y1 > candidate.y2 + reach) continue
    // Sits within the candidate's footprint, and is markedly narrower.
    if (other.x1 < candidate.x1 - 3 || other.x2 > candidate.x2 + 3) continue
    if ((other.x2 - other.x1 + 1) > candidateWidth * 0.7) continue
    if ((other.x2 - other.x1 + 1) / width < 0.01) continue
    return true
  }
  return false
}

function scoreRegion(
  s: Sampled,
  seg: Segmentation,
  region: Region,
  allRegions: Iterable<Region>,
): Shape | null {
  const { width, height } = s
  const total = width * height
  const areaFraction = region.area / total

  // Too small to be a tabletop, or so large it is the room.
  if (areaFraction < 0.015 || areaFraction > 0.55) return null

  const boxWidth = (region.x2 - region.x1 + 1) / width
  const boxHeight = (region.y2 - region.y1 + 1) / height
  const centroidY = region.sumRow / region.area / height
  const centroidX = region.sumX / region.area / width
  const solidity = region.area / ((region.x2 - region.x1 + 1) * (region.y2 - region.y1 + 1))
  const elongation = boxWidth / Math.max(0.001, boxHeight)

  // A tabletop seen from standing height is always wider on screen than it is tall.
  if (elongation < 1.05) return null

  const { rows, rowFill } = rowStructure(s, seg, region)
  if (rows.length < 3) return null

  const touchesTop = region.y1 <= 1
  const touchesBottom = region.y2 >= height - 2
  const spansWidth = boxWidth > 0.96
  const touchesBothSides = region.x1 <= 1 && region.x2 >= width - 2

  // Tabletops sit in a band of plausible proportions. Below it are square-ish
  // blobs; above it are floorboards, skirting, shadows and the gap between two
  // chair legs — all long, thin and not tables.
  const elongationScore =
    elongation < 1.3 ? 0 : elongation <= 8 ? 1 : Math.max(0, 1 - (elongation - 8) / 6)

  // Height in frame, graded rather than a flat band. A tabletop sits around the
  // middle; the lower a candidate sits the more likely it is to be floor, rug or
  // shadow — all of which are otherwise excellent imitations of a tabletop.
  const verticalScore =
    centroidY < 0.18
      ? 0
      : centroidY < 0.55
        ? 1
        : Math.max(0, 1 - (centroidY - 0.55) / 0.3)

  let score = 0
  score += elongationScore * 0.9
  score += rowFill * 1.2
  score += solidity * 0.8
  score += verticalScore * 0.7
  score += Math.abs(centroidX - 0.5) < 0.28 ? 0.3 : 0
  score += areaFraction > 0.03 && areaFraction < 0.4 ? 0.4 : 0
  score += isSupported(s, allRegions, region) ? 0.6 : 0

  // Somebody uploading a photograph of a table has put the table in the frame.
  // A candidate that is a sliver of it is a gap between other things.
  if (areaFraction < 0.04) score -= 0.8

  // Walls, ceilings, floors and rugs. A floor reaches the bottom of the frame, a
  // wall reaches the top, either may span the full width. A tabletop does none
  // of those things.
  if (touchesBottom) score -= 1.3
  if (touchesTop) score -= 1.1
  if (spansWidth) score -= 0.9
  if (touchesBothSides) score -= 0.6

  return { region, score, rowFill, rows }
}

/* ------------------------------------------------------------------- masks */

function maskFrom(
  width: number,
  height: number,
  test: (p: number) => boolean,
): ImageData | null {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const out = ctx.createImageData(width, height)
  for (let p = 0; p < width * height; p += 1) {
    const on = test(p)
    out.data[p * 4] = 255
    out.data[p * 4 + 1] = 255
    out.data[p * 4 + 2] = 255
    out.data[p * 4 + 3] = on ? 255 : 0
  }
  return out
}

/** Grows a mask outwards by `radius` pixels. */
function dilate(mask: ImageData | null, radius: number): ImageData | null {
  if (!mask || radius <= 0) return mask
  const { width, height } = mask
  let current = mask
  for (let step = 0; step < radius; step += 1) {
    const next = new ImageData(width, height)
    next.data.set(current.data)
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const p = row * width + col
        if (current.data[p * 4 + 3] > 127) continue
        let touching = false
        for (let k = 0; k < 4 && !touching; k += 1) {
          const nx = col + (k === 0 ? -1 : k === 1 ? 1 : 0)
          const ny = row + (k === 2 ? -1 : k === 3 ? 1 : 0)
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
          if (current.data[(ny * width + nx) * 4 + 3] > 127) touching = true
        }
        if (touching) {
          next.data[p * 4] = 255
          next.data[p * 4 + 1] = 255
          next.data[p * 4 + 2] = 255
          next.data[p * 4 + 3] = 255
        }
      }
    }
    current = next
  }
  return current
}

/** The trapezoid through the region's extremes — texture orientation, manual seed. */
function cornersFrom(shape: Shape, width: number, height: number): Quad {
  const { rows } = shape
  // A few rows in from each end: the very first and last rows of a curved top
  // are a handful of pixels wide and would give a useless corner.
  const inset = Math.max(1, Math.floor(rows.length * 0.06))
  const back = rows[Math.min(inset, rows.length - 1)]
  const front = rows[Math.max(0, rows.length - 1 - inset)]

  let widest = rows[0]
  for (const row of rows) {
    if (row.right - row.left > widest.right - widest.left) widest = row
  }

  return [
    { x: Math.min(back.left, widest.left) / width, y: back.row / height },
    { x: Math.max(back.right, widest.right) / width, y: back.row / height },
    { x: Math.max(front.right, widest.right) / width, y: (front.row + 1) / height },
    { x: Math.min(front.left, widest.left) / width, y: (front.row + 1) / height },
  ]
}

/** A plausible tabletop for the customer to drag from when nothing was found. */
function centredQuad(): Quad {
  return [
    { x: 0.22, y: 0.38 },
    { x: 0.78, y: 0.38 },
    { x: 0.84, y: 0.56 },
    { x: 0.16, y: 0.56 },
  ]
}

function nothingFound(warnings: string[], confidence = 0.2): AnalysisResult {
  return {
    tabletopMask: null,
    tabletopCorners: centredQuad(),
    objectMask: null,
    baseMask: null,
    backgroundMask: null,
    baseRegion: null,
    confidence,
    source: 'none',
    warnings,
  }
}

/* ------------------------------------------------------------------- driver */

function findTabletop(s: Sampled): AnalysisResult {
  const warnings: string[] = []
  const { width, height } = s

  const seg = segment(s)
  mergeSpecks(s, seg, Math.max(24, Math.round(width * height * 0.0015)))

  const candidates: Shape[] = []
  for (const region of seg.regions.values()) {
    const scored = scoreRegion(s, seg, region, seg.regions.values())
    if (scored) candidates.push(scored)
  }

  if (candidates.length === 0) {
    warnings.push('no-tabletop-candidate')
    return nothingFound(warnings)
  }

  candidates.sort((a, b) => b.score - a.score)
  const winner = candidates[0]
  const runnerUp = candidates[1]

  // Confidence: how good the winner is on its own, and how clearly it beat the
  // next best. A photograph containing two equally plausible slabs is not one we
  // should be guessing about.
  const quality = Math.max(0, Math.min(1, winner.score / 3.4))
  const margin = runnerUp ? Math.max(0, winner.score - runnerUp.score) : winner.score
  const separation = Math.min(1, margin / 0.8)
  const confidence = Math.max(0, Math.min(0.97, quality * 0.75 + separation * 0.25))

  if (confidence < CONFIDENCE_FLOOR) {
    warnings.push(`low-confidence:${confidence.toFixed(2)}`)
    // The corners still come from the best guess, so the adjuster opens near the
    // right place rather than in the middle of the frame.
    return {
      ...nothingFound(warnings, confidence),
      tabletopCorners: cornersFrom(winner, width, height),
    }
  }

  const labels = seg.labels
  const topId = winner.region.id
  // The edge guard deliberately stops a pixel short of every boundary, which
  // leaves a hairline of the original surface showing around the stone. Growing
  // the mask back by that much closes it, and a soft boundary is what a real
  // object edge looks like anyway.
  const tabletopMask = dilate(maskFrom(width, height, (p) => labels[p] === topId), 3)

  // The base: whatever sits directly beneath the top, inside its horizontal
  // span, and smaller than it. Legs, a pedestal, a stretcher.
  const topBottom = winner.region.y2
  const spanLeft = winner.region.x1
  const spanRight = winner.region.x2
  const baseIds = new Set<number>()
  for (const region of seg.regions.values()) {
    if (region.id === topId) continue
    if (region.area >= winner.region.area) continue
    const overlaps = region.x2 >= spanLeft && region.x1 <= spanRight
    const below = region.y1 >= topBottom - Math.round(height * 0.02)
    const narrow = (region.x2 - region.x1 + 1) / width < 0.9
    if (overlaps && below && narrow) baseIds.add(region.id)
  }

  let baseBottom = topBottom
  for (const region of seg.regions.values()) {
    if (baseIds.has(region.id)) baseBottom = Math.max(baseBottom, region.y2)
  }

  return {
    tabletopMask,
    tabletopCorners: cornersFrom(winner, width, height),
    objectMask: maskFrom(width, height, (p) => labels[p] === topId || baseIds.has(labels[p])),
    baseMask: maskFrom(width, height, (p) => baseIds.has(labels[p])),
    backgroundMask: maskFrom(
      width,
      height,
      (p) => labels[p] !== topId && !baseIds.has(labels[p]),
    ),
    baseRegion:
      baseBottom > topBottom
        ? { top: (topBottom + 1) / height, bottom: (baseBottom + 1) / height }
        : null,
    confidence,
    source: 'segmentation',
    warnings,
  }
}

/* ----------------------------------------------------------------- provider */

export const localAnalysis: ImageAnalysisProvider = {
  id: 'local-segmentation',
  async analyze(imageDataUrl) {
    const img = await loadImage(imageDataUrl)
    const sampled = sample(img)
    if (!sampled) return nothingFound(['sampling-unavailable'])
    return findTabletop(sampled)
  },
}

let provider: ImageAnalysisProvider = localAnalysis

/**
 * Swap in a different provider — a segmentation service, a vision model —
 * without touching a single caller. Anything that can return a `tabletopMask`
 * and a `confidence` slots straight in.
 */
export function setAnalysisProvider(next: ImageAnalysisProvider) {
  provider = next
}

/** The one entry point. */
export function analyzeFurnitureImage(imageDataUrl: string): Promise<AnalysisResult> {
  return provider.analyze(imageDataUrl)
}
