
## Grid-cutting optimizer
- `optimizeGrid` uses symmetric frames or rectangles, never L-shapes; keep merged cuts and co-pack equal heights via `addOptimizedGridPieces`. Why: fewer seams and honest yardage.

## Plus Block construction
- Cut each Plus Block as one continuous 1×3 center strip, two cross-arm squares, and four background corner squares; preserve those roles when fabrics reverse. Why: this is the real-world three-column construction and avoids two unnecessary seams.

## Star & Cross construction
- Cut four continuous 1×2 cross arms plus a separate center square; each 2×2 corner uses one horizontal outer-row background rectangle plus separate background/accent squares. Why: this preserves straight-seam 3×3 macro-unit assembly and never creates an L-piece or Y-seam.

## Butler's Trellis construction
- Assemble the 8×8 block as a 3×3 macro layout (3+2+3 cells): corner units sewn row-wise from a corner square, two continuous 1×2 background rectangles, one background square and three HSTs; edge units are outer bar / HST pair / inner bar; one 2×2 centre. Why: straight seams only, no set-in seams, no needless piecing of same-fabric runs.

## Arkansas Crossroads
- Cut 12 squares + four two-at-a-time HSTs; assemble four 2×2 quadrants, with rotation-only layouts. Why: preserves the sewn units.

## Domino Chicken Foot construction
- 5x5 row-by-row: 12 HSTs made two at a time (A/B, A/C, B/C), rows 2 and 4 centre B cells cut as one continuous 1x3 bar, other cells plain squares; rotation layouts only. Why: fewer seams without breaking straight-row assembly.

## Fabric photo rendering
- Uploads/camera shots go through `prepareFabricPhoto` (downscaled JPEG) before storage. Why: raw phone photos overflow saved planner storage and alias fine weaves.
- `buildFabricTile` fits lighting, scores seamless/repeat candidates with `tileArtifacts`, and box-halves to 256px; run the full fabric battery. Why: no one tiling method suits every print.
- FabricPatternDefs scopes photo IDs and cancels shape-to-root transforms before paint so adjoining translated or rotated units sample one continuous fabric plane; quilt patterns use the pixel-scaled tile size. Why: local SVG transforms and duplicate IDs otherwise restart or distort prints at piece edges.

## Attic Window construction
- Use one shared Attic Window renderer across thumbnails, diagrams, and quilt previews; cut a pane, two continuous shadow rectangles, and a two-at-a-time miter HST assembled in two rows. Why: matches the reference without Y-seams and keeps calculations and all views consistent.

## 54-40 or Fight construction
- Use a shared renderer for the five four-patches and four V-blocks; use seam-offset templates cut from conservative blanks for the center and mirrored side triangles, never HST starting-square formulas. Why: the star's narrow points require non-45-degree seams and honest template cutting allowances.
- Generate actual-size cutting PDFs on demand with a lazy-loaded PDF library and a one-inch calibration square. Why: users need correct non-45-degree templates without guessing cutting angles or slowing the initial pattern picker.

## Chocolate Cake construction
- Use one shared block renderer for all previews; assemble four square-in-a-square corners, four four-at-a-time flying-geese-and-continuous-bar side units, and one centre as a three-row macro layout. Why: preserves the reference diamonds and straight seams without splitting diamonds or wasting stitch-and-flip offcuts.

## Alaska construction
- Use shared reference geometry and fabric-role resolution for all Alaska previews; assemble the central nine-patch, paired outer split-triangle squares and outer HST corners as three bands. Why: two different unit scales preserve the reference without Y-seams, while half/quarter-square triangle starting blanks provide honest cutting allowances.

## Album 5 Patch
- Share geometry/dimensions across previews and cuts; use straight-grain rails, HST/triangle corners and continuous bars, cap two opposite units, then sew opposite pairs. Why: no bias strips, miters or Y-seams.
- Use seam-offset templates and rounded eighth-inch blanks via yardage helpers. Why: exact geometry, honest waste.

## Art Square
- Share geometry/cuts and seam-offset templates; piece setting triangles around an uncut centre. Why: straight seams, honest blanks.

## X Marks the Chain
- Share geometry and construction cuts: X uses a whole centre, HST side pairs and full-width rows; chain uses four corner four-patches and five whole macro squares. Why: straight seams and consistent guides at both grid scales.


## Contrary Wife
- Share the nine-cell reference map across previews, cut counts and row instructions; use two-at-a-time HSTs and rotation-only layouts. Why: keeps guides consistent.

## Bird Nest
- Share diamond/corner geometry and dimensions across views and cuts; assemble nine square-in-a-square diamonds and four pieced setting corners as three bands. Why: preserves continuous dark fields and avoids Y-seams and needless seams.

## Duck and Duckling construction
- Share the 5×5 geometry across previews and cuts; each corner unit is one large coral/pale HST (2×2) plus one small sage/pale HST at the outer corner, with the sage triangle overlaid on the pale field in renders. Why: matches the reference exactly and keeps assembly to straight seams with no Y-seams.

## Picker consistency
- Use `thumbnailAssignments` for default-driven picker renderers, not planning views. Why: cohesive thumbnails without changing saved fabric choices.
- Derive counts from distinct default block fabrics across both blocks, excluding finishing sections, and show both designs in two-block thumbnails. Why: count fabrics, not roles or only the first block.

## Kansas Star
- Share square-in-a-square geometry, dimensions and parity counts across both colorways and views; attach four diagonal-cut triangles to a whole centre, then trim with point allowances. Why: accurate diamonds, straight seams, no templates.
