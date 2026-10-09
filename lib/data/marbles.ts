import type { Localized } from '@/lib/i18n/config'

/**
 * The stone catalogue.
 *
 * Split out of `lib/data/configurator` so the catalogue can grow without that
 * file becoming unreadable; `configurator.ts` re-exports everything here, so no
 * consumer had to change. The data model is deliberately flat and additive: a
 * new stone is one entry, and nothing in the app enumerates stones by hand.
 *
 * Scaling to hundreds of stones later means replacing `MARBLES` with a fetched
 * list and keeping `marbleById` / `searchMarbles` as the only access points.
 * Nothing else reads the array directly except the catalogue UI itself.
 */

export const MARBLE_IDS = [
  // The six original demo stones. Their ids are referenced by product data and
  // by saved requests, so they never change.
  'calacatta',
  'crema',
  'bardiglio',
  'nero',
  'verde',
  'emperador',
  // Added for the design studio catalogue.
  'carrara',
  'statuario',
  'arabescato',
  'panda-white',
  'botticino',
  'travertine',
  'onyx-honey',
  'grigio-carnico',
  'nero-marquina',
  'sahara-noir',
  'verde-alpi',
  'rosso-levanto',
] as const
export type MarbleId = (typeof MARBLE_IDS)[number]

export interface MarblePalette {
  /** Lightest tone in the slab. */
  light: string
  /** Body tone. */
  mid: string
  /** Deepest tone, also used for the cut edge. */
  deep: string
  /** Primary vein colour. */
  vein: string
  /** Secondary, softer vein colour. */
  veinSoft: string
  /** True when veins are lighter than the body (dark stones). */
  lightVeins?: boolean
}

/* ------------------------------------------------------------ colour family */

export const COLOR_FAMILY_IDS = [
  'white',
  'beige',
  'grey',
  'black',
  'green',
  'brown',
  'red',
] as const
export type ColorFamilyId = (typeof COLOR_FAMILY_IDS)[number]

export const COLOR_FAMILIES: { id: ColorFamilyId; name: Localized; swatch: string }[] = [
  { id: 'white', name: { ar: 'أبيض', en: 'White' }, swatch: '#F2EEE7' },
  { id: 'beige', name: { ar: 'بيج', en: 'Beige' }, swatch: '#E3D2B6' },
  { id: 'grey', name: { ar: 'رمادي', en: 'Grey' }, swatch: '#C2C4C0' },
  { id: 'black', name: { ar: 'أسود', en: 'Black' }, swatch: '#26231F' },
  { id: 'green', name: { ar: 'أخضر', en: 'Green' }, swatch: '#33443B' },
  { id: 'brown', name: { ar: 'بني', en: 'Brown' }, swatch: '#57422F' },
  { id: 'red', name: { ar: 'أحمر', en: 'Red' }, swatch: '#6E2F2C' },
]

export const colorFamilyById = (id: ColorFamilyId) =>
  COLOR_FAMILIES.find((f) => f.id === id) ?? COLOR_FAMILIES[0]

/* -------------------------------------------------------------------- stone */

export interface MarbleOption {
  id: MarbleId
  /** Commercial name, as it appears on a quotation. */
  name: Localized
  description: Localized
  availability: 'ready' | 'order'
  /** Groups the stone under the catalogue colour filter. */
  colorFamily: ColorFamilyId
  /**
   * Extra search terms, both languages: the generic phrase a customer is likely
   * to type ("white marble", "رخام أبيض"), alternative spellings, and quarry or
   * trade variants. This is what makes search useful without a search backend.
   */
  synonyms?: Localized[]
  palette: MarblePalette
  /** Vein prominence, 0–1. */
  veinOpacity: number
  /** Turbulence seed, so each stone warps differently. */
  seed: number
}

