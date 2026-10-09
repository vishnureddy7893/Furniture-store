# AL MANARAT AL ANEEQA FACTORY MARBLE & STONE
# مصنع المنارات الأنيقة للرخام والحجر

## Demo Completion Report

A clickable, Arabic-first client demo for a premium Saudi natural-marble
furniture brand, built by transforming the existing Kosi furniture storefront
(the repository name and internal storage keys still carry that original name;
nothing customer-facing does).
The original Next.js 15 / React 19 / Tailwind 3 / Zustand architecture is
intact; nothing was rebuilt from scratch.

**Everything in this build is mock data. No payment, shipping, messaging or
storage service is contacted at any point.**

---

## 1. Implemented features

### Journey A — ready-made product
`/` → `/shop` → `/shop/[slug]` → add to cart → `/cart` → `/checkout` → `/order-success`

- Marble catalogue of 14 products across 6 categories, priced in SAR (2,050–7,400).
- Shop listing with category filter, four sort orders and progressive loading.
- Product detail page with a four-view gallery (three-quarter scene, plan,
  edge close-up, stone close-up), price and discount, availability, SKU,
  marble, dimensions, weight, lead time, warranty text, a natural-variation
  disclosure, features, a measured dimensions diagram, quantity control,
  add-to-cart and a customisation CTA.
- Cart and a three-step mock checkout (delivery details → payment → review)
  with Saudi cities, access/installation notes, and a labelled demo payment step.
- Order confirmation with order number, estimated delivery and next steps.

### Journey B — custom marble piece
`/` → `/customize` → piece → stone → form & edge → base → brief → review → submit → confirmation

- Five configuration steps plus a separate review stage, with a clickable
  step indicator that lets the visitor jump back.
- **Live 2D SVG preview** beside the controls on desktop, above them on mobile,
  visible at every step. It reacts immediately to stone, shape, edge, base and
  dimension changes.
- Brief step: dimension sliders (bounded per piece type), project description,
  notes, reference-image upload UI, and contact details with Saudi mobile
  validation.
- Review assembles the full summary, with per-section "edit" jumps.
- Submission generates a request id (`MR-2026-003`, …) and a confirmation that
  clearly reads **request received**, not order paid.

### Journey C — admin
`/admin` → `/admin/requests` → `/admin/requests/[id]`

- Dashboard with four status cards (new / awaiting quote / manufacturing /
  delivered), a requests-by-status chart, and the latest requests.
- Request list with status filters — a table from `md` up, cards below.
- Request detail: customer, configuration, **the same visual preview the
  customer configured**, project information and reference file names,
  status control, timeline, internal notes, and mock commercial actions
  (prepare quote, mark as contacted, WhatsApp, call).
- A request submitted in the configurator appears in the admin console
  immediately, in the same browser session.

### Cross-cutting
- **Arabic-first bilingual UI.** Arabic is the default; `<html lang dir>` is
  set once at document level and a pre-paint script prevents a flash for
  English visitors. `?lang=en` / `?lang=ar` links either language directly.
- Marble brand identity: warm alabaster ground, deep warm ink, bronze accent,
  deep verde — deliberately not black-and-gold.
- Portfolio page with project filters.
- Restrained animation: Motion for reveals, list transitions and admin
  feedback; Anime.js for exactly two cinematic moments.

---

## 2. Areas modified (existing code reused)

