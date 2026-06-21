## Add "Snowball Block" pattern

A new fully-functional pattern with a permanent checkerboard A/B fabric swap and a new per-pattern "corner accent size" input. License/paywall logic untouched — Snowball lands behind the paywall automatically like every pattern except Nine Patch and HST.

### Files to edit (all additive, no breaking changes)

1. **`src/lib/planner-store.ts`**
   - Add `"snowball-block"` to the `PatternId` union.
   - Add a new optional field `cornerAccentSize: number` (default `0` = "not set yet"), persisted in localStorage alongside the rest of planner state. Existing users' stored state spreads cleanly via `{ ...initial, ...parsed }` — no migration needed.

2. **`src/lib/patterns.ts`**
   - New `PatternDef` entry with sections: `mainA` (A) and `mainB` (B) — both labeled per spec — plus `sashing` (C) and `border`. `intro` uses the spec's green-box copy.
   - Effective border default falls through `getEffectiveBorderDefault` (no change to that helper).

3. **`src/pages/SizePage.tsx`**
   - Add `isSnowball` flag; include it in `isSashed`.
   - When `isSnowball`, render a new "Corner accent size (in inches)" text input directly below Block size, with the exact helper text from the spec. Validate `> 0` AND `< blockSize`. Block "Next" if invalid.
   - On `next()`, persist `cornerAccentSize`.

4. **`src/lib/yardage.ts`**
   - New `case "snowball-block"` branch. Math:
     - `mainCut = blockSize + SEAM` (0.5)
     - `cornerCut = cornerAccentSize + SEAM`
     - `evenBlocks` / `oddBlocks` computed by iterating the actual grid (`(r+c) % 2`), not a flat 50/50, so odd totals split correctly.
     - Fabric A pieces: `evenBlocks` main squares (`mainCut`) + `oddBlocks * 4` corner squares (`cornerCut`).
     - Fabric B pieces: `oddBlocks` main squares + `evenBlocks * 4` corner squares.
   - Route every cut through `addSquares` (never push to `req.pieces` directly), keeping the main-square and corner-square cuts as separate `addSquares` calls per fabric so the cutting diagram naturally renders them as distinct strip groups.
   - Add the spec's exact `notes.push(...)` lines (cutting/sewing bullets, per-fabric counts, sage-green Assembly Tip).
   - Sashing block: reuse the existing Sawtooth Star / Friendship Star sashing snippet verbatim.
   - Add `"snowball-block"` to the `showBasics` list and any other inclusive pattern flags already used for sashed block patterns.

5. **`src/components/PatternThumb.tsx`**
   - Add a tile illustration: 1×2 mini grid showing two adjacent snowball blocks with A/B swapped (octagon shape via clipped corners). Add the new id to the thumb-list mapping.

6. **`src/components/PatternDiagram.tsx`**
   - Add a `case "snowball-block"` that renders the "How blocks alternate" 1×2 panel (left = A main / B corners, right = B main / A corners), with the spec's caption sentence underneath.

7. **`src/components/QuiltLayoutPreview.tsx`**
   - Add a `case "snowball-block"` that tiles the full grid with the alternating colorway (octagon main + 4 corner triangles, swapped on `(r+c) % 2 === 1`). Used both by the Step 2 live preview and the Step 3/4 full-quilt preview, so the checkerboard appears everywhere automatically.

8. **`src/components/FabricRollIcon.tsx`**
   - Add `"snowball-block": 3` (uses up to 3 bolts: A, B, border; sashing fabric defaults to C so still 3).

9. **`src/pages/FabricsPage.tsx`** and **`src/pages/ResultsPage.tsx`**
   - Add `isSnowball` flag where other pattern-specific labels/copy switch. FabricsPage header/subheading + the green explanation box use the spec text. ResultsPage uses the spec's header/subheading and the sage-green Assembly Tip already emitted by `yardage.ts`.

10. **`scripts/audit-yardage.ts`**
    - Add 4 cases: (a) no sashing throw, (b) 2" sashing throw, (c) odd total blocks (e.g. 5×7 grid) to verify even/odd split math, (d) small block (8") with 3" corner accent. Run `bun audit:math` after the edits.

### What is NOT touched (license safety)

- `src/lib/license.ts`, `src/components/UnlockModal.tsx`, `api/license-*.ts`, Freemius config — zero changes. New pattern inherits the existing paywall rule "everything except `nine-patch` and `hst` requires a license" with no edits to that rule.
- localStorage key `quiltbutler-planner-state` unchanged. New field is additive and tolerated by old clients (they'd just ignore it).
- No existing pattern's calculator, diagram, sections, or defaults are modified.

### Verification

- `bun audit:math` must pass for all existing patterns plus the 4 new Snowball cases.
- Manually walk a Snowball quilt end-to-end (Step 1 → Step 4) and confirm: checkerboard preview, corner-accent input validation, fabric totals match the hand-computed `even/odd × pieces` formula, sashing toggles cleanly at 0" and 2".
- Spot-check Sawtooth Star, Friendship Star, Nine Patch, and HST still render and price identically.
- Confirm license flow: pattern card shows lock until key is entered; entering a valid key unlocks Snowball alongside the other paid patterns.

### Open question

The spec says Card 3 (Border) offers swatches "A, B, and C". The existing FabricsPage border picker auto-derives the available swatches from active fabrics + the next free letter (via `getEffectiveBorderDefault`). I'll keep that existing helper so Snowball's border picker shows A, B, and C exactly (since only A and B are active block fabrics, C is the next free letter). Confirm this matches your intent — otherwise I'll hardcode the three options for Snowball only.
