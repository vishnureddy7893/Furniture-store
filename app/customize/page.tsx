import type { Metadata } from 'next'
import PageIntro from '@/components/shop/PageIntro'
import Configurator from '@/components/configurator/Configurator'

export const metadata: Metadata = {
  title: 'صمّم قطعتك | Design Your Piece',
  description:
    'ارفع صورة القطعة التي تريدها، واختر الرخام والمقاس والحافة والقاعدة والتشطيب مع معاينة مباشرة — Upload a reference photograph and see it in your stone, at your measurements, with a live preview.',
}

export default function CustomizePage() {
  return (
    <main>
      <PageIntro
        title="customize.title"
        subtitle="customize.subtitle"
        eyebrow="home.custom.eyebrow"
      />
      <Configurator />
    </main>
  )
}
