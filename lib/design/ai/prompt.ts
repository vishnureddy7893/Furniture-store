import {
  edgeById,
  marbleById,
  pieceById,
  shapeById,
} from '@/lib/data/configurator'
import {
  baseTypeById,
  finishById,
  veinById,
  type DesignConfiguration,
} from '@/lib/data/design'
import { formatDimensions, formatThickness } from '@/lib/design/describe'

/**
 * Assembles the instruction for the image model.
 *
 * Written to hold the model to the customer's own piece. An image model left to
 * its own devices will happily return a beautiful table that is not the one that
 * was uploaded, which is worse than useless here — the customer is about to ask
 * for a quote on it. So the prompt leads with what must not change, states the
 * stone in physical terms rather than as a colour, and closes by ruling out the
 * two failure modes that actually happen: inventing furniture, and drawing a
 * technical diagram.
 *
 * Dimensions are included as context, not as a promise. No image model measures.
 */
export function buildPreviewPrompt(design: DesignConfiguration): string {
  const marble = marbleById(design.materialId)
  const piece = pieceById(design.pieceType)
  const finish = finishById(design.finish)
  const edge = edgeById(design.edgeProfile)
  const base = baseTypeById(design.baseType)
  const shape = shapeById(design.shape)
  const vein = veinById(design.veinDirection)

  const hasReference = Boolean(design.referenceImage)

  const preserve = hasReference
    ? [
        'Preserve the exact furniture design in the reference photograph: the same silhouette, the same proportions, the same camera angle, the same lens perspective, the same lighting direction and the same background.',
        'Do not restyle the piece, do not reframe the shot, and do not move the camera.',
      ]
    : [
        `Render a single ${piece.name.en.toLowerCase()} in a calm, well-lit interior, photographed at a natural three-quarter angle.`,
      ]

  const changes = [
    `Surface stone: ${marble.name.en} marble — ${marble.description.en}`,
    `Surface finish: ${finish.name.en} — ${finish.description.en}`,
    `Edge profile on the visible front edge: ${edge.name.en} — ${edge.description.en}`,
    `Slab thickness: ${formatThickness(design, 'en')}, which should read in the visible edge.`,
    `Vein direction across the top: ${vein.name.en} — ${vein.description.en}`,
    `Top outline: ${shape.name.en}.`,
    base.id === 'original'
      ? 'Base and legs: keep exactly as they appear in the reference photograph, unchanged in shape, material and colour.'
      : `Base and legs: ${base.name.en} — ${base.description.en} Keep the base in the same position and proportion as the reference; change only its material.`,
  ]

  return [
    'You are producing a photorealistic product visualisation for a marble and stone workshop.',
    '',
    'What must not change:',
    ...preserve.map((line) => `- ${line}`),
    '',
    'What to apply:',
    ...changes.map((line) => `- ${line}`),
    '',
    `Reference dimensions for context only: ${formatDimensions(design, 'en')}. Do not draw dimension lines, measurements, labels, arrows, watermarks or text of any kind.`,
    '',
    'Constraints:',
    '- Output one photorealistic interior photograph of this single piece.',
    '- Do not add other furniture, props, people or decorative objects that are not in the reference.',
    '- Do not produce a technical drawing, a blueprint, an exploded view, a collage or a set of variants.',
    '- Natural, physically plausible marble: veining that follows the surface and reacts to the lighting already in the scene.',
    '- This is a visualisation for discussion, not a manufacturing drawing.',
  ].join('\n')
}
