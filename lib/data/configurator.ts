import type { Localized } from '@/lib/i18n/config'
// Re-exported below as well; also needed in local scope for `PieceConfig`.
import type { MarbleId } from '@/lib/data/marbles'

/* ------------------------------------------------------------------ stone */

/**
 * The stone catalogue lives in its own module now that it is a real catalogue.
 * Re-exported from here so every existing import path keeps working.
 */
export {
  MARBLE_IDS,
  MARBLES,
  marbleById,
  searchMarbles,
  COLOR_FAMILY_IDS,
  COLOR_FAMILIES,
  colorFamilyById,
} from '@/lib/data/marbles'
export type {
  MarbleId,
  MarbleOption,
  MarblePalette,
  ColorFamilyId,
} from '@/lib/data/marbles'

/* ------------------------------------------------------------------ piece */

export const PIECE_IDS = ['dining', 'coffee', 'console', 'side'] as const
export type PieceId = (typeof PIECE_IDS)[number]

export interface Dimensions {
  length: number
  width: number
  height: number
}

export interface DimensionRange {
  min: number
  max: number
  step: number
}

export interface PieceOption {
  id: PieceId
  name: Localized
  description: Localized
  /** Starting dimensions in centimetres. */
  defaults: Dimensions
  ranges: { length: DimensionRange; width: DimensionRange; height: DimensionRange }
  /** Shapes that make sense for this piece. */
  shapes: ShapeId[]
}

export const PIECES: PieceOption[] = [
  {
    id: 'dining',
    name: { ar: 'طاولة طعام', en: 'Dining table' },
    description: {
      ar: 'من 6 إلى 12 شخصًا حسب الطول المطلوب.',
      en: 'Seats six to twelve depending on the length you choose.',
    },
    defaults: { length: 220, width: 100, height: 75 },
    ranges: {
      length: { min: 140, max: 320, step: 10 },
      width: { min: 80, max: 130, step: 5 },
      height: { min: 72, max: 78, step: 1 },
    },
    shapes: ['rectangle', 'soft', 'oval', 'round', 'organic', 'custom'],
  },
  {
    id: 'coffee',
    name: { ar: 'طاولة قهوة', en: 'Coffee table' },
    description: {
      ar: 'منخفضة وواسعة، تتوسط جلسة الصالة.',
      en: 'Low and wide, the centre of a seating arrangement.',
    },
    defaults: { length: 120, width: 70, height: 38 },
    ranges: {
      length: { min: 70, max: 180, step: 5 },
      width: { min: 50, max: 100, step: 5 },
      height: { min: 30, max: 45, step: 1 },
    },
    shapes: ['rectangle', 'soft', 'round', 'oval', 'square', 'organic', 'custom'],
  },
  {
    id: 'console',
    name: { ar: 'كونسول', en: 'Console' },
    description: {
      ar: 'ضيقة وطويلة، للمداخل والممرات وخلف الجلسات.',
      en: 'Narrow and long, for entrances, corridors and behind seating.',
    },
    defaults: { length: 160, width: 40, height: 85 },
    ranges: {
      length: { min: 90, max: 240, step: 10 },
      width: { min: 30, max: 55, step: 5 },
      height: { min: 75, max: 95, step: 1 },
    },
    shapes: ['rectangle', 'soft', 'custom'],
  },
  {
    id: 'side',
    name: { ar: 'طاولة جانبية', en: 'Side table' },
    description: {
      ar: 'قطعة صغيرة بجانب الكرسي أو السرير.',
      en: 'A small piece beside a chair or a bed.',
    },
    defaults: { length: 45, width: 45, height: 55 },
    ranges: {
      length: { min: 35, max: 70, step: 5 },
      width: { min: 35, max: 70, step: 5 },
      height: { min: 45, max: 65, step: 1 },
    },
    shapes: ['round', 'soft', 'square', 'rectangle', 'organic', 'custom'],
  },
]

