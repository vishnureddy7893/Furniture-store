import type { Metadata } from 'next'
import { IBM_Plex_Sans_Arabic, Montserrat, Roboto } from 'next/font/google'
import './globals.css'
import { StructuredData } from '@/components/StructuredData'
import Header from '@/components/layouts/Header'
import Footer from '@/components/layouts/Footer'
import { LocaleProvider } from '@/lib/i18n/LocaleProvider'
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, dirFor } from '@/lib/i18n/config'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})

// Arabic is the primary experience, so it gets a real Arabic typeface rather
// than a Latin font falling back to a system Arabic default.
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'مصنع المنارات الأنيقة للرخام والحجر | AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
    template: '%s | مصنع المنارات الأنيقة للرخام والحجر',
  },
  description:
    'طاولات وكونسولات من الرخام الطبيعي، جاهزة أو مُفصّلة حسب مقاسك. — Natural marble tables and consoles, ready-made or made to order.',
  keywords: [
    'رخام',
    'أثاث رخام',
    'طاولات رخام',
    'تفصيل رخام',
    'marble furniture',
    'marble dining table',
    'Saudi marble',
    'custom marble',
  ],
  authors: [{ name: 'AL MANARAT AL ANEEQA FACTORY MARBLE & STONE' }],
  creator: 'AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
  publisher: 'AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
  formatDetection: { email: false, address: false, telephone: false },
  metadataBase: new URL('https://kosii.netlify.app'),
  alternates: {
    canonical: '/',
    languages: { ar: '/', en: '/' },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/favicon-180x180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    alternateLocale: ['en_US'],
    url: 'https://kosii.netlify.app',
    siteName: 'AL MANARAT AL ANEEQA FACTORY MARBLE & STONE',
    title: 'مصنع المنارات الأنيقة للرخام والحجر',
    description: 'طاولات وكونسولات من الرخام الطبيعي، جاهزة أو مُفصّلة حسب مقاسك.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مصنع المنارات الأنيقة للرخام والحجر',
    description: 'طاولات وكونسولات من الرخام الطبيعي، جاهزة أو مُفصّلة حسب مقاسك.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

/**
 * Applies the stored locale before first paint so an English visitor never
 * sees an Arabic/RTL flash. `LocaleProvider` takes over after hydration.
 */
const localeBootstrap = `(function(){try{var q=new URLSearchParams(location.search).get('lang');var l=(q==='en'||q==='ar')?q:localStorage.getItem('${LOCALE_STORAGE_KEY}');if(l==='en'||l==='ar'){var d=document.documentElement;d.lang=l;d.dir=l==='ar'?'rtl':'ltr';}}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={dirFor(DEFAULT_LOCALE)}
      className={`${montserrat.variable} ${roboto.variable} ${arabic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <StructuredData />
        <script dangerouslySetInnerHTML={{ __html: localeBootstrap }} />
      </head>
      <body className="font-secondary antialiased">
        <LocaleProvider>
          <Header />
          {children}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  )
}
