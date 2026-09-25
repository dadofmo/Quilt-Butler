# Fix border fabric scaling after a fabric change

## What will change
- Keep border color and border photo styling separate so changing fabrics cannot reset the photo’s repeat size.
- Apply the correction in the shared quilt canvas, covering every standard pattern and Design Your Own Block.
- Add a regression check that switches border fabrics after the preview is already rendered.

## Verification
- Compare the border before and after changing fabrics in the live preview at phone size.
- Run the project’s full verification suite and confirm the preview has no errors.

## Technical details
The shared border currently uses the CSS `background` shorthand together with `backgroundImage` and `backgroundSize`. Updating the shorthand can reset an unchanged image size to its browser default. The fix will use `backgroundColor` plus explicit image properties, preventing that reset.