export const pieceById = (id: PieceId): PieceOption =>
  PIECES.find((p) => p.id === id) ?? PIECES[0]

/* ------------------------------------------------------------------ shape */

export const SHAPE_IDS = [
  'rectangle',
  'square',
  'round',
  'oval',
  'soft',
  'organic',
  'custom',
] as const
export type ShapeId = (typeof SHAPE_IDS)[number]

export interface ShapeOption {
  id: ShapeId
  name: Localized
  description: Localized
}

export const SHAPES: ShapeOption[] = [
  {
    id: 'rectangle',
    name: { ar: 'مستطيل', en: 'Rectangle' },
    description: { ar: 'زوايا حادة وخط مستقيم.', en: 'Straight lines, sharp corners.' },
  },
  {
    id: 'round',
    name: { ar: 'دائري', en: 'Round' },
    description: { ar: 'دائرة كاملة، جلسة متساوية.', en: 'A full circle — everyone sits equally.' },
  },
  {
    id: 'oval',
    name: { ar: 'بيضاوي', en: 'Oval' },
    description: { ar: 'طول المستطيل مع نعومة الدائري.', en: 'The length of a rectangle, softened.' },
  },
  {
    id: 'soft',
    name: { ar: 'مستطيل بزوايا ناعمة', en: 'Soft rounded' },
    description: { ar: 'زوايا مُدوّرة تخفف حدة الشكل.', en: 'Rounded corners that take the edge off.' },
  },
  {
    id: 'square',
    name: { ar: 'مربع', en: 'Square' },
    description: { ar: 'ضلعان متساويان، جلسة متقابلة.', en: 'Equal sides, seating face to face.' },
  },
  {
    id: 'organic',
    name: { ar: 'شكل حر', en: 'Organic' },
    description: {
      ar: 'حدود غير منتظمة تُرسم يدويًا مع كل لوح.',
      en: 'An irregular outline, drawn by hand for each slab.',
    },
  },
  {
    id: 'custom',
    name: { ar: 'شكل خاص', en: 'Custom' },
    description: {
      ar: 'أرسل لنا الرسم أو المقاس، ونصنعه كما هو.',
      en: 'Send us the drawing or the template and we cut to it.',
    },
  },
]

export const shapeById = (id: ShapeId): ShapeOption =>
  SHAPES.find((s) => s.id === id) ?? SHAPES[0]

/* ------------------------------------------------------------------- edge */

export const EDGE_IDS = [
  'straight',
  'beveled',
  'bullnose',
  'halfBullnose',
  'ogee',
  'custom',
] as const
export type EdgeId = (typeof EDGE_IDS)[number]

export interface EdgeOption {
  id: EdgeId
  name: Localized
  description: Localized
}

export const EDGES: EdgeOption[] = [
  {
    id: 'straight',
    name: { ar: 'حافة مستقيمة', en: 'Straight' },
    description: { ar: 'قطع مستقيم بزاوية قائمة.', en: 'A square, straight cut.' },
  },
  {
    id: 'beveled',
    name: { ar: 'حافة مشطوفة', en: 'Beveled' },
    description: { ar: 'شطفة علوية تكسر انعكاس الضوء.', en: 'A chamfer along the top that catches the light.' },
  },
  {
    id: 'bullnose',
    name: { ar: 'حافة مُدوّرة كاملة', en: 'Bullnose' },
    description: {
      ar: 'حافة ناعمة بالكامل، مناسبة للمنازل التي فيها أطفال.',
      en: 'A fully rounded edge — the safer choice with children at home.',
    },
  },
  {
    id: 'halfBullnose',
    name: { ar: 'حافة نصف مُدوّرة', en: 'Half bullnose' },
    description: {
      ar: 'تدوير للحد العلوي فقط، مع بقاء الحد السفلي مستقيمًا.',
      en: 'The top edge rounded, the underside left square.',
    },
  },
  {
    id: 'ogee',
    name: { ar: 'حافة أوجي', en: 'Ogee' },
    description: {
      ar: 'منحنى مزدوج كلاسيكي، يزيد سماكة الحافة بصريًا.',
      en: 'A classic double curve that gives the edge more visual weight.',
    },
  },
  {
    id: 'custom',
    name: { ar: 'حافة خاصة', en: 'Custom profile' },
    description: {
      ar: 'مقطع خاص يُنفَّذ حسب رسمك — نراجعه معك قبل التصنيع.',
      en: 'A profile cut to your own drawing — we confirm it with you before production.',
    },
  },
]

