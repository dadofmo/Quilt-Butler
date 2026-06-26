## Two bugs on the Results page in jelly-roll mode

### Bug 1 — Wrong finished size (57.5" × 72.5" instead of 50" × 65")

`src/pages/ResultsPage.tsx` (lines 75–82) still computes the block grid with the old formula that ignores sashing:

```ts
const blocksAcross = Math.floor(innerW / planner.blockSize);
const blocksDown   = Math.floor(innerH / planner.blockSize);
```

This is exactly the SizePage bug we fixed last round — it was never applied here. With a 50×65 desired quilt, 3.25" border, 6" block, 1.5" sashing → `innerW = 43.5`, `floor(43.5/6) = 7`, so it reports 7×9 blocks → 57.5" × 72.5". The suggester (and SizePage) correctly computes 6×8 = 50" × 65".

**Fix:** in ResultsPage, use the sashing-aware formula:

```ts
const denomW = planner.blockSize + (useSashedMath ? sashing : 0);
const denomH = denomW;
const blocksAcross = Math.max(1, Math.floor((innerW + (useSashedMath ? sashing : 0)) / denomW));
const blocksDown   = Math.max(1, Math.floor((innerH + (useSashedMath ? sashing : 0)) / denomH));
```

After this, the "Heads up" mismatch banner will correctly disappear and the subtitle will read `50" × 65" finished`.

### Bug 2 — Fabric summary only shows 2 fabrics

The summary correctly omits block fabrics in jelly-roll mode (they come from the precut, not yardage), but with `result.fabrics.length > 0` (border D + sashing E) the existing explanatory note at line 253 never shows, so the user can't tell why their block fabric is missing.

**Fix:** in jelly-roll mode, add a short note directly under the Fabric summary table — e.g.

> Your block fabrics come from your jelly roll and are listed in the **Jelly roll plan** below. The yardage above covers only your border, sashing, backing, batting, and binding.

This is just an info line in `ResultsPage.tsx` shown when `precut` is truthy.

### Verification

- Reload `/results` in Rail Fence + jelly-roll mode with 50×65 / 3.25" border / 1.5" sashing → header reads `50" × 65"`, no mismatch banner.
- Fabric summary still shows D + E, with a new note pointing to the Jelly roll plan for block fabrics.
- `bun audit:math` still passes (no yardage math changes).
- Quick sanity check that yardage mode (non-jelly-roll) is unchanged — same formula, just sashing-aware.

### Scope

Only `src/pages/ResultsPage.tsx` is touched. No changes to `yardage.ts`, patterns, or the license/checkout flow.
