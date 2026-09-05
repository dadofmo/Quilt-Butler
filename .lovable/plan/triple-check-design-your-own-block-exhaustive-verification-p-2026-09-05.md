# Triple-check "Design Your Own Block" — exhaustive verification pass

The honest answer to "is it 100% flawless" is no — not yet. The existing audit script only covers the built-in patterns, not the seven unit types in the custom editor. This plan closes that gap with three layers of proof.

## 1. Hand-calculated yardage cases for every new unit

Add cases to `scripts/audit-yardage.ts` (the same hand-calc style the built-in patterns use) for each new unit, each checked against real quilt-math formulas a quilter would use:

- **Snipped corners** — 1, 2, 3, and 4 corners on; base square at unit + 1/2"; one corner square per active corner at unit/2 + 1/2".
- **Square on point** — centre square at unit/1.414 + 1/2"; 2 squares at unit/2 + 7/8" cut diagonally (same method Economy Block uses).
- **Long triangles** — two rectangles at (2 units + 1") × (unit + 1"), trimmed after sewing.
- **Split in half** — two rectangles at unit + 1/2" × unit/2 + 1/2".

Each is checked at multiple grid sizes (2×2 through 8×8) and in alternating-blocks mode, since that doubles/flips fabric splits.

## 2. Automated sweep of every design a user can build

A new Vitest suite that programmatically generates designs and asserts the math never throws and never produces nonsense (zero/negative piece counts, blank fabric rows):

- Every unit type at every grid size 2×2 through 8×8.
- Full grids of each unit type alone, then mixed full grids.
- All corner on/off combinations for snipped corners (15 valid states).
- Every rotation state of every unit, including long triangles in both orientations at every legal anchor cell.
- Whole-block rotation applied 1–4 times to a mixed design, verifying piece counts are unchanged (rotation must never change the cutting list).
- Block B alternation and fabric-swap paths.
- Render-safety: mount the editor preview, block preview, and full-quilt preview for each generated design — any SVG that crashes or renders nothing fails the test.

## 3. Human-verifiable spot checks

- Update `docs/PATTERN-SMOKE-CHECK.md` with a custom-block section so you can do the same 5-minute eyeball pass you already do for built-in patterns.
- Playwright pass through the real UI: build one design per new unit, walk to Results, and screenshot the cutting list, yardage rows, and full-quilt preview for you to review in chat.
- Confirm the cutting-guide wording for the new units reads correctly (no "cut on the diagonal then subcut" style confusion like the one you caught earlier).

## Technical detail

- `scripts/audit-yardage.ts` — new hand-calc cases, run via `bun audit:math`.
- New `src/lib/__tests__/custom-block.test.ts` — the permutation sweep from section 2.
- Any bug the sweep finds gets fixed in this same turn (geometry in `src/lib/custom-block.ts`, yardage in `src/lib/yardage.ts`, or rendering in `CustomBlockSvg.tsx`), then all three checks rerun.
- Final gate: `bun run verify` (audit + tests + build) must pass clean.

## What I'll tell you at the end

A plain summary: how many cases ran, what failed and was fixed, and the residual honest caveat — automated tests prove math and render-safety, but the final visual sanity check on a real quilt design is yours.
