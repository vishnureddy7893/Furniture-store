import Hero from '@/components/sections/Hero'
import FeaturedCollection from '@/components/sections/FeaturedCollection'
import CategoryGrid from '@/components/sections/CategoryGrid'
import CustomCta from '@/components/sections/CustomCta'
import CraftStory from '@/components/sections/CraftStory'
import SelectedWork from '@/components/sections/SelectedWork'
import Trust from '@/components/sections/Trust'

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturedCollection />
      <CategoryGrid />
      <CustomCta />
      <CraftStory />
      <SelectedWork />
      <Trust />
    </main>
  )
}
