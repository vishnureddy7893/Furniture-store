'use client'

import { useEffect, useState } from 'react'

/**
 * True only after the first client render.
 *
 * The custom-request store is persisted to localStorage, so its contents can
 * differ from what the server rendered. Gating on this avoids a hydration
 * mismatch without disabling SSR for the whole route.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
