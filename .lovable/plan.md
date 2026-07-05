
## Plan: Remove Woven Star, Add Card Trick

### 1. Remove Woven Star completely
- `src/lib/planner-store.ts` — remove `"woven-star"` from `PatternId` union.
- `src/lib/patterns.ts` — remove the `woven-star` `PatternDef` entry and any pattern-list gates that reference it.
- `src/lib/yardage.ts` — remove the `woven-star` branch and any references in shared gate lists.
- `src/components/PatternDiagram.tsx`, `PatternThumb.tsx`, `QuiltLayoutPreview.tsx` — remove `case "woven-star"` rendering blocks and helpers used only by it (`triHst`/`triQst` variants specific to woven star).
- `src/components/FabricRollIcon.tsx` — remove the `"woven-star": 5` entry in `PATTERN_DIFFICULTY`.
- `scripts/audit-yardage.ts` — remove the two woven-star audit cases.
- `src/components/__tests__/__snapshots__/pattern-renderers.test.tsx.snap` — regenerate (snapshot for woven-star will disappear automatically on re-run).

### 2. Add `card-trick` pattern

**Metadata**
- `src/lib/planner-store.ts` — add `"card-trick"` to `PatternId`.
- `src/lib/patterns.ts` — new `PatternDef`:
  - `id: "card-trick"`, `name: "Card Trick"`, `hasMath: true`, `supportsSashing: true`, no `supportsAlternate`.
  - Sections: Card A (default A), Card B (B), Card C (C), Card D (D), Background (E), Sashing (F), Border (G).
  - Intro text noting the 3×3 grid, 4 on-point "cards" meeting at center, background visible only in corners.
- `src/components/FabricRollIcon.tsx` — add `"card-trick": 4` (difficulty 4 — mixed HST + QST but well-scoped).

**Yardage math (`src/lib/yardage.ts`)**
For a block with finished size `S`, unit `u = S/3`:
- 4 corner HSTs (one per card A/B/C/D paired with background E): each HST unit uses one starting square of size `u + 0.875"`, cut once diagonally → 2 HSTs.
  - Per block: 4 HST starter squares for Background (E), and 1 HST starter square for each of A/B/C/D.
- 4 edge QST units (top-center, middle-right, bottom-center, middle-left): each edge cell is a 3-triangle unit = one full QST (u + 1.25" starter, cut twice diagonally = 4 quarter-triangles) contributes; per unit we need 1 background quarter + 1 quarter from each of two adjacent cards. Standard approach: 1 QST starter of Background + 1 QST starter each of the two neighbor cards, discarding excess (same as other QST patterns already in library).
  - Per block edge QSTs total: 4 Background QST starters, and each card contributes to 2 edge units → 2 QST starters per card A/B/C/D (following the "one starter per quarter needed" convention already used in the codebase).
- 1 center QST unit (4 quarters, one per card): 1 QST starter per card A/B/C/D (1 quarter kept from each, standard convention).
- Total per block via `addSquares` helper:
  - A: 1 HST starter (u+0.875) + 3 QST starters (u+1.25)
  - B: same
  - C: same
  - D: same
  - E: 4 HST starters + 4 QST starters
- Route everything through `addSquares` / `addRails` per the memory rule. Wire sashing/border support identically to `nine-patch`.
- Add `card-trick` to any shared "supports sashing/border" gate lists.

**Rendering**
Use a 300×300 base viewBox, cells 100×100, exactly as user described. Add helpers only if needed (or reuse `triHst`/`triQst` primitives from PatternDiagram).

- `PatternThumb.tsx` — case `"card-trick"`: mini version painting all 9 cells with the exact triangle vertices from spec.
- `PatternDiagram.tsx` — case `"card-trick"`: full renderer using `assignments` for A/B/C/D/E. Draw the 9 cells:
  - Corners (1,1)(1,3)(3,1)(3,3): HSTs with background + card diamond half.
  - Edges (1,2)(2,1)(2,3)(3,2): 3-triangle QST units with 1 background point + 2 card halves.
  - Center (2,2): 4 card triangles meeting at (150,150), using exact vertices from spec (A top, B right, C bottom, D left).
  - Thin subtle grid lines to match other patterns.
- `QuiltLayoutPreview.tsx` — case `"card-trick"`: tile the block without rotation across the grid; supports sashing + border like nine-patch.

**Audit + tests**
- `scripts/audit-yardage.ts` — add card-trick cases:
  - Baseline (no sashing, no border): assert exact HST/QST starter counts per fabric per block × N blocks.
  - With sashing: assert sashing yardage added correctly.
- Snapshots refresh automatically via `bun run verify`.

### 3. Verification
- `bun run verify` (tests + `bun audit:math` + build).
- Manual smoke via Playwright: pick Card Trick → Step 2 (size, block, border, sashing available) → Step 3 diagram matches reference (4 on-point diamonds, background only in 4 corners) → full-quilt preview tiles cleanly → assign photos to all 5 fabrics → shopping list shows correct per-fabric yardage split for A/B/C/D/E.

### Technical notes
- QST quarter-counting: existing patterns (Ohio Star, Sawtooth Star) already use the "1 starter square per needed quarter, discard excess" convention. Card Trick follows that convention — no new math primitive required.
- Rotational symmetry: Card Trick has 4-fold rotational symmetry around block center but the card labels change under rotation, so no `supportsAlternate` — tile without rotation.
- Sashing default width reuses global default (2"), same as nine-patch.
