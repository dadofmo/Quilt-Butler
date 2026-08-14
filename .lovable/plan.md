# Next pattern for the A/B alternate-blocks toggle: Plus Block

## Why Plus Block is the logical next one

The toggle only makes sense for blocks built from exactly two fabrics whose roles can trade places cleanly. Plus Block is the closest match to Squares on Point:

- Two fabric roles only: `plus` (5 squares) and `bg` (4 corner squares) per block.
- Swapping them produces a genuine secondary design — alternating plus signs read as a checkerboard of positive/negative crosses instead of floating plus shapes on one background.
- The cutting math splits cleanly the same way Squares on Point does: with the toggle on, half the blocks contribute 5 plus squares of Fabric A and 4 corners of Fabric B, the other half the reverse.
- Its existing yardage notes already suggest this look informally ("try mixing in a few blocks where the plus and background fabrics are swapped") — the toggle makes it exact and puts it in the cutting list.

Runner-up, worth adding in the same pass if you want two: **Pinwheel** (blades vs background). Visually the swap gives alternating light/dark pinwheels, and it needs no math change at all because each block already uses an equal number of starting squares of both fabrics — it's a preview-only change plus one sentence in the sewing notes.

## What you get

On the Assign Fabrics step for Plus Block, the same highlighted toggle appears under the full-quilt preview: "Reverse the fabrics on every other block". Toggling it flips the plus and background fabrics on alternating blocks (alternating both across each row and down each column), the preview updates live, and the cutting list, yardage, and sewing steps on the plan page reflect whatever is selected when you continue.

## Technical details

- `src/lib/patterns.ts`: set `supportsAlternate: true` on `plus-block` (and on `pinwheel` if included), and mention the toggle in the pattern intro.
- `src/components/QuiltLayoutPreview.tsx`: add a `plusSwap` case alongside the existing `sopSwap`/`shooflySwap` checkerboard flags, and honor `swap` in the `plus-block` branch of the block renderer by trading the plus and bg fabrics.
- `src/lib/yardage.ts`: in the `plus-block` branch, walk the real block grid to count even/odd cells (same approach as Shoofly, so odd totals split exactly), then attribute 5 plus + 4 corner squares per block to the correct fabric per orientation, pooling by fabric letter when the user picks the same fabric twice. Add an assembly note describing the alternating layout when the toggle is on.
- `scripts/audit-yardage.ts`: add a Plus Block alternate case asserting the per-fabric split and that total squares are unchanged (9 x block count).
- Verify with `bun audit:math` plus the existing renderer snapshot tests.

No change to the toggle UI itself — it is already generic and driven by `supportsAlternate`.
