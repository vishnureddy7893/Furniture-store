export const LOCALES = ['ar', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** Arabic is the primary experience. */
export const DEFAULT_LOCALE: Locale = 'ar'

export const LOCALE_STORAGE_KEY = 'kosi-locale'

export type Direction = 'rtl' | 'ltr'

/** A piece of content that exists in both languages. */
export interface Localized {
  ar: string
  en: string
}

export function dirFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr'
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Read one side of a `Localized` value. */
export function pick(value: Localized, locale: Locale): string {
  return value[locale]
}

/**
 * Saudi ecommerce convention: Arabic UI, Western (latn) digits.
 * `ar-SA` alone would render Eastern Arabic numerals, which Saudi storefronts
 * generally do not use for prices.
 */
const numberLocale: Record<Locale, string> = {
  ar: 'ar-SA-u-nu-latn',
  en: 'en-US',
}

export function formatNum(value: number, locale: Locale, fractionDigits = 0): string {
  return new Intl.NumberFormat(numberLocale[locale], {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** Prices are always SAR in this demo. */
export function formatSAR(value: number, locale: Locale): string {
  const amount = formatNum(value, locale, Number.isInteger(value) ? 0 : 2)
  return locale === 'ar' ? `${amount} ر.س` : `SAR ${amount}`
}

export function formatDate(value: string | number | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(value: string | number | Date, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
