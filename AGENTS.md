
## Grid-cutting optimizer
- Plain-square block grids may be merged via `optimizeGrid` (src/lib/grid-optimizer.ts) and routed through `addOptimizedGridPieces` in yardage.ts — rectangles only, never L-shapes; custom blocks keep merged cuts per fabric only when they need no more yardage than separate squares. Why: removes needless seams and fabric while keeping all cuts on addSquares/addRails.

## Plus Block construction
- Cut each Plus Block as one continuous 1×3 center strip, two cross-arm squares, and four background corner squares; preserve those roles when fabrics reverse. Why: this is the real-world three-column construction and avoids two unnecessary seams.
