import { NextResponse } from 'next/server'
import { DEFAULT_DESIGN, type DesignConfiguration } from '@/lib/data/design'
import { describeDesign } from '@/lib/design/describe'
import { buildPreviewPrompt } from '@/lib/design/ai/prompt'
import { resolveProvider } from '@/lib/design/ai/provider'

/**
 * The one server endpoint in the studio, and the only place a generative image
 * model is ever called.
 *
 * Two shapes of response, and the client treats them identically apart from the
 * label it shows:
 *
 *   { mode: 'ai',       image, description }  — a provider was configured and ran
 *   { mode: 'fallback', image: null, description }  — no provider, or it produced
 *                                                    nothing; the browser keeps
 *                                                    showing its local composite
 *
 * A missing key is not an error. It is the demo's normal state, so it returns
 * 200 with `mode: 'fallback'` and the request flow continues untouched.
 *
 * The description is always generated locally from the configuration, never by a
 * model, so it is correct in both languages whether or not AI ran.
 */

export const runtime = 'nodejs'
/** Data URLs of two images are large; this route is never statically analysed. */
export const dynamic = 'force-dynamic'

/** Feature flag. Public so the button can be hidden without a round trip. */
function featureEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_PREVIEW_ENABLED !== 'false'
}

export async function GET() {
  const provider = featureEnabled() ? resolveProvider() : null
  // Deliberately only a boolean: the browser has no business knowing the vendor.
  return NextResponse.json({ available: provider !== null, enabled: featureEnabled() })
}

/** Rejects anything that is not a plausible inline image, before it is forwarded. */
function sanitiseImage(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(value)) return null
  // ~8MB of base64. Bigger than any copy this app produces, small enough to
  // refuse a pathological body.
  if (value.length > 11_000_000) return null
  return value
}

/** Trusts the shape but not the values: unknown ids fall back to the defaults. */
function sanitiseConfiguration(value: unknown): DesignConfiguration | null {
  if (typeof value !== 'object' || value === null) return null
  const raw = value as Partial<DesignConfiguration>
  if (typeof raw.dimensions !== 'object' || raw.dimensions === null) return null

  return {
    ...DEFAULT_DESIGN,
    ...raw,
    // The image travels in its own field, not inside the configuration.
    referenceImage: null,
    notes: typeof raw.notes === 'string' ? raw.notes.slice(0, 2000) : '',
    dimensions: { ...DEFAULT_DESIGN.dimensions, ...raw.dimensions },
  }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid-body' }, { status: 400 })
  }

  const payload = body as {
    configuration?: unknown
    referenceImage?: unknown
    previewImage?: unknown
  }

  const configuration = sanitiseConfiguration(payload.configuration)
  if (!configuration) {
    return NextResponse.json({ error: 'invalid-configuration' }, { status: 400 })
  }

  const referenceImage = sanitiseImage(payload.referenceImage)
  const previewImage = sanitiseImage(payload.previewImage)

  // The description is structured data rendered as a sentence, so it is right
  // even when no model runs.
  const description = describeDesign({ ...configuration, referenceImage })

  const provider = featureEnabled() ? resolveProvider() : null
  if (!provider) {
    return NextResponse.json({ mode: 'fallback', image: null, description })
  }

  try {
    const result = await provider.generate({
      referenceImage,
      previewImage,
      configuration,
      prompt: buildPreviewPrompt({ ...configuration, referenceImage }),
    })

    if (!result.image) {
      console.warn('[ai-preview] provider returned no image', provider.id, result.detail)
      return NextResponse.json({ mode: 'fallback', image: null, description })
    }

    return NextResponse.json({ mode: 'ai', image: result.image, description })
  } catch (error) {
    // A provider outage must never cost the customer their configuration.
    console.error('[ai-preview] provider failed', provider.id, error)
    return NextResponse.json({ mode: 'fallback', image: null, description })
  }
}