export const edgeById = (id: EdgeId): EdgeOption =>
  EDGES.find((e) => e.id === id) ?? EDGES[0]

/* ------------------------------------------------------------------- base */

export const BASE_IDS = ['metal', 'stone', 'pedestal', 'architectural'] as const
export type BaseId = (typeof BASE_IDS)[number]

export interface BaseOption {
  id: BaseId
  name: Localized
  description: Localized
  /** Whether the base is cut from the same slab as the top. */
  inStone: boolean
}

export const BASES: BaseOption[] = [
  {
    id: 'metal',
    name: { ar: 'أرجل معدنية', en: 'Metal legs' },
    description: {
      ar: 'أرجل نحيفة من المعدن المطلي، تُبقي القطعة خفيفة بصريًا.',
      en: 'Slim coated-metal legs that keep the piece visually light.',
    },
    inStone: false,
  },
  {
    id: 'stone',
    name: { ar: 'قاعدة حجرية', en: 'Stone base' },
    description: {
      ar: 'لوحان من نفس الرخام، لقطعة كتلية متكاملة.',
      en: 'Two panels cut from the same stone, for one solid mass.',
    },
    inStone: true,
  },
  {
    id: 'pedestal',
    name: { ar: 'قاعدة مركزية', en: 'Pedestal' },
    description: {
      ar: 'عمود مركزي يترك المساحة حول القطعة مفتوحة.',
      en: 'A central column that leaves the space around the piece open.',
    },
    inStone: true,
  },
  {
    id: 'architectural',
    name: { ar: 'قاعدة إنشائية', en: 'Architectural base' },
    description: {
      ar: 'هيكل معدني مفتوح بخطوط هندسية واضحة.',
      en: 'An open metal frame with a clear geometric line.',
    },
    inStone: false,
  },
]

export const baseById = (id: BaseId): BaseOption =>
  BASES.find((b) => b.id === id) ?? BASES[0]

/* ------------------------------------------------------- full configuration */

export interface PieceConfig {
  piece: PieceId
  marble: MarbleId
  shape: ShapeId
  edge: EdgeId
  base: BaseId
  dimensions: Dimensions
}

export const DEFAULT_CONFIG: PieceConfig = {
  piece: 'dining',
  marble: 'calacatta',
  shape: 'rectangle',
  edge: 'straight',
  base: 'metal',
  dimensions: PIECES[0].defaults,
}

/** Saudi cities offered in the demo forms. */
export const CITIES: { id: string; name: Localized }[] = [
  { id: 'riyadh', name: { ar: 'الرياض', en: 'Riyadh' } },
  { id: 'jeddah', name: { ar: 'جدة', en: 'Jeddah' } },
  { id: 'dammam', name: { ar: 'الدمام', en: 'Dammam' } },
  { id: 'khobar', name: { ar: 'الخبر', en: 'Khobar' } },
  { id: 'makkah', name: { ar: 'مكة المكرمة', en: 'Makkah' } },
  { id: 'madinah', name: { ar: 'المدينة المنورة', en: 'Madinah' } },
  { id: 'abha', name: { ar: 'أبها', en: 'Abha' } },
  { id: 'tabuk', name: { ar: 'تبوك', en: 'Tabuk' } },
]

export const cityById = (id: string): Localized | undefined =>
  CITIES.find((c) => c.id === id)?.name
