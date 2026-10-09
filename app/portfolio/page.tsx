import type { Metadata } from 'next'
import PageIntro from '@/components/shop/PageIntro'
import PortfolioGrid from '@/components/portfolio/PortfolioGrid'

export const metadata: Metadata = {
  title: 'أعمالنا | Custom Work',
  description:
    'قطع رخام مُفصّلة نفّذناها لمساحات سكنية وتجارية — Made-to-order marble pieces for homes and commercial spaces.',
}

export default function PortfolioPage() {
  return (
    <main>
      <PageIntro
        title="portfolio.title"
        subtitle="portfolio.subtitle"
        eyebrow="home.portfolio.eyebrow"
      />
      <PortfolioGrid />
    </main>
  )
}
