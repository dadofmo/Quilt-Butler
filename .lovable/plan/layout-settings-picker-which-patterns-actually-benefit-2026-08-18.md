# Layout settings picker — which patterns actually benefit

Your instinct is right: several blocks already earn their secondary design from a fixed, deliberate tiling. Those must not be given a picker that lets a user break the look by accident. So this is a curated, per-pattern opt-in — not a global feature.

## Three groups

**Group 1 — Leave alone (tiling is part of the design).**
These already hardcode a rotation or checkerboard in the full-quilt preview, and the intended aesthetic depends on it. No settings picker; the existing behavior stays the default and the only option.

- Rail Fence (every-other-block 90 deg = the woven look)
- Jacob's Ladder (fixed rotation makes the on-point diamond chain)
- Broken Dishes (fixed rotation makes the diamond/burst secondary)
- Corner Beam, Squares on Point, Plus Block, Pinwheel, Shoofly (already have the reverse-alternate toggle — a second layout control on top would be confusing)
- Irish Chain, Checkerboard, Fancy Stripe, Streak of Lightning (the "block" is really a tiling unit; rotating it destroys the chain/stripe)
- Four X's, Tulip Lady Fingers, Four Queens (directional multi-unit blocks whose corners are designed to meet a specific way)

**Group 2 — Best candidates for a settings picker.**
Rotationally asymmetric blocks with a strong diagonal or directional element, currently tiled straight with no secondary design. Rotation genuinely creates a new quilt here.

- Log Cabin (the classic: straight set, barn raising, straight furrows, sunshine and shadow — this alone justifies the feature)
- Economy Block
- Cabin in the Cotton
- Alaska Homestead
- Half Square Triangles (HST) — the deepest payoff after Log Cabin: zigzag, chevron, broken dishes, streak of lightning from one block
- Flying Geese (straight column vs. alternating direction vs. herringbone)
- Bow Tie
- Maple Star
- Love in a Mist
- Antique Tile
- Idaho Beauty
- Oh Susannah

**Group 3 — On-point set only (no rotation).**
4-way symmetric star/medallion blocks. Rotating them does nothing visible, but setting them on point with setting triangles is a real, distinct quilt. Worth offering later as a separate second phase since it changes yardage (setting and corner triangles) and the cutting list.

- Sawtooth Star, Ohio Star, Friendship Star, Twin Star, Star & Cross, Summer Winds, Weathervane, Card Trick, Churn Dash, Bear Paw, Wishing Ring, Clown's Choice, Four X Star, The Rolling Stone, Swing in the Center, Tippecanoe and Tyler Too, California Quilt, Nine Patch, Four Patch, Simple Squares, Autumn Tints, Disappearing Nine Patch

## Recommended scope for phase 1

Add a `layouts` field to the pattern definition listing which settings that pattern supports — straight set (always), alternating rotation, barn raising, herringbone/zigzag. Only Group 2 patterns get more than straight set. Group 1 patterns declare nothing and the picker never appears for them, so no existing look can be broken.

The picker sits under the full-quilt preview on the Assign Fabrics step, in the same slot the alternate-blocks toggle already occupies, as 3-4 small tiled thumbnails you click. Straight set stays the default everywhere.

Rotation-only settings do not change any cut piece — same blocks, same yardage — so phase 1 is preview plus a sewing note about block orientation, with zero yardage risk. On-point (Group 3) is deferred because it does change the cutting list.

## Technical notes

- `src/lib/patterns.ts`: add optional `layouts?: LayoutSetting[]` per pattern; `"straight" | "alternating" | "barn-raising" | "herringbone"`.
- `src/lib/planner-store.ts`: persist the selected layout alongside `alternateBlocks`.
- `src/components/QuiltLayoutPreview.tsx`: replace the ad-hoc `railRotate`/`jlRotate`/`bdRotate` flags with one `rotationFor(pattern, layout, row, col)` helper returning 0/90/180/270; hardcoded Group 1 rotations become the return value of that helper for their default setting, so their rendering is unchanged.
- `src/lib/yardage.ts`: add an assembly note describing the block orientation per row when a non-straight layout is chosen. No piece-count changes in phase 1.
- Verify with `bun audit:math`, the renderer snapshot suite (snapshots must be unchanged for every Group 1 pattern), and `bun run verify`.
