'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import PieceScene from '@/components/marble/PieceScene'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { PROJECTS, PROJECT_KINDS, type ProjectKind } from '@/lib/data/portfolio'
import {
  baseById,
  marbleById,
  pieceById,
  shapeById,
} from '@/lib/data/configurator'
import { cn } from '@/lib/utils'

export default function PortfolioGrid() {
  const { t, l, num } = useI18n()
  const [filter, setFilter] = useState<ProjectKind | 'all'>('all')

  const projects = filter === 'all' ? PROJECTS : PROJECTS.filter((p) => p.kind === filter)

  return (
    <div className="container py-10 md:py-14">
      <div className="-mx-4 mb-8 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2" role="group" aria-label={t('portfolio.title')}>
          <Chip
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={t('portfolio.filter.all')}
          />
          {PROJECT_KINDS.map((kind) => (
            <Chip
              key={kind.id}
              active={filter === kind.id}
              onClick={() => setFilter(kind.id)}
              label={l(kind.name)}
            />
          ))}
        </div>
      </div>

      <ul className="grid gap-6 md:grid-cols-2">
        {/* See ShopBrowser: layout projection was measuring every card on
            mount. Enter/exit animation is unchanged. */}
        <AnimatePresence initial={false}>
          {projects.map((project) => {
            const { config } = project
            const depth = config.shape === 'round' ? config.dimensions.length : config.dimensions.width

            return (
              <motion.li
                key={project.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
              >
                <article className="group h-full overflow-hidden rounded-2xl border border-sand-300 bg-white">
                  <PieceScene
                    config={config}
                    view="scene"
                    label={l(project.title)}
                    className="scene-defer aspect-[16/10] w-full bg-sand-100 transition-transform duration-700 group-hover:scale-[1.03]"
                  />

                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                      <span>{l(project.location)}</span>
                      <span aria-hidden>·</span>
                      <bdi>{num(project.year)}</bdi>
                      <span aria-hidden>·</span>
                      <span>
                        {l(PROJECT_KINDS.find((k) => k.id === project.kind)!.name)}
                      </span>
                    </div>

                    <h2 className="mt-2 font-primary text-xl font-semibold leading-snug text-ink">
                      {l(project.title)}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                      {l(project.summary)}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-sand-200 pt-4 sm:grid-cols-4">
                      <Spec label={t('customize.step1')} value={l(pieceById(config.piece).name)} />
                      <Spec label={t('customize.step2')} value={l(marbleById(config.marble).name)} />
                      <Spec label={t('customize.step4')} value={l(baseById(config.base).name)} />
                      <Spec
                        label={t('customize.step3.shape')}
                        value={l(shapeById(config.shape).name)}
                      />
                      <div className="col-span-2 sm:col-span-4">
                        <dt className="text-[10px] uppercase tracking-wide text-ink-muted">
                          {t('customize.dimensions')}
                        </dt>
                        <dd dir="ltr" className="mt-0.5 text-sm font-medium text-ink">
                          {num(config.dimensions.length)} × {num(depth)} ×{' '}
                          {num(config.dimensions.height)} {t('pdp.cm')}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </article>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>

      <p className="mt-8 text-center text-xs text-ink-muted">{t('portfolio.demoNotice')}</p>

      <section className="mt-14 overflow-hidden rounded-3xl border border-sand-300 bg-verde p-8 text-center md:p-12">
        <h2 className="font-primary text-2xl font-semibold text-sand-50 md:text-3xl">
          {t('portfolio.cta.title')}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sand-200/90">{t('portfolio.cta.body')}</p>
        <Link href="/customize" className="btn mt-7 bg-sand-50 text-ink hover:bg-white">
          {t('nav.customize')}
          <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
        </Link>
      </section>
    </div>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

function Chip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'border-ink bg-ink text-sand-50'
          : 'border-sand-300 bg-white text-ink-soft hover:border-ink hover:text-ink',
      )}
    >
      {label}
    </button>
  )
}
