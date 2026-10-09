import type { Localized } from '@/lib/i18n/config'
import {
  edgeById,
  marbleById,
  pieceById,
  shapeById,
} from '@/lib/data/configurator'
import {
  baseTypeById,
  finishById,
  fromCm,
  veinById,
  type DesignConfiguration,
} from '@/lib/data/design'

/**
 * The written specification of a design.
 *
 * Built from the configuration, never from the generated image — which is the
 * whole point. An image model may drift; this sentence cannot, because it reads
 * the same numbers the workshop will quote against. It is also why no text model
 * is needed to produce it, in either language.
 *
 * Shared by the studio, the confirmation screen and the API route, so the
 * customer, the emailed request and the admin console all read one description.
 */

const AR_DIGITS = 'ar-SA-u-nu-latn'

function formatNumber(value: number, locale: 'ar' | 'en'): string {
  const fraction = Number.isInteger(value) ? 0 : 1
  return new Intl.NumberFormat(locale === 'ar' ? AR_DIGITS : 'en-US', {
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value)
}

/** `250 × 120 × 80 cm` — always left-to-right, in both languages. */
export function formatDimensions(design: DesignConfiguration, locale: 'ar' | 'en'): string {
  const { unit } = design.dimensions
  const n = (cm: number) => formatNumber(Math.round(fromCm(cm, unit) * 10) / 10, locale)
  const suffix = unit === 'cm' ? (locale === 'ar' ? 'سم' : 'cm') : locale === 'ar' ? 'إنش' : 'in'
  return `${n(design.dimensions.length)} × ${n(design.dimensions.width)} × ${n(
    design.dimensions.height,
  )} ${suffix}`
}

export function formatThickness(design: DesignConfiguration, locale: 'ar' | 'en'): string {
  return `${formatNumber(design.thickness, locale)} ${locale === 'ar' ? 'مم' : 'mm'}`
}

/**
 * One sentence describing the finished piece, in both languages.
 *
 * The Arabic is written as Arabic rather than translated word for word: the
 * clause order follows how a Gulf showroom would describe a piece, and the
 * measurement stays in Latin digits as Saudi trade documents do.
 */
export function describeDesign(design: DesignConfiguration): Localized {
  const piece = pieceById(design.pieceType)
  const marble = marbleById(design.materialId)
  const finish = finishById(design.finish)
  const edge = edgeById(design.edgeProfile)
  const base = baseTypeById(design.baseType)
  const shape = shapeById(design.shape)
  const vein = veinById(design.veinDirection)

  const fromReference = design.referenceImage !== null

  const en = [
    fromReference
      ? `${piece.name.en} based on your reference image,`
      : `${piece.name.en},`,
    `configured at ${formatDimensions(design, 'en')}`,
    `in ${marble.name.en} marble`,
    `with a ${finish.name.en.toLowerCase()} finish,`,
    `a ${edge.name.en.toLowerCase()} edge`,
    `and ${base.id === 'original' ? 'the base as photographed' : `a ${base.name.en.toLowerCase()} base`}.`,
    `Outline: ${shape.name.en.toLowerCase()}; slab ${formatThickness(design, 'en')};`,
    `vein direction ${vein.name.en.toLowerCase()}.`,
  ].join(' ')

  const ar = [
    fromReference
      ? `${piece.name.ar} مستوحاة من صورتك المرجعية،`
      : `${piece.name.ar}،`,
    `بمقاس ${formatDimensions(design, 'ar')}`,
    `من رخام ${marble.name.ar}`,
    `بتشطيب ${finish.name.ar}`,
    `وحافة ${edge.name.ar.replace('حافة ', '')}`,
    base.id === 'original' ? 'مع الإبقاء على القاعدة كما في الصورة.' : `وقاعدة ${base.name.ar}.`,
    `الشكل: ${shape.name.ar}، وسماكة اللوح ${formatThickness(design, 'ar')}،`,
    `واتجاه العروق ${vein.name.ar}.`,
  ].join(' ')

  return { ar, en }
}

/** Flat label/value rows for the review screen, the request and the admin view. */
export function designSpecRows(design: DesignConfiguration): {
  key: string
  label: Localized
  value: Localized
  /** Technical strings stay left-to-right even in Arabic. */
  ltr?: boolean
}[] {
  const piece = pieceById(design.pieceType)
  const marble = marbleById(design.materialId)

  return [
    {
      key: 'piece',
      label: { ar: 'القطعة', en: 'Piece' },
      value: piece.name,
    },
    {
      key: 'dimensions',
      label: { ar: 'الأبعاد', en: 'Dimensions' },
      value: { ar: formatDimensions(design, 'ar'), en: formatDimensions(design, 'en') },
      ltr: true,
    },
    {
      key: 'material',
      label: { ar: 'الرخام', en: 'Marble' },
      value: marble.name,
    },
    {
      key: 'shape',
      label: { ar: 'الشكل', en: 'Outline' },
      value: shapeById(design.shape).name,
    },
    {
      key: 'edge',
      label: { ar: 'الحافة', en: 'Edge' },
      value: edgeById(design.edgeProfile).name,
    },
    {
      key: 'base',
      label: { ar: 'القاعدة', en: 'Base' },
      value: baseTypeById(design.baseType).name,
    },
    {
      key: 'finish',
      label: { ar: 'التشطيب', en: 'Finish' },
      value: finishById(design.finish).name,
    },
    {
      key: 'thickness',
      label: { ar: 'السماكة', en: 'Thickness' },
      value: { ar: formatThickness(design, 'ar'), en: formatThickness(design, 'en') },
      ltr: true,
    },
    {
      key: 'vein',
      label: { ar: 'اتجاه العروق', en: 'Vein direction' },
      value: veinById(design.veinDirection).name,
    },
  ]
}
