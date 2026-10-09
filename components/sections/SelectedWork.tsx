'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { PROJECTS } from '@/lib/data/portfolio'
import { useI18n } from '@/lib/i18n/LocaleProvider'

export default function SelectedWork() {
  const { t, l, num } = useI18n()
  const projects = PROJECTS.slice(0, 3)

  return (
    <section className="container py-16 md:py-24">
      <SectionHeading
        eyebrow={t('home.portfolio.eyebrow')}
        title={t('home.portfolio.title')}
        body={t('home.portfolio.body')}
        action={
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-bronze-deep"
          >
            {t('common.viewAll')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        }
      />

      <ul className="grid gap-6 md:grid-cols-3">
        {projects.map((project, index) => (
          <Reveal as="li" key={project.id} delay={index * 0.07}>
            <article className="group h-full overflow-hidden rounded-2xl border border-sand-300 bg-white">
              <PieceScene
                config={project.config}
                view="scene"
                className="scene-defer aspect-[4/3] w-full transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="p-5">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                  <span>{l(project.location)}</span>
                  <span aria-hidden>·</span>
                  <bdi>{num(project.year)}</bdi>
                </div>
                <h3 className="mt-2 font-primary text-lg font-semibold leading-snug text-ink">
                  {l(project.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{l(project.summary)}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
