
# Plan: Shoofly pattern + Alternate-blocks toggle

## Part 1 — New pattern: Shoofly

Classic 2-fabric 3×3 grid block. Fabrics: A (background), B (accent). 4 HST corners pointing inward + center accent square + 4 plain background sides.

**Files to add/edit**

- `src/lib/patterns.ts` — register `shoofly` with 2 sections (A background, B accent), `hasMath: true`, default block 12", sashing default 0", allows optional sashing/border like other blocks.
- `src/lib/yardage.ts` — add Shoofly math. Per block:
  - 4 HST corner units → cut 2 squares (one A, one B) at `cellFinished + 0.875"`, sliced diagonally → yields 4 HSTs (2 blocks worth of HSTs from each pair; use standard HST helper already used by Friendship Star / Ohio Star).
  - 4 plain background squares (cellFinished + 0.5").
  - 1 center accent square (cellFinished + 0.5").
  - Route everything through `addSquares` — never push to `req.pieces` directly (memory rule).
- `src/components/PatternDiagram.tsx` — render single Shoofly block per spec coords (300×300 viewBox, 100-unit cells, exact HST diagonals as specified so corners point inward toward center).
- `src/components/PatternThumb.tsx` — brand-fabric mini version for Step 1 tile.
- `src/components/QuiltLayoutPreview.tsx` — tile Shoofly across the full-quilt view (with alternation support, see Part 2).
- `scripts/audit-yardage.ts` — add Shoofly case with expected piece counts.
- `src/components/__tests__/pattern-renderers.test.tsx` — snapshot the new renderer.
- Coverage test picks up the new pattern automatically via `PATTERNS`.

## Part 2 — Reusable "Alternate blocks" toggle

New optional per-pattern feature: swap Fabric A ↔ Fabric B on every other block (checkerboard, like Snowball but user-controlled).

**Data model** (`src/lib/planner-store.ts`)
- Add `alternateBlocks: boolean` (default `false`) to `PlannerState` + `initial`.
- Add matching field to test `baseState()` in `patterns-coverage.test.ts`.

**Pattern metadata** (`src/lib/patterns.ts`)
- Add optional `supportsAlternate?: boolean` on the pattern definition.
- Set `true` on Shoofly. (Snowball keeps its permanent checkerboard — no change.)
- Leave other patterns untouched; easy to opt in later.

**UI** (`src/pages/SizePage.tsx`)
- When `getPattern(state.pattern)?.supportsAlternate`, show a checkbox: *"Alternate blocks — swap Fabric A and Fabric B on every other block"* with a one-line explainer. Hidden otherwise, so no impact on other patterns.

**Rendering** (`src/components/QuiltLayoutPreview.tsx`)
- If `alternateBlocks && supportsAlternate`, for each grid cell `(r,c)` with `(r+c)%2===1`, swap the fabrics assigned to sections A and B before rendering that block. Single-block preview and Step 2 patchwork preview unchanged.

**Math** (`src/lib/yardage.ts`)
- When `alternateBlocks` is on for a 2-fabric pattern, total piece counts don't change — but the per-fabric split does. For Shoofly: half the blocks use (A-background/B-accent), half use (B-background/A-accent). Effect: A and B each get 50% of what a single-orientation quilt would give A, plus 50% of what it would give B. Implement as a post-process swap on half the blocks when computing per-fabric totals.
- Odd block counts: the extra block uses the primary orientation (A background). Document in a comment.

**Audit** (`scripts/audit-yardage.ts`)
- Add a Shoofly + alternateBlocks case verifying A and B totals balance vs the non-alternating case.

## Technical notes

- All fabric defaults come from `getPattern(id).sections[*].defaultFabric` — no hardcoded "A"/"B" in diagrams (memory rule).
- HST math reuses the existing helper pattern (Friendship Star / Ohio Star). No new geometry helpers.
- Backwards compatible: `alternateBlocks` defaults to `false`; existing saved states get it via the store's `{ ...initial, ...parsed }` merge.
- Run `bun audit:math` + `bun run verify` after implementation.

## Out of scope

- Extending the alternate toggle to patterns beyond Shoofly (Log Cabin, HST, Four Patch etc. could opt in later with just a `supportsAlternate: true` flag).
- Changing Snowball's permanent checkerboard behavior.
