'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import BrandMark from '@/components/ui/BrandMark'
import { useI18n } from '@/lib/i18n/LocaleProvider'
import { useHydrated } from '@/lib/hooks/useHydrated'
import LocaleSwitcher from '@/components/ui/LocaleSwitcher'
import PieceScene from '@/components/marble/PieceScene'
import type { DictKey } from '@/lib/i18n/dictionaries'
import { cn } from '@/lib/utils'

const navLinks: { key: DictKey; href: string }[] = [
  { key: 'nav.shop', href: '/shop' },
  { key: 'nav.customize', href: '/customize' },
  { key: 'nav.portfolio', href: '/portfolio' },
  { key: 'nav.admin', href: '/admin' },
]

export default function Header() {
  const { t, l, price } = useI18n()
  const pathname = usePathname()
  const store = useCartStore()
  const hydrated = useHydrated()
  const { increaseQuantity, decreaseQuantity, removeFromCart } = store
  // Before rehydration the persisted cart is unknown, so render it as empty
  // — matching the server output — and fill it in on the next tick.
  const cartItems = hydrated ? store.cartItems : []
  const totalQuantity = hydrated ? store.totalQuantity : 0
  const totalPrice = hydrated ? store.totalPrice : 0

  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const cartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close the overlays whenever navigation happens.
  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsCartOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setIsMobileMenuOpen(false)
      setIsCartOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        isScrolled
          ? 'border-sand-300 bg-sand-50/90 backdrop-blur-md'
          : 'border-transparent bg-sand-100',
      )}
    >
      <div className="container flex h-[88px] items-center justify-between gap-4 md:h-[104px]">
        {/* Brand */}
        <Link href="/" aria-label={t('brand.name')} className="shrink-0">
          <BrandMark size="sm" className="md:hidden" />
          <BrandMark size="md" className="hidden md:flex" />
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label={t('nav.menu')}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'relative text-sm font-medium transition-colors hover:text-ink',
                isActive(link.href) ? 'text-ink' : 'text-ink-soft',
              )}
            >
              {t(link.key)}
              {isActive(link.href) && (
                <span className="absolute -bottom-1.5 inset-x-0 block h-px bg-bronze" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <LocaleSwitcher className="hidden sm:inline-flex" />

          {/* Mini cart */}
          <div className="relative" ref={cartRef}>
            <button
              type="button"
              onClick={() => setIsCartOpen((v) => !v)}
              aria-expanded={isCartOpen}
              aria-label={`${t('common.cart')} (${totalQuantity})`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 bg-white text-ink transition-colors hover:border-ink"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              {totalQuantity > 0 && (
                <span className="absolute -top-1 -end-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bronze px-1 text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
            </button>

            {isCartOpen && (
              <div className="absolute end-0 top-12 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-stone-lg">
                <div className="flex items-center justify-between border-b border-sand-200 px-4 py-3">
                  <p className="font-semibold text-ink">{t('common.cart')}</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    aria-label={t('common.close')}
                    className="text-ink-muted hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-ink-soft">{t('cart.empty.body')}</p>
                  </div>
                ) : (
                  <>
                    <ul className="max-h-72 divide-y divide-sand-200 overflow-y-auto">
                      {cartItems.map((item) => (
                        <li key={item.id} className="flex gap-3 px-4 py-3">
                          <span className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-sand-100">
                            {item.config && (
                              <PieceScene config={item.config} view="scene" className="h-full w-full" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-ink">
                              {item.name ? l(item.name) : item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-muted">{price(item.price)}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(item.id)}
                                aria-label={t('cart.decrease')}
                                className="flex h-6 w-6 items-center justify-center rounded border border-sand-300 text-ink-soft hover:border-ink"
                              >
                                <Minus className="h-3 w-3" aria-hidden />
                              </button>
                              <span className="min-w-6 text-center text-xs font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(item.id)}
                                aria-label={t('cart.increase')}
                                className="flex h-6 w-6 items-center justify-center rounded border border-sand-300 text-ink-soft hover:border-ink"
                              >
                                <Plus className="h-3 w-3" aria-hidden />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                aria-label={t('cart.remove')}
                                className="ms-auto text-ink-muted hover:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-sand-200 px-4 py-3">
                      <div className="mb-3 flex items-center justify-between text-sm">
                        <span className="text-ink-soft">{t('common.subtotal')}</span>
                        <span className="font-semibold text-ink">{price(totalPrice)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href="/cart" className="btn-secondary py-2.5 text-xs">
                          {t('common.cart')}
                        </Link>
                        <Link href="/checkout" className="btn-primary py-2.5 text-xs">
                          {t('cart.checkout')}
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t('nav.menu')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-300 bg-white text-ink lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t('common.close')}
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 end-0 flex h-full w-[min(84vw,20rem)] flex-col bg-sand-50 shadow-stone-lg">
            <div className="flex items-center justify-between border-b border-sand-200 px-5 py-4">
              <BrandMark size="sm" />
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t('nav.close')}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-300 text-ink"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4" aria-label={t('nav.menu')}>
              <Link
                href="/"
                className="rounded-xl px-3 py-3 text-base font-medium text-ink-soft hover:bg-sand-200 hover:text-ink"
              >
                {t('nav.home')}
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-xl px-3 py-3 text-base font-medium hover:bg-sand-200 hover:text-ink',
                    isActive(link.href) ? 'bg-sand-200 text-ink' : 'text-ink-soft',
                  )}
                >
                  {t(link.key)}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-sand-200 p-4">
              <LocaleSwitcher className="w-full justify-center" />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
