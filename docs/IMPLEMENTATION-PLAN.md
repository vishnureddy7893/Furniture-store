# Kosi → Marble Demo: Implementation Plan

> Transformation of the existing Kosi furniture store into a clickable,
> Arabic-first client demo for a premium Saudi natural-marble furniture brand.
> **This is a modification of the existing app, not a rebuild.**

---

## 1. Current architecture (verified baseline)

Inspected on the `main` branch, then installed and ran the app.

| Area | Finding |
| --- | --- |
| Framework | Next.js **15.5.9**, App Router, Turbopack (`next dev --turbopack`, `next build --turbopack`) |
| React | **19.1.0** / react-dom 19.1.0 |
| TypeScript | 5.x, `strict: true`, path alias `@/*` → repo root, `global.d.ts` + generated `next-env.d.ts` |
| Styling | **Tailwind CSS 3.4.13** (`tailwind.config.js`, PostCSS + autoprefixer). No shadcn, no Tailwind v4, no CSS-in-JS |
| State | **Zustand 5.0.8** — a single `lib/store/cart-store.ts` (no persistence middleware) |
| Icons | `lucide-react` |
| Fonts | `next/font/google` — Montserrat (`--font-montserrat`, `font-primary`) + Roboto (`--font-roboto`, `font-secondary`) |
| Images | `next/image`, all assets local in `public/images/*.png`; no `remotePatterns` configured |
| i18n | **None.** `<html lang="en">`, hardcoded English strings everywhere |
| Deploy | `netlify.toml` (`publish = ".next"`, security headers) |

### Routes (before)

```
/                app/page.tsx                Hero + TopPicks + NewArrival + Feature + ImageGallery
/cart            app/cart/page.tsx           client, reads cart-store
/checkout        app/checkout/page.tsx       client, 3 steps (information → payment → review),
                                             writes sessionStorage.lastOrder
/order-success   app/order-success/page.tsx  reads sessionStorage.lastOrder, clears cart
/track-order     app/track-order/page.tsx    mock tracking timeline
+ manifest.ts, robots.ts, sitemap.ts, StructuredData.tsx
```

**There is no product-listing page and no product detail page.** The header
"Shop" link points at `#shop`; products only exist as cards on the homepage.

### Components (before)

```
components/layouts/Header.tsx        340 lines — sticky header, mini-cart dropdown, mobile menu
components/layouts/Footer.tsx        367 — links, newsletter, gallery strip
components/sections/Hero.tsx         166 — two-image hero (sofa / lamp)
components/sections/TopPicks.tsx     261 — product grid + category filter + sort + load-more
components/sections/NewArrival.tsx   309 — single feature product, IntersectionObserver reveal
components/sections/Feature.tsx      237 — trust/USP cards
components/sections/ImageGallery.tsx 376 — masonry gallery + lightbox modal
components/ui/ProductCard.tsx        287 — image, badges, rating, add-to-cart (3 variants),
                                           wishlist, quick-view
components/ui/Badge.tsx               11 — tiny discount badge
```

Data: `lib/mock-data.ts` — 8 generic products (sport jackets, backpacks, smart
watches) priced in USD. Types: `types/index.ts` — `Product`, `CartItem`,
`CartStore`, `ShippingAddress`, `PaymentMethod`, `Order`.

### Baseline verification

- `npm install` → 357 packages (the repo ships a `pnpm-lock.yaml`; pnpm is not installed on this machine, so npm was used).
- `npm run build` → success, 12 static pages.
- `npx tsc --noEmit` → clean (the only errors come from `New folder/`, a
  committed duplicate copy of the project that predates this work — left untouched).
- `npm run dev` → `/`, `/cart`, `/checkout`, `/order-success`, `/track-order` all return 200.

---

## 2. What is reused as-is (architecture preserved)

- **Zustand cart store** — `addToCart / removeFromCart / increaseQuantity /
  decreaseQuantity / clearCart` and its `totalQuantity` / `totalPrice`
  derivation. Journey A depends on it unchanged.
- **Checkout state machine** — the existing `information → payment → review`
  step flow and its `sessionStorage.lastOrder` handoff to `/order-success`.
- **Section-per-file homepage architecture** — `app/page.tsx` composes section
  components; the marble homepage keeps that shape.
