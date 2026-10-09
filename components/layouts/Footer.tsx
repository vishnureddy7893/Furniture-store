'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Instagram, Mail, MapPin, Phone } from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { CATEGORIES } from '@/lib/mock-data'
import type { DictKey } from '@/lib/i18n/dictionaries'

const exploreLinks: { key: DictKey; href: string }[] = [
  { key: 'nav.shop', href: '/shop' },
  { key: 'nav.customize', href: '/customize' },
  { key: 'nav.portfolio', href: '/portfolio' },
  { key: 'nav.admin', href: '/admin' },
]

const supportLinks: { key: DictKey; href: string }[] = [
  { key: 'success.trackOrder', href: '/track-order' },
  { key: 'footer.shipping', href: '/track-order' },
  { key: 'footer.care', href: '/portfolio' },
  { key: 'footer.faq', href: '/track-order' },
]

export default function Footer() {
  const { t, l } = useI18n()
  const [subscribed, setSubscribed] = useState(false)

  return (
    <footer className="mt-24 border-t border-sand-300 bg-sand-50">
      <div className="container py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-4">
            <BrandMark size="lg" />
            <p className="mt-3 text-sm text-bronze-deep">{t('brand.tagline')}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {t('footer.about')}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-ink-soft">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-bronze" aria-hidden />
                <span>{l({ ar: 'الرياض، المملكة العربية السعودية', en: 'Riyadh, Saudi Arabia' })}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-bronze" aria-hidden />
                <span dir="ltr">+966 5X XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-bronze" aria-hidden />
                <span dir="ltr">info@almanarat-aneeqa.demo</span>
              </li>
            </ul>
          </div>

          {/* Explore */}
          <nav className="lg:col-span-2" aria-label={t('footer.explore')}>
            <h2 className="eyebrow mb-4">{t('footer.explore')}</h2>
            <ul className="space-y-2.5 text-sm">
              {exploreLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-ink-soft transition-colors hover:text-ink">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Categories */}
          <nav className="lg:col-span-3" aria-label={t('home.categories.title')}>
            <h2 className="eyebrow mb-4">{t('home.categories.title')}</h2>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 5).map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="text-ink-soft transition-colors hover:text-ink"
                  >
                    {l(category.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Newsletter + support */}
          <div className="lg:col-span-3">
            <h2 className="eyebrow mb-4">{t('footer.newsletter')}</h2>
            <p className="mb-3 text-sm text-ink-soft">{t('footer.newsletterBody')}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setSubscribed(true)
              }}
              className="flex gap-2"
            >
              <label htmlFor="footer-email" className="sr-only">
                {t('footer.emailPlaceholder')}
              </label>
              <input
                id="footer-email"
                type="email"
                required
                dir="ltr"
                placeholder={t('footer.emailPlaceholder')}
                className="field py-2.5 text-sm"
              />
              <button
                type="submit"
                aria-label={t('footer.subscribe')}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink text-sand-50 transition-colors hover:bg-ink-soft"
              >
                <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
              </button>
            </form>
            {subscribed && (
              <p className="mt-2 text-xs font-medium text-verde" role="status">
                {t('footer.subscribed')}
              </p>
            )}

            <h2 className="eyebrow mb-3 mt-8">{t('footer.support')}</h2>
            <ul className="space-y-2.5 text-sm">
              {supportLinks.map((link) => (
                <li key={link.key}>
                  <Link href={link.href} className="text-ink-soft transition-colors hover:text-ink">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-bronze/20 bg-bronze-wash px-4 py-3">
          <p className="text-xs leading-relaxed text-bronze-deep">
            <span className="me-2 rounded bg-bronze px-1.5 py-0.5 font-semibold text-white">
              {t('common.demoBadge')}
            </span>
            {t('footer.demoDisclaimer')}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-sand-300 pt-8 text-xs text-ink-muted sm:flex-row">
          <p className="text-center sm:text-start">
            © {new Date().getFullYear()} {t('brand.name')} — {t('footer.rights')}
          </p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-2 transition-colors hover:text-ink"
          >
            <Instagram className="h-4 w-4" aria-hidden />
            Instagram
          </a>
        </div>
      </div>
    </footer>
  )
}
