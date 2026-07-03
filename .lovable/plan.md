# Add "Autumn Tints" pattern

New beginner pattern: a 4×4 grid of 16 equal squares, all plain (no triangles). Rotationally symmetric block that, when tiled, forms diagonal chains across the quilt — matches the reference image exactly.

Layout (row × col, 1-indexed):
```
A A B D
A A C B
B C A A
D B A A
```
Per-block counts: A=8, B=4, C=2, D=2.

> Note: earlier in this thread you'd answered "3 fabrics" to a follow-up, but the reference image and this prompt both clearly show 4 distinct fabrics (orange/white/green/yellow). I'll build it as 4 fabrics per the prompt. Say the word if you'd rather collapse background to one of the accents.

## Changes

1. **`src/lib/planner-store.ts`** — Add `"autumn-tints"` to the `PatternId` union.

2. **`src/lib/patterns.ts`** — Add a new `PatternDef` with sections:
   - `dominant` (A, 8/block) — "Dominant squares"
   - `background` (B, 4/block) — "Background squares"
   - `accent1` (C, 2/block) — "First accent"
   - `accent2` (D, 2/block) — "Second accent"
   - `sashing` (E) — optional
   - `border` (E) — border
   No `supportsAlternate`. Intro explains the diagonal secondary that emerges from tiling.

3. **`src/lib/yardage.ts`** — New branch modeled on `four-patch` / `nine-patch`:
   - `patchFinished = blockSize / 4`, `patchCut = patchFinished + 0.5`
   - Per block: 8 A + 4 B + 2 C + 2 D squares, all the same cut size
   - Route every cut through `addSquares` (per the core memory rule)
   - Standard assembly-tip text: piece into rows of 4, then join rows; when laying out, keep every block in the same orientation so the A-corners chain along the diagonal
   - Include `autumn-tints` in the shared pattern-list gates around lines 1795-1810 (same list as nine-patch/four-patch).

4. **`src/components/PatternDiagram.tsx`** — New `case "autumn-tints"` rendering the 16-cell grid on a 200×200 viewBox (u = 50), using the layout above with subtle white grid lines (matches plus-block/nine-patch style).

5. **`src/components/PatternThumb.tsx`** — Small-scale version of the same 4×4 fill for the pattern picker card.

6. **`src/components/QuiltLayoutPreview.tsx`** — New `case "autumn-tints"` that tiles the 4×4 block across the full quilt with NO per-block rotation (rotational symmetry of the block itself produces the diagonal secondary — verify visually).

7. **`scripts/audit-yardage.ts`** — Add an autumn-tints case (baseline + with sashing) asserting per-fabric square counts: A = 8·N, B = 4·N, C = 2·N, D = 2·N where N = block count.

8. **Snapshots** — Refresh `pattern-renderers.test.tsx.snap` for the new pattern renderers.

## Verification

- `bun run verify` (tests + `bun audit:math` + build).
- Manual smoke: pick Autumn Tints → Step 2 shows no alternate-blocks toggle → Step 3 diagram shows the exact reference layout → full-quilt preview shows the diagonal A-chain running corner to corner → assign photos to all 4 fabrics and confirm they render in both the block diagram and tiled preview → shopping list shows correct per-fabric yardage split.
