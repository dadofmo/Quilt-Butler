# Add the Double Pinwheel pattern

Build Double Pinwheel as a new two-fabric pattern matching the supplied 4×4 triangle layout exactly.

## Pattern construction

- Draft one block as a 4×4 grid of sixteen equal half-square-triangle units.
- Use one shared orientation map for the block preview, picker thumbnail, full-quilt preview, and full-screen views so the design cannot drift between screens.
- Match the reference row by row, including the four-triangle pinwheel at the centre and the larger turning shapes around it.
- Keep every triangle flush with its neighbor, without decorative seam outlines.

## Planner integration

- Add Double Pinwheel to the pattern picker, search/filter information, fabric selection, block preview, full-quilt preview, full-screen views, and results.
- Provide two plain-English fabric choices plus optional sashing and border.
- Preserve the shared fabric-color and uploaded-photo behavior used by existing patterns.

## Cutting math and instructions

- Calculate sixteen HST units per block from the actual quilt dimensions and selected block size.
- Use the standard two-at-a-time HST method: eight starting-square pairs per block, split evenly between the two fabrics.
- Route all cuts through the shared yardage helpers and include optional sashing and border calculations.
- Add beginner-friendly trimming, orientation, row assembly, pressing, and point-matching instructions.

## Verification

- Add hand-calculated audit cases for multiple block sizes, including a quilt with sashing.
- Run the complete yardage audit, automated renderer and pattern tests, type checks, and production verification.
- Open the live planner and visually confirm the picker tile, one-block view, full-quilt view, and results against the supplied reference.
