# Expand "Design Your Own Block" — 4 new units + whole-block rotation

Everything below is written for a quilter who has never heard a piecing term. Every unit gets a plain-English name, a one-line explanation in the editor, and a picture. No jargon-only labels.

## The palette (7 units instead of 3)

Each palette button shows a small picture of the unit, a plain name, and one sentence underneath.

| Picture | Name shown | Sentence shown underneath |
|---|---|---|
| existing | **Plain square** | One whole square of a single fabric. The simplest piece there is. |
| existing | **Two triangles** | A square cut corner to corner so two fabrics meet on the diagonal. Quilters call this an HST. |
| existing | **Four triangles** | A square split into four triangles that meet in the middle — the classic hourglass piece. |
| new | **Snipped corners** | A square with a small triangle across one or more corners, like a Snowball block. Tap the corners to turn them on and off. |
| new | **Square on point** | A square turned 45° so it sits like a diamond, with background triangles filling the four corners. |
| new | **Long triangles** | A stretched diagonal across two side-by-side cells — a slant you cannot make from single squares. |
| new | **Split in half** | A square split straight across the middle into two halves — for stripes, bars and rails. |

Notes on the new four:

- **Snipped corners** — instead of a confusing options list, the fabric panel shows a live picture of the unit with four tappable corners. Tap a corner to add or remove its triangle. At least one corner must stay on (the app won't let you turn all four off, and says why). Two fabric pickers: "Main square" and "Corner triangles".
- **Square on point** — two fabric pickers: "Diamond in the middle" and "Background corners". No turn button (it looks the same every way round), so nothing useless appears on screen.
- **Long triangles** — the only unit that covers two cells. Tapping the grid places it across the cell you tapped plus the one next to it; if it would hang off the edge, that cell simply doesn't respond and a short line of help text explains why. The turn button stands it upright or flips the slant, and the button text says what it will do in words, not degrees.
- **Split in half** — two fabric pickers, "First half" and "Second half". The turn button switches between a top/bottom split and a left/right split.

## Whole-block rotation

A **"Turn the whole block"** button under the block preview spins everything you've drawn a quarter turn at a time. It rewrites the drawn design directly, so the quilt preview, full-screen views, cutting list and alternating-block settings all follow automatically with no extra setting to understand. Undo covers it like any other change.

## Making it hard to get lost

- The turn buttons say what they do in words ("Turn this piece a quarter turn"), with the current orientation shown by the live picture rather than a number.
- The fabric pickers are already labelled per region; the new units keep that pattern with everyday region names ("Main square", "Background corners") instead of piecing terms.
- Units with only one sensible orientation hide the turn button entirely.
- Empty cells stay dashed and the Next button stays disabled with a plain-language list of what's left, exactly as it works today.

## Technical detail

- **`src/lib/custom-block.ts`** — extend `UnitKind`, `REGION_COUNT`, `UNIT_LABEL`, `REGION_LABELS`, `ROTATION_STEPS`; add a `UNIT_HELP` map for the one-line descriptions and an optional `corners: boolean[]` field on `CustomCell` for the snipped-corner unit. Extend `cellsCovered` to a 2-cell footprint for "Long triangles" (orientation from rotation), and `unitPolys` with the four new polygon sets. Extend `UnitTally` with records for cornered bases + flip squares, on-point centres + corner squares, long-triangle rectangles, and split halves; update `scaleTally`/`mergeTallies`/`swapFabrics`/`rotateDesign` to carry them.
- **`src/lib/yardage.ts`** — in the custom-block branch, add cutting for each new unit, all routed through the shared `addSquares`/`addRails` helpers:
  - Snipped corners: base square at unit + 1/2"; one corner square per active corner at unit/2 + 1/2", sewn stitch-and-flip (draw the diagonal, sew, trim, press).
  - Square on point: centre square at unit/1.414 + 1/2"; 2 squares at unit/2 + 7/8" cut once on the diagonal for the four background corners (same method the Economy Block already uses).
  - Long triangles: two rectangles at (2 units + 1") × (unit + 1"), the standard oversized half-rectangle method, trimmed after sewing.
  - Split in half: two rectangles at unit + 1/2" wide × unit/2 + 1/2" tall.
  Each gets a plain-language sewing note in the same voice as the existing notes.
- **`src/pages/DesignBlockPage.tsx`** — 7-button palette with pictures and help text, corner-toggle picker for snipped corners, word-based turn buttons, "Turn the whole block" control, and help text when a two-cell unit won't fit.
- **`src/components/CustomBlockSvg.tsx`** — unchanged; new shapes flow through `blockPolys` and the existing fabric tokens.

## Verification

- `bun audit:math` and a typecheck after the yardage changes.
- Playwright pass: place all seven units, toggle corners, place a long triangle at the right-hand edge (must refuse), turn the whole block, then walk to Results and check the cutting list totals.
