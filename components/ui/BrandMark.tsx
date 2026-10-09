'use client'

import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

type BrandSize = 'sm' | 'md' | 'lg'

interface BrandMarkProps {
  size?: BrandSize
  /** Hide the wordmark and show only the logo (very tight spaces). */
  logoOnly?: boolean
  className?: string
}

/**
 * The mark is tall (840 x 1306), so it is sized by height with the width left
 * to follow. Fixing both would letterbox it inside `object-contain`.
 */
const logoSize: Record<BrandSize, string> = {
  // Narrow phones (<400px) step down slightly so the lockup plus the two
  // header controls still clear 375px without overflowing.
  sm: 'h-10 w-auto min-[400px]:h-11', // 40 -> 44px — mobile header and drawer
  md: 'h-14 w-auto', // 56px — desktop header
  // Footer: full presence on desktop, stepped down so it clears 375px.
  lg: 'h-12 w-auto min-[400px]:h-14 sm:h-16', // 48 -> 56 -> 64px — footer
}

/** The company name, the dominant line of the lockup. */
const line1Type: Record<BrandSize, string> = {
  sm: 'text-[13.5px] min-[400px]:text-[15px]',
  md: 'text-[19px]',
  lg: 'text-[17px] min-[400px]:text-[19px] sm:text-[21px]',
}

/** The descriptor line, set smaller and more widely spaced beneath it. */
const line2Type: Record<BrandSize, string> = {
  sm: 'text-[11px] min-[400px]:text-[12.5px]',
  md: 'text-[16px]',
  lg: 'text-[13.5px] min-[400px]:text-[15px] sm:text-[17px]',
}

const gap: Record<BrandSize, string> = {
  sm: 'gap-2 min-[400px]:gap-2.5',
  md: 'gap-3.5',
  lg: 'gap-3 sm:gap-4',
}

/** Latin letter-spacing, tightened on narrow phones to buy back width. */
const line1Track: Record<BrandSize, string> = {
  sm: 'tracking-[0.03em] min-[400px]:tracking-[0.055em]',
  md: 'tracking-[0.055em]',
  lg: 'tracking-[0.04em] sm:tracking-[0.055em]',
}

const line2Track: Record<BrandSize, string> = {
  sm: 'tracking-[0.07em] min-[400px]:tracking-[0.09em]',
  md: 'tracking-[0.105em]',
  lg: 'tracking-[0.08em] sm:tracking-[0.105em]',
}

/**
 * The company lockup: the official logo plus the official registered company
 * name, set on the two lines the company itself uses.
 *
 * Both name versions are official — neither is a translation of the other — so
 * the wording is never shortened or altered; it is read straight from the
 * dictionary, which means switching language switches the company name along
 * with the rest of the site. Direction comes from the document, so the logo
 * sits at the inline start in both Arabic (right) and English (left).
 */
export default function BrandMark({ size = 'md', logoOnly = false, className }: BrandMarkProps) {
  const { t, locale } = useI18n()
  const isArabic = locale === 'ar'

  return (
    <span className={cn('flex items-center', gap[size], className)}>
      {/* The official supplied logo, identical in both languages. A plain
          <img> on purpose: next/image would need `dangerouslyAllowSVG` and
          gives a vector nothing. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand-logo.svg"
        alt=""
        aria-hidden
        className={cn('shrink-0 object-contain', logoSize[size])}
      />

      {!logoOnly && (
        <span className="flex flex-col justify-center text-start">
          <span
            className={cn(
              'whitespace-nowrap font-primary font-semibold text-ink',
              line1Type[size],
              // Latin gets the spacing of the printed lockup; Arabic never
              // takes letter-spacing, which would break its joins.
              isArabic ? 'leading-[1.35]' : `leading-[1.15] ${line1Track[size]}`,
            )}
          >
            {t('brand.nameLine1')}
          </span>
          <span
            className={cn(
              'whitespace-nowrap font-primary font-medium text-ink-soft',
              line2Type[size],
              isArabic ? 'leading-[1.4]' : `mt-0.5 leading-[1.15] ${line2Track[size]}`,
            )}
          >
            {t('brand.nameLine2')}
          </span>
        </span>
      )}
    </span>
  )
}
