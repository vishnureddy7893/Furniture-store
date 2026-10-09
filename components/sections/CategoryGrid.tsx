'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { CATEGORIES, productsByCategory } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/LocaleProvider'

export default function CategoryGrid() {
  const { t, l, num } = useI18n()

  return (
    <section className="border-y border-sand-300 bg-sand-50 py-16 md:py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t('home.categories.eyebrow')}
          title={t('home.categories.title')}
          body={t('home.categories.body')}
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category, index) => {
            const count = productsByCategory(category.slug).length
            return (
              <Reveal as="li" key={category.slug} delay={index * 0.05}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-sand-300 bg-white transition-all duration-300 hover:border-bronze/40 hover:shadow-stone"
                >
                  <PieceScene
                    config={category.config}
                    view="scene"
                    className="scene-defer aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-primary text-lg font-semibold text-ink">
                        {l(category.name)}
                      </h3>
                      <span className="shrink-0 rounded-full bg-sand-200 px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                        {t('home.categories.count', { count: num(count) })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {l(category.description)}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-bronze-deep">
                      {t('nav.shop')}
                      <ArrowRight
                        className="h-3.5 w-3.5 rtl-flip transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
