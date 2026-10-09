import { create } from 'zustand'
import {
  DEFAULT_DESIGN,
  clampDimension,
  pieceDefaults,
  type BaseTypeId,
  type DesignConfiguration,
  type FinishId,
  type Unit,
  type VeinId,
} from '@/lib/data/design'
import type { EdgeId, MarbleId, PieceId, ShapeId } from '@/lib/data/configurator'
import {
  CONFIDENCE_FLOOR,
  analyzeFurnitureImage,
  type AnalysisResult,
  type Quad,
} from '@/lib/design/analysis'
import { prepareUpload, type UploadRejection } from '@/lib/design/image'

/**
 * The design studio's single store.
 *
 * One configuration object, one step index, one analysis result. No step keeps
 * private state, which is what makes the persistent preview trivially correct:
 * it reads the same object every control writes to, so there is nothing to keep
 * in sync and nothing to re-derive when the customer moves between steps.
 *
 * Deliberately not persisted. The reference photograph alone is bigger than a
 * comfortable localStorage budget, and a half-restored design — specification
 * back, photograph gone — is a worse experience than a clean start. What *is*
 * persisted is the submitted request, which is the thing that matters.
 */

export const STEP_COUNT = 7

/** Steps by index, so nothing has to remember that dimensions are step two. */
export const STEPS = {
  inspiration: 0,
  dimensions: 1,
  material: 2,
  edge: 3,
  base: 4,
  finish: 5,
  review: 6,
} as const

export type UploadStatus = 'empty' | 'analyzing' | 'ready' | 'needsHelp' | 'error'

export interface GeneratedPreview {
  image: string | null
  mode: 'ai' | 'fallback'
  description: { ar: string; en: string }
}

export type GenerateStatus = 'idle' | 'working' | 'done' | 'error'

interface DesignState {
  design: DesignConfiguration
  step: number
  /** Furthest step reached, so earlier steps stay clickable. */
  furthest: number

  /**
   * Larger copy of the photograph, used only for compositing. Kept out of
   * `design` because it never leaves the browser.
   */
  workingImage: string | null
  uploadStatus: UploadStatus
  uploadError: UploadRejection | null
  analysis: AnalysisResult | null
  /** The tabletop, either as detected or as the customer placed it. */
  quad: Quad | null
  /** True once the customer has moved a corner themselves. */
  quadAdjusted: boolean
  /** The corner adjuster is open over the preview. */
  adjusting: boolean

  generated: GeneratedPreview | null
  generateStatus: GenerateStatus

  /* actions */
  goTo: (step: number) => void
  next: () => void
  previous: () => void

  upload: (file: File) => Promise<void>
  removeImage: () => void
  setQuad: (quad: Quad) => void
  resetQuad: () => void
  setAdjusting: (adjusting: boolean) => void

  setPieceType: (piece: PieceId) => void
  setDimension: (key: 'length' | 'width' | 'height', value: number) => void
  nudgeDimension: (key: 'length' | 'width' | 'height', direction: 1 | -1) => void
  setUnit: (unit: Unit) => void
  setMaterial: (id: MarbleId) => void
  setShape: (id: ShapeId) => void
  setEdge: (id: EdgeId) => void
  setBaseType: (id: BaseTypeId) => void
  setFinish: (id: FinishId) => void
  setThickness: (mm: number) => void
  setVeinDirection: (id: VeinId) => void
  setNotes: (notes: string) => void

  setGenerated: (preview: GeneratedPreview | null) => void
  setGenerateStatus: (status: GenerateStatus) => void

  reset: () => void
}

/** Rising counter, so a slow analysis from a replaced photo cannot land late. */
let uploadToken = 0

const initial = {
  design: DEFAULT_DESIGN,
  step: 0,
  furthest: 0,
  workingImage: null,
  uploadStatus: 'empty' as UploadStatus,
  uploadError: null,
  analysis: null,
  quad: null,
  quadAdjusted: false,
  adjusting: false,
  generated: null,
  generateStatus: 'idle' as GenerateStatus,
}

