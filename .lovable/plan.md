# Keep fabric photos inside each quilt piece

## What will change
- Change uploaded and camera-taken fabric photos from one block-wide image to a fresh, centered crop inside each individual square or triangle.
- Apply the same rendering rule in the Custom Block Studio, block previews, and full-quilt previews so the picture never spills visually across neighboring pieces.
- Keep the existing upload and camera buttons unchanged.

## Verification
- Add a focused rendering check confirming each piece receives its own complete photo crop.
- Test adjacent pieces using the same fabric and mixed fabrics at multiple grid sizes.
- Run the full automated test and math verification suite, then inspect the result in the running app.

## Technical details
- Use shape-relative SVG photo patterns rather than the current block-wide coordinate system.
- Preserve the existing fabric color fallback and unique pattern IDs used when multiple block previews appear together.
