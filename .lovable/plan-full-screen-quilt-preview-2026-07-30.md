# Full-screen quilt preview

Easy change — roughly one component edit, no math or yardage impact.

## What you get

Next to the "Your full quilt" label on the Assign Fabrics page, a small text link: **See full screen**. Clicking it opens the finished-quilt preview filling the screen, centered on a dimmed backdrop, with an X button at the top right. Clicking the X (or pressing Esc, or clicking the backdrop) returns to the normal view. Works on phone and desktop, and it applies to every pattern automatically since it lives in the shared preview component.

## How it works

- `src/components/QuiltLayoutPreview.tsx` currently hardcodes a 220px max size for the quilt thumbnail. Extract the quilt-rendering markup (border padding + SVG of tiled blocks/sashing) into an internal `QuiltCanvas` subcomponent that takes a `maxSize` value, so the same code renders both the 220px thumbnail and the large full-screen version. No geometry logic changes — the existing pixel math is already proportional to `MAX`.
- Add a `See full screen` button (styled as a link, `no-print` so it never appears in printouts) beside the "Your full quilt" heading.
- Render the enlarged copy in the existing shadcn `Dialog` component with a near-full-viewport content panel and a close X in the corner; size the canvas from the viewport (e.g. `min(90vw, 85vh)` scaled by quilt aspect ratio) so tall and wide quilts both fit without cropping.
- Fabric photos, sashing, cornerstones, and border tiling all pass straight through, so the full-screen view matches the thumbnail exactly (border photo keeps the ~40% tile scale rule).

## Not included

No changes to yardage, cutting diagrams, patterns, or the single-block preview.