| File | What changed |
| --- | --- |
| `tailwind.config.js` | Marble palette; the original semantic keys (`primary`, `secondary`, `productBorder`, …) were re-pointed rather than replaced, so untouched markup re-skinned automatically. Arabic font family, container, shadows |
| `app/globals.css` | Brand tokens, `--chart-*` ramp, RTL-safe base styles, button/field/surface component classes, off-screen scene deferral, reduced-motion block |
| `app/layout.tsx` | `lang="ar" dir="rtl"` default, Arabic webfont, pre-paint locale script, `LocaleProvider` |
| `app/page.tsx` | New section order |
| `app/cart`, `app/checkout`, `app/order-success`, `app/track-order` | SAR, bilingual, RTL, marble styling. The checkout keeps its original three-step machine and its `sessionStorage.lastOrder` handoff |
| `components/layouts/Header.tsx` | Marble nav, locale switcher, SAR mini-cart, RTL, Escape/route-change dismissal |
| `components/layouts/Footer.tsx` | Brand copy, bilingual, demo disclaimer |
| `components/ui/ProductCard.tsx` | Localised, SAR, links to the new PDP; wishlist and quick-view removed (out of demo scope) |
| `components/sections/*` | Repurposed and renamed: `TopPicks → FeaturedCollection`, `NewArrival → CategoryGrid`, `Feature → CraftStory`, `ImageGallery → SelectedWork` (renamed with `git mv`, history preserved) |
| `lib/mock-data.ts` | Replaced contents with the marble catalogue; export names kept |
| `lib/store/cart-store.ts` | Logic unchanged, wrapped in Zustand `persist` |
| `types/index.ts` | `Localized` fields on `Product`, `MarbleProduct`, custom-request types. The original `Product`/`CartItem`/`CartStore` shape is intact |
| `app/manifest.ts`, `sitemap.ts`, `robots.ts`, `StructuredData.tsx` | Rebranded, real routes, `/admin` excluded, invented address/phone removed, manifest icons pointed at files that exist |
| `tsconfig.json` | Excluded `New folder/` — see Known limitations |
| `next.config.ts` | Pinned the Turbopack workspace root |

**Deleted:** `components/ui/Badge.tsx` (no remaining consumers).

## 3. New components and modules

**i18n** — `lib/i18n/config.ts`, `dictionaries.ts` (≈300 keys; Arabic is the
typed source of truth, so a missing English string is a compile error),
`LocaleProvider.tsx`, `components/ui/LocaleSwitcher.tsx`.

**Marble rendering** — `components/marble/MarbleDefs.tsx` (procedural stone
patterns), `components/marble/PieceScene.tsx` (a server component rendering
scene / plan / edge / stone views), `lib/marble/geometry.ts` (scale, outlines,
edge-profile shading).

**Data** — `lib/data/configurator.ts` (pieces, 6 marbles, shapes, edges, bases,
cities), `lib/data/portfolio.ts`, the catalogue in `lib/mock-data.ts`.

**Configurator** — `Configurator.tsx`, `StepIndicator.tsx`, `PreviewPanel.tsx`,
`OptionCard.tsx`, `steps/SelectionSteps.tsx`, `steps/BriefStep.tsx`,
`steps/ReviewStep.tsx`, `RequestConfirmation.tsx`.

**Requests + admin** — `lib/store/requests-store.ts`,
`components/admin/{AdminShell,AdminDashboard,RequestsList,RequestDetail,StatusChart,StatusBadge}.tsx`.

**Shop / shared** — `components/shop/{ShopBrowser,ProductDetail,DimensionDiagram,PageIntro}.tsx`,
`components/checkout/OrderSummary.tsx`, `components/portfolio/PortfolioGrid.tsx`,
`components/ui/{Reveal,SectionHeading}.tsx`, `lib/utils.ts`,
`lib/hooks/useHydrated.ts`.

**Routes added** — `/shop`, `/shop/[slug]`, `/customize`, `/portfolio`,
`/admin`, `/admin/requests`, `/admin/requests/[id]`.

## 4. Dependencies added

| Package | Why |
| --- | --- |
| `motion` ^13 | Reveals, list transitions, configurator step transitions, admin feedback |
| `animejs` ^4 | The two cinematic moments only |
| `clsx` + `tailwind-merge` | `cn()`, the helper Kokonut components import from `@/lib/utils` |

No i18n library, no chart library, no 3D, no auth, no backend SDK.

### Kokonut UI

`components/kokonutui/file-upload.tsx` is Kokonut UI's `file-upload`, fetched
from the official registry (`kokonutui.com/r/file-upload.json`). Its only
dependencies are `lucide-react` and `motion`. It is used for the
reference-image step of the configurator, where it genuinely fits. Adaptations,
all recorded in the file header: restyled onto the marble palette, dark-mode
variants stripped (the storefront is light-only), and a `labels` prop added so
every string can be supplied in Arabic or English. Behaviour is unchanged. No
other Kokonut component was forced into the storefront.

### Bklit UI — evaluated, deliberately not installed

