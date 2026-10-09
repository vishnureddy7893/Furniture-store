'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import Reveal from '@/components/ui/Reveal'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import type { DictKey } from '@/lib/i18n/dictionaries'
import type { PieceConfig } from '@/lib/data/configurator'

const points: DictKey[] = ['home.custom.point1', 'home.custom.point2', 'home.custom.point3']

const showcase: PieceConfig = {
  piece: 'console',
  marble: 'emperador',
  shape: 'soft',
  edge: 'beveled',
  base: 'architectural',
  dimensions: { length: 200, width: 45, height: 88 },
}

export default function CustomCta() {
  const { t } = useI18n()

  return (
    <section className="container py-16 md:py-24">
      <Reveal className="overflow-hidden rounded-3xl border border-sand-300 bg-verde">
        <div className="grid items-center gap-0 lg:grid-cols-2">
          <div className="p-8 md:p-12 lg:p-14">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-sand-300">
              {t('home.custom.eyebrow')}
            </p>
            <h2 className="mt-4 font-primary text-3xl font-semibold leading-tight text-sand-50 md:text-4xl">
              {t('home.custom.title')}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-sand-200/90">
              {t('home.custom.body')}
            </p>

            <ul className="mt-7 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-sand-100">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand-50/15">
                    <Check className="h-3 w-3 text-sand-50" aria-hidden />
                  </span>
                  {t(point)}
                </li>
              ))}
            </ul>

            <Link
              href="/customize"
              className="btn mt-9 bg-sand-50 text-ink hover:bg-white"
            >
              {t('home.custom.cta')}
              <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
            </Link>
          </div>

          <div className="relative h-full min-h-[18rem] bg-verde-soft">
            <PieceScene config={showcase} view="scene" className="h-full w-full" />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