- **`ProductCard` / `Badge`** as the single product-card primitive.
- **`Header` / `Footer`** shells, mini-cart dropdown, mobile-menu behaviour.
- **SEO scaffolding** — `manifest.ts`, `robots.ts`, `sitemap.ts`, `StructuredData.tsx`.
- **Tailwind semantic colour keys** (`primary`, `secondary`, `productBorder`,
  `productTitle`, `productPrice`) — re-pointed to marble-brand values so every
  existing class re-skins at once instead of being rewritten.

## 3. What is modified

| File | Change |
| --- | --- |
| `tailwind.config.js` | Marble palette (warm alabaster / ink / bronze / deep verde), Arabic font family, extra radii |
| `app/globals.css` | Brand tokens, RTL-safe base styles, logical-property helpers, focus-visible ring |
| `app/layout.tsx` | `lang="ar" dir="rtl"` default, Arabic webfont, pre-paint locale script, `LocaleProvider` |
| `next.config.ts` | `images.remotePatterns` for the demo photography host |
| `components/layouts/Header.tsx` | Marble nav (Shop / Design Your Piece / Portfolio / Admin), locale switcher, SAR mini-cart, RTL |
| `components/layouts/Footer.tsx` | Brand copy, bilingual, RTL |
| `components/ui/ProductCard.tsx` | Localised name/category, SAR pricing, links to the new PDP, wishlist/quick-view removed |
| `components/sections/Hero.tsx` | Marble hero, `Explore Collection` / `Design Your Piece` CTAs, Anime.js headline reveal |
| `components/sections/TopPicks.tsx` | Featured marble collection (chips driven by the real marble categories) |
| `components/sections/NewArrival.tsx` | → product **categories** grid |
| `components/sections/Feature.tsx` | → craftsmanship / natural-stone story |
| `components/sections/ImageGallery.tsx` | → selected custom work, sourced from portfolio data |
| `app/page.tsx` | New section order incl. custom-configurator CTA + trust section |
| `app/cart/page.tsx` | SAR, bilingual, RTL, marble styling |
| `app/checkout/page.tsx` | SAR, Saudi cities/addressing, mock payment (clearly labelled demo), bilingual, RTL |
| `app/order-success/page.tsx` | Bilingual, SAR, marble styling |
| `app/track-order/page.tsx` | Bilingual, marble styling |
| `types/index.ts` | `Localized`, marble product fields, custom-request types |
| `lib/mock-data.ts` | Replaced contents with the marble catalogue (export names kept) |
| `app/manifest.ts` / `sitemap.ts` / `StructuredData.tsx` | Brand + new routes |

## 4. New components / modules

**i18n**
- `lib/i18n/config.ts` — `Locale`, `Localized`, `dirFor()`, `pick()`, `formatSAR()`, `formatNum()`
- `lib/i18n/dictionaries.ts` — flat, compile-time-checked `ar` / `en` dictionaries
- `lib/i18n/LocaleProvider.tsx` — context + `useI18n()`, localStorage persistence, sets `<html lang/dir>`
- `components/ui/LocaleSwitcher.tsx`

**Data**
- `lib/mock-data.ts` — marble products across 6 categories, SAR pricing
- `lib/data/configurator.ts` — pieces, marbles, shapes, edges, bases
- `lib/data/portfolio.ts` — custom-work projects

**Configurator (Phases 7 & 8)**
- `app/customize/page.tsx` — 5 steps + review
- `components/configurator/PiecePreview.tsx` — live 2D SVG preview (marble texture masked into the top, geometry driven by shape/dimensions, edge treatment, base variants)
- `components/configurator/MarblePattern.tsx` — SVG `<pattern>` defs (photographic marble texture over a procedural fallback)
- `components/configurator/OptionGrid.tsx`, `StepHeader.tsx`, `SummaryList.tsx`
- `components/kokonutui/file-upload.tsx` — Kokonut UI file-upload for reference images

**Requests + Admin (Phases 9 & 10)**
- `lib/store/requests-store.ts` — Zustand + `persist` (localStorage), IDs `MR-2026-00N`
- `app/admin/page.tsx`, `app/admin/requests/page.tsx`, `app/admin/requests/[id]/page.tsx`
- `components/admin/AdminShell.tsx`, `StatCards.tsx`, `StatusChart.tsx`, `StatusBadge.tsx`