Bklit UI is a charts and data-visualisation registry. Its chart components
target **Tailwind v4** design tokens plus shadcn `card`/`badge` primitives, and
a single bar chart pulls `@visx/gradient`, `@visx/pattern`, `@visx/shape`,
`@visx/scale`, `@visx/event`, `@visx/responsive` (all at `4.0.1-alpha`),
`d3-array`, `@number-flow/react` and `@central-icons-react/all` across 13+
registry files.

This project is on **Tailwind 3.4 with no shadcn**. Adopting that stack would
have meant a Tailwind v4 migration, a shadcn install and five alpha packages —
for one chart, in a demo. That is precisely the "unnecessary complexity" the
brief warns about, so `components/admin/StatusChart.tsx` instead **follows
Bklit's conventions** in ~80 lines with no new dependencies: the
`--chart-1…--chart-5` token ramp (declared in `globals.css`), a single-hue warm
theme, and motion-driven bar growth. If the client later moves to Tailwind v4
and shadcn, swapping in the real Bklit chart is a contained change.

## 5. Mock / simulated integrations

| Area | How it is simulated |
| --- | --- |
| Catalogue | Static TypeScript in `lib/mock-data.ts`. SKUs, stock, lead times and prices are illustrative |
| Product imagery | Generated procedurally as SVG from each product's configuration — see Known limitations |
| Cart | Zustand + localStorage (`kosi-cart`) |
| Checkout | Three-step form; the order is written to `sessionStorage.lastOrder` and read by the success page. No gateway, no tokenisation. The card option is explicitly an interface-only demo and its fields are disabled |
| Delivery pricing | Flat 250 SAR, waived above 5,000 SAR |
| Order number | `KOSI-######`, generated client-side |
| Order tracking | Fixed timeline, labelled as simulated |
| Custom requests | Zustand + localStorage (`kosi-custom-requests`), seeded with two requests so the admin is never empty. Ids `MR-2026-001`, … |
| Quotation | `indicativeEstimate()` — area × a per-stone rate + a base cost, rounded. Not a pricing engine, and labelled as indicative |
| Admin actions | Prepare quote / mark contacted / WhatsApp / call write to the request timeline and show a confirmation. Nothing is sent |
| Reference upload | The Kokonut component's simulated progress; only the **file name** is kept in state. No file is uploaded or stored |
| Newsletter | Local state only |
| Testimonials & portfolio | Labelled sample content |

## 6. Known limitations

1. **Imagery is generated, not photographed.** Image hosts were unreachable
   from the build environment, so rather than ship broken image requests every
   marble surface is drawn procedurally in SVG (`components/marble/`). This
   turned out to be a strength — the catalogue, the PDP gallery, the
   configurator preview and the admin all share one renderer, which is why the
   admin preview is guaranteed to match what the customer designed. It is not
   photography. Each product already carries an empty `images: string[]`, and
   `MarbleDefs` fills every surface through a single `<pattern>`, so swapping
   in real slab photography is a contained change with no consumer edits.
2. **No locale in the URL.** Routes stay flat and language is a client
   preference (`localStorage`, overridable with `?lang=`). Good for a demo,
   linkable in either language, but not per-language SEO. Production would want
   `/[lang]` segments.
3. **State is per browser.** Requests and cart live in localStorage, so two
   people on two devices see different data, and clearing site data resets to
   the two seeded requests.
4. **`/admin` is unauthenticated** and only excluded from `robots.txt`.
5. **`New folder/`** is a committed duplicate copy of the project that predates
   this work. It is now excluded from `tsconfig.json` (it broke `next build`
   once the shared types changed). It should be deleted from the repository.
6. **Arabic copy should get a native review** before client-facing use. It was
   written as Saudi/Gulf ecommerce Arabic rather than translated word for word,
   but a native reviewer is the right final check.
7. The repo ships a `pnpm-lock.yaml`; pnpm was unavailable here so npm was used
   and a `package-lock.json` now exists. Pick one lockfile before deploying.
8. `README.md` still describes the original generic furniture store.

## 7. Production work still required

- Real product photography and slab imagery.
- A backend for custom requests (persistence, notifications, assignment) and
  authenticated admin access.
