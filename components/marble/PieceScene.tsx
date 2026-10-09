import {
  baseById,
  marbleById,
  type PieceConfig,
} from '@/lib/data/configurator'
import MarbleDefs, { marblePatternId, mix } from './MarbleDefs'
import {
  CANVAS,
  buildGeometry,
  edgeRamp,
  edgeSteps,
  planPath,
  roundedPolygon,
  topFacePath,
  type SceneGeometry,
} from '@/lib/marble/geometry'

export type SceneView = 'scene' | 'plan' | 'edge' | 'stone'

interface PieceSceneProps {
  config: PieceConfig
  view?: SceneView
  /** Accessible description; omit for decorative use alongside a text label. */
  label?: string
  className?: string
}

/**
 * Scenes are drawn on a 4:3 canvas but shown in containers of many aspect
 * ratios. Backgrounds are painted well outside the viewBox so `meet`
 * letterboxing never exposes bare container colour at the edges.
 */
const BLEED = { x: -CANVAS.width, y: -CANVAS.height, width: CANVAS.width * 3, height: CANVAS.height * 3 }

const METAL_DARK = '#22201D'
const METAL_MID = '#3B3733'
const METAL_LIGHT = '#5C5650'

/**
 * The single renderer behind every marble visual in the app: product imagery,
 * the PDP gallery, the live configurator preview and the admin request view.
 * Because the customer and the admin look at the same component with the same
 * config, the admin preview is guaranteed to match what the customer designed.
 */
