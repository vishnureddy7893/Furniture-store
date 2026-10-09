'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/ui/ProductCard'
import SectionHeading from '@/components/ui/SectionHeading'
import Reveal from '@/components/ui/Reveal'
import { featuredProducts } from '@/lib/mock-data'
import { useI18n } from '@/lib/i18n/LocaleProvider'

export default function FeaturedCollection() {
  const { t } = useI18n()
  const items = featuredProducts(6)

  return (
    <section className="container py-16 md:py-24" id="collection">
      <SectionHeading
        eyebrow={t('home.featured.eyebrow')}
        title={t('home.featured.title')}
        body={t('home.featured.body')}
        action={
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-bronze-deep"
          >
            {t('home.featured.viewAll')}
            <ArrowRight className="h-4 w-4 rtl-flip" aria-hidden />
          </Link>
        }
      />

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product, index) => (
          <Reveal as="li" key={product.id} delay={index * 0.06}>
            <ProductCard product={product} className="h-full" />
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