- A real payment integration (Saudi context: mada / Apple Pay / bank transfer)
  and real VAT and invoicing handling.
- Real delivery and installation scheduling and logistics.
- Locale-segmented routes and per-language metadata.
- A genuine quotation model (slab yield, edge work, base fabrication,
  installation, city).
- Content management for the catalogue and portfolio.

## 8. Manual test results

Verified against the **production build** (`next build` + `next start`) driven
through the Chrome DevTools Protocol. **62 / 62 checks passed.**

### Flow 1 — ready-made product
| Check | Result |
| --- | --- |
| Shop lists products | pass |
| PDP opens (`/shop/najd-dining-table-240`) | pass |
| Add to cart | pass |
| Cart shows the item and totals | pass |
| Checkout → payment step | pass |
| Payment → review step | pass |
| Place order | pass |
| Success page with `KOSI-######` | pass |

### Flow 2 — custom piece
| Check | Result |
| --- | --- |
| Steps 2–5 reachable in order | pass |
| Dimension slider changes the value (160 → 210) | pass |
| Preview reflects the new length | pass |
| Validation blocks an empty contact form | pass |
| Review stage reached | pass |
| Request submitted, id `MR-2026-003` | pass |
| Confirmation states no payment was taken | pass |

### Flow 3 — admin
| Check | Result |
| --- | --- |
| Dashboard renders | pass |
| The new request appears in the list | pass |
| Detail shows customer / configuration / brief | pass |
| Visual preview renders in the admin | pass |
| Status change applied | pass |
| Internal note saved | pass |
| Mock quotation produces a value | pass |

### Language and layout
| Check | Result |
| --- | --- |
| `?lang=en` switches to `lang="en" dir="ltr"` | pass |
| English copy renders; prices show `SAR` | pass |
| English persists across navigation | pass |
| Configurator in English | pass |
| Arabic RTL default across all flows | pass |

### Responsive — no horizontal overflow
375, 390, 768, 1024 and 1440 px × `/`, `/shop`, `/customize`, `/cart`,
`/portfolio`, `/admin/requests` — **30 / 30 pass, 0 px overflow everywhere.**
The mobile configurator was checked visually at 390 px: preview above,
configuration below, step indicator scrolls horizontally.

### Console and accessibility
- **Console:** clean on `/`, `/shop`, PDP, `/customize`, `/portfolio`, `/cart`,
  `/checkout`, `/track-order`, `/admin`, `/admin/requests`, request detail and
  `?lang=en`. No errors, warnings, exceptions or failed requests.
- **Accessibility scan** across nine routes: no unlabelled form controls, no
  buttons or links without an accessible name, no clickable `div`s, no `img`
  without `alt`, no `svg[role=img]` without a label, exactly one `h1` per page.
- `npm run lint` — clean. `npx tsc --noEmit` — clean.
  `npm run build` — succeeds, 31 pages, 14 product pages prerendered.

### Fixed during testing
- Cart emptied on refresh (no persistence) → wrapped the store in `persist`,
  with `useHydrated` guards so the persisted cart cannot disagree with the
  server HTML.
- Edge close-up collapsed to a flat band → the slices were stacked to the
  bottom instead of drawn per depth step.
- Pedestal foot was invisible on light stones → shaded it.
- Letterbox bands at the sides of previews → backgrounds now bleed past the
  viewBox.
- Bidi merging in Arabic (`+140`, `150%`) → isolated numeric runs with `<bdi>`.
- The Motion page transition rendered pages at `opacity: 0` and depended on JS
  to reveal them → replaced with a CSS animation that degrades to "visible".

## 8a. Navigation performance pass

Navigating between Shop / Design Your Piece / Custom Work / Requests felt
laggy. Measured with the Chrome DevTools Protocol at 4x CPU throttling, medians
over 5–7 repetitions per transition.

**What was actually wrong** (in order of impact):

1. **A 280 ms full-page fade on every navigation.** `app/template.tsx` wrapped
   every route in an opacity animation. Content painted at ~320 ms but only
   became fully visible at ~596 ms — a flat ~280 ms of self-inflicted delay on
   every single navigation, plus whole-page layerisation while the browser was
   already busy painting the new route.
