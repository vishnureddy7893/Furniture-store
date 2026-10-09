import {
  pieceById,
  type EdgeId,
  type MarblePalette,
  type PieceConfig,
  type ShapeId,
} from '@/lib/data/configurator'
import { mix } from '@/lib/marble/texture'

/** Drawing canvas for every marble scene. */
export const CANVAS = { width: 1200, height: 900 }
const FLOOR_Y = 780
/** How much the depth axis is foreshortened in the three-quarter view. */
const PERSPECTIVE = 0.45
/** Nominal slab thickness in centimetres. */
const SLAB_CM = 3

export interface SceneGeometry {
  /** Pixels per centimetre for this piece type. */
  pxPerCm: number
  cx: number
  floorY: number
  /** y of the front-top corner of the slab. */
  frontY: number
  halfLen: number
  /** Foreshortened depth of the top face. */
  depth: number
  /** Perspective convergence of the back edge. */
  inset: number
  /** Slab thickness in pixels. */
  thickness: number
}

/**
 * Scale is derived from the piece type's own dimension range, so changing a
 * dimension visibly changes the drawing while every piece still fits the frame.
 */
export function buildGeometry(config: PieceConfig): SceneGeometry {
  const piece = pieceById(config.piece)
  const pxPerCm = Math.min(
    820 / piece.ranges.length.max,
    560 / piece.ranges.height.max,
  )

  const { length, width, height } = config.dimensions
  // A round or square top follows the length rather than the stated width.
  const depthCm = squareInPlan(config.shape) ? length : width

  const halfLen = (length * pxPerCm) / 2
  const depth = depthCm * pxPerCm * PERSPECTIVE
  const thickness = Math.max(9, Math.min(26, SLAB_CM * pxPerCm))

  return {
    pxPerCm,
    cx: CANVAS.width / 2,
    floorY: FLOOR_Y,
    frontY: FLOOR_Y - height * pxPerCm,
    halfLen,
    depth,
    inset: hasStraightSides(config.shape) ? halfLen * 0.05 : 0,
    thickness,
  }
}

/* ------------------------------------------------------------------ shapes */

/** Outlines whose depth follows the length rather than the stated width. */
export function squareInPlan(shape: ShapeId): boolean {
  return shape === 'round' || shape === 'square'
}

/** Outlines drawn with straight sides, so the back edge can converge. */
export function hasStraightSides(shape: ShapeId): boolean {
  return (
    shape === 'rectangle' ||
    shape === 'square' ||
    shape === 'soft' ||
    shape === 'custom' ||
    shape === 'organic'
  )
}

/** Corner rounding as a fraction of the smaller half-axis, per outline. */
function cornerRatio(shape: ShapeId): number {
  switch (shape) {
    case 'soft':
      return 0.3
    case 'organic':
      return 0.55
    case 'custom':
      return 0.1
    default:
      return 0
  }
}

type Point = [number, number]

/** Polygon with quadratic corners; `radius` 0 gives sharp corners. */
export function roundedPolygon(points: Point[], radius: number): string {
  if (radius <= 0.5) {
    return `M ${points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z`
  }

  const n = points.length
  const towards = (from: Point, to: Point, dist: number): Point => {
    const dx = to[0] - from[0]
    const dy = to[1] - from[1]
    const len = Math.hypot(dx, dy) || 1
    const d = Math.min(dist, len / 2)
    return [from[0] + (dx / len) * d, from[1] + (dy / len) * d]
  }

  let d = ''
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n]
    const cur = points[i]
    const next = points[(i + 1) % n]
    const start = towards(cur, prev, radius)
    const end = towards(cur, next, radius)
    d += i === 0 ? `M ${start[0].toFixed(1)} ${start[1].toFixed(1)}` : ` L ${start[0].toFixed(1)} ${start[1].toFixed(1)}`
    d += ` Q ${cur[0].toFixed(1)} ${cur[1].toFixed(1)} ${end[0].toFixed(1)} ${end[1].toFixed(1)}`
  }
  return `${d} Z`
}

export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return [
    `M ${(cx - rx).toFixed(1)} ${cy.toFixed(1)}`,
    `A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 1 0 ${(cx + rx).toFixed(1)} ${cy.toFixed(1)}`,
    `A ${rx.toFixed(1)} ${ry.toFixed(1)} 0 1 0 ${(cx - rx).toFixed(1)} ${cy.toFixed(1)}`,
    'Z',
  ].join(' ')
}

