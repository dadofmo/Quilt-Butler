## Problem

In the Simple Squares preview, when a fabric photo is assigned to a cell it looks "blown up" — you see only a corner of one motif instead of a repeating fabric.

Root cause: `PatchworkPreview` uses a fixed `FABRIC_TILE_PX = 64` for every fabric photo background. The preview container is capped at 360px wide, so when there are many blocks across (e.g. a 10×12 layout), each cell renders at ~30–40 px. A 64px tile is then larger than the cell, so only a fragment of one motif is visible — exactly the "blown up / distorted" look.

The SVG diagrams don't have this problem because `FabricPatternDefs` tiles at ~40% of a block, scaled in SVG user units that resize with the shape. The HTML preview needs the same behavior.

## Fix (PatchworkPreview.tsx only)

1. Add a `ref` + `ResizeObserver` (or a `useLayoutEffect` measuring `clientWidth`) on the outer preview div to track its rendered pixel width.
2. Derive the rendered pixel size of one block:
   `blockPx = (containerPx - 2 * borderPx) / (cols + sashCols * sashingWidth/blockSize)`
   (i.e. mirror the same fr-track math already used for layout).
3. Set the tile pixel size to roughly 40% of `blockPx` (clamped to a sensible min, e.g. `max(12, round(blockPx * 0.4))`) — matching the SVG convention so the motif looks like it was cut from a continuous bolt.
4. Pass that dynamic tile size into `fabricTileStyle` (turn the constant into a parameter) and use it for all three call sites: border, sashing, and each cell.
5. Leave the no-photo (solid color) branch unchanged.

Result: as the preview width or block count changes, the photo always tiles at ~40% of a block, so every cell shows a believable swatch of fabric — same scale as the SVG diagrams elsewhere in the app, and consistent before and after cycling.

## Out of scope

- No changes to yardage math, pattern definitions, FabricPatternDefs, or any other component.
- No change to the cycle/tap behavior itself.