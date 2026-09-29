# Cutting merge audit — all built-in patterns

Audit only, no code changed. Written on 2026-09-29 in four batches.

# Pattern Cutting/Construction Audit — Fabric-Merge Opportunities

Scope: simple-squares, nine-patch, hst, pinwheel, double-pinwheel, rail-fence,
log-cabin, ohio-star, flying-geese, disappearing-nine-patch, squares-on-point,
plus-block, churn-dash, bear-paw.

Method: for each pattern I read the `s.pattern === "<id>"` branch in
`src/lib/yardage.ts` (cut sizes/counts), the block renderer dispatched from
`renderInner()` in `src/components/PatternDiagram.tsx` (cell-by-cell geometry,
including `BearPawBlockSvg.tsx`), and the pattern's `sections` in
`src/lib/patterns.ts` (fabric roles). A merge is only valid when it is a plain
rectangle that fits inside a single straight-seam row/column/unit; patches
from different pieced sub-units (e.g. an HST triangle next to a plain square)
never merge, and an L-shaped same-fabric run may only merge one of its two
legs (never both — that would require a Y-seam).

---

### Simple Squares (simple-squares)
1. **How it's cut today:** One square per block, cut at `blockSize + 0.5"`. In patchwork mode the grid is split cell-by-cell across 2–12 fabrics; in single-fabric mode every square is Fabric A. Optional sashing strips (`sashingWidth + 0.5"` × `blockSize + 0.5"`) run only between blocks.
2. **Same-fabric, same-size patches touching?** No, within a single block there is only one patch (the whole square) — there is nothing to merge inside a block. In single-fabric mode, adjacent blocks are literally the same fabric and abut with no seam gained by "merging" since the sashing/seam between blocks is the actual quilt-assembly seam, not an internal cut seam.
3. **Construction-valid merge:** None available — the block *is* already the biggest rectangle it can be (a single square). Nothing to remove.
4. **Verdict:** Already handled.

---

### Nine Patch (nine-patch)
1. **How it's cut today:** 3×3 grid, `patchFinished = blockSize/3`, cut = `patchFinished + 0.5"`. Center+corners (Fabric center, 5/block) and alternating squares (Fabric outer, 4/block) placed by `(i+j)%2===0 → center`.
2. **Same-fabric, same-size patches touching?** No. The checkerboard parity rule means every "center" cell only touches "outer" cells edge-to-edge (corners and the middle square are diagonal to each other, never edge-adjacent), and vice versa. Mapped cells: center at (0,0),(2,0),(0,2),(2,2),(1,1); outer at (1,0),(0,1),(2,1),(1,2) — no two same-fabric cells share an edge.
3. **Construction-valid merge:** None — this is a genuine checkerboard; that pattern *requires* the alternation, so there is no adjacent same-fabric pair to fold into one rectangle.
4. **Verdict:** No real merge.

---

### Half Square Triangles (hst)
1. **How it's cut today:** One HST per block: two squares cut at `blockSize + 0.875"` (Fabric tri1, tri2), sewn/cut on the diagonal to yield 2 finished HSTs per pair (so the total pair count is halved across the quilt). The 2×2 tiling shown in the diagram is only an illustration of 4 neighboring blocks, not a single block's internal structure.
2. **Same-fabric, same-size patches touching?** N/A inside a block — a block is only two triangles of two different fabrics. Between blocks, which triangle touches which neighbor depends on the chosen layout (alternating/barn-raising/herringbone) and block rotation, so adjacency isn't fixed by the cut plan itself.
3. **Construction-valid merge:** No merge is valid — the two patches inside a block are triangles (not rectangles), and the technique's entire purpose is the diagonal seam; removing it isn't "merging a rectangle," it's eliminating the block.
4. **Verdict:** No real merge.

---

### Pinwheel (pinwheel)
1. **How it's cut today:** Each block = 2×2 grid of 4 HST units (`halfFinished = blockSize/2`, cut = `halfFinished + 0.875"`). Each HST's blade triangle right-angle corner rotates to a different corner of its quadrant (BL→TL→TR→BR clockwise) so all 4 blade hypotenuses meet at the center point.
2. **Same-fabric, same-size patches touching?** No plain-rectangle adjacency exists. Every quadrant is a triangle pair (blade/bg); the blade triangle of one quadrant touches the bg triangle of its neighbor along the outer edges (mapped in the diagram: TL-quadrant blade is the BL half, TR-quadrant blade is the TL half, etc. — always paired against the opposite fabric on the shared edge), and all four blade triangles meet only at the single center point, not along a shared edge.
3. **Construction-valid merge:** None — the entire visual depends on 4 diagonally-pieced HST units; there is no same-fabric rectangle-to-rectangle adjacency to fold together.
4. **Verdict:** No real merge.

---

### Double Pinwheel (double-pinwheel)
1. **How it's cut today:** 4×4 grid of 16 equal HST units per block (`unitFinished = blockSize/4`, cut = `unitFinished + 0.875"`), built two-at-a-time from paired starting squares, with each HST's right-angle placement following a prescribed per-row pattern to create the inner and outer pinwheels.
2. **Same-fabric, same-size patches touching?** No plain-square adjacency — all 16 cells are diagonally split HST triangles, and the prescribed right-angle placements (varying per row/column) mean no two full same-fabric rectangles sit side by side; any same-fabric contact is triangle-to-triangle along a bias seam or point.
3. **Construction-valid merge:** None — same reasoning as Pinwheel; the whole design is built from bias-seamed HST units and collapsing any of them would remove the secondary pinwheel effect.
4. **Verdict:** No real merge.

---

### Rail Fence (rail-fence) — confirm only
1. **How it's cut today:** 3 full-length rails per block, each cut `blockSize/3 + 0.5"` tall × `blockSize + 0.5"` long, cut efficiently from full-width strips (`railsPerStrip` sub-cuts per strip).
2. **Same-fabric, same-size patches touching?** Rails are already the largest possible single rectangles (a full block-length strip each) — there is no smaller sub-cut to merge.
3. **Construction-valid merge:** N/A — already the maximal single-rectangle-per-rail construction; this is the pattern flagged as already handled.
4. **Verdict:** Already handled (confirmed).

---

### Log Cabin (log-cabin) — confirm only
1. **How it's cut today:** 1 center "hearth" square (`blockSize/4 + 0.5"`) plus 12 logs (3 rounds × 4 logs) cut as full-length rectangles at each round's length, alternating dark/light fabrics so two adjacent sides are dark and two are light.
2. **Same-fabric, same-size patches touching?** Each log is already cut as one continuous rectangle for its full finished length — logs of the same fabric occupy different rounds/lengths and are not literally the same size, and adjacent-round logs of the same color (e.g., two dark logs in sequence) are already merged into single strips rather than being cut in multiple smaller pieces.
3. **Construction-valid merge:** N/A — already maximal single-rectangle-per-log construction; flagged as already handled.
4. **Verdict:** Already handled (confirmed).

---

### Ohio Star (ohio-star)
1. **How it's cut today:** 3×3 grid of units, `unitFinished = blockSize/3`. 4 corner units = plain background squares (cut `unitFinished + 0.5"`); 1 center unit = plain square (Fabric center, cut `unitFinished + 0.5"`); 4 edge units = pieced quarter-square-triangle (QST) blocks (2 star squares + 2 bg squares per block, cut `unitFinished + 1.25"`, built via double-HST QST method).
2. **Same-fabric, same-size patches touching?** The 4 plain background corner squares are diagonal to the center (not edge-adjacent to each other), so they don't touch each other. Each corner square *does* share an edge with a background triangle inside the adjacent QST unit (e.g. corner (0,0) touches the left-facing bg triangle of the top-edge QST) — same fabric, but the QST's bg patch is a triangle belonging to a pieced sub-unit, not a plain square.
3. **Construction-valid merge:** No valid merge. Per the rule, a plain background square and a background triangle from a different pieced sub-unit (the QST) do not merge even though they're the same fabric and touch — cutting one bigger rectangle there would require eliminating the QST's inward-pointing star-triangle seam, which is structurally necessary for the star points.
4. **Verdict:** No real merge.

---

