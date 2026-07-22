
## Goal

Rebuild the Maple Star single-block renderer so it matches the reference image exactly:

1. Each of the 4 corner macro-cells is a **2u × 2u block of pure Fabric A** — no accent, no flip corner, no triangle intrudes.
2. Each of the 4 edge macro-cells is a **2u × 2u flying-goose unit** where the **apex triangle is Fabric B (accent)** and the **two flanking triangles are Fabric A (background)** — the inverse of what ships today.
3. All 4 star points are rotationally identical (one shared unit, rotated 0°/90°/180°/270°).
4. Inner 3×3 macro area (center + frame + inner-ring squares) stays as-is.

## Files to change

### `src/components/PatternDiagram.tsx` — `MapleStarBlock`

Switch from a 6u grid with 1u corners + narrow geese to a **true unequal 3×3 grid** where the three columns/rows are `[2u, 2u, 2u]` (so the block is still 6u total, but the macro cells are 2u each). Then:

- **4 corners (2u × 2u):** single `<rect fill={bg}>`. No geese, no flips.
- **4 edges (2u × 2u):** one shared `StarPoint` sub-component that renders a 2u × 2u square as:
  - `<rect fill={bg}>` background,
  - one `<polygon fill={acc}>` apex triangle from the two BACK corners (edge farthest from block center) meeting at the midpoint of the OUTER edge.
  - Rendered with an SVG `transform="rotate(...)"` per side so top/right/bottom/left are literally the same unit rotated.
- **Center 3×3 inner region** (columns/rows 2u..4u):
  - 4 accent squares (B) at the inner-ring corners (unchanged fill, but repositioned to the new grid),
  - 4 frame rectangles (C) as the plus arms (repositioned),
  - 1 center square (D) at the true center (repositioned).
- Debug gridline overlay stays gated on `debug` prop, drawing the 3×3 macro grid at 2u intervals so the corner boundary is obvious during verification.

### `src/lib/yardage.ts` — Maple Star branch

Piece count per block stays the same shape but the semantics change slightly, so the cutting notes need to match the new geometry:

- Fabric A: **4 corner squares at C × C (2u × 2u finished)** + **8 flip-corner squares at s × s (1u × 1u finished)** — the flip squares now belong to A (they become the background flanks of the goose), replacing the previous 8 goose-base rectangles.
- Fabric B: **1 apex-flip square at s × s (1u × 1u finished) × … actually per-goose piece count is: 1 rectangle 2u × 1u (B) + 2 flip squares 1u × 1u (A).** So per block:
  - Fabric B: 4 inner-ring squares (s × s) + 4 goose-base rectangles (2u × 1u, i.e. C × s).
  - Fabric A: 4 corner squares (C × C) + 8 flip-corner squares (s × s).
- Fabric C: 4 frame rectangles (C × s), unchanged.
- Fabric D: 1 center square (C × C), unchanged.

Update the two summary `notes.push(...)` sentences and the flying-geese instruction sentence to reflect: "each goose = 1 Fabric B rectangle + 2 Fabric A flip corners; apex points OUTWARD (toward the block edge), not toward the center."

No changes to sashing/border logic.

### No changes needed

- `src/lib/patterns.ts` — section metadata and defaults stay the same.
- `src/components/PatternThumb.tsx` and `src/components/QuiltLayoutPreview.tsx` — they call `MapleStarBlock`, so fixing it fixes them too.
- Yardage totals per fabric letter don't shift in a way that affects the shopping list *count* of yards materially (piece counts change but same fabrics), but the cut sizes and notes must be corrected.

## Verification sequence (before declaring done)

1. Render `MapleStarBlock` with `debug` gridlines on and confirm each 2u×2u corner cell is 100% `bg`-filled — no other fabric color crosses the corner cell boundary.
2. Render the clean single-block `PatternDiagram` at 280px next to image-155 and visually confirm: 4 sage corners, 4 orange apex triangles pointing outward, orange inner ring (4 B squares + 4 C rectangles), red center.
3. Confirm all 4 star points are rotational copies of one unit (visual symmetry check).
4. Render `QuiltLayoutPreview` at 3×4 to confirm the tiled quilt reads correctly and star points don't collide across neighboring blocks.
5. Run `bun audit:math` per Core memory rule after touching `yardage.ts`.

## Technical notes

- The "true 3×3 macro grid at 2u each" is just a labeling change — the block is still 6u total, so no math elsewhere shifts. The `s6 = size/6` scale factor in yardage stays, and `sCut` (s + seam) and `CCut` (2s + seam) still describe the same finished dimensions. Only the *assignment* of which pieces belong to which fabric flips for the goose flanks.
- Using SVG `<g transform="rotate(deg, cx, cy)">` around a single `StarPoint` component eliminates the risk of per-side geometry drift that caused the earlier "top/bottom correct but left/right inverted" bug class.
