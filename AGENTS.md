
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

## Fabric photo rendering
- Fabric photos use cached square textures: flatten camera lighting with a wide-blur gain map, crop regular prints to an exact detected print repeat (autocorrelation) and lay copies side by side, then periodic-plus-smooth correction; no edge crossfades or mirrored repeats, one fixed user-space scale; HTML quilt surfaces use the same prepared textures. Why: arbitrary photo crops break dot lattices and keep lighting ramps at every repeat, which reads as bands and false seams.
- FabricPatternDefs scopes photo IDs and cancels shape-to-root transforms before paint so adjoining translated or rotated units sample one continuous fabric plane; quilt patterns use the pixel-scaled tile size. Why: local SVG transforms and duplicate IDs otherwise restart or distort prints at piece edges.

## Attic Window construction
- Use one shared Attic Window renderer across thumbnails, diagrams, and quilt previews; cut a pane, two continuous shadow rectangles, and a two-at-a-time miter HST assembled in two rows. Why: matches the reference without Y-seams and keeps calculations and all views consistent.

## 54-40 or Fight construction
- Use a shared renderer for the five four-patches and four V-blocks; use seam-offset templates cut from conservative blanks for the center and mirrored side triangles, never HST starting-square formulas. Why: the star's narrow points require non-45-degree seams and honest template cutting allowances.
- Generate actual-size cutting PDFs on demand with a lazy-loaded PDF library and a one-inch calibration square. Why: users need correct non-45-degree templates without guessing cutting angles or slowing the initial pattern picker.
