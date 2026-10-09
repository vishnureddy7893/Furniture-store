'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Info, LayoutDashboard, ListChecks, Store } from 'lucide-react'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { DictKey } from '@/lib/i18n/dictionaries'

const links: { href: string; key: DictKey; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { href: '/admin', key: 'admin.nav.dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/requests', key: 'admin.nav.requests', icon: ListChecks },
  { href: '/', key: 'admin.nav.storefront', icon: Store, exact: true },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const pathname = usePathname()

  return (
    <main className="min-h-screen bg-sand-50">
      <div className="border-b border-sand-300 bg-white">
        <div className="container py-6 md:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-primary text-2xl font-semibold text-ink md:text-3xl">
                {t('admin.title')}
              </h1>
              <p className="mt-1 text-sm text-ink-soft">{t('admin.subtitle')}</p>
            </div>
            <span className="rounded-full bg-bronze px-3 py-1 text-[11px] font-semibold text-white">
              {t('common.demoBadge')}
            </span>
          </div>

          <nav className="mt-6 flex gap-1 overflow-x-auto no-scrollbar" aria-label={t('admin.title')}>
            {links.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href)
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-ink text-sand-50'
                      : 'text-ink-soft hover:bg-sand-200 hover:text-ink',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {t(link.key)}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="container py-8 md:py-10">
        <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-bronze/25 bg-bronze-wash px-4 py-3 text-sm text-bronze-deep">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('admin.demoNotice')}
        </p>
        {children}
      </div>
    </main>
  )
}
