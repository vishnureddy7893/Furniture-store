'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { animate, stagger } from 'animejs'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import type { PieceConfig } from '@/lib/data/configurator'

const heroPiece: PieceConfig = {
  piece: 'dining',
  marble: 'calacatta',
  shape: 'oval',
  edge: 'bullnose',
  base: 'pedestal',
  dimensions: { length: 260, width: 115, height: 75 },
}

const stats: { value: number; key: 'home.hero.stat1' | 'home.hero.stat2' | 'home.hero.stat3' }[] = [
  { value: 6, key: 'home.hero.stat1' },
  { value: 140, key: 'home.hero.stat2' },
  { value: 8, key: 'home.hero.stat3' },
]

/**
 * Cinematic moment #1 (Anime.js): the headline is split into words that rise
 * out of a clipping mask, the way a slab is revealed as it is lifted.
 * Everything else on the page uses Motion.
 */
export default function Hero() {
  const { t, num, locale } = useI18n()
  const headlineRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = headlineRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const words = root.querySelectorAll<HTMLElement>('[data-word]')
    if (!words.length) return

    const animation = animate(words, {
      y: ['110%', '0%'],
      opacity: [0, 1],
      duration: 900,
      delay: stagger(70, { start: 120 }),
      ease: 'out(3)',
    })

    return () => {
      animation.revert()
    }
    // Re-runs when the language changes, since the words themselves change.
  }, [locale])

  const lines = [t('home.hero.titleTop'), t('home.hero.titleBottom')]

  return (
    <section className="relative overflow-hidden border-b border-sand-300 bg-sand-100">
      <div className="stone-grain pointer-events-none absolute inset-0 opacity-60" aria-hidden />

      <div className="container relative grid items-center gap-10 py-14 md:py-20 lg:grid-cols-12 lg:gap-12 lg:py-24">
        <div className="lg:col-span-6">
          <p className="eyebrow mb-5">{t('home.hero.eyebrow')}</p>

          <h1
            ref={headlineRef}
            className="font-primary text-4xl font-semibold leading-[1.12] text-ink sm:text-5xl lg:text-6xl"
          >
            {lines.map((line, lineIndex) => (
              <span key={lineIndex} className="block overflow-hidden py-0.5">
                {line.split(' ').map((word, wordIndex) => (
                  <span
                    key={`${lineIndex}-${wordIndex}`}
                    data-word
                    className="inline-block will-change-transform"
                  >
                    {word}
                    {wordIndex < line.split(' ').length - 1 && <span>&nbsp;</span>}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-soft md:text-lg">
            {t('home.hero.body')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="btn-primary">
              {t('home.hero.primaryCta')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>
            <Link href="/customize" className="btn-secondary">
              {t('home.hero.secondaryCta')}
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-sand-300 pt-8">
            {stats.map((stat) => (
              <div key={stat.key}>
                <dt className="sr-only">{t(stat.key)}</dt>
                <dd>
                  <bdi className="block font-primary text-2xl font-semibold text-ink md:text-3xl">
                    {num(stat.value)}
                    {stat.value > 100 && '+'}
                  </bdi>
                  <span className="mt-1 block text-xs leading-snug text-ink-muted">
                    {t(stat.key)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6">
          <div className="relative overflow-hidden rounded-3xl border border-sand-300 bg-white shadow-stone">
            <PieceScene
              config={heroPiece}
              view="scene"
              label={t('home.hero.titleTop')}
              className="aspect-[4/3] w-full"
            />
            <div className="absolute bottom-4 start-4 rounded-full bg-white/85 px-3.5 py-1.5 text-xs font-medium text-ink backdrop-blur-sm">
              {t('customize.previewNote')}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            {(['crema', 'bardiglio', 'nero'] as const).map((marble) => (
              <div
                key={marble}
                className="overflow-hidden rounded-2xl border border-sand-300"
              >
                <PieceScene
                  config={{ ...heroPiece, marble }}
                  view="stone"
                  className="aspect-[3/2] w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
