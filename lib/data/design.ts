import type { Localized } from '@/lib/i18n/config'
import {
  PIECES,
  pieceById,
  type BaseId,
  type EdgeId,
  type MarbleId,
  type PieceConfig,
  type PieceId,
  type ShapeId,
} from '@/lib/data/configurator'

/**
 * The design studio option sets.
 *
 * These are the choices a marble workshop actually quotes on: surface finish,
 * slab thickness, vein direction and the base it sits on. They are additive —
 * the original `PieceConfig` (piece / stone / shape / edge / base) is still the
 * shape the storefront, the product catalogue and saved requests speak, and
 * `toPieceConfig` below projects a full design down onto it. That projection is
 * why the admin console, the product renderer and the estimate maths did not
 * have to change.
 */

/* -------------------------------------------------------------------- units */

export type Unit = 'cm' | 'in'

export const CM_PER_INCH = 2.54

/** Dimensions are always stored in centimetres; the unit is a display choice. */
export function fromCm(valueCm: number, unit: Unit): number {
  return unit === 'cm' ? valueCm : valueCm / CM_PER_INCH
}

export function toCm(value: number, unit: Unit): number {
  return unit === 'cm' ? value : value * CM_PER_INCH
}

/** Inches are shown to one decimal; centimetres are whole numbers. */
export function unitStep(unit: Unit): number {
  return unit === 'cm' ? 1 : 0.5
}

/* --------------------------------------------------------------- dimensions */

/**
 * Allowed range for one dimension, in centimetres.
 *
 * Wider than the storefront's own product ranges: a customer who uploads a
 * photograph has a specific piece in mind and may well want a 4 m table, which
 * the catalogue does not stock. The bounds still exist — a typed value is
 * clamped into them, so no keystroke can put nonsense into the configuration.
 */
export function dimensionRange(
  pieceType: PieceId,
  key: 'length' | 'width' | 'height',
): { min: number; max: number; step: number } {
  const range = pieceById(pieceType).ranges[key]
  return {
    min: Math.max(10, Math.round(range.min * 0.8)),
    max: Math.round(range.max * 1.25),
    step: key === 'height' ? 1 : 5,
  }
}

/** Starting proportions and permitted outlines for one kind of piece. */
export function pieceDefaults(pieceType: PieceId): {
  dimensions: { length: number; width: number; height: number }
  shapes: ShapeId[]
} {
  const piece = pieceById(pieceType)
  return { dimensions: piece.defaults, shapes: piece.shapes }
}

/** Clamps to the range and drops anything that is not a finite number. */
export function clampDimension(
  value: number,
  pieceType: PieceId,
  key: 'length' | 'width' | 'height',
): number {
  const { min, max } = dimensionRange(pieceType, key)
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10))
}

/* --------------------------------------------------------------- base / legs */

export const BASE_TYPE_IDS = [
  'original',
  'blackMetal',
  'brass',
  'stainless',
  'bronze',
  'wood',
  'marblePedestal',
] as const
export type BaseTypeId = (typeof BASE_TYPE_IDS)[number]

export interface BaseTypeOption {
  id: BaseTypeId
  name: Localized
  description: Localized
  /**
   * Tint applied to the base region of an uploaded photograph. `null` means the
   * photograph is left exactly as it was — which is why "keep original" is the
   * only option that is never an approximation.
   */
  tint: string | null
  /** How the studio (drawn) preview represents this base. */
  drawnAs: BaseId
}

