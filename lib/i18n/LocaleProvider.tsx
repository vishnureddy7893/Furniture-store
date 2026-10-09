'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  dirFor,
  formatDate,
  formatDateTime,
  formatNum,
  formatSAR,
  isLocale,
  type Direction,
  type Locale,
  type Localized,
} from './config'
import { dictionaries, type DictKey } from './dictionaries'

type Vars = Record<string, string | number>

interface I18nValue {
  locale: Locale
  dir: Direction
  isRTL: boolean
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  /** Translate a dictionary key, filling `{placeholders}`. */
  t: (key: DictKey, vars?: Vars) => string
  /** Read the current language out of a `Localized` value. */
  l: (value: Localized) => string
  price: (value: number) => string
  num: (value: number, fractionDigits?: number) => string
  date: (value: string | number | Date) => string
  dateTime: (value: string | number | Date) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  )
}

/**
 * Direction is owned by the document, not by individual components: this
 * provider is the only place that writes `lang` / `dir` on <html>.
 * The matching pre-paint script lives in `app/layout.tsx`.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Pick up the visitor's choice after hydration. `?lang=en` wins over the
  // stored value, so a demo can be linked directly in either language.
  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get('lang')
    if (isLocale(override)) {
      setLocale(override)
      return
    }
    try {
      const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
      if (isLocale(stored) && stored !== locale) setLocaleState(stored)
    } catch {
      /* storage unavailable — stay on the default locale */
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.lang = locale
    root.dir = dirFor(locale)
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[locale]
    return {
      locale,
      dir: dirFor(locale),
      isRTL: locale === 'ar',
      setLocale,
      toggleLocale: () => setLocale(locale === 'ar' ? 'en' : 'ar'),
      t: (key, vars) => interpolate(dict[key], vars),
      l: (localized) => localized[locale],
      price: (v) => formatSAR(v, locale),
      num: (v, fractionDigits) => formatNum(v, locale, fractionDigits),
      date: (v) => formatDate(v, locale),
      dateTime: (v) => formatDateTime(v, locale),
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <LocaleProvider>')
  return ctx
}
