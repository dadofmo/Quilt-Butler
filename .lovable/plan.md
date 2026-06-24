## Add "Streak of Lightning" pattern

A new paywalled pattern: each block is a 2×2 grid of four Half Square Triangle (HST) units, **all facing the same diagonal direction**. When placed flush, the diagonals connect block-to-block into one continuous zigzag across the whole quilt top.

### Pattern model
- Add `"streak-of-lightning"` to `PatternId` in `src/lib/planner-store.ts`.
- Add pattern definition in `src/lib/patterns.ts` with sections:
  - `stripe` (default `A`) — the diagonal stripe fabric
  - `bg` (default `B`) — background behind the stripe
  - `sashing` (default `C`) — uses the existing global sashing system
  - `border` (default `D`)
- `intro` text mentions the continuous zigzag effect and the sashing caveat verbatim from the spec.

### Tile illustration (`src/components/PatternThumb.tsx`)
- Add a `case "streak-of-lightning"` rendering a 2×2 grid of 45×45 cells. Each cell: orange/stripe triangle in the bottom-left half, gray/background triangle in the top-right half. Use `C.a` (stripe) and `C.b` (background) so it picks up the brand fabric tokens. Add `PATTERN_ALT` entry.

### Block + quilt previews
- **`src/components/PatternDiagram.tsx`**: add a renderer that draws four same-direction HSTs in a 2×2 (200×200) grid using live `stripe` / `bg` assignments.
- **`src/components/QuiltLayoutPreview.tsx`**: render the full quilt as repeating same-direction HST units so adjacent blocks visually connect into a continuous zigzag. When `sashingWidth > 0` and the pattern is in the sashing list, render the existing sashing strips between blocks — the zigzag will appear segmented, which is the honest preview.

### Yardage math (`src/lib/yardage.ts`)
Add a `streak-of-lightning` branch:
- `u = blockSize / 2`
- `cutSize = u + HST_EXTRA` (0.875")
- Per block: 2 stripe starting squares + 2 background starting squares (one pair → 2 same-direction HSTs, two pairs → 4 HSTs per block).
- Total: `stripeSquares = blocks × 2`, `bgSquares = blocks × 2`. Pool by fabric letter (if user assigns stripe and bg to the same letter, sum them — same pattern the other multi-section blocks use).
- Use existing `addSquares` helper so it routes through `req.pieces` correctly.
- Sashing: include in the sashing-enabled list; uses existing `addRails`/sashing helper.
- Border: standard `borderInches`.
- Assembly tip (sage green): exact text from spec.
- Cutting/sewing bullet steps from spec, including HST construction note and orientation reminder.
- Cutting diagrams: per-fabric squares with sub-cut instruction `"Sub-cut along the dashed lines to get [X] starting squares — each [u+0.875]" × [u+0.875]". Draw a diagonal line corner to corner on each before pairing."` — matches existing detailed style (selvage trim, usable width label, strip visual, total fabric line).

### Sashing wiring
Add `"streak-of-lightning"` to the sashing-supported pattern list in:
- `src/pages/SizePage.tsx`
- `src/pages/FabricsPage.tsx`
- `src/pages/ResultsPage.tsx`

### Step 3 (Fabrics) copy
In `src/pages/FabricsPage.tsx`, the page already reads pattern sections + intro. Confirm:
- Heading: `Assign fabrics — Streak of Lightning`
- Subheading: `Pick two fabrics for your diagonal stripe. The diagram updates as you choose.`
- Green explanation box content matches spec (verify rendering path follows the same pattern as Four Patch / Snowball).
- Section cards: Stripe fabric (A,B), Background (A,B), Border (A,B,C) — using existing `FabricSwatchOption` swatch logic.

### Step 4 (Results) — handled by ResultsPage via yardage output
Header: `Streak of Lightning • W" × H" finished` — already follows pattern name. Bullets, cutting diagrams, materials, shopping list, sage assembly tip, and print button all flow through existing infrastructure once the yardage branch is added.

### Paywall / license
`streak-of-lightning` is NOT in the free list (only Nine Patch + HST are free), so the existing license gate auto-locks it. No changes to `license.ts`, `freemius-config.ts`, or the unlock modal.

### Audit
Add cases to `scripts/audit-yardage.ts`:
1. 20-block layout, stripe=A, bg=B — expect 40 starting squares each at cutSize.
2. Same fabric for stripe+bg (both A) — pool to 80 squares of A.
3. Sashing enabled — verify sashing strips appear and don't double-count border.
Run `bun audit:math` after implementation; must pass.

### Files touched
- `src/lib/planner-store.ts`
- `src/lib/patterns.ts`
- `src/lib/yardage.ts`
- `src/components/PatternThumb.tsx`
- `src/components/PatternDiagram.tsx`
- `src/components/QuiltLayoutPreview.tsx`
- `src/pages/SizePage.tsx`
- `src/pages/FabricsPage.tsx`
- `src/pages/ResultsPage.tsx`
- `scripts/audit-yardage.ts`

No license, paywall, routing, or design-token changes. No new pages, no DB.
