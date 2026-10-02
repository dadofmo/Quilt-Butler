
## Grid-cutting optimizer
- Plain-square block grids merge via `optimizeGrid` (src/lib/grid-optimizer.ts): rings become symmetrical frames (two full-width + two side strips), rest greedy rectangles, never L-shapes. Merged cuts are always kept (no fallback to loose squares); `addOptimizedGridPieces` co-cuts pieces sharing a strip height onto the same strips. Why: experienced-quilter construction (fewer seams, flat accurate blocks) with honest yardage.

## Plus Block construction
- Cut each Plus Block as one continuous 1×3 center strip, two cross-arm squares, and four background corner squares; preserve those roles when fabrics reverse. Why: this is the real-world three-column construction and avoids two unnecessary seams.

## Star & Cross construction
- Cut four continuous 1×2 cross arms plus a separate center square; each 2×2 corner uses one horizontal outer-row background rectangle plus separate background/accent squares. Why: this preserves straight-seam 3×3 macro-unit assembly and never creates an L-piece or Y-seam.
