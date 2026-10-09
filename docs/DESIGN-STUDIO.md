# The Design Studio (`/customize`)

What happens when a customer uploads a photograph of a table they like, and how
much of it is real.

---

## The shape of it

```
upload  ──▶  one-time analysis  ──▶  tabletop quad + object mask
                                          │
                                          ▼
           ┌──────────── persistent preview (canvas) ────────────┐
           │  every selection repaints locally, in milliseconds  │
           └────────────────────────┬───────────────────────────┘
                                    │  once, on request
                                    ▼
                        optional AI render  (server route)
```

The rule the whole design follows: **a generative model is never called while
the customer is configuring.** Stone, edge, base, finish, thickness, vein
direction and every dimension are applied locally on a 2D canvas. The model is
invited exactly once, at the end, by the customer, on a button.

## Where things live

| Concern | File |
| --- | --- |
| The configuration (single source of truth) | `lib/data/design.ts`, `lib/store/design-store.ts` |
| Stone catalogue + search | `lib/data/marbles.ts` |
| Finding the tabletop in a photograph | `lib/design/analysis.ts` |
| Painting stone onto the photograph | `lib/design/composite.ts` |
| Marble texture, shared by SVG and canvas | `lib/marble/texture.ts` |
| Written specification, both languages | `lib/design/describe.ts` |
| AI provider abstraction (server only) | `lib/design/ai/`, `app/api/ai/generate-preview/route.ts` |
| The persistent preview | `components/configurator/DesignPreview.tsx` |
| Manual tabletop placement | `components/configurator/CornerAdjuster.tsx` |

## How the stone gets onto a photograph

1. Draw the photograph.
2. Clip to the tabletop and paint marble into it. On its own this looks like a
   sticker, because the photograph's lighting has been discarded.
3. Blend the photograph's own luminance back over the marble with `overlay`,
   normalised so the tabletop's *average* brightness is neutral. Neutral leaves
   the marble alone; darker areas darken it, lighter areas lighten it. The
   shadows, the sheen and the darker far edge all return, now in the new stone.
   **This step is the difference between a convincing preview and a paint
   bucket.**
4. Draw the edge band, the finish pass and the base tint on top.

The marble tile is painted once per stone and cached, so clicking through the
whole catalogue allocates nothing and requests nothing.

## Finding the tabletop

`lib/design/analysis.ts`, and it is the part that decides whether any of this
works. An earlier version subtracted the image border colour and called the rest
"the piece" — fine on a studio cut-out, useless in a real dining room, where
"everything that is not the border" is most of the room.

What it does now:

1. **Downscale to 320px and blur twice.** Timber grain, rug pile and fabric weave
   are texture, not boundaries.
2. **Find edges on the once-blurred signal.** Each extra blur pass widens a real
   boundary into a ramp, and every pixel of that ramp is one the guard withholds
   from the mask — which the customer sees as a rim of bare wood around their new
   stone.
3. **Grow regions over colour**, weighting brightness at 0.45 so a tabletop that
   runs from lit to shadowed stays one surface. Three tests must all pass: no
   growing across an edge, no jump in local colour, and no drift from the
   region's running mean. The third is the important one — a top, its apron and
   its legs form a smooth ramp of browns in which every individual step looks
   small, and without it the top grows straight down the legs.
4. **Score every region** on what makes a tabletop a tabletop:
   - horizontally elongated, but within a plausible band — floorboards, skirting
     and shadows are long and thin too;
   - **rows that are nearly solid between their own extremes.** Not "one unbroken
     run per row": a vase standing on the table splits rows without making it any
     less of a table. Fill survives an occluder; run-counting does not;
   - sitting around the middle of the frame, graded, because the lower a
     candidate sits the more likely it is to be floor or rug;
   - **something narrower underneath holding it up.** This is what separates a
     tabletop from a patch of floor — both are flat, horizontal and solid; only
     one has legs under it.
5. **Return the winner as a mask**, then dilate it slightly. The mask is the true
   outline, so a round table gets a round top and an oval one an oval, with no
   shape fitting anywhere in the pipeline.

Measured against scenes whose true tabletop is known: IoU 0.96 on a round table
in a room, 0.92 on an oval with a vase on it, 0.91 on a studio rectangle. A white
table on a white wall and a busy patterned scene both decline.

**Confidence, and what happens below it.** The winner's own score and its margin
over the runner-up become a confidence. Below `CONFIDENCE_FLOOR` the studio
paints **nothing at all** — it shows the photograph untouched and asks the
customer to place four corners. That is the whole point: a wrong mask is worse
than no mask, and the previous version's real failing was not its shape but that
it painted regardless.

`ImageAnalysisProvider` is an interface. Swapping the heuristic for SAM 2,
Grounded-SAM or a hosted segmenter is one implementation plus
`setAnalysisProvider`; the result type already carries the masks such a service
returns. Nothing else in the app changes.

## Applying the stone

`renderComposite` builds the stone on its own layer — texture, then the
photograph's luminance blended back with `overlay`, then the finish — and cuts
the whole layer to the mask with `destination-in`. Nothing outside the mask is
ever written to, so the wall, floor, vase and legs survive by construction
rather than by being careful.

The edge band is walked along the **bottom silhouette of the mask**, column by
column, so it curves with a round table instead of cutting a straight line
across it.

A customer-placed quad is rasterised by `maskFromQuad` into the same kind of
mask, so the manual route and the automatic route share one drawing path.

## Honest limits

| | |
| --- | --- |
| Stone, finish, vein direction, outline | Applied for real, live, on the photograph. |
| Dimensions | Held as exact numbers and quoted from. **Not** shown to scale — the photograph is never stretched to fake a longer table. |
| Edge profile | A real band at the real thickness under the front lip. A visual approximation, not a reconstruction of the customer's actual edge. |
| Base / legs | A **recolour** that keeps the photographed shape. Brass reads as brass; it does not replace the legs with different legs. "Keep original" is exact by definition. |
| Tabletop detection | Automatic on clean single-table photographs, including real interiors. Measured IoU 0.91–0.96 on known scenes. |
| Hard photographs | Low confidence declines and routes to manual corner placement. Nothing is painted on a guess. This is intended. |
| Very cluttered scenes, several tables, near-zero contrast | Expect a decline rather than a good mask. A real segmenter is the answer, and the provider interface is where it goes. |

The UI states these in one quiet line under the preview (`design.approx.*`),
never as a warning.

## The AI step

- `POST /api/ai/generate-preview` is the only place a model is called.
- Keys are server-only. Nothing in `lib/design/ai/` may be imported by a client
  component, and no key is ever `NEXT_PUBLIC_`.
- With **no key configured** the route returns `200` with
  `{ mode: 'fallback', image: null, description }` and the studio keeps showing
  its local composite labelled "Live". This is not a degraded path somebody has
  to remember to test — it is what the demo runs on.
- The description is always built locally from the configuration
  (`describeDesign`), so it is correct in both languages whether or not a model
  ran. **The generated image is never the source of truth.**

See `.env.example` for the variables.

## Submitting

The request carries both shapes: `config` (the storefront's `PieceConfig`, which
the admin renderer and the estimate maths already understand) and `design` (the
full studio specification plus the reference photograph and any render). That
projection — `toPieceConfig` — is why the shop, the product pages, the portfolio
and the admin console did not have to change.

Requests persist to `localStorage`. Because they now carry imagery, the persist
adapter sheds pictures from *older* requests rather than throwing when the origin
quota is reached (`lib/store/requests-store.ts`). Every specification survives.
