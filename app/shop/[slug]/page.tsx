import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProductDetail from '@/components/shop/ProductDetail'
import { productBySlug, products } from '@/lib/mock-data'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = productBySlug(slug)
  if (!product) return { title: 'Not found' }

  return {
    title: `${product.name.ar} | ${product.name.en}`,
    description: product.description.ar,
    openGraph: {
      title: `${product.name.ar} | ${product.name.en}`,
      description: product.description.ar,
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = productBySlug(slug)
  if (!product) notFound()

  return <ProductDetail product={product} />
}
