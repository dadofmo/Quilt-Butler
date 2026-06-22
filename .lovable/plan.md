## Fix the Snowball Block "1 block" diagram

The bug: the Step 3/4 single-block panel for Snowball currently renders **two side-by-side 100×200 half-blocks** (a skinny pair). That distorts the geometry — corners are stretched rectangles instead of right triangles, the octagon is squashed, and it doesn't match the reference image you shared, where each block is square and the alternation only appears when blocks are tiled into the quilt.

Your intent — "build a block and then using the same colors every other block reverses" — is exactly the checkerboard the **full-quilt preview** already renders correctly via the `swap` flag in `QuiltLayoutPreview.tsx`. The fix is to make the single-block panel show one true square block (like every other pattern) and let the full-quilt thumbnail demonstrate the reversal.

### Changes

1. **`src/components/PatternDiagram.tsx`** — `case "snowball-block"`
   - Replace the two-skinny-blocks renderer with a **single 200×200 square block**: solid Fabric B background + Fabric A octagon (8-point polygon) on top, matching the geometry already used in `QuiltLayoutPreview`'s `MiniBlock` snowball case.
   - Corner accent visual size: derive from the user's `cornerAccentSize / blockSize` ratio when both are set (clamped to a sensible 10%–40% so tiny/huge values still read), falling back to ~30% when not yet entered. This keeps the diagram faithful to the user's actual input.

2. **`src/components/QuiltLayoutPreview.tsx`** — `case "snowball-block"` (single-block MiniBlock, lines 657–683)
   - Same geometry as PatternDiagram so the "1 block" preview and each tile in the full-quilt thumbnail match exactly.
   - Keep the existing `swap` logic so the full-quilt grid still alternates A/B every other cell (this is already correct and produces the red/white checkerboard from your reference image).

3. **`src/components/QuiltLayoutPreview.tsx`** — line 74
   - Revert the special-case label from `"How blocks alternate"` back to `"1 block"` so Snowball matches every other pattern's UI exactly. The alternation is visible in the adjacent "Your full quilt" panel and via the explanation copy on FabricsPage/ResultsPage.

### What is NOT changing

- `src/lib/yardage.ts` — math is correct (verified by audit cases). No edits.
- `src/lib/patterns.ts`, `src/lib/planner-store.ts`, `SizePage.tsx`, `FabricsPage.tsx`, `ResultsPage.tsx`, `PatternThumb.tsx`, `FabricRollIcon.tsx` — no edits.
- `src/lib/license.ts` and any paywall/license code — no edits. Existing paid users are unaffected.

### Verification

- Open Step 3 with Snowball selected: confirm the "1 block" panel shows a single square block (B background, A octagon), undistorted.
- Confirm the "Your full quilt" panel shows the alternating A↔B checkerboard exactly like the reference image.
- Run `bun audit:math` — should still pass with no math changes.
