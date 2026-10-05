
## Grid-cutting optimizer
- Plain-square block grids merge via `optimizeGrid` (src/lib/grid-optimizer.ts): rings become symmetrical frames (two full-width + two side strips), rest greedy rectangles, never L-shapes. Merged cuts are always kept (no fallback to loose squares); `addOptimizedGridPieces` co-cuts pieces sharing a strip height onto the same strips. Why: experienced-quilter construction (fewer seams, flat accurate blocks) with honest yardage.

## Plus Block construction
- Cut each Plus Block as one continuous 1×3 center strip, two cross-arm squares, and four background corner squares; preserve those roles when fabrics reverse. Why: this is the real-world three-column construction and avoids two unnecessary seams.

## Star & Cross construction
- Cut four continuous 1×2 cross arms plus a separate center square; each 2×2 corner uses one horizontal outer-row background rectangle plus separate background/accent squares. Why: this preserves straight-seam 3×3 macro-unit assembly and never creates an L-piece or Y-seam.

## Butler's Trellis construction
- Assemble the 8×8 block as a 3×3 macro layout (3+2+3 cells): corner units sewn row-wise from a corner square, two continuous 1×2 background rectangles, one background square and three HSTs; edge units are outer bar / HST pair / inner bar; one 2×2 centre. Why: straight seams only, no set-in seams, no needless piecing of same-fabric runs.

## Arkansas Crossroads construction
- Cut all 16 cells as separate units (12 plain squares + 4 HSTs made two at a time) and assemble as four 2×2 quadrants; offer only rotation layouts (alternating turn), never merged strips. Why: no matching same-fabric cells share a sewn unit, and rotation changes the look without changing cuts.

## Domino Chicken Foot construction
- 5x5 row-by-row: 12 HSTs made two at a time (A/B, A/C, B/C), rows 2 and 4 centre B cells cut as one continuous 1x3 bar, other cells plain squares; rotation layouts only. Why: fewer seams without breaking straight-row assembly.
