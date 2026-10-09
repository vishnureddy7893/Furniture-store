/**
 * The generative-preview provider abstraction. Server-only.
 *
 * Nothing in this directory may be imported from a client component: the keys
 * live here. The browser talks to `/api/ai/generate-preview` and never learns
 * which provider is configured, or whether one is configured at all beyond a
 * boolean.
 *
 * Adding a provider is one file plus one line in `PROVIDERS`. Removing every
 * provider is also supported, and is the default: with no key set the studio
 * shows the locally composited preview and the request flow carries on. That
 * path is not a degraded mode that somebody has to remember to test — it is
 * what the demo runs on.
 */

import type { DesignConfiguration } from '@/lib/data/design'

export interface GenerateInput {
  /** The customer's reference photograph, as a data URL. May be absent. */
  referenceImage: string | null
  /** The locally composited preview, as a data URL. May be absent. */
  previewImage: string | null
  configuration: DesignConfiguration
  /** The prompt, already assembled from the configuration. */
  prompt: string
}

export interface GenerateResult {
  /** A data URL of the generated image, or `null` if the provider produced none. */
  image: string | null
  /** For logs only — never returned to the browser. */
  detail?: string
}

export interface PreviewProvider {
  readonly id: string
  /** True when the environment holds everything this provider needs. */
  isConfigured(): boolean
  generate(input: GenerateInput): Promise<GenerateResult>
}

/* ------------------------------------------------------------------- helpers */

function splitDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const match = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl)
  return match ? { mediaType: match[1], data: match[2] } : null
}

/** 45s: image models are slow, but a hung request must not hold a lambda open. */
const TIMEOUT_MS = 45_000

async function postJson(url: string, body: unknown, headers: Record<string, string>) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

/* -------------------------------------------------------------------- Gemini */

/**
 * Google's image model edits an input image in place, which is exactly the shape
 * of this problem: keep the photograph, change the stone.
 */
const gemini: PreviewProvider = {
  id: 'gemini',

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY)
  },

  async generate({ referenceImage, previewImage, prompt }) {
    const key = process.env.GEMINI_API_KEY
    if (!key) return { image: null, detail: 'missing-key' }

    const model = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image'
    const parts: unknown[] = [{ text: prompt }]

    // The reference goes first so the model treats it as the piece to preserve,
    // and the local composite second as the colour target.
    for (const source of [referenceImage, previewImage]) {
      const parsed = source ? splitDataUrl(source) : null
      if (parsed) {
        parts.push({ inline_data: { mime_type: parsed.mediaType, data: parsed.data } })
      }
    }

    const response = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { contents: [{ role: 'user', parts }] },
      { 'x-goog-api-key': key },
    )

    if (!response.ok) {
      return { image: null, detail: `gemini-http-${response.status}` }
    }

    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { mimeType: string; data: string } }[] } }[]
    }

    for (const part of payload.candidates?.[0]?.content?.parts ?? []) {
      if (part.inlineData?.data) {
        return { image: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
      }
    }
    return { image: null, detail: 'gemini-no-image' }
  },
}

/* -------------------------------------------------------------------- OpenAI */

const openai: PreviewProvider = {
  id: 'openai',

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY)
  },

  async generate({ referenceImage, prompt }) {
    const key = process.env.OPENAI_API_KEY
    if (!key) return { image: null, detail: 'missing-key' }

    const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1'
    const parsed = referenceImage ? splitDataUrl(referenceImage) : null

    // The edits endpoint takes multipart, so the reference is rebuilt as a file.
    if (parsed) {
      const bytes = Buffer.from(parsed.data, 'base64')
      const form = new FormData()
      form.append('model', model)
      form.append('prompt', prompt)
      form.append('size', 'auto')
      form.append(
        'image',
        new Blob([new Uint8Array(bytes)], { type: parsed.mediaType }),
        'reference.jpg',
      )

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      let response: Response
      try {
        response = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { authorization: `Bearer ${key}` },
          body: form,
          signal: controller.signal,
        })
      } finally {
        clearTimeout(timer)
      }

      if (!response.ok) return { image: null, detail: `openai-http-${response.status}` }
      const payload = (await response.json()) as { data?: { b64_json?: string }[] }
      const b64 = payload.data?.[0]?.b64_json
      return b64 ? { image: `data:image/png;base64,${b64}` } : { image: null, detail: 'openai-no-image' }
    }

    const response = await postJson(
      'https://api.openai.com/v1/images/generations',
      { model, prompt, size: '1536x1024' },
      { authorization: `Bearer ${key}` },
    )
    if (!response.ok) return { image: null, detail: `openai-http-${response.status}` }
    const payload = (await response.json()) as { data?: { b64_json?: string }[] }
    const b64 = payload.data?.[0]?.b64_json
    return b64 ? { image: `data:image/png;base64,${b64}` } : { image: null, detail: 'openai-no-image' }
  },
}

/* ------------------------------------------------------------------ registry */

const PROVIDERS: PreviewProvider[] = [gemini, openai]

/**
 * The provider to use, or `null` when none is configured.
 *
 * `AI_PREVIEW_PROVIDER` pins a choice; otherwise the first configured provider
 * wins. Note that none of these names are `NEXT_PUBLIC_`: a key must never be
 * reachable from the bundle.
 */
export function resolveProvider(): PreviewProvider | null {
  const pinned = process.env.AI_PREVIEW_PROVIDER
  if (pinned) {
    const found = PROVIDERS.find((p) => p.id === pinned)
    return found?.isConfigured() ? found : null
  }
  return PROVIDERS.find((p) => p.isConfigured()) ?? null
}
