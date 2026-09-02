# Expand "Design Your Own Block" — 4 new units + whole-block rotation

## What the quilter gets

The designer palette grows from 3 units to 7:

1. **Solid square** (existing)
2. **Half-square triangle** (existing)
3. **Quarter-square triangle** (existing)
4. **Cornered square** — a solid square with stitch-and-flip corner triangles. Tap each corner of the unit preview to toggle it on/off (1–4 corners); each active corner gets its own fabric pick. This single unit covers snowball, square-in-a-square corners, bow-tie corners, etc.
5. **On-point square** — a square set on point (diamond) with four setting triangles in a second fabric filling the cell corners. True on-point look in one cell; no rotation needed.
6. **Half-rectangle** — a 1×2 (or 2×1) rectangle split diagonally, spanning two grid cells, with a fabric for each side of the diagonal. Rotation flips between horizontal/vertical and diagonal direction. This is the only unit that covers 2 cells, so it brings real diagonal motion (baskets, streaks, chevrons).
7. **Split square** — a cell split into two triangles horizontally or vertically (each triangle spans the full cell width/height), one fabric each. Rotation gives 4 orientations. Gives clean stripe/diamond effects impossible with HSTs.

Plus a **Rotate block** control: rotate the whole finished block 0°/90°/180°/270°. Applies to the tiled quilt preview, the full-screen quilt/block views, and combines with alternating layouts.

## How it works

- **Data model (`src/lib/custom-block.ts`)** — extend `UnitKind`, `REGION_COUNT`, `UNIT_LABEL`, `REGION_LABELS`, `ROTATION_STEPS`, and `unitPolys`/`unitTally`:
  - `cornered`: regions `[base, cornerTL, cornerTR, cornerBR, cornerBL]`; a corner's fabric entry may be `null` (no corner) — validation requires at least one corner and disallows all-four-off. Geometry: square polygon + one small triangle polygon per active corner. Yardage: base square cut once + one stitch-and-flip corner square per active corner (standard 7/8″-smaller corner-square math, matching how built-in snowball-type patterns are computed).
  - `onpoint`: regions `[diamond, corners]`. Geometry: rotated square + 4 corner triangles. Yardage: on-point center square cut + 4 setting triangles from 2 squares cut twice diagonally (matches Economy Block math).
  - `hrt` (half-rectangle): regions `[triangle1, triangle2]`; reintroduces multi-cell occupancy in `cellsCovered`/`occupancy`/`canPlace` for a 2-cell footprint, with rotation controlling orientation and diagonal slope. Yardage: half-rectangle cut via the two-triangles-from-rectangle method with proper seam allowance (non-45° diagonal handled like existing split-rectangle patterns, e.g. Rolling Stone).
  - `split`: regions `[triangle1, triangle2]`, 1 cell. Yardage: cut like an HST square but with the diagonal along the cell edge direction (same square cut, different seam orientation — counts through `addSquares` as HST-equivalents).
  - Add `rotation: Rotation` to `CustomBlockDesign` (default `0`); older saved designs load with rotation `0`.
- **Editor (`src/pages/DesignBlockPage.tsx`)** — new palette entries with small SVG previews; clicking a placed unit still cycles rotation; the cornered-square fabric panel gets a per-corner toggle UI. Whole-block rotation control sits next to grid-size controls.
- **Rendering (`src/components/CustomBlockSvg.tsx`)** — new polygon sets flow through the existing `blockPolys`/fabric-* token path; block rotation applied as a transform so tiling, alternation, and full-screen views inherit it.
- **Yardage (`src/lib/yardage.ts`)** — extend the custom-block tally switch to count each new unit's pieces and route every cut through `addSquares`; cutting guide labels follow existing conventions ("Squares — then cut each square on the diagonal", stitch-and-flip notes).
- **Migration** — extend `migrateDesign` to backfill `rotation: 0` on legacy designs; no other legacy shapes needed.
- **Validation** — `validateDesign` still requires every grid cell filled, including cells covered by a 2-cell half-rectangle.

## Verification

- `bun audit:math` after all yardage.ts/custom-block.ts changes (per project rule).
- `bunx tsgo` typecheck.
- Playwright pass through the designer: place each new unit, rotate it, toggle cornered-square corners, place a half-rectangle across a boundary (must reject out-of-bounds), rotate the whole block, then walk through to Results and confirm cutting guide counts.
