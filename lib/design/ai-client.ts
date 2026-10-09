import type { DesignConfiguration } from '@/lib/data/design'
import { describeDesign } from '@/lib/design/describe'
import type { GeneratedPreview } from '@/lib/store/design-store'

/**
 * The browser half of the AI preview.
 *
 * Talks only to our own route, so no key, no vendor name and no model name is
 * ever present in the bundle. The route answers the same shape whether or not a
 * provider is configured, which is what lets the studio behave identically in
 * both modes.
 */

/** The public flag only hides the invitation; the server decides what can run. */
const FEATURE_ENABLED = process.env.NEXT_PUBLIC_AI_PREVIEW_ENABLED !== 'false'

let availability: Promise<boolean> | null = null

/** Whether to offer the render at all. Asked once per page load, then cached. */
export function previewAvailability(): Promise<boolean> {
  if (!FEATURE_ENABLED) return Promise.resolve(false)
  if (!availability) {
    availability = fetch('/api/ai/generate-preview', { method: 'GET' })
      .then((response) => (response.ok ? response.json() : { available: false }))
      .then((payload: { available?: boolean }) => Boolean(payload.available))
      .catch(() => false)
  }
  return availability
}

/**
 * Requests the final render.
 *
 * Always resolves to something usable: on any failure the description is still
 * built locally from the configuration, so the customer sees their written
 * specification and can carry on to the quote. `null` is returned only when the
 * request could not even be attempted.
 */
export async function generatePreview(input: {
  configuration: DesignConfiguration
  referenceImage: string | null
  previewImage: string | null
}): Promise<GeneratedPreview | null> {
  try {
    const response = await fetch('/api/ai/generate-preview', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        configuration: { ...input.configuration, referenceImage: null },
        referenceImage: input.referenceImage,
        previewImage: input.previewImage,
      }),
    })

    if (!response.ok) {
      return {
        image: null,
        mode: 'fallback',
        description: describeDesign(input.configuration),
      }
    }

    const payload = (await response.json()) as Partial<GeneratedPreview>
    return {
      image: typeof payload.image === 'string' ? payload.image : null,
      mode: payload.mode === 'ai' ? 'ai' : 'fallback',
      description: payload.description ?? describeDesign(input.configuration),
    }
  } catch {
    return null
  }
}
