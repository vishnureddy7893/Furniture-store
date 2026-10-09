/**
 * Minimal, honest structured data for the demo: no invented address, phone
 * number or opening hours — only facts the demo itself establishes.
 */
export function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    name: 'AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
    alternateName: 'مصنع المنارات الأنيقة للرخام والحجر',
    description:
      'طاولات وكونسولات من الرخام الطبيعي، جاهزة أو مُفصّلة حسب المقاس. Natural marble tables and consoles, ready-made or made to order.',
    url: 'https://kosii.netlify.app',
    inLanguage: ['ar', 'en'],
    areaServed: { '@type': 'Country', name: 'Saudi Arabia' },
    currenciesAccepted: 'SAR',
    priceRange: '2000–7500 SAR',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
