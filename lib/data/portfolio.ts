import type { Localized } from '@/lib/i18n/config'
import type { PieceConfig } from '@/lib/data/configurator'

export type ProjectKind = 'residential' | 'commercial' | 'architectural'

export interface PortfolioProject {
  id: string
  title: Localized
  location: Localized
  kind: ProjectKind
  year: number
  summary: Localized
  /** Drives the generated visual for the project card. */
  config: PieceConfig
}

export const PROJECT_KINDS: { id: ProjectKind; name: Localized }[] = [
  { id: 'residential', name: { ar: 'سكني', en: 'Residential' } },
  { id: 'commercial', name: { ar: 'تجاري', en: 'Commercial' } },
  { id: 'architectural', name: { ar: 'قطع إنشائية', en: 'Architectural' } },
]

/** Mock portfolio content for the demo — no real client work is represented. */
export const PROJECTS: PortfolioProject[] = [
  {
    id: 'majlis-riyadh',
    title: { ar: 'طاولة مجلس، حي الملقا', en: 'Majlis table, Al Malqa' },
    location: { ar: 'الرياض', en: 'Riyadh' },
    kind: 'residential',
    year: 2025,
    summary: {
      ar: 'طاولة طعام بطول ٣٢٠ سم من لوح واحد، بحافة مشطوفة وقاعدة حجرية، لمجلس عائلي يتسع لاثني عشر شخصًا.',
      en: 'A 320cm single-slab dining table with a beveled edge on a stone base, for a family majlis seating twelve.',
    },
    config: {
      piece: 'dining',
      marble: 'crema',
      shape: 'rectangle',
      edge: 'beveled',
      base: 'stone',
      dimensions: { length: 320, width: 120, height: 75 },
    },
  },
  {
    id: 'villa-jeddah',
    title: { ar: 'طاولة قهوة، فيلا خاصة', en: 'Coffee table, private villa' },
    location: { ar: 'جدة', en: 'Jeddah' },
    kind: 'residential',
    year: 2025,
    summary: {
      ar: 'كتلة من الرخام الأخضر بشكل بيضاوي على قاعدة مركزية، بمقاس مخصص لجلسة موجودة مسبقًا.',
      en: 'An oval mass of green marble on a central pedestal, sized around an existing seating arrangement.',
    },
    config: {
      piece: 'coffee',
      marble: 'verde',
      shape: 'oval',
      edge: 'bullnose',
      base: 'pedestal',
      dimensions: { length: 160, width: 90, height: 36 },
    },
  },
  {
    id: 'lobby-khobar',
    title: { ar: 'كونسول استقبال، مبنى مكاتب', en: 'Reception console, office building' },
    location: { ar: 'الخبر', en: 'Khobar' },
    kind: 'commercial',
    year: 2024,
    summary: {
      ar: 'كونسول بطول ٢٤٠ سم من الرخام الداكن على هيكل معدني، لمدخل مبنى مكاتب.',
      en: 'A 240cm dark marble console on a metal frame for an office building entrance.',
    },
    config: {
      piece: 'console',
      marble: 'nero',
      shape: 'rectangle',
      edge: 'straight',
      base: 'architectural',
      dimensions: { length: 240, width: 45, height: 90 },
    },
  },
  {
    id: 'boutique-riyadh',
    title: { ar: 'طاولة عرض، متجر', en: 'Display table, boutique' },
    location: { ar: 'الرياض', en: 'Riyadh' },
    kind: 'commercial',
    year: 2024,
    summary: {
      ar: 'طاولة عرض دائرية من الرخام الأبيض بقاعدة مركزية، في منتصف صالة العرض.',
      en: 'A round white marble display table on a pedestal, at the centre of a retail floor.',
    },
    config: {
      piece: 'dining',
      marble: 'calacatta',
      shape: 'round',
      edge: 'bullnose',
      base: 'pedestal',
      dimensions: { length: 180, width: 180, height: 75 },
    },
  },
  {
    id: 'entry-madinah',
    title: { ar: 'قطعة مدخل، منزل خاص', en: 'Entrance piece, private home' },
    location: { ar: 'المدينة المنورة', en: 'Madinah' },
    kind: 'architectural',
    year: 2023,
    summary: {
      ar: 'قطعة إنشائية من لوحين حجريين بزوايا ناعمة، صُممت لتتقاطع مع خط الدرج.',
      en: 'An architectural piece on two stone panels with softened corners, set against the line of a staircase.',
    },
    config: {
      piece: 'console',
      marble: 'bardiglio',
      shape: 'soft',
      edge: 'straight',
      base: 'stone',
      dimensions: { length: 220, width: 50, height: 95 },
    },
  },
  {
    id: 'suite-abha',
    title: { ar: 'طاولات جانبية، جناح فندقي', en: 'Side tables, hotel suite' },
    location: { ar: 'أبها', en: 'Abha' },
    kind: 'commercial',
    year: 2023,
    summary: {
      ar: 'مجموعة طاولات جانبية من الرخام البني بقواعد معدنية، نُفذت لعشرين جناحًا.',
      en: 'A set of brown marble side tables on metal bases, produced for twenty suites.',
    },
    config: {
      piece: 'side',
      marble: 'emperador',
      shape: 'round',
      edge: 'beveled',
      base: 'metal',
      dimensions: { length: 50, width: 50, height: 58 },
    },
  },
]

/** Testimonials are illustrative demo copy, not real client quotes. */
export const TESTIMONIALS: {
  id: string
  quote: Localized
  author: Localized
  role: Localized
}[] = [
  {
    id: 't1',
    quote: {
      ar: 'المقاس كان دقيقًا، والتركيب تم في نفس اليوم دون أي ضرر على الأرضية.',
      en: 'The measurements were exact and the installation was done the same day without marking the floor.',
    },
    author: { ar: 'نورة ا.', en: 'Noura A.' },
    role: { ar: 'الرياض — طاولة طعام مُفصّلة', en: 'Riyadh — custom dining table' },
  },
  {
    id: 't2',
    quote: {
      ar: 'أرسلت لهم صورة للمساحة، ورجعوا لي بثلاثة خيارات للوح والحافة خلال يومين.',
      en: 'I sent a photo of the space and they came back with three slab and edge options within two days.',
    },
    author: { ar: 'عبدالله م.', en: 'Abdullah M.' },
    role: { ar: 'جدة — كونسول مدخل', en: 'Jeddah — entrance console' },
  },
  {
    id: 't3',
    quote: {
      ar: 'وضّحوا لي أن العروق تختلف من لوح لآخر قبل الشراء، وهذا وفّر علينا سوء فهم لاحقًا.',
      en: 'They explained up front that veining differs between slabs, which saved a misunderstanding later.',
    },
    author: { ar: 'ريم س.', en: 'Reem S.' },
    role: { ar: 'الخبر — طاولة قهوة', en: 'Khobar — coffee table' },
  },
]