### Flying Geese (flying-geese)
1. **How it's cut today:** No-waste 4-at-a-time method. 1 large goose square (`blockSize + 1.25"`) + 4 small sky squares (`blockSize/2 + 0.875"`) yield 4 finished geese; 2 geese are stacked vertically per block and sewn along one straight seam.
2. **Same-fabric, same-size patches touching?** Within one goose unit, the two sky ("background") corner triangles meet the main goose triangle along bias seams and meet *each other* only at the single apex point at the top-center — not along a shared straight edge, so there's no rectangle to merge there. Where two geese units are stacked, the bottom edge of the upper goose (100% goose fabric — the triangle base) touches the top edge of the lower goose (which is almost entirely sky fabric except the single apex point) — different fabrics at that seam, not a same-fabric merge candidate.
3. **Construction-valid merge:** None found — the sky corners are two separate pieced triangles required by the no-waste construction; there's no full-width same-fabric rectangle spanning them to merge.
4. **Verdict:** No real merge.

---

### Disappearing Nine Patch (disappearing-nine-patch)
1. **How it's cut today:** Sew a standard nine-patch sized up (`startingBlock = blockSize + 1`, patch cut `= startingBlock/3 + 0.5"`), 5 center/corner squares (Fabric center) + 4 alternating squares (Fabric outer) per starting block — identical layout/cut math to Nine Patch. The block is then sliced in half horizontally and vertically and the 4 quarters rotated 180° and re-sewn, which is what actually produces the finished look (center 2×2 of Fabric "center", 4 small Fabric-"center" corners, Fabric "outer" filling the rest).
2. **Same-fabric, same-size patches touching?** Only in the *finished, re-assembled* block: the 4 original corner squares meet at the new block's center as a 2×2 same-fabric cluster (`center` fabric), and this is a genuine four-way "pinwheel" intersection where a horizontal seam and a vertical seam cross at one point (an X-seam), not a single straight seam.
3. **Construction-valid merge:** No valid merge. This four-way seam intersection is exactly the "no double L merge" case generalized to four legs — you can't remove it without a Y/X-seam, and more fundamentally, the entire technique's premise is that the starting nine-patch is sewn from small squares *before* being sliced; there is no earlier stage where a bigger single rectangle could stand in for those 4 quarter-pieces, because they only exist as a 2×2 same-fabric block *after* the slice-and-rotate step, not as a plan you cut ahead of time.
4. **Verdict:** No real merge (the technique's disappearing effect depends on those seams).

---

### Squares on Point (squares-on-point)
1. **How it's cut today:** 1 on-point square (cut side `= blockSize/√2 + 0.5"`, Fabric square) plus 2 corner squares (cut `= blockSize/2 + 0.875"`, Fabric bg) each cut once on the diagonal to yield the 4 background corner triangles.
2. **Same-fabric, same-size patches touching?** The 4 background corner triangles surround the single diamond and touch each other only at the four block corners (a point), not along a shared edge inside one block. No two same-fabric full rectangles are adjacent.
3. **Construction-valid merge:** None available — every same-fabric patch here is a triangle from the square-in-a-square technique; there's no rectangle pair to fold together.
4. **Verdict:** No real merge.

---

### Plus Block (plus-block) — confirm only
1. **How it's cut today:** Already built as 3 columns to avoid inset/Y-seams: the center column is ONE continuous strip (`squareCut × (blockSize + 0.5")`, Fabric plus) instead of 3 separate squares; each outer column is background-square / plus-arm-square / background-square (`unitFinished + 0.5"` squares).
2. **Same-fabric, same-size patches touching?** The center column has already been merged into a single rectangle (this is the intentional fix noted in the code comments: "Three columns avoid inset seams... center column is one continuous strip"). In the outer columns, the two background corner squares in a column are separated by the plus-arm square and never touch each other; they also don't touch the center strip's background — the center column is 100% plus fabric.
3. **Construction-valid merge:** Already done. No further merges are available or needed — that's exactly the merge the code already performs (3 squares folded into 1 continuous strip, removing 2 internal seams from the center column).
4. **Verdict:** Already handled (confirmed).

---

### Churn Dash (churn-dash)
1. **How it's cut today:** 3×3 grid, `unitFinished = blockSize/3`. 1 center square (cut `unitFinished + 0.5"`); 4 corner HST units (2 dark + 2 bg starting squares/block, cut `unitFinished + 0.875"`, each pair yielding 2 HSTs → 4 corners); 4 side-bar units, each a dark rectangle + bg rectangle sewn together (`unitFinished/2 + 0.5"` × `unitFinished + 0.5"`), with dark always on the block's outer edge.
2. **Same-fabric, same-size patches touching?** Mapped cell-by-cell: corner HSTs' background triangle sits toward the block interior, and its right-angle side (facing the adjacent bar cell) is entirely background — this can touch a bar's background half where the bar's dark half faces outward (e.g. top bar: dark on top, bg on bottom, so its bottom edge, facing the corner cell, is bg). That contact is real, but the corner's bg region there is a *triangle* from an HST, while the bar's bg region is a *rectangle* half — different sub-units, not a matching rectangle pair. Center square touches all 4 bars only through their bg halves (bars are built "dark outside / bg inside" by design), and by default Fabric center/corners/bars all resolve to the same key "A" while bg is "B" — but no two *same-sized plain rectangles* of fabric A/A or B/B are ever adjacent; every contact crosses a triangle/rectangle sub-unit boundary.
3. **Construction-valid merge:** None valid — every apparent same-fabric contact happens at an HST's bias edge or crosses between a bar-half-rectangle and a triangle from a different pieced unit, which the merge rule excludes.
4. **Verdict:** No real merge.

---

### Bear Paw (bear-paw)
1. **How it's cut today (per `BearPawBlockSvg.tsx` + yardage.ts):** Each block = 4 paw units + 4 short sashing rectangles + 1 center square, arranged `[paw][v-sash][paw] / [h-sash][center][h-sash] / [paw][v-sash][paw]`. Each paw unit is itself a 3×3 mini-grid: a 2×2 pad square already cut/sewn as ONE piece (`padCut = 2u + 0.5"`), an "L" of 4 HST claw cells along the two outer edges, and 1 plain background corner square (`cornerCut = u + 0.5"`) at the paw's outermost corner. `u = (blockSize - s)/6`, `s = blockSize/8` (sashing). HSTs cut at `u + 0.875"`. Sashing rectangles are `s + 0.5" × 3u + 0.5"` (bg fabric); center is `s + 0.5"` (claw fabric).
2. **Same-fabric, same-size patches touching?** The 2×2 pad is already a single merged patch — the code explicitly skips internal grid lines "since the pad is a single piece of fabric, so no internal seam" (see `vSegs`/`hSegs` in `BearPawBlockSvg.tsx`). Elsewhere, background fabric appears in three different sub-units that can sit next to each other visually (the paw's plain bg corner square, the bg half of each HST claw triangle, and the bg sashing rectangles/whole-block background fill) — but each of these is a different sub-unit (plain square vs. HST triangle vs. sashing rectangle) with different dimensions, so none of them forms a same-size rectangle pair.
3. **Construction-valid merge:** The pad's internal 2×2 merge is already done. No further merge is available: the remaining background contacts cross sub-unit boundaries (square/triangle/rectangle of different sizes) and are excluded by the "different sub-units never merge" rule.
4. **Verdict:** Already handled (pad merge) / No real merge elsewhere.


# Pattern Audit — Same-Fabric Merge Opportunities

Scope: irish-chain, sawtooth-star, friendship-star, snowball-block, four-patch,
streak-of-lightning, bow-tie, shoofly, jacobs-ladder, autumn-tints, card-trick,
oh-susannah, twin-star, star-and-cross.

Sources read for every pattern: `src/lib/yardage.ts` (`s.pattern === "<id>"` branch),
`src/components/PatternDiagram.tsx` (block renderer reached via the `switch`/dispatch),
`src/lib/patterns.ts` (pattern definition + fabric-role sections).

Rule reminder used throughout: a merge is only valid if it forms one plain rectangle
that fits inside a straight-seam row/column/unit. An L-shaped same-fabric region can
merge its horizontal arm OR its vertical arm, never both (that would require a Y-seam).
Usable strip width assumed ≈ 40.5" from a 42" WOF strip.

---

### Irish Chain (irish-chain)

1. **How it's cut today:** Chain blocks are a 3×3 grid, `u = blockSize/3`. All 9 cells
   are cut as individual small squares at `u + 0.5"`: 5 "chain" squares (Fabric B/chain)
   and 4 "background" squares (Fabric A/bg), pooled across all chain blocks
   (`chainSmallCount = 5×chainBlocks`, `bgSmallCount = 4×chainBlocks`). Plain alternate
   blocks are cut as a single square at `blockSize + 0.5"` (Fabric A). A strip-piecing
   shortcut (CBC/BCB strip sets) is offered in the notes as an alternative cutting method,
   but the yardage math itself is based on individual small squares.
2. **Same-fabric, same-size patches touching?** No. The block fill rule is
   `(i+j)%2===0 → chain else bg`, i.e. a perfect checkerboard: chain cells are
   (0,0),(2,0),(1,1),(0,2),(2,2); background cells are (1,0),(0,1),(2,1),(1,2). No two
   same-fabric cells share an edge — only diagonal (corner) contact.
3. **Construction-valid merge:** None available inside the chain block — every
   same-fabric pair is diagonal, not edge-adjacent, so there is no rectangle to form.
   The plain alternate block is already a single uncut piece (correctly not chopped into
   smaller squares). No seams to remove, no fabric to save, no change to strip-cut counts.
4. **Verdict:** No real merge — the checkerboard construction is inherent to the pattern
   (that's what makes the diagonal chain read across the quilt), so no adjacent same-
   fabric squares exist to combine.

---

### Sawtooth Star (sawtooth-star)

1. **How it's cut today:** 4×4 grid, `u = blockSize/4`. Center 2×2 is already cut as
   ONE square at `2u + 0.5"` (not 4 small squares) — this merge is already implemented.
   The 4 corner cells are individual background squares at `u + 0.5"`. The 8 remaining
   edge cells are HST units (star triangle + background triangle), starting squares cut
   at `u + 0.875"`.
2. **Same-fabric, same-size patches touching?** No additional opportunity beyond what's
   already merged. The 4 background corner squares sit at grid cells (0,0), (3,0), (0,3),
   (3,3); each is surrounded only by HST cells (which are half star / half background
   triangles, not full background squares), so no corner square is edge-adjacent to
   another full background square or to a matching background triangle region large
   enough to form a rectangle.
3. **Construction-valid merge:** The one real merge (center 2×2 → one square) is already
   done in code (`centerCut = 2u + SEAM`, cut as a single piece per block). No further
   rectangle merge is available for the corner squares or the HST background triangles.
4. **Verdict:** Already handled (center square merge is implemented); no further merge
   possible for the remaining pieces.

---

### Friendship Star (friendship-star)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. Center cell = 1 center square
   (`u+0.5"`). 4 corner cells = background squares (`u+0.5"`). 4 edge cells = HST units
   (star point + background triangle), starting squares at `u+0.875"`.
2. **Same-fabric, same-size patches touching?** No. The 4 background corner squares
   (0,0),(2,0),(0,2),(2,2) are each surrounded by HST edge cells (mixed fabric,
   triangular), never touching another full background square edge-to-edge.
3. **Construction-valid merge:** None — no two same-size, same-fabric plain squares
   share an edge anywhere in the grid.
4. **Verdict:** No real merge.

---

### Snowball Block (snowball-block)

1. **How it's cut today:** Each block = 1 main square (`blockSize + 0.5"`) + 4 small
   corner accent squares (`cornerAccentSize + 0.5"`), stitched-and-flipped onto the
   corners of the main square (sew diagonal, trim 1/4" beyond stitch line, press open).
   Fabric A/B swap "main" vs. "corner" roles every other block in a checkerboard.
2. **Same-fabric, same-size patches touching?** Not applicable in the grid sense — this
   isn't a subdivided same-size grid. The main square and its 4 corner squares are
   different sizes and are joined by a stitch-and-flip (fold-and-trim) technique, not a
   straight seam between equal cells.
3. **Construction-valid merge:** None possible. There is no same-fabric, same-size,
   edge-adjacent pair to combine — the corner accents are deliberately smaller pieces
   layered onto the main square's corners, which is the whole point of the technique.
4. **Verdict:** No real merge — construction is already minimal for this technique.

---

### Four Patch (four-patch)

1. **How it's cut today:** 2×2 grid, `u = blockSize/2`, cut `u + 0.5"` per position.
   Each of the 4 positions (topLeft, topRight, bottomLeft, bottomRight) has its own
   fabric assignment; the code pools counts by fabric letter for the cut list (e.g. if a
   user sets two positions to the same fabric, they're listed together) but each position
   is still cut and sewn as its own individual `u×u` square — no rectangle merge is ever
   performed regardless of fabric assignment.
2. **Same-fabric, same-size patches touching? Default assignment:** No — defaults are
   topLeft=A, topRight=B, bottomLeft=D, bottomRight=C, all four distinct, so by default
   no two cells share a fabric.
   **If the user manually assigns the same fabric to two positions:** it depends which
   two. TL+TR (adjacent, top row) or BL+BR (adjacent, bottom row) or TL+BL (adjacent,
   left column) or TR+BR (adjacent, right column) would be edge-adjacent, same-fabric.
   TL+BR or TR+BL are diagonal only, never mergeable.
3. **Construction-valid merge:** For the four *possible* adjacent-same-fabric cases
   above (e.g. TL=TR), the two `u×u` squares could be replaced with a single `2u×u`
   rectangle, removing 1 internal seam and saving 0.5" of fabric along that seam per
   block. This does not change the finished look (still visually one continuous patch)
   and is a legitimate straight-seam row/column merge. It could also change how many
   pieces fit per 42" strip depending on final cut dimensions vs. 40.5" usable width.
4. **Verdict:** No real merge for the shipped defaults (all 4 fabrics distinct). Needs
   verification / merge-only-if-triggered for user-chosen same-fabric adjacent positions
   — this is a config-dependent opportunity, not a defect in the base pattern, and the
   code intentionally treats every position independently since users can pick any
   fabric per position.

---

### Streak of Lightning (streak-of-lightning)

1. **How it's cut today:** 2×2 grid of HST units, all 4 cells split diagonally
   (stripe triangle + background triangle), all facing the same direction. Cut at
   `u + 0.875"` HST starting squares (2 stripe-fabric + 2 bg-fabric per block, `u = blockSize/2`).
2. **Same-fabric, same-size patches touching?** N/A — there are no plain full-square
   cells in this block; every cell is a diagonal HST, so no same-fabric plain-rectangle
   region exists to test.
3. **Construction-valid merge:** None available — no plain square/rectangle regions
   exist to merge; the whole design is triangle-based.
4. **Verdict:** No real merge (no plain-square regions present).

---

### Bow Tie (bow-tie)

1. **How it's cut today:** 2×2 grid of plain main squares, cut `u + 0.5"`
   (`u = blockSize/2`): Fabric A at TL+BR, Fabric B at TR+BL. A separate on-point "knot"
   square (Fabric C/D) is appliquéd on top of the center seam intersection, cut
   separately at its own diagonal-based size.
2. **Same-fabric, same-size patches touching?** No. Fabric A's two squares (TL, BR) are
   diagonal to each other, not edge-adjacent; same for Fabric B's two squares (TR, BL).
   They only meet at the single center point, not along a shared edge.
3. **Construction-valid merge:** None — diagonal contact only, and no rectangle can span
   two squares that only touch at a corner point.
4. **Verdict:** No real merge.

---

### Shoofly (shoofly)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. Center cell = 1 accent square
   (`u+0.5"`). 4 side cells (N/S/E/W) = background plain squares (`u+0.5"`). 4 corner
   cells = HST units (accent triangle pointing inward + background triangle), starting
   squares at `u+0.875"`. Optional `alternateBlocks` swaps bg/accent roles every other
   block, handled independently of cutting geometry.
2. **Same-fabric, same-size patches touching?** No. The 4 background side squares sit at
   (1,0),(0,1),(2,1),(1,2); each is only edge-adjacent to the center accent square and to
   corner HST cells (mixed fabric) — never to another full background square.
3. **Construction-valid merge:** None — no two plain same-fabric squares share an edge.
4. **Verdict:** No real merge.

---

### Jacob's Ladder (jacobs-ladder)

1. **How it's cut today:** Each block is a 3×3 arrangement of nine 2u×2u sub-blocks
   (`u = blockSize/6`) — five four-patches (corners + center) and four HST units (edges).
   Each four-patch is cut as 4 individual small squares at `u+0.5"` (2 dark + 2 light,
   alternating dark/light on the diagonal, i.e. dark at TL+BR, light at TR+BL within the
   four-patch). Each edge HST is cut from starting squares at `2u+0.875"` (ladder-accent +
   light/background).
2. **Same-fabric, same-size patches touching?** No. Within every four-patch, the two
   dark cells (TL, BR) are diagonal to each other, not edge-adjacent (this is the
   standard four-patch alternating layout — it's what makes it a four-patch rather than
   two rectangles). Between neighboring sub-blocks, a four-patch's dark corner cell only
   ever touches an HST triangle cell (mixed fabric) or another sub-block's cell
   diagonally — never a same-fabric full square edge-to-edge.
3. **Construction-valid merge:** None — every same-fabric adjacency in this pattern is
   diagonal (corner-touching) by design, never a full shared edge, so no rectangle merge
   is available anywhere in the block.
4. **Verdict:** No real merge — the alternating four-patch/HST structure has no
   edge-adjacent same-fabric same-size cells to combine.

---

### Autumn Tints (autumn-tints)

**Status check only, per instructions — already handled.**

1. **How it's cut today:** 4×4 grid (`u = blockSize/4`) run through `optimizeGrid()`
   (`src/lib/grid-optimizer.ts`), which scans the grid and merges maximal same-fabric
   rectangles automatically. The layout is:
   ```
   dom dom bg  acc2
   dom dom acc1 bg
   bg  acc1 dom dom
   acc2 bg  dom dom
   ```
   The two 2×2 dominant corners (top-left, bottom-right) are each detected and merged
   into ONE large square cut at `2u + 0.5"` instead of 4 small squares at `u + 0.5"` each
   — this is exactly the valid rectangle merge described by the rules (a full solid 2×2
   block, not an L-shape), and it is already implemented via `addOptimizedGridPieces`.
2. **Same-fabric, same-size patches touching?** Yes — the two 2×2 dominant corner
   blocks are fully contiguous 2×2 regions (already merged, not left as 4 separate
   touching squares). Background/accent1/accent2 cells (4, 2, 2 respectively) remain
   single, non-adjacent cells — verified no other same-fabric adjacency exists in the
   remaining 8 cells.
3. **Construction-valid merge:** Already performed by the optimizer: 2 large 2u×2u
   squares per block instead of 8 small squares — removes 4 internal seams per block
   (2 per corner) and saves fabric/cutting time accordingly. No further merge is possible
   or needed for the remaining single-cell colors.
4. **Verdict:** Already handled — confirmed correct, no changes needed.

---

### Card Trick (card-trick)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. 4 corner cells = HST units
   (1 card fabric + background). 4 edge cells + 1 center cell = 4-triangle QST units
   (each combining background and/or multiple card fabrics). No plain squares appear
   anywhere in the block; background only shows in the outer corner triangles.
2. **Same-fabric, same-size patches touching?** N/A — there are no plain square regions
   at all; everything is diagonal HST/QST triangle construction.
3. **Construction-valid merge:** None — no plain-rectangle regions exist to merge.
4. **Verdict:** No real merge (fully triangle-pieced block).

---

### Oh Susannah (oh-susannah)

1. **How it's cut today:** 4×4 grid, `u = blockSize/4`. The 12 outer-ring cells are
   plain squares (Fabric A "dominant" ×4, Fabric B "secondary" ×4, Fabric C "background"
   ×4 at the block's 4 corners), cut at `u+0.5"`. The center 2×2 is 4 HST units (Fabric A
   outer-corner triangle + Fabric C center-facing triangle), starting squares at
   `u+0.875"`.
2. **Same-fabric, same-size patches touching?** No. Mapping the outer ring:
   ```
   C A B C
   B . . A
   A . . B
   C B A C
   ```
   Checking every edge-adjacency: each corner C only touches an A and a B neighbor
   (never another C); each A only touches C/B neighbors (never another A); each B only
   touches C/A neighbors (never another B). No two same-fabric plain squares share an
   edge anywhere in the outer ring.
3. **Construction-valid merge:** None — no adjacent same-fabric same-size squares exist.
4. **Verdict:** No real merge.

---

### Twin Star (twin-star)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. 4 corners + center (5 cells) are
   plain background squares (Fabric C), cut at `u+0.5"`. The 4 edge cells are 3-triangle
   units (1 large Fabric A triangle + 1 small Fabric B + 1 small Fabric D triangle),
   rotated 90° around the block; background never appears inside an edge unit.
2. **Same-fabric, same-size patches touching?** No. The 5 background squares sit at
   (0,0),(2,0),(0,2),(2,2),(1,1) — the 4 corners are two cells apart from each other
   (never adjacent), and the center (1,1) is diagonal to every corner (corner-touch only,
   e.g. (0,0) and (1,1) do not share an edge). Every background square's actual edge
   neighbors are edge-cell triangle units (mixed fabric), never another background
   square.
3. **Construction-valid merge:** None — no two background squares share a full edge.
4. **Verdict:** No real merge.

---

### Star & Cross (star-and-cross) — reference case

1. **How it's cut today:** 5×5 unit grid, `u = blockSize/5`, all rectangles/squares (no
   triangles). Per corner 2×2 unit (e.g. top-left): row 0 = one background rectangle
   spanning both columns (`2u×u`, already cut as ONE piece — `rectLong × rectShort`);
   row 1 = one background square (outer) + one accent square (inner, next to the cross).
   The 4 cross arms are `2u×u` rectangles (Fabric C); the center is 1 square (Fabric D).
2. **Same-fabric, same-size patches touching?** Yes. Each 2×2 corner unit has 3
   background cells forming an L: e.g. top-left corner = (row0,col0), (row0,col1),
   (row1,col0) [with (row1,col1) = accent]. The two cells in row 0 are the "horizontal
   pair" of the L; (row0,col0)+(row1,col0) are the "vertical pair."
3. **Construction-valid merge — what the code currently does:** The code already merges
   the **horizontal pair** of each corner's L (the row farthest from the block's cross)
   into a single `2u × u` rectangle (`rectLong`), cut and sewn as one piece instead of two
   `u×u` squares — this removes 1 internal seam per corner (4 per block) and saves 0.5"
   of fabric along each of those 4 seams. It leaves the **vertical pair** (the cell
   nearest the cross + the outer corner cell above/below it) as separate small squares,
   which is correct: merging the vertical pair *as well* would require re-consuming a
   cell already used in the horizontal rectangle and would create a Y-seam/overlap.
   This pattern's construction is symmetric for all four corners: TL and TR merge their
   top row; BL and BR merge their bottom row — always the row/column farther from the
   center cross, never both arms of the same L.
4. **Verdict:** Already handled — the current implementation already performs exactly
   one valid arm-merge per corner (horizontal in this case) and correctly leaves the
   other arm unmerged, matching the reference behavior described in the audit brief.

---

## Summary Table

| Pattern | Same-fabric adjacency found? | Merge valid? | Verdict |
|---|---|---|---|
| Irish Chain | No (checkerboard, diagonal only) | — | No real merge |
| Sawtooth Star | No (beyond existing center merge) | Center 2×2 already merged | Already handled |
| Friendship Star | No | — | No real merge |
| Snowball Block | N/A (flip-corner technique) | — | No real merge |
| Four Patch | No by default; possible only if user duplicates adjacent fabrics | Config-dependent | Needs verification (default: no real merge) |
| Streak of Lightning | N/A (all triangles) | — | No real merge |
| Bow Tie | No (diagonal only) | — | No real merge |
| Shoofly | No | — | No real merge |
| Jacob's Ladder | No (diagonal only, by design) | — | No real merge |
| Autumn Tints | Yes, already merged | Already implemented via `optimizeGrid` | Already handled |
| Card Trick | N/A (all triangles) | — | No real merge |
| Oh Susannah | No | — | No real merge |
| Twin Star | No | — | No real merge |
| Star & Cross | Yes, L-shape per corner | Horizontal arm already merged; vertical arm correctly left alone | Already handled |

# Cutting/Seam Audit — Batch 3

Scope: idaho-beauty, checkerboard, cabin-in-the-cotton, fancy-stripe, maple-star,
love-in-a-mist, four-x-star, antique-tile, economy-block, california-quilt,
clowns-choice, corner-beam, four-queens.

Method: for each pattern I mapped `yardage.ts` cutting math against the actual
SVG cell geometry in `PatternDiagram.tsx` and the assembly narrative in the
notes strings / `patterns.ts`, then checked every same-fabric / same-size
patch pair for true edge-to-edge adjacency that could be re-cut as one plain
rectangle without changing the seam plan into a Y-seam.

---

### Idaho Beauty (idaho-beauty)
1. **How it's cut today:** 3×3 core on a `core = blockSize/4` grid, ringed by a
   half-width (`ring = core/2`) border. Fabric A (bg): 4 core diamond-base
   squares + 5→(no, 4) small ring corner squares (`ring+SEAM`) + 12 half-width
   rectangles (`core+SEAM × ring+SEAM`). Fabric B (accent): 32 small corner
   squares (`ring+SEAM`) used as stitch-and-flip corners for diamonds/geese.
   Fabric C (solid): 5 plain core squares (`core+SEAM`).
2. **Same-fabric, same-size patches touching?** No. The 3×3 core alternates
   solid-C / diamond-A checkerboard style, so no two A or C core squares
   touch edge-to-edge. In the outer ring, each plain bg piece (corner square
   or half-width rectangle) is separated from the next by a mixed-fabric
   flying-geese unit, and the four true-corner bg squares are diagonal to
   each other, not edge-adjacent. Sizes also differ (border vs. core-length),
   so even the diagonal neighbors couldn't form a rectangle.
3. **Construction-valid merge:** None available — no qualifying adjacency.
4. **Verdict: No real merge.**

---

### Checkerboard (checkerboard)
1. **How it's cut today:** Outer hourglass from 2 Fabric A + 2 Fabric B
   quarter-square-triangle starters (`blockSize+1.25"`), forming a full-block
   QST with A top/bottom, B left/right. A 2×2 on-point inner square is
   pieced from 4 small squares (`(S·√2/4)+SEAM`) — Fabric C at north/south,
   Fabric D at east/west — then set on point at the true center.
2. **Same-fabric, same-size patches touching?** No. The two A triangles (top
   and bottom quarters) are diagonally opposite and meet only at the single
   center point, not along an edge; same for the two B triangles (left/right).
   The inner C squares (north/south) and D squares (east/west) are likewise
   opposite corners of the on-point square, meeting only at the center point.
3. **Construction-valid merge:** None — every same-fabric pair is
   point-adjacent only, never edge-adjacent, so there is no rectangle to cut.
4. **Verdict: No real merge.**

---

### Cabin in the Cotton (cabin-in-the-cotton)
Courthouse Steps-style log cabin: center square, then three rounds of strips
added in opposite pairs (top+bottom, then left+right). Round 2 reuses the
center's fabric (A), but it is separated from the center by the entire
Round‑1 ring, so it never touches the center square. Round 3 optionally
alternates Fabric D/E by block position; within one block the same fabric
also never touches itself edge-to-edge because rounds are always full
concentric rings. This is the reference "sequential strip" construction
already called out as handled.
**Verdict: Already handled.** (Confirmed — no changes needed.)

---

### Fancy Stripe (fancy-stripe)
1. **How it's cut today:** 16 identical HST cells in a strict 4×4 grid. Each
   HST finishes at `blockSize/4`; 8 Fabric A + 8 Fabric B starting squares
   (`hstFinished + 7/8"`) make all 16 units two-at-a-time.
2. **Same-fabric, same-size patches touching?** Not applicable in a
   mergeable sense — every visible patch is a triangle (half of an HST cell),
   never a plain square/rectangle. Adjacent same-fabric triangles across
   cell boundaries do occur (e.g. the diagonal stripe bands), but merging
   triangles from different HST cells means cutting a non-rectangular,
   non-square shape and would require a bias-heavy Y/diagonal seam replacing
   two straight HST seams — not a valid straight-seam rectangle merge.
3. **Construction-valid merge:** None.
4. **Verdict: No real merge.**

---

### Maple Star (maple-star)
1. **How it's cut today:** Unequal 5×5 grid, tracks `[s,s,C,s,s]` with `C=2s`.
   Fabric A (bg): 4 small squares (`s`) at the four inner-corner positions +
   8 rectangles (`C×s`, already cut as single pieces — 4 outer background
   rectangles top/bottom/left/right of the star points + 4 flying-geese cap
   bases). Fabric B (accent): 12 small squares (4 inner-ring + 8 flip
   corners). Fabric C (frame): 4 shaft rectangles (`C×s`). Fabric D
   (center): 1 square (`C×C`).
2. **Same-fabric, same-size patches touching?** The 4 outer bg rectangles
   are already cut as single `C×s` pieces (not two `s×s` squares), so that
   merge is already done. The 4 small bg squares at the inner corners
   (e.g. col1,row2) sit directly under the top outer-bg rectangle's left
   half, sharing an edge — but the top rectangle is 2 units wide while the
   small square below is only 1 unit wide, and the missing unit is occupied
   by the flying-geese cap (different fabric/sub-unit) in row1 col3-4. The
   combined bg footprint is L-shaped, not a plain rectangle.
3. **Construction-valid merge:** None — the only adjacency is an L-shape
   straddling two different assembly rows (row 1 outer strip vs. row 2
   nine-patch-style row), and closing it would require a Y-seam, not a
   straight row/column seam.
4. **Verdict: No real merge** (outer rectangles are already correctly
   merged; no further merge is valid).

---

### Love in a Mist (love-in-a-mist)
1. **How it's cut today:** 3×3 nine-patch on a 6-unit grid (`u = blockSize/6`).
   Corner cells = 2×2 four-patches (Fabric C outer-outer square, Fabric B
   inner-inner square, 2 HSTs blending A... wait — outer(C)/accent(B) HSTs
   toward center). Edge-middle cells = square-in-a-square (Fabric B diamond,
   Fabric C corners on the outside, Fabric A corners toward the block
   center). Center cell = 1 plain Fabric A square.
2. **Same-fabric, same-size patches touching?** No plain-rectangle case.
   The only same-fabric adjacencies are triangle-to-triangle or
   triangle-to-square across sub-unit boundaries (e.g. the bg triangles at
   the inward corners of each edge diamond meet the center-cell bg square
   only at a single point, not along a shared edge, because the diamond's
   footprint is on point).
3. **Construction-valid merge:** None.
4. **Verdict: No real merge.**

---

### Four X Star (four-x-star)
1. **How it's cut today:** Strict 5×5 grid (`u = blockSize/5`), 25 equal
   cells. Fabric A (bg): 8 plain squares (4 corners + 4 flanking the center)
   + background half of 8 HSTs. Fabric B (accent): star-point half of the 8
   HSTs. Fabric C (squares): 4 diagonal squares around the center. Fabric D
   (dark): 5 squares forming the X (center + 4 edge middles).
2. **Same-fabric, same-size patches touching?** No. Checking the grid
   row-by-row: dark squares in the middle row alternate with bg
   (`dark,bg,dark,bg,dark`), so no two dark squares are edge-adjacent; the
   4 bg squares flanking the center (rows 2/4, col 3) are separated from the
   dark center by those same alternating cells; the corner bg squares are
   isolated by HST neighbors on both sides; the 4 accent "squares" fabric
   cells are each boxed in by HSTs and never touch another same-fabric cell.
3. **Construction-valid merge:** None.
4. **Verdict: No real merge.**

---

### Antique Tile (antique-tile)
1. **How it's cut today:** 6-unit grid with 1-1-2-1-1 row/column tracks
   (`u = blockSize/6`). Fabric A (corner): 4 rectangles (`2u×u`, the outer
   row-1/row-5 corner pieces) + 4 squares (`u×u`, the row-2/row-4 corner
   cells). Fabric B (edge): 4 rectangles (`2u×u`). Fabric C (accent): 4
   squares (`u×u`). Fabric D (frame): 4 rectangles (`2u×u`). Fabric E
   (center): 1 square (`2u×2u`).
2. **Same-fabric, same-size patches touching?** **Yes**, but not in a way
   that can legally merge. In each of the 4 block corners, the row-1 (or
   row-5) Fabric-A rectangle (`2u wide × u tall`) sits directly above/below
   the row-2 (or row-4) Fabric-A square (`u×u`), sharing a full `u`-long
   edge — e.g. top-left corner: rectangle at `(0,0)-(2u,u)` and square at
   `(0,u)-(u,2u)`. This is exactly the L-shaped same-fabric case: the
   rectangle is 2 units wide but the square below/above it is only 1 unit
   wide, because the other unit-width is occupied by Fabric B (edge) in row
   1 or Fabric C (accent) in row 2.
3. **Construction-valid merge:** **None.** The rectangle belongs to Row 1
   (a horizontal strip: corner–edge–corner) and the square belongs to Row 2
   (a five-piece strip: corner–accent–frame–accent–corner) — two different
   pieced rows that are only joined afterward by the row-to-row seam. Fusing
   the rectangle and square into one L-shaped patch would require cutting a
   non-rectangular piece and set it in around the Fabric-B/Fabric-C
   neighbors with a Y-seam, which breaks the straight-seam row construction.
   This is the same situation flagged by the Star & Cross rule: only follow
   the seam direction that is already straight (here, neither the "row"
   direction alone can extend into an L without a Y-seam), so no merge of
   either pair is valid.
4. **Verdict: No real merge** (same-fabric, same-size adjacency exists but
   only across a Y-seam boundary between two different assembly rows).

---

### Economy Block (economy-block)
1. **How it's cut today:** Concentric square-in-a-square. Center square
   `blockSize/2 + SEAM`. Round 1: 2 squares (`(blockSize/√2)/2 + 7/8"`), each
   cut once diagonally → 4 triangles, framing the center on point. Round 2:
   2 squares (`blockSize/2 + 7/8"`), each cut once diagonally → 4 triangles,
   framing round 1 on point (this becomes the entire outer background).
2. **Same-fabric, same-size patches touching?** No. Each round is a ring of
   4 triangles around the previous unit; the 4 round-1 triangles all meet
   only at their tips at the center-square corners (point contact, not edge
   contact), and likewise for round 2 around round 1.
3. **Construction-valid merge:** None — no rectangle can be formed from
   triangular, point-adjacent patches.
4. **Verdict: No real merge.**

---

### California Quilt (california-quilt)
1. **How it's cut today:** 3×3 nine-patch on a 6-unit grid (`u=blockSize/6`).
   Corner units: Fabric A rectangles (`2u×u`, two stacked) with a Fabric C
   stitch-and-flip corner tucked into the inner one. Edge (flying-geese)
   units: Fabric B rectangles (`2u×u`, outer + goose base) with 2 Fabric C
   flip squares (`u×u`) forming the goose sides. Center: Fabric D on-point
   square inside a Fabric C square-in-a-square frame (from 2 squares cut
   once diagonally).
2. **Same-fabric, same-size patches touching?** Yes, geometrically: in each
   quadrant the corner unit's inner-corner Fabric C flip triangle and the
   adjacent flying-geese unit's Fabric C side triangle share the seam line
   between the corner unit and the geese unit (both are right triangles of
   the same leg length, and together their union is exactly the classic
   large flying-geese isosceles triangle split down the middle).
3. **Construction-valid merge:** Not valid. That shared edge *is* the
   required unit-joining seam between the corner unit and the flying-geese
   unit — two separately pieced sub-units assembled in the row (`corner ·
   geese · corner`). The triangles come from different stitch-and-flip
   squares that belong to different sub-units, so per the sub-unit rule they
   cannot be recut as one triangle; doing so would mean pre-piecing across
   what is otherwise the row's structural seam, and the "triangle" doesn't
   correspond to a plain rectangle anyway. No seam or fabric is actually
   wasted — this seam is unavoidable regardless of fabric choice.
4. **Verdict: No real merge** (adjacency is coincidental to the required
   unit-assembly seam, not a redundant duplicate cut).

---

### Clown's Choice (clowns-choice)
1. **How it's cut today:** 3×3 grid of thirds (`u=blockSize/3`). 5 hourglass
   (QST) units in the 4 corners + center, each from one accent + one
   background `u+1.25"` starting square (yielding 2 hourglasses per pair).
   4 plain Fabric-accent squares (`u+SEAM`) fill the edge-middle cells.
2. **Same-fabric, same-size patches touching?** The accent triangle on one
   side of each hourglass (e.g. the right-hand accent triangle of the
   top-left hourglass) shares a full edge with the neighboring plain accent
   square in the adjoining edge cell — same fabric, matching edge length.
3. **Construction-valid merge:** Not valid as a plain-rectangle cut. The
   hourglass triangle is one quarter of a pieced QST unit (bounded by
   diagonal seams on its other two sides), and the plain square is a
   separate, independently-cut sub-unit; the shared edge is simply the
   ordinary row-assembly seam between the hourglass unit and the plain
   square unit (`Row 1 = hourglass · square · hourglass`), not a duplicate
   cut. Removing it would mean building a house-shaped hybrid patch with a
   diagonal edge, which isn't a straight-seam rectangle.
4. **Verdict: No real merge.**

---

### Corner Beam (corner-beam)
1. **How it's cut today:** 4 identical quadrant units (`u=blockSize/2`).
   Each quadrant = 1 Fabric-beam square (`u+SEAM`) with 2 Fabric-bg
   stitch-and-flip rectangles (`u+SEAM × u/2+SEAM`) trimming two adjacent
   corners into a wedge.
2. **Same-fabric, same-size patches touching?** No plain-rectangle
   adjacency. The four beam wedges only meet at the single block-center
   point (a pinwheel), never along a shared edge, and the background flip
   rectangles belong to separate quadrant units joined by the normal
   2×2-block seams.
3. **Construction-valid merge:** None.
4. **Verdict: No real merge.**

---

### Four Queens (four-queens)
1. **How it's cut today:** 7×7 unit grid (`u=blockSize/7`). Each of 4
   corner quadrants = 1 plain bg corner square (`u`) + 4 claw HSTs (`u`) +
   1 queen square (`2u`) banded with accent + a queen tip. Each of 4 arms =
   1 plain bg end square (`u`) + an outward accent goose (bg sides, `u×u/2`)
   + an inward accent goose (queen sides) + a background goose forming the
   center-diamond point. 1 plain bg center square (`u`).
2. **Same-fabric, same-size patches touching?** The bg arm-end square sits
   directly next to the bg portion of the outward goose rectangle (both
   background fabric, adjacent along the arm's length), but the goose
   rectangle is a stitch-and-flip base that gets partially covered by accent
   triangles once flipped — it isn't a plain matching-size rectangle after
   piecing, and the two pieces are cut for different purposes (a plain
   corner-tip square vs. a goose base rectangle) even though both start as
   background fabric.
3. **Construction-valid merge:** None valid — the two candidate pieces are
   different sub-units (arm-end square vs. goose base rectangle) with
   different final shapes after the stitch-and-flip step is applied, so
   fusing them would change the goose geometry, not just remove a seam.
4. **Verdict: No real merge.**

---

## Summary

| Pattern | Verdict |
|---|---|
| idaho-beauty | No real merge |
| checkerboard | No real merge |
| cabin-in-the-cotton | Already handled |
| fancy-stripe | No real merge |
| maple-star | No real merge |
| love-in-a-mist | No real merge |
| four-x-star | No real merge |
| antique-tile | No real merge (L-shape needs Y-seam) |
| economy-block | No real merge |
| california-quilt | No real merge |
| clowns-choice | No real merge |
| corner-beam | No real merge |
| four-queens | No real merge |

None of the 13 audited patterns have a valid, construction-safe rectangle
merge available. Where same-fabric/same-size patches do touch (Antique
Tile's corner L-shape, Clown's Choice and California Quilt's unit-boundary
triangles), the shared edge is either a required cross-row/cross-unit
assembly seam or would force a non-rectangular Y-seam cut, so no yardage or
per-strip piece-count savings are being left on the table in these blocks.

# Pattern Audit 4

Scope: four-xs, broken-dishes, rolling-stone, summer-winds, swing-in-the-center,
tippecanoe-and-tyler-too, tulip-lady-fingers, weathervane, wishing-ring,
blazing-arrows, apple-pie, album-cross, alaska-homestead.

Sources read: `src/lib/yardage.ts` (per-pattern branches), `src/components/PatternDiagram.tsx`
(shared SVG block renderers used by both the picker and the diagram), `src/lib/patterns.ts`
(fabric-role sections/copy). SEAM = 0.25", HST_EXTRA = 7/8", no-waste-goose extras = 1.25"/0.875".

---

### Four X's (four-xs)

1. **How it's cut today:** On-point block, `u = blockSize / (4·√2)`. Per block: 4×5 = 20 coloured
   squares (5 per X fabric) at `u+0.25"`, 5 background squares at `u+0.25"` (centre X), 3 background
   squares at `u·√2+1.25"` cut on BOTH diagonals (12 side setting triangles), 2 background squares at
   `u/√2+0.875"` cut on ONE diagonal (4 corner triangles).
2. **Same-fabric, same-size patches touching?** Yes. `FourXsBlock` places each X as a centre diamond
   plus its four on-point neighbours (`xCells`: `(u,v)`, `(u±1,v)`, `(u,v±1)`), all one fabric, entirely
   inside one quadrant. In the actual diagonal-row piecing, `(u−1,v)-(u,v)-(u+1,v)` is one physical
   pieced ROW (3 consecutive same-fabric squares) and `(u,v−1)-(u,v)-(u,v+1)` is one physical pieced
   COLUMN (3 consecutive same-fabric squares) — an L/plus-shaped same-fabric footprint, like the
   Star & Cross case, sharing the centre square.
3. **Construction-valid merge:** Geometrically you could sew the 3-square row run (or the 3-square
   column run — never both, that would force a Y-seam at the shared centre square) as one long strip
   instead of 3 seamed squares, removing 2 seams (~1.0" fabric) per X, ×5 X's/block. **However**, each
   "row" in an on-point set is a straight seam line running at 45° to the fabric's straight grain — the
   individual squares are cut on-grain and only appear diagonal once sewn. Replacing 3 on-grain squares
   with one long cut patch would put that patch's long edges on the bias for its full length, which
   directly contradicts the pattern's own stated rationale for keeping the setting/corner triangles on
   straight grain. Strip yield would also change (a 3u-long bias strip vs. 3 small square cuts) in a way
   that isn't clearly better.
4. **Verdict: Needs verification.** The merge is topologically valid (one row OR one column, never
   both) but trades a construction seam for a long bias edge; a human quilter's judgment call, not a
   clear-cut fabric-saving win.

---

### Broken Dishes (broken-dishes)

1. **How it's cut today:** 2×2 grid of HSTs, `half = blockSize/2`, all 4 starting squares at
   `half + 0.875"` (1 accent1, 1 accent2, 2 background, two-at-a-time HST method).
2. **Same-fabric, same-size patches touching?** No. The two accent1 triangles (TL unit's SE half,
   BR unit's NW half) only meet tip-to-tip at the block centre (a single point), not along an edge; the
   two accent2 triangles sit on opposite outer corners and don't touch each other or accent1 at all.
3. **Construction-valid merge:** None. There is no shared edge between any two same-fabric patches —
   only point contact — so there is no rectangle to extract, and the units belong to different HST cells.
4. **Verdict: No real merge.**

---

### The Rolling Stone (rolling-stone)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. Corners: on-point accent1 square-in-a-square
   (`diamondCut = u/√2+0.25`) inside 4 background triangles (`cornerTriCut = u/2+0.875`, cut once
   diagonally). Edges: accent1/accent2 rectangle pairs (`rectLong = u+0.25`, `rectShort = u/2+0.25`).
   Centre: 1 plain accent1 square (`u+0.25`).
2. **Same-fabric, same-size patches touching?** No. The centre accent1 square only touches the 4 edge
   units, and in every edge unit the fabric touching the centre is accent2 (the inner half), not
   accent1 — confirmed in `RollingStoneBlock`: edge-unit accent2 halves face inward, accent1 halves
   face outward toward the corner units' background. Corner-unit diamonds touch only their own
   background triangles, never another accent1/accent2 patch.
3. **Construction-valid merge:** None available — every fabric boundary in the block is between two
   different fabrics.
4. **Verdict: No real merge.**

---

### Summer Winds (summer-winds)

1. **How it's cut today:** Nine-patch on a 6-unit grid, `u = blockSize/6`. Per block: 6 HST pairs
   (bg + accent, `u+0.875"`) → 12 HSTs; 4 dark squares (`u+0.25"`); 4 flying-geese rectangles
   (`geese` fabric, `2u+0.25 × u+0.25`) with 8 bg stitch-and-flip squares (`u+0.25"`); 4 plain bg
   rectangles (`2u+0.25 × u+0.25`); 1 accent centre square (`2u+0.25"`).
2. **Same-fabric, same-size patches touching?** No qualifying case. The 4 dark corner squares sit at
   `(1,1)-(2,2)` (per quadrant, rotated) and only meet the accent centre square `(2,2)-(4,4)` at a single
   corner point, not an edge. The accent triangles inside each corner unit only touch the dark square
   and each other as triangles (already a single 4-patch unit), never abutting another accent-fabric
   rectangle.
3. **Construction-valid merge:** None — no same-fabric rectangle/rectangle or rectangle/square pair
   shares a full edge.
4. **Verdict: No real merge.**

---

### Swing in the Center (swing-in-the-center)

1. **How it's cut today:** 6-unit grid (1-1-2-1-1 tracks), `u = blockSize/6`. Corners: 1 dark square
   (`u+0.25"`) + 3 dark/bg HSTs (`u+0.875"` pairs) forming an arrowhead. Edges: double flying-geese
   (inner accent-on-bg + outer bg-on-accent, `2u+0.25 × u+0.25` rectangles with `u+0.25"`
   stitch-and-flip squares). Centre: dark square-in-a-square on point (`diamondCut = 2u/√2+0.25`)
   inside 2 bg squares cut once diagonally (`u+0.875"`).
2. **Same-fabric, same-size patches touching?** The corner "arrowhead" (1 dark square + 3 dark
   triangles) is contiguous and one fabric, but the union of those four shapes is a pinwheel/arrow
   silhouette, not a rectangle — there is no straight cut that reproduces it. The centre on-point dark
   square only touches its own 4 background corner triangles, not the corner arrowheads (separated by
   the double-goose edge units).
3. **Construction-valid merge:** None. The only same-fabric contiguous area (the arrowhead) is
   inherently non-rectangular, so no plain-rectangle merge applies without changing the pieced shape
   itself (which would mean re-drafting the block, not "removing a seam").
4. **Verdict: No real merge.**

---

### Tippecanoe and Tyler Too (tippecanoe-and-tyler-too)

1. **How it's cut today:** 4×4 grid of 16 HSTs, `u = blockSize/4`, all starting squares at
   `u+0.875"`: 2 mid+bg pairs (corners), 4 dark+bg pairs (edges, ×2 sets = 8 units), 2 mid+centre pairs
   (middle).
2. **Same-fabric, same-size patches touching?** Yes for the "centre" fabric: in `TippecanoeBlock`,
   cell `(1,1)`'s lower-right "centre" triangle and cell `(1,2)`'s lower-left "centre" triangle share the
   full vertical edge between them (both right triangles with the right-angle at the shared corner),
   and together read as one bigger isoceles triangle spanning both cells. The same happens for the pair
   at row 2.
3. **Construction-valid merge:** The union of the two half-square triangles is a *triangle*, not a
   rectangle (it's the classic "two HSTs make one flying-goose-sized triangle" shape). Per the
   merge rule, only plain-rectangle merges qualify — a triangle spanning two grid cells isn't a
   rectangle that fits a straight row/column, so it does not meet the bar even though it is a
   real, commonly-used piecing shortcut. No qualifying rectangle merge exists elsewhere in the block.
4. **Verdict: No real merge** (the only same-fabric adjacency produces a triangle, not a rectangle).

---

### Tulip Lady Fingers (tulip-lady-fingers)

1. **How it's cut today:** 8-unit grid, `u = blockSize/8`. 1 centre square (`4u+0.25"`), 4 background
   edge rectangles (`4u+0.25 × 2u+0.25`), and 4 corner "tulip" units each = 1 bg corner square
   (`u+0.25"`) + 2 tulip/bg HSTs (`u+0.875"`) + 1 plain tulip square (`u+0.25"`).
2. **Same-fabric, same-size patches touching?** The background triangle inside each corner's HST
   touches the adjacent background edge rectangle along a shared edge (e.g. the TL corner's
   horizontal-edge HST background triangle shares its right edge with the top background rectangle's
   left edge for the outer half of that cell). But that background region is a *triangle* (half of an
   HST), not a same-size plain square/rectangle.
3. **Construction-valid merge:** No valid rectangle merge — the matching same-fabric area on one side
   of the seam is a triangle belonging to an HST sub-unit, and merging a triangle into the adjoining
   plain rectangle would require re-cutting the whole corner tulip unit, not just removing a seam.
4. **Verdict: No real merge.**

---

### Weathervane (weathervane)

1. **How it's cut today:** 6-unit grid (1-1-2-1-1), `u = blockSize/6`. Per block: 4 bg corner squares
   (`u+0.25"`), 8 star/bg HSTs (`u+0.875"` pairs), 1 large vane square (`2u+1.25"`) + 4 bg squares
   (`u+0.875"`) → 4 no-waste flying geese, 4 star squares (`u+0.25"`), 1 star centre square
   (`2u+0.25"`), and — **cut separately from the geese** — 4 vane "arm" rectangles (`2u+0.25 × u+0.25`).
2. **Same-fabric, same-size patches touching?** Yes, and it's a real, same-sub-unit case: the yardage
   notes explicitly describe sewing "one goose to one Fabric vane arm rectangle along the goose's long
   BASE edge" to build **each edge unit** — i.e. the goose's vane-fabric point and the vane arm
   rectangle below it are two separately-cut vane patches, already destined for the same edge unit,
   joined along a full-width seam that is 100% vane-to-vane.
3. **Construction-valid merge:** Yes — this is a valid rectangle merge. Instead of cutting a
   `2u+1.25"` large vane square (no-waste geese method) *and* a separate `2u+0.25 × u+0.25` vane
   rectangle, cut one tall vane rectangle (`armLong` wide × roughly `2u+0.5"` tall) and stitch-and-flip
   only the top two bg corner squares onto it (a "goose-on-a-stem" in one piece), skipping the seam
   between the goose base and the arm. This removes 1 seam per edge unit × 4 edge units per block =
   4 seams/block, saving ≈2" of fabric per block in seam allowance. It does change strip yield: the
   combined patch is taller than either original piece, so fewer combined patches fit per 42" strip
   crosswise than the small arm rectangles did — the fabric saved is in seam allowance, not in strip
   count, and yardage totals should be re-derived rather than assumed lower.
4. **Verdict: Merge recommended**, with a note to re-check strip-yield math before shipping (the merged
   patch is a single, taller rectangle, so cutting layouts differ from the current two-piece cut list).

---

### Wishing Ring (wishing-ring)

1. **How it's cut today:** 25-patch on a 5-unit grid, `u = blockSize/5`. 12 dark squares + 5 light
   squares at `u+0.25"`, plus 4 HST pairs (`u+0.875"`) → 8 HSTs (4 dark/light pairs).
2. **Same-fabric, same-size patches touching?** No. Checking `WishingRingBlock`'s explicit cell
   layout, the dark plain squares are placed on a knight's-move / checkerboard-like pattern
   (e.g. `(1,0)` and `(1,2)` are separated by the HST at `(1,1)`; `(0,1)` and `(1,0)` only share a
   corner point) — no two dark squares, and no two light squares, share a full edge anywhere in the
   25-patch.
3. **Construction-valid merge:** None — every internal seam in the block is between two different
   fabrics or across HST diagonals.
4. **Verdict: No real merge.**

---

### Alaska Homestead (alaska-homestead)

1. **How it's cut today:** 3×3 grid, `u = blockSize/3`. 4 corner bg/point HSTs (`u+0.875"` pairs,
   2 pairs total), 4 edge units = accent (outer half) + bg (inner half) rectangles
   (`rectLong = u+0.25`, `rectShort = u/2+0.25`), 1 accent centre square (`u+0.25"`).
2. **Same-fabric, same-size patches touching?** No. The accent centre square only touches the *bg*
   inner halves of the 4 edge units (per `AlaskaHomesteadBlock`, `accent` is explicitly the OUTER half
   of each edge unit, `bg` the inner half touching the centre) — never another accent patch. The accent
   outer bars of neighbouring edge units are separated by the corner HST units, so they never touch
   each other either.
3. **Construction-valid merge:** None.
4. **Verdict: No real merge.**

---

### Blazing Arrows (blazing-arrows)

1. **How it's cut today:** 4-unit grid, `u = blockSize/4`. 4 corner arrow/bg HSTs (`u+0.875"` pairs);
   top/bottom no-waste geese (arrow point on bg sky, 1 large `2u+1.25"` arrow square + 4 small
   `u+0.875"` bg squares per set, 1 set/2 blocks); left/right no-waste geese (bg point on arrow sky,
   reversed fabrics); 1 centre hourglass (arrow + bg QST, `2u+1.25"` pairs, 1 pair/2 blocks).
2. **Same-fabric, same-size patches touching?** Yes: the left/right edge unit's solid arrow "sky"
   rectangle (`0,u`–`u,3u`) shares its full right edge with the centre hourglass's left arrow triangle
   (`u,u`–`u,3u`–`2u,2u`) — both arrow fabric, full-height shared edge.
3. **Construction-valid merge:** Not valid. These two patches belong to two different sub-units built
   by two different techniques — the edge unit is a no-waste flying-geese sky rectangle, the hourglass
   is a two-at-a-time QST unit — assembled side by side only at final block assembly. Per the rule,
   patches from different sub-units do not merge; forcing them together would also produce a
   non-rectangular ("kite") shape, not a plain rectangle.
4. **Verdict: No real merge** (adjacency confirmed, but it's a correct cross-sub-unit seam, not a
   removable one).

---

### Apple Pie (apple-pie)

1. **How it's cut today:** Nine-patch on a 6-unit grid, `u = blockSize/6`. 4 corner units = 2 no-waste
   flying geese each (points fabric on bg sky; 2 sets/block, 1 large `points` square `2u+1.25"` + 4
   small bg squares `u+0.875"` per set). 4 edge units = bg (outer) + bar (inner) rectangles
   (`2u+0.25 × u+0.25`). 1 centre square (`2u+0.25"`).
2. **Same-fabric, same-size patches touching?** Yes for background: the corner unit's bg "sky" gap
   (upper portion of the corner, not covered by either points triangle) shares a full edge with the
   adjoining edge unit's plain bg outer rectangle (e.g. TL corner's right edge, upper half, borders the
   top edge unit's bg rectangle left edge).
3. **Construction-valid merge:** Not valid. The corner's bg region is a byproduct of the no-waste
   flying-geese piecing (small stitch-and-flip squares), a different cut size/shape and a different
   sub-unit from the edge unit's plain bg rectangle. Per the rule, patches from different sub-units do
   not merge, and combining them would require redesigning the corner-unit piecing method, not simply
   dropping a seam.
4. **Verdict: No real merge.**

---

### Album Cross (album-cross)

1. **How it's cut today:** Nine-patch on a 6-unit grid, `u = blockSize/6`. 4 cross-arm squares
   (`2u+0.25"`), 1 bg centre square (`2u+0.25"`), 4 corner units each = 1 large, uninterrupted outer
   triangle (cut once diagonally from a `2u+0.875"` square) + a pieced bg/accent background half
   (2 small bg triangles from `u+0.875"` squares around 1 accent square, `u+0.25"`).
2. **Same-fabric, same-size patches touching?** No same-size duplicate patches touch: the 4 cross-arm
   squares are diagonal neighbours of each other (sharing only a corner point at the block centre), and
   the outer triangle in each corner is already explicitly required to remain one continuous piece.
3. **Construction-valid merge:** None available, and none needed — the design already keeps the
   largest possible single patch (the outer triangle) uncut; the notes even call this out explicitly
   ("each Fabric outer area must remain one continuous large triangle—do not divide it into smaller
   pieces").
4. **Verdict: Already handled.**

---

## Summary

| Pattern | Same-fabric patches touching | Verdict |
|---|---|---|
| Four X's | Yes (plus-shaped X, row & column runs) | Needs verification |
| Broken Dishes | No | No real merge |
| The Rolling Stone | No | No real merge |
| Summer Winds | No | No real merge |
| Swing in the Center | Yes, but non-rectangular union | No real merge |
| Tippecanoe and Tyler Too | Yes, but union is a triangle | No real merge |
| Tulip Lady Fingers | Yes, but one side is a triangle | No real merge |
| Weathervane | Yes, same sub-unit, full-edge match | **Merge recommended** |
| Wishing Ring | No | No real merge |
| Alaska Homestead | No | No real merge |
| Blazing Arrows | Yes, but different sub-units | No real merge |
| Apple Pie | Yes, but different sub-units | No real merge |
| Album Cross | No (already one continuous triangle) | Already handled |