export const useDesignStore = create<DesignState>()((set, get) => ({
  ...initial,

  /* ------------------------------------------------------------ navigation */

  goTo: (step) => {
    const next = Math.max(0, Math.min(STEP_COUNT - 1, step))
    set((s) => ({ step: next, furthest: Math.max(s.furthest, next) }))
  },

  next: () => get().goTo(get().step + 1),
  previous: () => get().goTo(get().step - 1),

  /* ---------------------------------------------------------------- upload */

  upload: async (file) => {
    const token = ++uploadToken
    set({ uploadStatus: 'analyzing', uploadError: null, generated: null, generateStatus: 'idle' })

    const prepared = await prepareUpload(file)
    if (token !== uploadToken) return

    if (!prepared.ok) {
      set({ uploadStatus: 'error', uploadError: prepared.reason })
      return
    }

    // The photograph is published to the store before analysis runs, so the
    // preview can show it on the very next paint. Analysis is never in the way.
    set((s) => ({
      design: { ...s.design, referenceImage: prepared.image.portable },
      workingImage: prepared.image.working,
      analysis: null,
      quad: null,
      quadAdjusted: false,
      adjusting: false,
    }))

    try {
      const analysis = await analyzeFurnitureImage(prepared.image.working)
      if (token !== uploadToken) return
      set({
        analysis,
        quad: analysis.tabletopCorners,
        uploadStatus: analysis.confidence >= CONFIDENCE_FLOOR ? 'ready' : 'needsHelp',
      })
    } catch {
      if (token !== uploadToken) return
      // Analysis failing is not an upload failure: the photograph is fine, we
      // just need the customer to place the corners.
      set({ uploadStatus: 'needsHelp' })
    }
  },

  removeImage: () => {
    uploadToken += 1
    set((s) => ({
      design: { ...s.design, referenceImage: null },
      workingImage: null,
      uploadStatus: 'empty',
      uploadError: null,
      analysis: null,
      quad: null,
      quadAdjusted: false,
      adjusting: false,
      generated: null,
      generateStatus: 'idle',
    }))
  },

  setQuad: (quad) => set({ quad, quadAdjusted: true, uploadStatus: 'ready' }),

  setAdjusting: (adjusting) => set({ adjusting }),

  resetQuad: () =>
    set((s) => ({
      quad: s.analysis?.tabletopCorners ?? s.quad,
      quadAdjusted: false,
    })),

  /* ---------------------------------------------------------- the numbers */

  setPieceType: (piece) =>
    set((s) => {
      const defaults = pieceDefaults(piece)
      return {
        design: {
          ...s.design,
          pieceType: piece,
          // A different kind of piece starts from its own proportions, and only
          // keeps the outline if that outline still makes sense for it.
          dimensions: { ...defaults.dimensions, unit: s.design.dimensions.unit },
          shape: defaults.shapes.includes(s.design.shape) ? s.design.shape : defaults.shapes[0],
        },
      }
    }),

  setDimension: (key, value) =>
    set((s) => {
      const piece = s.design.pieceType
      const next = { ...s.design.dimensions, [key]: clampDimension(value, piece, key) }
      // A round or square top is as deep as it is long.
      if ((s.design.shape === 'round' || s.design.shape === 'square') && key === 'length') {
        next.width = next.length
      }
      return { design: { ...s.design, dimensions: next } }
    }),

  nudgeDimension: (key, direction) => {
    const { design } = get()
    const step = design.dimensions.unit === 'cm' ? 1 : 2.54 / 2
    get().setDimension(key, design.dimensions[key] + step * direction)
  },

  setUnit: (unit) =>
    set((s) => ({ design: { ...s.design, dimensions: { ...s.design.dimensions, unit } } })),

  setMaterial: (materialId) => set((s) => ({ design: { ...s.design, materialId } })),

  setShape: (shape) =>
    set((s) => {
      const dimensions = { ...s.design.dimensions }
      if (shape === 'round' || shape === 'square') dimensions.width = dimensions.length
      return { design: { ...s.design, shape, dimensions } }
    }),

  setEdge: (edgeProfile) => set((s) => ({ design: { ...s.design, edgeProfile } })),
  setBaseType: (baseType) => set((s) => ({ design: { ...s.design, baseType } })),
  setFinish: (finish) => set((s) => ({ design: { ...s.design, finish } })),

  setThickness: (mm) =>
    set((s) => ({
      design: { ...s.design, thickness: Math.max(12, Math.min(120, Math.round(mm))) },
    })),

  setVeinDirection: (veinDirection) => set((s) => ({ design: { ...s.design, veinDirection } })),
  setNotes: (notes) => set((s) => ({ design: { ...s.design, notes: notes.slice(0, 2000) } })),

  /* -------------------------------------------------------------------- ai */

  setGenerated: (generated) => set({ generated }),
  setGenerateStatus: (generateStatus) => set({ generateStatus }),

  reset: () => {
    uploadToken += 1
    set({ ...initial })
  },
}))

/* -------------------------------------------------------------- selectors */

/** A photograph is loaded, whether or not analysis has finished. */
export const selectHasPhoto = (s: DesignState) => s.workingImage !== null

/**
 * Whether the studio is confident about where the tabletop is — either because
 * the analysis was, or because the customer placed the corners themselves.
 */
export const selectConfident = (s: DesignState) =>
  s.quadAdjusted || (s.analysis !== null && s.analysis.confidence >= CONFIDENCE_FLOOR)