export const MARBLES: MarbleOption[] = [
  {
    id: 'calacatta',
    name: { ar: 'كالاكاتا', en: 'Calacatta' },
    description: {
      ar: 'أرضية بيضاء صافية بعروق رمادية عريضة تميل إلى الذهبي — الأكثر طلبًا للمساحات الفاتحة.',
      en: 'A clean white ground with broad grey-gold veining — the most requested stone for light interiors.',
    },
    availability: 'ready',
    colorFamily: 'white',
    synonyms: [
      { ar: 'رخام أبيض', en: 'white marble' },
      { ar: 'كالكاتا', en: 'calacatta gold' },
    ],
    palette: {
      light: '#FCFBF9',
      mid: '#F0EDE6',
      deep: '#D9D3C7',
      vein: '#8C8375',
      veinSoft: '#BEB6A6',
    },
    veinOpacity: 0.55,
    seed: 3,
  },
  {
    id: 'carrara',
    name: { ar: 'كرارا', en: 'Carrara' },
    description: {
      ar: 'أبيض مائل للرمادي بعروق ريشية دقيقة — الخيار الهادئ والأكثر توازنًا.',
      en: 'A soft white-grey with fine feathered veining — the calmest, most even of the whites.',
    },
    availability: 'ready',
    colorFamily: 'white',
    synonyms: [
      { ar: 'رخام أبيض', en: 'white marble' },
      { ar: 'كرارة', en: 'bianco carrara' },
    ],
    palette: {
      light: '#F8F8F6',
      mid: '#E9E9E5',
      deep: '#CFCFC9',
      vein: '#9A9C98',
      veinSoft: '#C8C9C4',
    },
    veinOpacity: 0.42,
    seed: 131,
  },
  {
    id: 'statuario',
    name: { ar: 'ستاتواريو', en: 'Statuario' },
    description: {
      ar: 'أبيض ساطع بعروق رمادية حادة ومتباعدة — حجر النحّاتين، وأرقى الأبيض.',
      en: 'A bright white with sharp, well-spaced grey veining — the sculptors’ stone, and the finest of the whites.',
    },
    availability: 'order',
    colorFamily: 'white',
    synonyms: [
      { ar: 'رخام أبيض', en: 'white marble' },
      { ar: 'ستاتوارى', en: 'statuarietto' },
    ],
    palette: {
      light: '#FEFEFD',
      mid: '#F4F4F1',
      deep: '#DCDCD6',
      vein: '#77797A',
      veinSoft: '#B4B6B4',
    },
    veinOpacity: 0.6,
    seed: 149,
  },
  {
    id: 'arabescato',
    name: { ar: 'أرابيسكاتو', en: 'Arabescato' },
    description: {
      ar: 'عروق رمادية عريضة ترسم أشكالًا مغلقة على أرضية بيضاء — حضور قوي في القطع الكبيرة.',
      en: 'Broad grey veins that close into shapes across a white ground — a strong presence on large pieces.',
    },
    availability: 'order',
    colorFamily: 'white',
    synonyms: [
      { ar: 'رخام أبيض بعروق', en: 'veined white marble' },
      { ar: 'ارابيسكاتو', en: 'arabescato corchia' },
    ],
    palette: {
      light: '#FBFAF7',
      mid: '#EDEBE5',
      deep: '#CDCAC1',
      vein: '#6F706D',
      veinSoft: '#A8A9A4',
    },
    veinOpacity: 0.72,
    seed: 167,
  },
  {
    id: 'panda-white',
    name: { ar: 'باندا وايت', en: 'Panda White' },
    description: {
      ar: 'تباين حاد بين الأبيض والأسود بعروق دراماتيكية — يُختار عندما تكون القطعة هي محور المساحة.',
      en: 'Sharp white and black contrast with dramatic veining — chosen when the piece is meant to lead the room.',
    },
    availability: 'order',
    colorFamily: 'white',
    synonyms: [
      { ar: 'أبيض وأسود', en: 'black and white marble' },
      { ar: 'باندا', en: 'panda marble' },
    ],
    palette: {
      light: '#FAFAF8',
      mid: '#EBEBE8',
      deep: '#C4C4C0',
      vein: '#2B2B29',
      veinSoft: '#8B8B87',
    },
    veinOpacity: 0.78,
    seed: 181,
  },
  {
    id: 'crema',
    name: { ar: 'كريما مارفيل', en: 'Crema Marfil' },
    description: {
      ar: 'درجة بيج دافئة بعروق ناعمة، تتناغم مع الخشب والإضاءة الدافئة.',
      en: 'A warm beige tone with fine veining that sits well with wood and warm lighting.',
    },
    availability: 'ready',
    colorFamily: 'beige',
    synonyms: [
      { ar: 'رخام بيج', en: 'beige marble' },
      { ar: 'كريم مارفيل', en: 'cream marfil' },
    ],
    palette: {
      light: '#F5EADA',
      mid: '#E8D8BF',
      deep: '#CDB694',
      vein: '#B0906A',
      veinSoft: '#D6C1A2',
    },
    veinOpacity: 0.45,
    seed: 11,
  },
  {
    id: 'botticino',
    name: { ar: 'بوتيتشينو', en: 'Botticino' },
    description: {
      ar: 'بيج فاتح هادئ بتعرّق شبه غائب — سطح مريح للعين في المساحات الواسعة.',
      en: 'A quiet light beige with almost no visible veining — an easy surface across large spans.',
    },
    availability: 'ready',
    colorFamily: 'beige',
    synonyms: [
      { ar: 'رخام بيج فاتح', en: 'light beige marble' },
      { ar: 'بوتشينو', en: 'botticino classico' },
    ],
    palette: {
      light: '#F7F0E2',
      mid: '#EDE1CB',
      deep: '#D6C4A6',
      vein: '#BCA483',
      veinSoft: '#E0D0B4',
    },
    veinOpacity: 0.3,
    seed: 197,
  },
  {
    id: 'travertine',
    name: { ar: 'ترافرتين كلاسيك', en: 'Classic Travertine' },
    description: {
      ar: 'طبقات أفقية دافئة وملمس مسامي مميز — طابع تقليدي يناسب المداخل والأفنية.',
      en: 'Warm horizontal banding with a distinctive porous character — traditional, and at home in entrances and courtyards.',
    },
    availability: 'ready',
    colorFamily: 'beige',
    synonyms: [
      { ar: 'ترافرتين', en: 'travertino' },
      { ar: 'حجر ترافرتين', en: 'travertine stone' },
    ],
    palette: {
      light: '#F2E5D1',
      mid: '#E2CFB2',
      deep: '#C4A87F',
      vein: '#A98A61',
      veinSoft: '#D8C3A4',
    },
    veinOpacity: 0.38,
    seed: 211,
  },
  {
    id: 'onyx-honey',
    name: { ar: 'أونكس عسلي', en: 'Honey Onyx' },
    description: {
      ar: 'أونكس بدرجات العسل وطبقات شبه شفافة — يُستخدم عادةً مع إضاءة خلفية.',
      en: 'Honey-toned onyx with translucent banding — usually specified with backlighting.',
    },
    availability: 'order',
    colorFamily: 'beige',
    synonyms: [
      { ar: 'أونيكس', en: 'onyx' },
      { ar: 'أونكس أصفر', en: 'amber onyx' },
    ],
    palette: {
      light: '#F6E2BE',
      mid: '#E7C994',
      deep: '#C79E5E',
      vein: '#A87B3C',
      veinSoft: '#DCBB86',
    },
    veinOpacity: 0.52,
    seed: 223,
  },
  {
    id: 'bardiglio',
    name: { ar: 'بارديليو إمبريال', en: 'Bardiglio Imperiale' },
    description: {
      ar: 'رمادي هادئ بعروق بيضاء دقيقة، مناسب للمساحات الحديثة.',
      en: 'A calm grey with fine white veining, suited to contemporary interiors.',
    },
    availability: 'ready',
    colorFamily: 'grey',
    synonyms: [
      { ar: 'رخام رمادي', en: 'grey marble' },
      { ar: 'بارديجليو', en: 'bardiglio nuvolato' },
    ],
    palette: {
      light: '#DFE0DD',
      mid: '#C7C9C5',
      deep: '#A3A6A1',
      vein: '#6C716D',
      veinSoft: '#EDEEEB',
    },
    veinOpacity: 0.5,
    seed: 23,
  },
  {
    id: 'grigio-carnico',
    name: { ar: 'غريجيو كارنيكو', en: 'Grigio Carnico' },
    description: {
      ar: 'رمادي داكن بعروق بيضاء واضحة — بديل أهدأ من الأسود مع نفس العمق.',
      en: 'A dark grey cut by clear white veining — a quieter alternative to black with the same depth.',
    },
    availability: 'order',
    colorFamily: 'grey',
    synonyms: [
      { ar: 'رخام رمادي داكن', en: 'dark grey marble' },
      { ar: 'كارنيكو', en: 'grigio carnico scuro' },
    ],
    palette: {
      light: '#6E7270',
      mid: '#555957',
      deep: '#3A3D3C',
      vein: '#E2E4E1',
      veinSoft: '#9EA3A0',
      lightVeins: true,
    },
    veinOpacity: 0.6,
    seed: 239,
  },
  {
    id: 'nero',
    name: { ar: 'نيرو بورتورو', en: 'Nero Portoro' },
    description: {
      ar: 'حجر داكن بعروق ذهبية واضحة — حضور قوي في المساحات الواسعة.',
      en: 'A dark stone with bright golden veining — a strong presence in large rooms.',
    },
    availability: 'order',
    colorFamily: 'black',
    synonyms: [
      { ar: 'رخام داكن', en: 'dark marble' },
      { ar: 'رخام أسود بعروق ذهبية', en: 'black and gold marble' },
      { ar: 'بورتورو', en: 'portoro' },
    ],
    palette: {
      light: '#3A3733',
      mid: '#282521',
      deep: '#16130F',
      vein: '#D6CCBA',
      veinSoft: '#8E8578',
      lightVeins: true,
    },
    veinOpacity: 0.6,
    seed: 47,
  },
  {
    id: 'nero-marquina',
    name: { ar: 'نيرو ماركينا', en: 'Nero Marquina' },
    description: {
      ar: 'أسود عميق بعروق بيضاء حادة ومتقاطعة — أشهر الأحجار الداكنة وأكثرها تباينًا.',
      en: 'A deep black crossed by crisp white veining — the best known of the dark stones, and the highest in contrast.',
    },
    availability: 'ready',
    colorFamily: 'black',
    synonyms: [
      { ar: 'رخام أسود', en: 'black marble' },
      { ar: 'ماركينا', en: 'marquina' },
      { ar: 'نيرو مركينا', en: 'nero marquiña' },
    ],
    palette: {
      light: '#33302C',
      mid: '#1C1A17',
      deep: '#0D0C0A',
      vein: '#F2F0EA',
      veinSoft: '#9C9890',
      lightVeins: true,
    },
    veinOpacity: 0.72,
    seed: 251,
  },
  {
    id: 'sahara-noir',
    name: { ar: 'صحارى نوار', en: 'Sahara Noir' },
    description: {
      ar: 'أسود مائل للبني بعروق بيضاء عريضة — دفء لا تجده في الأسود الصافي.',
      en: 'A brown-black with broad white veining — warmer than a pure black will ever read.',
    },
    availability: 'order',
    colorFamily: 'black',
    synonyms: [
      { ar: 'رخام أسود بني', en: 'brown black marble' },
      { ar: 'صحارة نوار', en: 'black beauty' },
    ],
    palette: {
      light: '#453B32',
      mid: '#2E2620',
      deep: '#191411',
      vein: '#EDE6DA',
      veinSoft: '#A2907C',
      lightVeins: true,
    },
    veinOpacity: 0.66,
    seed: 263,
  },
  {
    id: 'verde',
    name: { ar: 'فيردي غواتيمالا', en: 'Verde Guatemala' },
    description: {
      ar: 'أخضر عميق بعروق فاتحة، يُستخدم عادةً في القطع المميزة.',
      en: 'A deep green with light veining, usually chosen for statement pieces.',
    },
    availability: 'order',
    colorFamily: 'green',
    synonyms: [
      { ar: 'رخام أخضر', en: 'green marble' },
      { ar: 'أخضر غواتيمالا', en: 'verde guatemala' },
    ],
    palette: {
      light: '#42574B',
      mid: '#31423A',
      deep: '#1F2C26',
      vein: '#C3D0BC',
      veinSoft: '#7E9083',
      lightVeins: true,
    },
    veinOpacity: 0.55,
    seed: 61,
  },
  {
    id: 'verde-alpi',
    name: { ar: 'فيردي ألبي', en: 'Verde Alpi' },
    description: {
      ar: 'أخضر داكن تقطعه عروق بيضاء حادة — حجر كلاسيكي للطاولات والمغاسل.',
      en: 'A dark green broken by sharp white veining — a classic for tables and vanities.',
    },
    availability: 'order',
    colorFamily: 'green',
    synonyms: [
      { ar: 'رخام أخضر داكن', en: 'dark green marble' },
      { ar: 'فردي ألبي', en: 'verde alpi tinos' },
    ],
    palette: {
      light: '#36493F',
      mid: '#24332C',
      deep: '#141D19',
      vein: '#EAF0E6',
      veinSoft: '#8AA092',
      lightVeins: true,
    },
    veinOpacity: 0.68,
    seed: 277,
  },
  {
    id: 'emperador',
    name: { ar: 'إمبرادور داكن', en: 'Emperador Dark' },
    description: {
      ar: 'بني دافئ بعروق ذهبية، يمنح القطعة طابعًا تقليديًا فاخرًا.',
      en: 'A warm brown with golden veining, giving the piece a traditional, formal character.',
    },
    availability: 'order',
    colorFamily: 'brown',
    synonyms: [
      { ar: 'رخام بني', en: 'brown marble' },
      { ar: 'امبرادور', en: 'emperador marron' },
    ],
    palette: {
      light: '#6A5241',
      mid: '#523E30',
      deep: '#3A2A1F',
      vein: '#C9AD8B',
      veinSoft: '#8A7057',
      lightVeins: true,
    },
    veinOpacity: 0.5,
    seed: 89,
  },
  {
    id: 'rosso-levanto',
    name: { ar: 'روسو ليفانتو', en: 'Rosso Levanto' },
    description: {
      ar: 'أحمر عنّابي عميق بشبكة عروق بيضاء — خيار جسور للمجالس الرسمية.',
      en: 'A deep burgundy with a white vein network — a bold choice for a formal majlis.',
    },
    availability: 'order',
    colorFamily: 'red',
    synonyms: [
      { ar: 'رخام أحمر', en: 'red marble' },
      { ar: 'روسو', en: 'rosso levanto marble' },
    ],
    palette: {
      light: '#6E3330',
      mid: '#52231F',
      deep: '#361412',
      vein: '#E8DAD0',
      veinSoft: '#A06B61',
      lightVeins: true,
    },
    veinOpacity: 0.62,
    seed: 293,
  },
]

