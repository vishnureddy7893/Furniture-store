import type { MarbleOption } from '@/lib/data/configurator'
import { mix, veinPath, veinsFor } from '@/lib/marble/texture'

/**
 * Procedural marble, SVG side.
 *
 * Every marble surface drawn as SVG in the app -- swatches, product imagery,
 * the studio preview -- is filled from these patterns, so the catalogue and the
 * configurator share one visual language. The colour blending and the vein
 * geometry live in `lib/marble/texture`, which the canvas compositor behind the
 * uploaded-photo preview reads as well; that is what keeps a stone looking like
 * the same stone in both renderers.
 *
 * Production note: each surface is filled through a single `<pattern>`, so
 * swapping in real slab photography later is a one-line change here (replace
 * the generated content with an `<image>`), with no changes to any consumer.
 */

/** Re-exported for the modules that imported it from here historically. */
export { mix }

/* -------------------------------------------------------------------- defs */

export interface MarbleDefsProps {
  marble: MarbleOption
  /** Unique per component instance — pass `useId()` from the consumer. */
  uid: string
  /** Size of the pattern tile in user units. Use the host viewBox size. */
  width: number
  height: number
  /** Larger values give bolder, more open veining. */
  scale?: number
}

export const marblePatternId = (uid: string, marbleId: string) =>
  `mp-${marbleId}-${uid}`

/**
 * Renders the gradient / filter / pattern for one stone.
 * Place inside a `<defs>` element and fill shapes with
 * `url(#${marblePatternId(uid, marble.id)})`.
 */
export default function MarbleDefs({
  marble,
  uid,
  width,
  height,
  scale = 1,
}: MarbleDefsProps) {
  const { palette, seed, veinOpacity } = marble
  const base = `mg-${marble.id}-${uid}`
  const warp = `mw-${marble.id}-${uid}`
  const grain = `mn-${marble.id}-${uid}`
  const pattern = marblePatternId(uid, marble.id)

  // Veins are always generated inside the pattern box; zooming in means
  // fewer but larger veins, the way a close-up of a real slab behaves.
  const veins = veinsFor(seed, width, height, Math.max(8, Math.round(32 / scale)))
  const mottle = mix(palette.mid, palette.deep, 0.5)

  return (
    <>
      <linearGradient id={base} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={palette.light} />
        <stop offset="45%" stopColor={palette.mid} />
        <stop offset="78%" stopColor={mix(palette.mid, palette.light, 0.55)} />
        <stop offset="100%" stopColor={palette.mid} />
      </linearGradient>

      {/* Warps the straight vein guides into organic stone veining. */}
      <filter id={warp} x="-25%" y="-25%" width="150%" height="150%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.005 0.017"
          numOctaves={4}
          seed={seed}
          result="turb"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="turb"
          scale={58 * scale}
          xChannelSelector="R"
          yChannelSelector="G"
        />
        <feGaussianBlur stdDeviation={0.9 * scale} />
      </filter>

      {/* Fine crystalline grain over the whole surface. */}
      <filter id={grain} x="0%" y="0%" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={1}
          seed={seed + 7}
          result="n"
        />
        <feColorMatrix
          in="n"
          type="matrix"
          values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0.22 0"
        />
      </filter>

      <pattern
        id={pattern}
        patternUnits="userSpaceOnUse"
        width={width}
        height={height}
      >
        <rect width={width} height={height} fill={`url(#${base})`} />

        {/* Broad cloudy mottling. */}
        <rect
          width={width}
          height={height}
          fill={mottle}
          opacity={0.26}
          filter={`url(#${warp})`}
        />

        <g
          filter={`url(#${warp})`}
          fill="none"
          strokeLinecap="round"
          opacity={veinOpacity}
        >
          {veins.map((v, i) => (
            <path
              key={i}
              d={veinPath(v)}
              stroke={v.soft ? palette.veinSoft : palette.vein}
              strokeWidth={v.width * scale}
              opacity={v.opacity}
            />
          ))}
        </g>

        <rect width={width} height={height} filter={`url(#${grain})`} />
      </pattern>
    </>
  )
}
