# Plan: Add "Jacob's Ladder" pattern

## Block anatomy (6×6 grid of small units)

The block is a 3×3 arrangement of 2×2-unit sub-units:

```
[FP] [HST] [FP ]
[HST][FP ] [HST]
[FP] [HST] [FP ]
```

- 5 four-patches (FP) at the four corners + center. Each FP = 2×2 small squares alternating Fabric A (dark) / Fabric B (light).
- 4 half-square-triangle blocks (HST) on the edges. All 4 HSTs in a single block share the same diagonal orientation so the "ladder" runs corner-to-corner across the block. Dark triangle = Fabric C, light triangle = Fabric B.

## 3-fabric setup

- **Fabric A** — Four-patch dark squares (default: dark)
- **Fabric B** — Four-patch light squares + HST background triangle (default: light)
- **Fabric C** — HST diagonal accent triangle (default: dark; can match A or contrast)

Sharing B between the four-patch light squares and the HST background is what makes the ladder read as continuous. Giving C its own slot lets a user pick a different dark for the diagonal, but defaulting C = same tone as A reproduces the classic reference.

## Getting the reference quilt (the diamond secondary pattern)

The right-hand reference image is Jacob's Ladder tiled with **every other block rotated 90°**. Rotating a block 90° flips the direction of its ladder diagonal. When 4 neighboring blocks meet at a corner in a checkerboard rotation pattern, their HST hypotenuses join to form the big on-point diamond, and their four-patches line up edge-to-edge to form the checkerboard chains between diamonds.

Implementation:
- Add `supportsAlternate: true` to the pattern (same field Shoofly uses).
- Extend `QuiltLayoutPreview` for Jacob's Ladder so `alternateBlocks = true` **rotates** every other block 90° (checkerboard by `(row+col) % 2`), rather than swapping A/B like Shoofly does.
- Default `alternateBlocks` to **true** when the user picks Jacob's Ladder so the "Your full quilt" preview matches the reference out of the box. User can uncheck for a straight-set variant.

Yardage stays identical whether alternate is on or off — rotation doesn't change piece counts, only orientation.

## Files to add / edit

- `src/lib/planner-store.ts` — add `"jacobs-ladder"` to `PatternId`.
- `src/lib/patterns.ts` — register pattern with 3 sections (fourPatchDark, fourPatchLight, ladder), `supportsAlternate: true`, intro copy, sashing/border support.
- `src/lib/yardage.ts` — new `computeJacobsLadder` case: per block = 10 dark small squares (A) + 10 light small squares (B) + 4 HST units (C dark tri + B light tri). Use `addSquares` / HST helpers, pool by fabric letter.
- `src/components/PatternThumb.tsx` — new SVG case: 6×6 grid, FPs and HSTs as described, brand palette (A=blue, B=yellow, C=pink or A-tone).
- `src/components/PatternDiagram.tsx` — same layout at diagram size honoring assignments.
- `src/components/QuiltLayoutPreview.tsx` — add Jacob's Ladder rendering and handle `alternateBlocks` as **90° rotation** for this pattern.
- `src/pages/SizePage.tsx` — the existing `supportsAlternate` toggle appears automatically; add label copy variant ("Rotate every other block (recommended)" for Jacob's Ladder).
- `src/pages/PatternPickerPage.tsx` — when user picks `jacobs-ladder`, set `alternateBlocks: true` by default in planner state.
- `scripts/audit-yardage.ts` — add Jacob's Ladder test cases (baseline, alternate on, with sashing).
- `src/lib/__tests__/patterns-coverage.test.ts` + renderer snapshot — auto-picks up the new pattern; refresh snapshot.
- `src/lib/__tests__/pattern-sashing.test.tsx` — auto-covers via the "every sashed pattern" loop.

## Verification

- `bun run verify` (vitest + audit + build) — all 250+ tests must pass, including new Jacob's Ladder audit cases and sashing guardrail.
- Manual smoke: pick Jacob's Ladder → Step 2 default block 12" → Step 3 preview shows the diamond secondary pattern → toggle alternate off shows straight-set ladders all running the same direction → shopping list splits A/B/C correctly.

## Out of scope

- No changes to other patterns' rotation behavior. `alternateBlocks` remains an A/B swap for Shoofly and becomes a 90° rotation for Jacob's Ladder — dispatched per-pattern inside `QuiltLayoutPreview`.