2. **That same wrapper put Motion in every route's bundle.** Because the root
   template was a client component importing Motion, Motion was pulled into the
   shared chunk for *all* routes, including ones with no animation.
3. **Motion layout projection on grid items.** `ShopBrowser` and
   `PortfolioGrid` used `layout` + `mode="popLayout"`, so Motion measured every
   card with `getBoundingClientRect` on mount — 4% of all CPU samples on a
   Shop navigation, for cards that were not moving.
4. **The admin chart animated `width`.** Five staggered bars animating a
   layout-triggering property ran layout on every frame for ~1 s on entering
   `/admin`.
5. **Per-render marble maths.** Every `PieceScene` rebuilt its vein field
   (32 procedural paths) and recomputed the cut-edge colour ramp per slice —
   thousands of identical hex blends per navigation, all deterministic.
6. **Off-screen SVG filters were still rasterised.** A Shop page carries ~20
   `feTurbulence` filters; the ones below the fold were painted on arrival.
7. **`/customize` loaded the whole configurator up front,** including the
   file-upload component and Anime.js, neither of which is reachable before
   step 5.

**What was changed** — no features, no redesign, no configurator behaviour change:

| Change | File(s) |
| --- | --- |
| Removed the full-page fade and its wrapper | `app/template.tsx` (deleted), `app/globals.css` |
| Dropped `layout` / `popLayout`; enter/exit animation kept as-is | `components/shop/ShopBrowser.tsx`, `components/portfolio/PortfolioGrid.tsx` |
| Chart bars animate `scaleX` (composited) instead of `width`, with RTL-aware transform origin | `components/admin/StatusChart.tsx` |
| Memoised vein generation, colour mixing and edge ramps | `components/marble/MarbleDefs.tsx`, `lib/marble/geometry.ts`, `components/marble/PieceScene.tsx` |
| Grain filter reduced from 3 octaves to 1 (invisible at 0.22 alpha, ~3x cheaper) | `components/marble/MarbleDefs.tsx` |
| `content-visibility: auto` on grid scenes so off-screen filters are not painted | `app/globals.css` + the six grid consumers |
| Steps 5–6 lazily imported and warmed on idle | `components/configurator/Configurator.tsx` |

**Verified as already correct, so left alone:** all internal navigation is
client-side (no full page reloads), every internal link is a Next `<Link>`, and
route prefetching is working (`/shop?_rsc=`, `/customize?_rsc=` are fetched
while idle on the homepage). Anime.js only runs on the homepage hero and the
configurator review step, not on route mount.

**Results** (4x CPU throttle):

| Metric | Before | After |
| --- | --- | --- |
| Main-thread blocked, warm navigation (6 transitions) | 1194 ms | 611 ms (**−49%**) |
| Main-thread blocked, cold navigation (6 transitions) | 1299 ms | 907 ms (**−30%**) |
| Click → page fully visible (`/shop → /customize`) | 596 ms | 329 ms (**−45%**) |
| Shared First Load JS (every route) | 212 kB | 166 kB (**−46 kB**) |
| `/customize` First Load JS | 276 kB | 211 kB |
| `/shop` First Load JS | 252 kB | 206 kB |
| `/portfolio` First Load JS | 253 kB | 207 kB |

Re-verified after the pass: **62/62** functional checks (all three journeys,
Arabic RTL and English LTR, 30 responsive checks at 375–1440 px with 0 px
overflow), console clean on 12 routes, and `lint` / `tsc --noEmit` / `build`
all clean.

**Trade-off:** the cross-page fade is gone, so routes now appear immediately
rather than fading in. That was the single largest contributor to perceived
navigation lag. Per-element animations (card reveals, configurator step
transitions, admin feedback) are unchanged.

## 8b. Official company name

The customer-facing brand is the registered company name, in both official
versions. Neither is a translation of the other, so the site shows the version
matching the active language and never mixes, shortens or transliterates them.

| Language | Displayed name |
| --- | --- |
| English (LTR) | `AL MANARAT AL ANEEQA FACTORY MARBLE & STONE` |
| Arabic (RTL) | `مصنع المنارات الأنيقة للرخام والحجر` |

