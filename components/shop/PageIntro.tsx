'use client'

import { useI18n } from '@/lib/i18n/LocaleProvider'
import type { DictKey } from '@/lib/i18n/dictionaries'

/**
 * Bilingual page header used by the shop, portfolio and configurator routes,
 * so those pages can stay server components apart from this strip.
 */
export default function PageIntro({
  title,
  subtitle,
  eyebrow,
}: {
  title: DictKey
  subtitle?: DictKey
  eyebrow?: DictKey
}) {
  const { t } = useI18n()

  return (
    <header className="border-b border-sand-300 bg-sand-50">
      <div className="container py-12 md:py-16">
        {eyebrow && <p className="eyebrow mb-3">{t(eyebrow)}</p>}
        <h1 className="font-primary text-3xl font-semibold text-ink md:text-5xl">{t(title)}</h1>
        {subtitle && (
          <p className="mt-4 max-w-xl text-base text-ink-soft md:text-lg">{t(subtitle)}</p>
        )}
      </div>
    </header>
  )
}
