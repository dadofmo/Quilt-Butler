
## Grid-cutting optimizer
- Plain-square block grids may be merged via `optimizeGrid` (src/lib/grid-optimizer.ts) and routed through `addOptimizedGridPieces` in yardage.ts — rectangles only, never L-shapes; custom blocks keep merged cuts per fabric only when they need no more yardage than separate squares. Why: removes needless seams and fabric while keeping all cuts on addSquares/addRails.
