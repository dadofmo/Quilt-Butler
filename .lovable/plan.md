## Fix: Size suggestions must respect jelly-roll architecture

### The bug
On Step 2, when **Jelly Roll** is selected for Rail Fence, the "Heads up — your finished size doesn't match" panel is still offering block sizes like 5.5" and 13". Those are impossible for a jelly-roll rail fence — every block must be exactly three 2.5" strips stacked, finishing at **6"** (3 × 2" finished). Only border and sashing can flex.

### The fix
In `src/pages/SizePage.tsx`, when `fabricSource === "jelly-roll"`:

1. **Lock block size in the solver.** Restrict the suggestion search to `blockSize = 6` only. Vary just border width (0–8" in 0.25" steps) and sashing width (0–4" in 0.25" steps) to find combinations that hit the target W × H exactly.
2. **Update the suggestion copy.** Each option reads "3" border and 1.5" sashing (5 × 7 = 35 blocks)" — no block-size text, since it's fixed at 6".
3. **Update the "larger/smaller than desired" sentence.** Drop the block-size mention in jelly-roll mode: "With a 2" border and 2" sashing, your finished quilt will be 58" × 82" …".
4. **If no exact match exists,** show the closest under-and-over pair instead of nothing, same as today.

No changes to `yardage.ts`, the planner store, or any other pattern. Yardage mode is untouched.

### Verification
- Manually walk Rail Fence → Jelly Roll on Step 2 with the throw preset (50 × 65) and confirm only 6"-block options appear.
- Re-run `bun audit:math` (no math changed, but confirms nothing regressed).