**Shared UI**
- `lib/utils.ts` — `cn()`
- `components/ui/Reveal.tsx` — Motion scroll reveal
- `components/ui/SectionHeading.tsx`
- `components/ui/Price.tsx` — SAR formatting in one place
- `app/portfolio/page.tsx`, `app/shop/page.tsx`, `app/shop/[slug]/page.tsx`

## 5. Dependencies to add

| Package | Why |
| --- | --- |
| `motion` | Phase 12 — page/reveal/modal/admin transitions. Also the dependency Kokonut's file-upload expects |
| `animejs` | Phase 12 — exactly two cinematic moments (hero headline, review-summary assembly) |
| `clsx` + `tailwind-merge` | `cn()` — the utility Kokonut components import from `@/lib/utils` |

Nothing else. No i18n library, no 3D, no chart library, no auth, no backend.

### Kokonut UI / Bklit UI decision (Phase 13)

- **Kokonut UI** — adopting `file-upload` from the official registry
  (`kokonutui.com/r/file-upload.json`; its only dependencies are `lucide-react`
  and `motion`). It is a genuine fit for the configurator's reference-image
  step and is restyled to the marble palette and RTL. No other Kokonut
  component is forced into the storefront.
- **Bklit UI** — evaluated and **not installed**. Its chart registry targets
  Tailwind **v4** tokens plus shadcn `card`/`badge` primitives and pulls
  `@visx/*@4.0.1-alpha`, `d3-array`, `@number-flow/react` and
  `@central-icons-react/all` — 13+ files and five alpha packages for a single
  bar chart, in a project on Tailwind 3 with no shadcn. That is the
  "unnecessary complexity" the brief warns about, so the admin chart is
  implemented locally following Bklit's conventions (a `--chart-1..5` token
  ramp, monochrome/warm theming, motion-animated bars). Recorded in
  `docs/DEMO-COMPLETION.md`.

## 6. Locale strategy

Routes stay flat (`/shop`, `/customize`, `/admin`) — a `/[lang]` restructure
would mean moving every existing page for no demo benefit. Instead:

- `app/layout.tsx` renders `<html lang="ar" dir="rtl">` — **Arabic is the default**.
- A tiny pre-paint inline script reads `localStorage['kosi-locale']` and swaps
  `lang`/`dir` before first paint, so an English visitor sees no flash.
- `LocaleProvider` keeps React state in sync and exposes `t()` / `locale` / `dir`.
- Direction is therefore set **once at the document level**; components use
  logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start/end`,
  `inset-inline`) instead of being mirrored by hand.

## 7. Implementation order

1. Foundations — Tailwind palette, globals, fonts, `cn`, i18n module, provider, switcher, layout `dir`. *(Phases 1–2)*
2. Catalogue — types + `lib/mock-data.ts` marble products + categories. *(Phase 4)*
3. Storefront shell — Header, Footer, ProductCard, `/shop`. *(Phases 1–2)*
4. Homepage sections. *(Phase 3)*
5. PDP `/shop/[slug]`. *(Phase 5)*
6. Cart + mock checkout + success. *(Phase 6)*
7. Configurator data → live SVG preview → 5 steps + review. *(Phases 7–8)*
8. Request store + confirmation. *(Phase 9)*
9. Admin dashboard / list / detail. *(Phase 10)*
10. Portfolio page. *(Phase 11)*
11. Animation pass (Motion + the two Anime.js moments). *(Phase 12)*
12. Responsive + RTL + a11y pass, lint, typecheck, build, manual flow test. *(Phases 14, 15, 18)*
13. `docs/DEMO-COMPLETION.md`.

After each step: `npx tsc --noEmit` and `npm run lint`, fixing before moving on.

## 8. Explicitly out of scope

3D / AR / 360 viewers, real payments, real shipping, SMS/email, ERP or Salla
integration, a production database, authentication, wishlist, customer
accounts, a CMS, advanced search/filtering, and a real pricing or quotation
engine. All commerce and workflow behaviour in this build is mock, local and
clearly labelled as a demo.
