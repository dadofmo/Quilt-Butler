# Add Pattern: Friendship Star

A new 3×3 star block built from 1 center square + 4 background corner squares + 4 HST star points arranged with the classic Friendship Star **rotational** orientation (each HST's star triangle points in a swirling pattern around the center, as in your reference image). Sashing is included to match every other pattern except Irish Chain. Paywalled like the rest (only Nine Patch and HST stay free).

## Zero-risk for existing users

- No edits to `src/lib/license.ts`, `src/components/UnlockModal.tsx`, or any `api/license-*` file.
- No localStorage key changes (`qb_license_v1`, `qb_device_uid_v1` untouched).
- No existing pattern's calculator, diagram, thumbnail, or store field is modified — Friendship Star is added as a brand-new `case` in each switch statement.
- `PatternId` only gains a new value; nothing renamed/removed → no breaking store change.

## Files to edit (all additive)

1. **`src/lib/planner-store.ts`** — add `"friendship-star"` to the `PatternId` union.
2. **`src/lib/patterns.ts`** — add Friendship Star entry to `PATTERNS` with sections: `center` (A), `points` (B), `bg` (C), `sashing` (D), border (auto). `hasMath: true`. Intro text uses the green-box copy from the spec.
3. **`src/lib/yardage.ts`**
   - Add `case "friendship-star"` branch modeled on Sawtooth Star (line 1146).
   - Math: `u = blockSize / 3`; `centerCut = u + 0.5`, `hstCut = u + 0.875`, `cornerCut = u + 0.5`. Per block: 1 center, 4 star-point HST starting squares, 4 bg corner squares, 4 bg HST starting squares.
   - Route every cut through `addSquares` / `addRails` — **never push to `req.pieces` directly** (per CHANGE-SAFETY.md).
   - Pooling for shared letters is automatic: each `addSquares` call appends to the requirement object for whatever letter is assigned, so when two sections share a letter their piece counts pool into one yardage calculation. No special-case code needed.
   - Add the exact spec `notes.push(...)` lines: cutting/sewing bullets, sub-cut instructions per fabric (center / star points / background), HST construction step, and the sage-green Assembly Tip.
   - Add sashing block copied from Sawtooth Star: if `sashWidth > 0`, compute vSash/hSash, `addRails`, push sashing note + 2-stage assembly tip.
   - Add `"friendship-star"` to the `showBasics` list at line 1263.
   - Border is handled automatically by the shared block at line 1208 via `getEffectiveBorderDefault`.
4. **`src/components/PatternDiagram.tsx`** — add `case "friendship-star"`: 3×3 grid. Center cell uses `center` fabric, 4 corners use `bg`, 4 edge cells render HSTs with rotational orientation matching your reference (top HST dark triangle on right half, right HST dark on bottom, bottom HST dark on left, left HST dark on top). Reuse existing HST cell rendering used by Sawtooth Star.
5. **`src/components/QuiltLayoutPreview.tsx`** — add `case "friendship-star"` tiling the block across the grid (same construction as the diagram, scaled).
6. **`src/components/PatternThumb.tsx`** — add `case "friendship-star"` producing the tile illustration. Demo colors: pink center, yellow corners/background, blue star points — matching the spec. Also add the thumb-list entry near line 44.
7. **`src/components/FabricRollIcon.tsx`** — add `"friendship-star": 4`.
8. **`scripts/audit-yardage.ts`** — add cases:
   - All distinct fabrics (A center, B points, C bg, D border), block 12", no sashing — verify exact piece counts: blocks × 1 centers, blocks × 4 point HSTs, blocks × 4 corners, blocks × 4 bg HSTs; verify cut sizes match formulas.
   - With sashing 2" — verify sashing strip counts.
   - **Two-fabric look (center === points, both = "B"):** verify pooled piece counts produce a single yardage equal to what cutting the combined piece list would actually require (round-up happens once, after pooling).
   - Small block edge case (block 9", u=3").
   - Cross-check: shopping-list total yardage equals `Σ(strips × cut size)` from the cutting diagram for each letter.

## Behavior verification (after build)

- `bun audit:math` passes.
- Manually walk one Friendship Star quilt end-to-end in the preview: tile shows on picker, fabrics page renders all 4 cards + border, results page shows correct piece counts, cutting diagrams render for each assigned letter, shopping list totals match the diagrams.
- Spot-check Sawtooth Star and Nine Patch still render identically (regression check on shared code paths).
- License flow: not touched. No smoke test required by CHANGE-SAFETY.md.

## One small spec note

Your reference image shows the classic **rotational** Friendship Star (HSTs swirl around the center) rather than all four star triangles pointing dead-center. Claude's text said "pointing inward toward center" — these read similarly but the rotational version is the traditional Friendship Star and matches your image. I'll build the rotational version. The math is identical either way (still 4 HSTs per block, same cut sizes, same yardage); only the diagram/thumb orientation changes.