export default function PieceScene({
  config,
  view = 'scene',
  label,
  className,
}: PieceSceneProps) {
  const marble = marbleById(config.marble)
  const geo = buildGeometry(config)
  const defsScale = view === 'stone' ? 2.2 : view === 'edge' ? 1.8 : 1

  // Ids are derived from the stone and the zoom rather than `useId`, so this
  // stays a server component and identical scenes safely share one set of defs.
  const uid = `${marble.id}-${Math.round(defsScale * 10)}`
  const fill = `url(#${marblePatternId(uid, marble.id)})`

  return (
    <svg
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      className={className}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      preserveAspectRatio={view === 'stone' ? 'xMidYMid slice' : 'xMidYMid meet'}
    >
      <defs>
        <MarbleDefs
          marble={marble}
          uid={uid}
          width={CANVAS.width}
          height={CANVAS.height}
          scale={defsScale}
        />
        <linearGradient
          id={`bg-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2={CANVAS.height}
        >
          <stop offset="0%" stopColor="#FBF9F6" />
          <stop offset="62%" stopColor="#F1ECE4" />
          <stop offset="100%" stopColor="#E6DED2" />
        </linearGradient>
        <radialGradient
          id={`glow-${uid}`}
          gradientUnits="userSpaceOnUse"
          cx={CANVAS.width / 2}
          cy={CANVAS.height * 0.42}
          r={CANVAS.width * 0.58}
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`shadow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#241F1B" stopOpacity="0.34" />
          <stop offset="70%" stopColor="#241F1B" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#241F1B" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={METAL_DARK} />
          <stop offset="38%" stopColor={METAL_LIGHT} />
          <stop offset="62%" stopColor={METAL_MID} />
          <stop offset="100%" stopColor={METAL_DARK} />
        </linearGradient>
      </defs>

      {view === 'stone' && <StoneView uid={uid} fill={fill} />}
      {view === 'plan' && <PlanView uid={uid} config={config} fill={fill} />}
      {view === 'edge' && <EdgeView uid={uid} config={config} fill={fill} />}
      {view === 'scene' && <SceneView uid={uid} config={config} geo={geo} fill={fill} />}
    </svg>
  )
}

/* ------------------------------------------------------------------ views */

function StoneView({ uid, fill }: { uid: string; fill: string }) {
  return (
    <>
      <rect width={CANVAS.width} height={CANVAS.height} fill={fill} />
      <rect
        width={CANVAS.width}
        height={CANVAS.height}
        fill={`url(#glow-${uid})`}
        opacity="0.35"
      />
    </>
  )
}

function PlanView({
  uid,
  config,
  fill,
}: {
  uid: string
  config: PieceConfig
  fill: string
}) {
  const { length, width } = config.dimensions
  const depthCm = config.shape === 'round' ? length : width
  const scale = Math.min(940 / length, 620 / depthCm)
  const halfLen = (length * scale) / 2
  const halfWidth = (depthCm * scale) / 2
  const cx = CANVAS.width / 2
  const cy = CANVAS.height / 2
  const d = planPath(config.shape, cx, cy, halfLen, halfWidth)

  return (
    <>
      <rect {...BLEED} fill={`url(#bg-${uid})`} />
      <path d={d} transform="translate(0 26)" fill={`url(#shadow-${uid})`} opacity="0.5" />
      <path d={d} fill={fill} />
      <path d={d} fill="none" stroke="#1E1B18" strokeOpacity="0.14" strokeWidth="3" />
    </>
  )
}

/** Magnified cross-section so the edge profile is actually legible. */
function EdgeView({
  uid,
  config,
  fill,
}: {
  uid: string
  config: PieceConfig
  fill: string
}) {
  const marble = marbleById(config.marble)
  const top = 300
  const thickness = 190
  const steps = 40
  const ramp = edgeRamp(config.edge, marble.id, marble.palette, steps)

  return (
    <>
      <rect {...BLEED} fill={`url(#bg-${uid})`} />
      {/* Extruded cut edge: one thin band per depth step. */}
      {Array.from({ length: steps }, (_, i) => (
        <rect
          key={i}
          x={120}
          y={top + (thickness * i) / (steps - 1)}
          width={960}
          height={thickness / steps + 1.5}
          fill={ramp[i]}
        />
      ))}
      {/* Polished top surface running back into the frame. */}
      <path
        d={`M 120 ${top} L 1080 ${top} L 1020 ${top - 190} L 180 ${top - 190} Z`}
        fill={fill}
      />
      <path
        d={`M 120 ${top} L 1080 ${top} L 1020 ${top - 190} L 180 ${top - 190} Z`}
        fill="#FFFFFF"
        opacity="0.12"
      />
      <line
        x1={120}
        y1={top}
        x2={1080}
        y2={top}
        stroke="#FFFFFF"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
    </>
  )
}

function SceneView({
  uid,
  config,
  geo,
  fill,
}: {
  uid: string
  config: PieceConfig
  geo: SceneGeometry
  fill: string
}) {
  const marble = marbleById(config.marble)
  const base = baseById(config.base)
  const face = topFacePath(config.shape, geo)
  const steps = edgeSteps(geo.thickness)
  const ramp = edgeRamp(config.edge, marble.id, marble.palette, steps)

  return (
    <>
      <rect {...BLEED} fill={`url(#bg-${uid})`} />
      <rect {...BLEED} fill={`url(#glow-${uid})`} />
      <line
        x1={BLEED.x}
        y1={geo.floorY}
        x2={BLEED.x + BLEED.width}
        y2={geo.floorY}
        stroke="#1E1B18"
        strokeOpacity="0.07"
        strokeWidth="2"
      />

      {/* Contact shadow. */}
      <ellipse
        cx={geo.cx}
        cy={geo.floorY + 6}
        rx={geo.halfLen * 1.06}
        ry={Math.max(18, geo.depth * 0.3)}
        fill={`url(#shadow-${uid})`}
      />

      <Base config={config} geo={geo} uid={uid} fill={fill} inStone={base.inStone} />

      {/* Cut edge of the slab, sliced from the bottom upwards. */}
      <g>
        {Array.from({ length: steps }, (_, i) => {
          const step = steps - 1 - i
          const p = step / (steps - 1)
          return (
            <path
              key={i}
              d={face}
              transform={`translate(0 ${(geo.thickness * p).toFixed(2)})`}
              fill={ramp[step]}
            />
          )
        })}
      </g>

      {/* Polished top. */}
      <path d={face} fill={fill} />
      <path d={face} fill="#FFFFFF" opacity="0.07" />
      <path d={face} fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
    </>
  )
}

/* ------------------------------------------------------------------- base */

function Base({
  config,
  geo,
  uid,
  fill,
  inStone,
}: {
  config: PieceConfig
  geo: SceneGeometry
  uid: string
  fill: string
  inStone: boolean
}) {
  const { cx, halfLen, depth, frontY, floorY, thickness } = geo
  const topY = frontY + thickness * 0.72
  const marble = marbleById(config.marble)
  const stoneFill = inStone ? fill : `url(#metal-${uid})`
  const shade = mix(marble.palette.deep, '#0B0906', 0.2)

  switch (config.base) {
    case 'stone': {
      const panelW = Math.max(18, halfLen * 0.18)
      const offset = halfLen * 0.6
      return (
        <g>
          {[-1, 1].map((side) => {
            const x = cx + side * offset - panelW / 2
            return (
              <g key={side}>
                {/* Receding side face, then the front face. */}
                <path
                  d={roundedPolygon(
                    [
                      [x + panelW, topY],
                      [x + panelW + depth * 0.34, topY - depth * 0.34],
                      [x + panelW + depth * 0.34, floorY - depth * 0.34],
                      [x + panelW, floorY],
                    ],
                    0,
                  )}
                  fill={shade}
                />
                <rect x={x} y={topY} width={panelW} height={floorY - topY} fill={stoneFill} />
                <rect
                  x={x}
                  y={topY}
                  width={panelW}
                  height={floorY - topY}
                  fill="#1E1B18"
                  opacity="0.1"
                />
              </g>
            )
          })}
        </g>
      )
    }

    case 'pedestal': {
      const topW = Math.max(24, halfLen * 0.26)
      const botW = Math.max(32, halfLen * 0.4)
      const footRx = Math.max(44, halfLen * 0.46)
      const footRy = Math.max(9, depth * 0.18)
      const footTop = floorY - footRy * 0.6
      return (
        <g>
          {/* Foot: a disc seen in perspective, shaded so it reads against
              the floor even when the stone is near-white. */}
          <ellipse cx={cx} cy={floorY} rx={footRx} ry={footRy} fill={shade} opacity="0.55" />
          <ellipse cx={cx} cy={footTop} rx={footRx} ry={footRy} fill={stoneFill} />
          <ellipse cx={cx} cy={footTop} rx={footRx} ry={footRy} fill="#1E1B18" opacity="0.06" />

          {/* Column, flaring slightly towards the foot. */}
          <path
            d={roundedPolygon(
              [
                [cx - topW, topY],
                [cx + topW, topY],
                [cx + botW, footTop],
                [cx - botW, footTop],
              ],
              0,
            )}
            fill={stoneFill}
          />
          <path
            d={roundedPolygon(
              [
                [cx + topW * 0.45, topY],
                [cx + topW, topY],
                [cx + botW, footTop],
                [cx + botW * 0.5, footTop],
              ],
              0,
            )}
            fill={shade}
            opacity="0.22"
          />
        </g>
      )
    }

    case 'architectural': {
      const bar = Math.max(9, 4.5 * geo.pxPerCm)
      const offset = halfLen * 0.66
      const footW = Math.max(70, halfLen * 0.42)
      return (
        <g>
          {/* Top rail tying the two frames together. */}
          <rect
            x={cx - offset}
            y={topY}
            width={offset * 2}
            height={bar * 0.75}
            fill={`url(#metal-${uid})`}
            opacity="0.9"
          />
          {[-1, 1].map((side) => {
            const x = cx + side * offset - bar / 2
            return (
              <g key={side}>
                <rect x={x} y={topY} width={bar} height={floorY - topY} fill={`url(#metal-${uid})`} />
                <rect
                  x={cx + side * offset - footW / 2}
                  y={floorY - bar}
                  width={footW}
                  height={bar}
                  fill={`url(#metal-${uid})`}
                />
              </g>
            )
          })}
        </g>
      )
    }

    default: {
      // Four tapered legs; the back pair sits higher and darker.
      const bar = Math.max(7, 4 * geo.pxPerCm)
      const offsetFront = halfLen * 0.84
      const offsetBack = (halfLen - geo.inset) * 0.84
      const backDrop = depth * 0.86
      return (
        <g>
          {[-1, 1].map((side) => (
            <path
              key={`back-${side}`}
              d={roundedPolygon(
                [
                  [cx + side * offsetBack - bar * 0.55, topY - backDrop],
                  [cx + side * offsetBack + bar * 0.55, topY - backDrop],
                  [cx + side * offsetBack + bar * 0.4, floorY - backDrop],
                  [cx + side * offsetBack - bar * 0.4, floorY - backDrop],
                ],
                0,
              )}
              fill={METAL_DARK}
              opacity="0.75"
            />
          ))}
          {[-1, 1].map((side) => (
            <path
              key={`front-${side}`}
              d={roundedPolygon(
                [
                  [cx + side * offsetFront - bar * 0.6, topY],
                  [cx + side * offsetFront + bar * 0.6, topY],
                  [cx + side * offsetFront + bar * 0.42, floorY],
                  [cx + side * offsetFront - bar * 0.42, floorY],
                ],
                0,
              )}
              fill={`url(#metal-${uid})`}
            />
          ))}
        </g>
      )
    }
  }
}