export const BASE_TYPES: BaseTypeOption[] = [
  {
    id: 'original',
    name: { ar: 'كما هي في الصورة', en: 'Keep original' },
    description: {
      ar: 'نُبقي القاعدة كما تظهر في صورتك المرجعية.',
      en: 'We keep the base exactly as it appears in your reference.',
    },
    tint: null,
    drawnAs: 'metal',
  },
  {
    id: 'blackMetal',
    name: { ar: 'معدن أسود', en: 'Black metal' },
    description: {
      ar: 'معدن مطلي بالأسود المطفي — الخط الأنحف والأكثر حيادية.',
      en: 'Matte black coated steel — the slimmest, most neutral line.',
    },
    tint: '#2A2724',
    drawnAs: 'metal',
  },
  {
    id: 'brass',
    name: { ar: 'نحاس أصفر', en: 'Brass' },
    description: {
      ar: 'نحاس أصفر مصقول يضيف دفئًا واضحًا تحت الرخام الفاتح.',
      en: 'Polished brass, which adds a clear warmth under a light stone.',
    },
    tint: '#A88246',
    drawnAs: 'architectural',
  },
  {
    id: 'stainless',
    name: { ar: 'ستانلس ستيل', en: 'Stainless steel' },
    description: {
      ar: 'ستانلس مصقول، انعكاس باهت وحضور معاصر.',
      en: 'Brushed stainless — a low reflection and a contemporary presence.',
    },
    tint: '#9FA4A8',
    drawnAs: 'architectural',
  },
  {
    id: 'bronze',
    name: { ar: 'برونز', en: 'Bronze' },
    description: {
      ar: 'برونز داكن، أهدأ من النحاس وأدفأ من الأسود.',
      en: 'Dark bronze — quieter than brass, warmer than black.',
    },
    tint: '#6E5638',
    drawnAs: 'architectural',
  },
  {
    id: 'wood',
    name: { ar: 'خشب طبيعي', en: 'Solid wood' },
    description: {
      ar: 'خشب طبيعي بدرجة الجوز، يخفف صلابة الحجر.',
      en: 'Solid walnut-toned timber, which softens the weight of the stone.',
    },
    tint: '#7A5433',
    drawnAs: 'metal',
  },
  {
    id: 'marblePedestal',
    name: { ar: 'قاعدة رخامية', en: 'Marble pedestal' },
    description: {
      ar: 'قاعدة من نفس اللوح — القطعة كتلة واحدة من الحجر.',
      en: 'A pedestal cut from the same slab, so the piece reads as one mass of stone.',
    },
    tint: null,
    drawnAs: 'pedestal',
  },
]

export const baseTypeById = (id: BaseTypeId): BaseTypeOption =>
  BASE_TYPES.find((b) => b.id === id) ?? BASE_TYPES[0]

/* ------------------------------------------------------------------- finish */

export const FINISH_IDS = ['polished', 'honed', 'leathered', 'brushed'] as const
export type FinishId = (typeof FINISH_IDS)[number]

export interface FinishOption {
  id: FinishId
  name: Localized
  description: Localized
}

export const FINISHES: FinishOption[] = [
  {
    id: 'polished',
    name: { ar: 'مصقول لامع', en: 'Polished' },
    description: {
      ar: 'لمعان كامل يُبرز العروق ويعكس الضوء — الأكثر طلبًا للطاولات.',
      en: 'A full gloss that lifts the veining and reflects light — the usual choice for tables.',
    },
  },
  {
    id: 'honed',
    name: { ar: 'مطفي ناعم', en: 'Honed / matte' },
    description: {
      ar: 'سطح مطفي ناعم، أقل إظهارًا للبصمات وأهدأ في الإضاءة القوية.',
      en: 'A smooth matte surface: fewer fingerprints, and calmer under strong light.',
    },
  },
  {
    id: 'leathered',
    name: { ar: 'ملمس جلدي', en: 'Leathered' },
    description: {
      ar: 'ملمس محبب خفيف يحافظ على عمق اللون في الأحجار الداكنة.',
      en: 'A lightly textured surface that holds the depth of colour on dark stones.',
    },
  },
  {
    id: 'brushed',
    name: { ar: 'مفرش بالفرشاة', en: 'Brushed' },
    description: {
      ar: 'خطوط دقيقة في اتجاه واحد، ملمس طبيعي غير لامع.',
      en: 'Fine directional texture — natural to the touch, and not reflective.',
    },
  },
]

export const finishById = (id: FinishId): FinishOption =>
  FINISHES.find((f) => f.id === id) ?? FINISHES[0]

/* ---------------------------------------------------------------- thickness */

/** Slab thickness in millimetres. `0` marks the custom entry. */
export const THICKNESS_OPTIONS: { value: number; name: Localized }[] = [
  { value: 20, name: { ar: '20 مم', en: '20 mm' } },
  { value: 30, name: { ar: '30 مم', en: '30 mm' } },
  { value: 40, name: { ar: '40 مم', en: '40 mm' } },
  { value: 0, name: { ar: 'سماكة أخرى', en: 'Custom' } },
]

export const THICKNESS_MIN = 12
export const THICKNESS_MAX = 120

/* ------------------------------------------------------------ vein direction */

export const VEIN_IDS = ['standard', 'horizontal', 'vertical', 'bookmatch', 'continuous'] as const
export type VeinId = (typeof VEIN_IDS)[number]

