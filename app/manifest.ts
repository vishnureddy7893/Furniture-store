import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'مصنع المنارات الأنيقة للرخام والحجر — AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
    short_name: 'مصنع المنارات الأنيقة للرخام والحجر',
    description: 'طاولات وكونسولات من الرخام الطبيعي، جاهزة أو مُفصّلة حسب مقاسك.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    display: 'standalone',
    background_color: '#F6F2EC',
    theme_color: '#1E1B18',
    // Only icons that actually exist in /public, so nothing 404s.
    icons: [
      { src: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: '/favicon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