export const marbleById = (id: MarbleId): MarbleOption =>
  MARBLES.find((m) => m.id === id) ?? MARBLES[0]

/* ------------------------------------------------------------------ search */

/** Strips Arabic diacritics and normalises the letter forms people vary on. */
function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/ñ/g, 'n')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Everything one stone can be matched against, in both languages. */
function haystack(marble: MarbleOption, families: typeof COLOR_FAMILIES): string {
  const family = families.find((f) => f.id === marble.colorFamily)
  return normalise(
    [
      marble.id,
      marble.name.ar,
      marble.name.en,
      marble.description.ar,
      marble.description.en,
      family?.name.ar ?? '',
      family?.name.en ?? '',
      ...(marble.synonyms ?? []).flatMap((s) => [s.ar, s.en]),
    ].join(' '),
  )
}

const haystacks = new Map<MarbleId, string>()

/**
 * Filters the catalogue by free text and, optionally, colour family. Matching
 * is per-word so "nero white" and "أسود عروق" both behave sensibly, and the
 * haystacks are built once per stone.
 */
export function searchMarbles(
  query: string,
  family: ColorFamilyId | 'all' = 'all',
): MarbleOption[] {
  const words = normalise(query).split(' ').filter(Boolean)
  return MARBLES.filter((marble) => {
    if (family !== 'all' && marble.colorFamily !== family) return false
    if (words.length === 0) return true
    let hay = haystacks.get(marble.id)
    if (!hay) {
      hay = haystack(marble, COLOR_FAMILIES)
      haystacks.set(marble.id, hay)
    }
    return words.every((word) => hay.includes(word))
  })
}
