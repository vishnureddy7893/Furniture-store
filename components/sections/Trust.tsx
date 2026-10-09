'use client'

import { Gem, Quote, Ruler, Truck, UserRound } from 'lucide-react'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { TESTIMONIALS } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import type { DictKey } from '@/lib/i18n/dictionaries'

const points: { icon: typeof Gem; title: DictKey; body: DictKey }[] = [
  { icon: Gem, title: 'home.trust.point1.title', body: 'home.trust.point1.body' },
  { icon: Ruler, title: 'home.trust.point2.title', body: 'home.trust.point2.body' },
  { icon: Truck, title: 'home.trust.point3.title', body: 'home.trust.point3.body' },
  { icon: UserRound, title: 'home.trust.point4.title', body: 'home.trust.point4.body' },
]

export default function Trust() {
  const { t, l } = useI18n()

  return (
    <section className="border-t border-sand-300 bg-sand-50 py-16 md:py-24">
      <div className="container">
        <SectionHeading
          eyebrow={t('home.trust.eyebrow')}
          title={t('home.trust.title')}
          align="center"
        />

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {points.map((point, index) => {
            const Icon = point.icon
            return (
              <Reveal as="li" key={point.title} delay={index * 0.05}>
                <div className="h-full rounded-2xl border border-sand-300 bg-white p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bronze-wash text-bronze-deep">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-primary text-base font-semibold text-ink">
                    {t(point.title)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t(point.body)}</p>
                </div>
              </Reveal>
            )
          })}
        </ul>

        <h3 className="mt-16 text-center font-primary text-2xl font-semibold text-ink">
          {t('home.testimonials.title')}
        </h3>

        <ul className="mt-8 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <Reveal as="li" key={item.id} delay={index * 0.06}>
              <figure className="h-full rounded-2xl border border-sand-300 bg-white p-6">
                <Quote className="h-5 w-5 rtl-flip text-bronze" aria-hidden />
                <blockquote className="mt-4 text-sm leading-relaxed text-ink">
                  {l(item.quote)}
                </blockquote>
                <figcaption className="mt-4 border-t border-sand-200 pt-4">
                  <span className="block text-sm font-semibold text-ink">{l(item.author)}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{l(item.role)}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>

        <p className="mt-6 text-center text-xs text-ink-muted">{t('home.testimonials.note')}</p>
      </div>
    </section>
  )
}