- Both live in the translation dictionary under `brand.name`, so the language
  switcher changes the company name together with the rest of the site.
- One component, `components/ui/BrandMark.tsx`, renders the logo + name lockup,
  and the header, mobile navigation drawer and footer all use it — they cannot
  drift apart.
- The logo is identical in both languages and sits at the inline start, so it
  is on the left in English and on the right in Arabic, with no per-language
  markup.
- The English and Arabic names need different measures to break where the
  company breaks them (`AL MANARAT AL ANEEQA / FACTORY MARBLE & STONE` and
  `مصنع المنارات الأنيقة / للرخام والحجر`), so `BrandMark` picks the measure by
  locale. Only the line break moves; the wording is always the full name.
- Metadata, the web manifest and the JSON-LD structured data all carry the
  official name; the customer-facing order reference is now `AMA-######`.

**Logo asset:** `public/images/brand-logo.svg` — the **client's own Illustrator
export**, supplied as `client-logo.svg` / `LOGO.png`. Its 18 paths and the two
brand colours (`#FE6B08` orange, `#3C3C3C` charcoal) are byte-identical to the
supplied file. The only change is the `viewBox`: the export shipped
`0 0 4.78 6.19` while the artwork sits at x 1290–2130, y −584.81–721.19, so it
rendered blank. Correcting the canvas to `1290 -584.81 840.01 1306` makes it
visible without touching a single path, colour or proportion — the recovered
bounding box (840 × 1306) matches the supplied `LOGO.png` (841 × 1307), and the
rendered result was compared side by side against it.

**Header lockup sizing.** The mark is tall, so `BrandMark` sizes it by height
and lets the width follow. The official name is set on the two lines the
company uses (`brand.nameLine1` / `brand.nameLine2`), each with its own size
and weight; `brand.name` stays the full single-line string for aria labels,
metadata and the copyright line.

| | Logo | Line 1 | Line 2 | Header bar |
| --- | --- | --- | --- | --- |
| Desktop (>=768px) | 56px | 19px / 600 / .055em | 16px / 500 / .105em | 104px |
| Phone (400-767px) | 44px | 15px / 600 / .055em | 12.5px / 500 / .09em | 88px |
| Narrow (<400px) | 40px | 13.5px / 600 / .03em | 11px / 500 / .07em | 88px |
| Footer | 48 -> 64px | 17 -> 21px | 13.5 -> 17px | — |

Arabic takes no letter-spacing at any size (it breaks the joins) and slightly
looser leading. The narrow-phone step exists because the full English name is
long: at 375px the previous sizing overflowed the viewport by 1px. Sticky
panels in the cart, checkout and configurator moved from `top-24` to
`top-[120px]` to clear the taller header.

The old placeholder `public/images/kosi-logo.png` has been deleted.

Verified: 178/178 automated brand checks — across eleven routes in both
languages, the header and footer show the correct official name, the other
language's name never leaks, the logo element is present **and actually
decodes**, no other image appears in the header or footer, direction is
correct, the mobile drawer matches, and the string "Kosi" appears nowhere in
any rendered page.

Still carrying the original name, none of it customer-facing: the repository
name, three `localStorage` keys (`kosi-cart`, `kosi-locale`,
`kosi-custom-requests`), `LICENSE.md` / `CONTRIBUTING.md`, and the
**deployment domain `kosii.netlify.app`** used for canonical URLs, the sitemap
and `robots.txt` — that one needs the client's real domain before launch.

## 9. Running the demo

```bash
npm install
npm run dev            # http://localhost:3000
# or, closer to production:
npm run build && npm start
```

Suggested presentation order:

1. **`/`** — Arabic homepage. Point out the live hero, then switch to English
   with the header toggle to show RTL → LTR.
2. **Journey A** — `/shop` → any product → Add to Cart → `/cart` → `/checkout`
   → confirm → success page.
3. **Journey B** — `/customize`. Change the stone and the dimension slider and
   let the preview react. Submit and note the request number.
4. **Journey C** — `/admin`, open that request, confirm the visual matches,
   change the status, add an internal note, prepare the mock quote.

`?lang=en` and `?lang=ar` link straight into either language. Requests and cart
are stored in the browser; clearing site data resets the demo to the two
seeded requests.
