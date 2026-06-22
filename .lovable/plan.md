## Fix the Snowball Block tile illustration

The tile on the pattern picker currently renders two tall-skinny 45×90 rectangles side by side, so each block is a stretched octagon instead of a square. That's what you're seeing in the screenshot — it doesn't read like the red/white checkerboard reference you pasted.

### Change

**`src/components/PatternThumb.tsx`** — `case "snowball-block"` (lines 385–417)

Replace the 1×2 tall-block layout with a **2×2 grid of square blocks** (each 45×45 inside the 90×90 thumb viewBox), with A/B swapped on every other cell using `(r+c) % 2`. This:

- Shows true square blocks (matches the reference image's geometry).
- Demonstrates the checkerboard alternation on both axes — exactly the red/white reversal you want users to see at a glance on the picker tile.
- Uses the same octagon math already in `MiniBlock`/`PatternDiagram`, just scaled to 45px.

Corner fraction: `c = 13` of 45 (~29%) — keeps the existing visual weight.

### Not changing

- No math, yardage, license, or paywall code touched.
- `PatternDiagram` (single-block panel) and `QuiltLayoutPreview` (full-quilt preview) already render correctly from the prior fix — leaving them alone.

### Verify

- Open the pattern picker: Snowball Block tile should show a 2×2 grid where diagonal cells share the same colorway and adjacent cells are reversed — matching the reference image's checkerboard.
- `bun audit:math` unaffected (no math edits).
