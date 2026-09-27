
## Grid-cutting optimizer
- Plain-square block grids may be merged via `optimizeGrid` (src/lib/grid-optimizer.ts) and routed through `addOptimizedGridPieces` in yardage.ts — rectangles only, never L-shapes. Why: removes needless seams and fabric while keeping all cuts on addSquares/addRails.
