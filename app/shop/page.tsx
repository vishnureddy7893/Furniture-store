import { Suspense } from 'react'
import type { Metadata } from 'next'
import PageIntro from '@/components/shop/PageIntro'
import ShopBrowser from '@/components/shop/ShopBrowser'

export const metadata: Metadata = {
  title: 'المتجر | Shop',
  description: 'قطع من الرخام الطبيعي جاهزة للطلب — Natural marble pieces ready to order.',
}

export default function ShopPage() {
  return (
    <main>
      <PageIntro title="shop.title" subtitle="shop.subtitle" eyebrow="home.featured.eyebrow" />
      <div className="container py-10 md:py-14">
        <Suspense fallback={null}>
          <ShopBrowser />
        </Suspense>
      </div>
    </main>
  )
}
