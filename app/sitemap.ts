import { MetadataRoute } from 'next'
import { products } from '@/lib/mock-data'

const baseUrl = 'https://kosii.netlify.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  const staticRoutes: MetadataRoute.Sitemap = (
    [
      { url: baseUrl, changeFrequency: 'monthly', priority: 1 },
      { url: `${baseUrl}/shop`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${baseUrl}/customize`, changeFrequency: 'monthly', priority: 0.9 },
      { url: `${baseUrl}/portfolio`, changeFrequency: 'monthly', priority: 0.7 },
      { url: `${baseUrl}/cart`, changeFrequency: 'monthly', priority: 0.4 },
      { url: `${baseUrl}/track-order`, changeFrequency: 'monthly', priority: 0.4 },
    ] satisfies MetadataRoute.Sitemap
  ).map((route) => ({ ...route, lastModified }))

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/shop/${product.slug}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
