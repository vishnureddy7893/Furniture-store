import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/checkout', '/order-success', '/api/'],
      },
    ],
    sitemap: 'https://kosii.netlify.app/sitemap.xml',
  }
}
