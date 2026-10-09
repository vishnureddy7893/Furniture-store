'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import Reveal from '@/components/ui/Reveal'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { MARBLES } from '@/lib/data/configurator'
import type { DictKey } from '@/lib/i18n/dictionaries'
import type { PieceConfig } from '@/lib/data/configurator'

const steps: { title: DictKey; body: DictKey }[] = [
  { title: 'home.story.point1.title', body: 'home.story.point1.body' },
  { title: 'home.story.point2.title', body: 'home.story.point2.body' },
  { title: 'home.story.point3.title', body: 'home.story.point3.body' },
]

const detail: PieceConfig = {
  piece: 'dining',
  marble: 'calacatta',
  shape: 'rectangle',
  edge: 'beveled',
  base: 'stone',
  dimensions: { length: 240, width: 105, height: 75 },
}

export default function CraftStory() {
  const { t, l, num } = useI18n()

  return (
    <section className="border-y border-sand-300 bg-sand-50 py-16 md:py-24" id="story">
      <div className="container grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-4">{t('home.story.eyebrow')}</p>
            <h2 className="font-primary text-3xl font-semibold leading-tight text-ink md:text-4xl">
              {t('home.story.title')}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-ink-soft">{t('home.story.body')}</p>
            <Link
              href="/portfolio"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-bronze-deep"
            >
              {t('home.story.cta')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-2xl border border-sand-300">
            <PieceScene config={detail} view="edge" className="aspect-[16/10] w-full" />
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ol className="space-y-6">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.title} delay={index * 0.08}>
                <div className="flex gap-5 rounded-2xl border border-sand-300 bg-white p-6">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bronze-wash font-primary text-sm font-semibold text-bronze-deep"
                  >
                    {num(index + 1)}
                  </span>
                  <div>
                    <h3 className="font-primary text-lg font-semibold text-ink">
                      {t(step.title)}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t(step.body)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>

          {/* The stones themselves, straight from the configurator data. */}
          <Reveal delay={0.16} className="mt-6 rounded-2xl border border-sand-300 bg-white p-6">
            <h3 className="eyebrow mb-4">{t('customize.step2')}</h3>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {MARBLES.map((marble) => (
                <li key={marble.id} className="text-center">
                  <span className="block overflow-hidden rounded-xl border border-sand-300">
                    <PieceScene
                      config={{ ...detail, marble: marble.id }}
                      view="stone"
                      className="aspect-square w-full"
                    />
                  </span>
                  <span className="mt-2 block text-[11px] leading-tight text-ink-soft">
                    {l(marble.name)}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
