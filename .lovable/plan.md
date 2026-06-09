# Fix plan: Simple Squares preview zooms in on fabric photos after toggling

## Problem
In the Simple Squares quilt visualizer, tapping squares to cycle fabrics can make a photo-backed fabric render as a zoomed-in / flat-looking patch (the camo turning grayish is one example). This must not happen for any fabric.

## Root cause
`PatchworkPreview` builds each cell's style by spreading `fabricTileStyle(...)` AFTER a `background: FABRIC_COLORS[fab]` shorthand:

```
style={{
  background: FABRIC_COLORS[fab],   // shorthand resets background-size, position, repeat
  ...fabricTileStyle(fab, tilePx, photos), // then sets image/size/repeat
}}
```

For solid swatches the shorthand stays. For photo swatches, React's style diffing during re-render (after a cycle) can momentarily reapply `background` and clobber `background-size`/`repeat`, so the image defaults to `auto` and shows one giant zoomed tile. The same shorthand-then-override pattern is used for the border and sashing layers.

A second contributor: `tilePx` is derived from a measured `containerPx` that only updates via ResizeObserver, so on first paint of a newly-assigned cell the tile can fall back to a stale or oversized value.

## Fix
1. In `src/components/PatchworkPreview.tsx`, change `fabricTileStyle` to always return a fully-specified style object (color + image when present + explicit `backgroundRepeat`, `backgroundSize`, `backgroundPosition`) and NEVER combine it with a separate `background:` shorthand at the call site.
2. Update all three call sites (cells, border layer, sashing layer) to use only `...fabricTileStyle(...)` — drop the preceding `background: FABRIC_COLORS[...]` line so the shorthand can't reset image properties.
3. Guarantee tiling for solid colors too by setting `backgroundColor` (not `background`) inside the helper, so React diffing is stable across re-renders.
4. Guard `tilePx` so it always has a sensible minimum even before the ResizeObserver fires, and recompute it from the actual block-grid math already in the component (no behavior change for sizing — just no stale-zoom on first paint).

## Out of scope
- No changes to yardage math, pattern defaults, or `FabricPatternDefs` (SVG diagrams already render correctly).
- No visual redesign — same tile scale, same tap-to-cycle behavior.

## Verification
- Open Simple Squares, upload photos for A, B, and C, then tap squares repeatedly to cycle through every fabric multiple times. Each fabric must render at the same scale every cycle, with the motif visibly repeating — no giant zoomed patches.
- Repeat on a narrow mobile viewport (matches the screenshot).
- Confirm border and sashing photo rendering is unchanged for non-cycled states.