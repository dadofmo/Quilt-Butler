# Long triangles: add a mirror (flip) option

## What's wrong

You're right, and it is a real limitation, not a display quirk. The long-triangle piece is built from one fixed shape: a 2:1 rectangle cut from one corner to the opposite corner, always leaning the same way. The "Turn this piece" button only spins that one shape a quarter turn at a time, so you get four positions of the *same lean*. The opposite lean is a mirror image, and no amount of turning ever produces a mirror image. Swapping which fabric is on top only trades the two colours — it doesn't change which way the slant runs.

Quilters treat these as two genuinely different pieces (often called left-leaning and right-leaning long triangles), which is exactly why you need both to make opposing sides of a block match.

## Recommended fix (most intuitive)

Add a second small button right beside "Turn this piece", shown only for Long triangles:

- **"Mirror this piece"** with a flip icon, and a plain-English line underneath, e.g. "Right now the slant runs from the bottom-left corner up to the top-right." Pressing it says "…from the top-left corner down to the bottom-right."
- The small picture in the piece palette updates instantly, so the choice is visible before placing anything — the same way turning already works.
- Turn and Mirror stack together: four turns × two mirrors = all eight positions of the long triangle, which is the complete set.

Why a mirror button rather than doubling the turn button to eight clicks: eight identical-looking clicks makes people hunt. Two clearly named controls — one that spins, one that flips — matches how quilters already think about it and stays two taps at most from any position.

## Cutting and yardage — must follow the flip

This is the part that has to stay exact. A left-leaning and a right-leaning long triangle are cut on *opposite* diagonals, so they can't be lumped together in the cut list. The plan:

- Track the mirror choice as part of the piece, and count left-leaning and right-leaning units separately in the cutting maths.
- Keep the same rectangle sizes and the same generous cut-and-trim approach already in use.
- Give each lean its own sewing note stating which diagonal to cut, so a quilter cutting a stack ends up with the lean they actually placed. If a block uses both leans, both notes appear.
- Existing saved designs keep their current lean (unmirrored), so nothing anyone has already made changes.

## Technical notes

- `src/lib/custom-block.ts`: add an optional `mirrored?: boolean` to `CustomCell`; mirror the `hrt` polygon points (x → w − x) before rotation in `unitPolys`; extend the `hrt` tally key to include the lean; extend `rotationWord`/help text. Everything else (`cellsCovered`, `canPlace`, occupancy) is unaffected since the footprint doesn't change.
- `src/pages/DesignBlockPage.tsx`: mirror state alongside rotation, the flip button, palette preview and placement pass `mirrored` through; Undo covers it like any other edit.
- `src/lib/yardage.ts`: split the `hrtUnits` loop by lean, keeping all cuts routed through `addRails`.
- Verification: extend `scripts/audit-yardage.ts` with hand-checked mirrored cases, add mirror coverage to `src/lib/__tests__/custom-block.test.ts`, then run `bun audit:math` and the full test/typecheck/build, plus a live check in the editor that all eight positions are reachable and Results shows correct cut lists.