/** Outline of the table top as seen in the three-quarter view. */
export function topFacePath(shape: ShapeId, g: SceneGeometry): string {
  const { cx, frontY, halfLen, depth, inset } = g
  const backY = frontY - depth

  if (shape === 'round' || shape === 'oval') {
    return ellipsePath(cx, frontY - depth / 2, halfLen, depth / 2)
  }

  return roundedPolygon(
    [
      [cx - halfLen, frontY],
      [cx + halfLen, frontY],
      [cx + halfLen - inset, backY],
      [cx - halfLen + inset, backY],
    ],
    Math.min(halfLen, depth) * cornerRatio(shape),
  )
}

/** Plan (top-down) outline, used for the plan-view gallery image. */
export function planPath(
  shape: ShapeId,
  cx: number,
  cy: number,
  halfLen: number,
  halfWidth: number,
): string {
  if (shape === 'round' || shape === 'oval') {
    return ellipsePath(cx, cy, halfLen, halfWidth)
  }

  return roundedPolygon(
    [
      [cx - halfLen, cy - halfWidth],
      [cx + halfLen, cy - halfWidth],
      [cx + halfLen, cy + halfWidth],
      [cx - halfLen, cy + halfWidth],
    ],
    Math.min(halfLen, halfWidth) * cornerRatio(shape) * 1.07,
  )
}

/* ------------------------------------------------------------------- edges */

/**
 * Colour of the cut edge at depth `p` (0 = directly under the top surface,
 * 1 = the bottom of the slab). This is what makes the three edge profiles
 * read differently: a flat band, a light chamfer, or a rounded highlight.
 */
export function edgeColorAt(edge: EdgeId, palette: MarblePalette, p: number): string {
  const bodyTop = mix(palette.mid, palette.deep, 0.2)
  // A cut edge sits in shadow, but never near-black — that reads as a
  // hole under light stones rather than as polished marble.
  const bodyBottom = mix(palette.deep, '#3A332B', 0.42)

  switch (edge) {
    case 'beveled': {
      const chamfer = 0.34
      if (p < chamfer) return mix(palette.light, bodyTop, p / chamfer)
      return mix(bodyTop, bodyBottom, (p - chamfer) / (1 - chamfer))
    }
    case 'bullnose': {
      const body = mix(bodyTop, bodyBottom, p)
      const specular = Math.exp(-(((p - 0.18) / 0.17) ** 2))
      const bounce = Math.exp(-(((p - 0.94) / 0.1) ** 2)) * 0.45
      return mix(body, palette.light, Math.min(0.72, specular * 0.68 + bounce * 0.3))
    }
    case 'halfBullnose': {
      // Rounded over the top third, then a straight face to the underside.
      const body = mix(bodyTop, bodyBottom, p)
      const specular = Math.exp(-(((p - 0.14) / 0.13) ** 2))
      return mix(body, palette.light, Math.min(0.6, specular * 0.62))
    }
    case 'ogee': {
      // A double curve reads as two highlights with a shadow between them.
      const body = mix(bodyTop, bodyBottom, p)
      const upper = Math.exp(-(((p - 0.12) / 0.1) ** 2)) * 0.66
      const lower = Math.exp(-(((p - 0.68) / 0.12) ** 2)) * 0.5
      const hollow = Math.exp(-(((p - 0.4) / 0.12) ** 2)) * 0.45
      const lit = mix(body, palette.light, Math.min(0.7, upper + lower))
      return mix(lit, bodyBottom, hollow)
    }
    default:
      // Straight, and the fallback for a customer-supplied profile.
      return mix(bodyTop, bodyBottom, p * 0.78)
  }
}

/** Number of slices used to fake the extruded edge; enough to look continuous. */
export function edgeSteps(thickness: number): number {
  return Math.max(12, Math.min(28, Math.round(thickness * 1.4)))
}

const rampCache = new Map<string, string[]>()

/**
 * The colour of every slice of the cut edge, front to back.
 *
 * Each scene used to recompute this per slice, and each colour costs several
 * hex blends — with a dozen scenes on a listing page that is thousands of
 * blends per navigation for what is only ever one of a few dozen ramps.
 */
export function edgeRamp(
  edge: EdgeId,
  marbleId: string,
  palette: MarblePalette,
  steps: number,
): string[] {
  const key = `${edge}:${marbleId}:${steps}`
  let ramp = rampCache.get(key)
  if (!ramp) {
    ramp = Array.from({ length: steps }, (_, i) => edgeColorAt(edge, palette, i / (steps - 1)))
    rampCache.set(key, ramp)
  }
  return ramp
}
