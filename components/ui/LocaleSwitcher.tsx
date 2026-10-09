'use client'

import { LOCALES, type Locale } from '@/lib/i18n/config'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const labels: Record<Locale, string> = { ar: 'العربية', en: 'EN' }

export default function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-sand-300 bg-white/70 p-0.5',
        className,
      )}
      role="group"
      aria-label={t('common.language')}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            locale === code
              ? 'bg-ink text-sand-50'
              : 'text-ink-soft hover:text-ink',
          )}
        >
          {labels[code]}
        </button>
      ))}
    </div>
  )
}