export interface VeinOption {
  id: VeinId
  name: Localized
  description: Localized
}

export const VEIN_DIRECTIONS: VeinOption[] = [
  {
    id: 'standard',
    name: { ar: 'طبيعي', en: 'Standard' },
    description: {
      ar: 'نتبع اتجاه العروق في اللوح كما هو.',
      en: 'We follow the vein direction of the slab as it comes.',
    },
  },
  {
    id: 'horizontal',
    name: { ar: 'أفقي', en: 'Horizontal' },
    description: {
      ar: 'العروق تمتد مع طول القطعة، فتبدو أوسع.',
      en: 'Veins run along the length, which makes the piece read wider.',
    },
  },
  {
    id: 'vertical',
    name: { ar: 'عمودي', en: 'Vertical' },
    description: {
      ar: 'العروق تعبر العرض، فتبدو القطعة أقصر وأكثر هدوءًا.',
      en: 'Veins cross the width, which makes the piece read shorter and calmer.',
    },
  },
  {
    id: 'bookmatch',
    name: { ar: 'انعكاس مزدوج', en: 'Bookmatch' },
    description: {
      ar: 'لوحان متقابلان كالمرآة، فيتكوّن شكل متماثل في المنتصف.',
      en: 'Two slabs mirrored, so a symmetrical figure forms down the centre.',
    },
  },
  {
    id: 'continuous',
    name: { ar: 'عرق متصل', en: 'Continuous vein' },
    description: {
      ar: 'نختار الألواح بحيث يستمر العرق من السطح إلى القاعدة.',
      en: 'Slabs selected so the vein carries on from the top down into the base.',
    },
  },
]

export const veinById = (id: VeinId): VeinOption =>
  VEIN_DIRECTIONS.find((v) => v.id === id) ?? VEIN_DIRECTIONS[0]

/* ------------------------------------------------------- the configuration */

export interface DesignDimensions {
  length: number
  width: number
  height: number
  /** Display unit only — the three values above are always centimetres. */
  unit: Unit
}

/**
 * The single source of truth for a design in progress.
 *
 * Note what is *not* here: no generated image, no mask, no analysis result. The
 * numbers are authoritative and the imagery is downstream of them, never the
 * other way round.
 */
export interface DesignConfiguration {
  /** Downscaled data URL of the customer's reference photograph. */
  referenceImage: string | null
  pieceType: PieceId
  dimensions: DesignDimensions
  materialId: MarbleId
  edgeProfile: EdgeId
  baseType: BaseTypeId
  finish: FinishId
  /** Millimetres. */
  thickness: number
  veinDirection: VeinId
  shape: ShapeId
  notes: string
}

export const DEFAULT_DESIGN: DesignConfiguration = {
  referenceImage: null,
  pieceType: 'dining',
  dimensions: { ...PIECES[0].defaults, unit: 'cm' },
  materialId: 'calacatta',
  edgeProfile: 'straight',
  baseType: 'original',
  finish: 'polished',
  thickness: 30,
  veinDirection: 'standard',
  shape: 'rectangle',
  notes: '',
}

/**
 * Projects a design onto the storefront's `PieceConfig`.
 *
 * Used for the drawn preview, for the product renderer and for everything
 * already built against `PieceConfig` — the admin console included.
 */
export function toPieceConfig(design: DesignConfiguration): PieceConfig {
  const piece = pieceById(design.pieceType)
  return {
    piece: design.pieceType,
    marble: design.materialId,
    shape: piece.shapes.includes(design.shape) ? design.shape : piece.shapes[0],
    edge: design.edgeProfile,
    base: baseTypeById(design.baseType).drawnAs,
    dimensions: {
      length: design.dimensions.length,
      width: design.dimensions.width,
      height: design.dimensions.height,
    },
  }
}

/**
 * Whether an option is worth showing for this piece type.
 *
 * Only shapes are conditional today; the signature is the hook for the rest.
 * Everything that renders an option group asks here rather than branching
 * inline, so making finishes or thicknesses conditional later is a change to
 * this function alone.
 */
export function isOptionAvailable(
  group: 'shape' | 'edge' | 'finish' | 'thickness' | 'vein' | 'base',
  optionId: string,
  pieceType: PieceId,
): boolean {
  if (group === 'shape') {
    return pieceById(pieceType).shapes.includes(optionId as ShapeId)
  }
  return true
}
