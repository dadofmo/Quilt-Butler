# Design Your Own Block

A grid-based block editor that plugs into the existing Size → Fabrics → Results flow. Users lay out a block from four unit types, then get the same yardage, cutting list, and sewing instructions every built-in pattern produces.

## What the user gets

**Entry point.** A distinctive "Design Your Own Block" tile pinned to the front of the pattern picker grid, styled apart from the 50 named patterns so it reads as a tool rather than a pattern.

**The editor.** A canvas showing the block as a grid, with:

- A grid-size selector: 2×2 through 8×8.
- A unit palette: Solid square, Half-square triangle, Quarter-square triangle (hourglass), Flying geese.
- Rotation: tap a placed unit again to rotate it 90° (HST has 4 orientations, QST 2, geese 4).
- Flying geese span two cells — placing one occupies a 1×2 or 2×1 footprint and the editor blocks placement where it won't fit.
- A fabric strip below the canvas for choosing which fabric paints the next tap. Each unit type has named regions (HST = two triangles, QST = four, geese = goose + two sky corners) that get filled independently.
- Undo, clear, and a live count of distinct fabrics used.

**Small-piece warning.** Once the user reaches Step 2 and sets a block size, if the resulting finished unit drops below a sane cutting threshold the app shows a non-blocking warning naming the actual unit size. No hard block — an 8×8 grid on a 16" block is perfectly reasonable, an 8×8 on a 6" block is not.

**Everything downstream is unchanged.** Size, sashing, border, fabric assignment, full-quilt preview, "see block full screen", cutting list, cost estimator, and print view all work exactly as they do for named patterns.

## Scope boundaries for v1

- Unit types are exactly the four above. No square-in-a-square, no curves, no uneven grid tracks (like the 1-1-2-1-1 tracks Antique Tile uses).
- One saved design at a time, persisted to the browser. No named library, no accounts.
- No alternate-blocks toggle and no rotation layouts for custom blocks initially — those depend on knowing the block's symmetry, which is safest to add after the core is proven.
- Sewing instructions are generated per unit type (HST no-waste pairs, QST trim, no-waste geese, row assembly) rather than hand-written prose. They'll be accurate but less personal than the named patterns' notes.

## Technical notes

**Fabric palette.** `FabricKey` in `src/lib/planner-store.ts` is currently A–L (12). Extend to A–Z (26) with matching entries in `ALL_FABRIC_KEYS`, `FABRIC_COLORS`, `FABRIC_LABELS`, the `--fabric-*` CSS tokens in the global stylesheet, and `FabricPatternDefs`. This is mechanical but touches several files; the audit script and existing tests guard the change.

**Block definition.** New `src/lib/custom-block.ts` holding the design type — grid size plus a cell map where each cell is `{ kind: "square" | "hst" | "qst" | "geese", rotation, fabrics }`, with geese recorded once against their anchor cell. Includes validation (no overlapping geese, no orphaned cells) and a `unitCounts()` helper that rolls the grid up into per-fabric piece tallies.

**Planner state.** Add `customBlock: CustomBlockDesign | null` to `PlannerState` and a `"custom-block"` member of `PatternId`. The existing localStorage merge already tolerates new fields.

**Pattern registration.** Register a synthetic `PatternDef` for `custom-block` in `src/lib/patterns.ts` with `hasMath: true`. Its `sections` are derived at runtime from the design's fabric regions rather than being a static list — `FabricsPage` reads sections from the pattern, so this needs a small accessor that returns the dynamic sections when the pattern is the custom one.

**Yardage.** A new branch in `calculateYardage` in `src/lib/yardage.ts` that walks the cell map and routes every unit through `addSquares` per the existing rules — solid squares at `unit + 0.5`, HST starting squares at `unit + HST_EXTRA`, QST squares at `unit + 1.25`, geese via the existing no-waste method (one large goose square plus four sky squares per four geese). Squares are pooled by fabric and cut size so the cutting list stays tidy. Per the project rule, all math goes through `addSquares`/`addRails` — nothing is pushed to `req.pieces` directly.

**Rendering.** A `CustomBlock` renderer component drawing the grid with the shared `fabric-*` fill tokens via `fillFor`, wired into `QuiltLayoutPreview` so the one-block preview, full-quilt tiling, both full-screen dialogs, and `PatternThumb` all pick it up. No white seam strokes; adjacent units butt flush.

**Verification.** Extend `scripts/audit-yardage.ts` to cover a set of representative custom designs, including a Pinwheel-equivalent 2×2 that must produce an identical cutting list to the built-in Pinwheel, an Ohio Star equivalent 3×3 (QST parity), a geese-heavy design, and a 8×8 scrappy design using 15+ fabrics. Run `bun audit:math` and the full test suite, and drive the editor end to end with Playwright.

## Build order

1. Extend the fabric palette to A–Z and confirm existing patterns and tests are unaffected.
2. Add the custom block type, validation, and planner state.
3. Build the block renderer and wire it into all preview surfaces.
4. Build the editor UI and the picker tile.
5. Add the yardage branch and generated sewing instructions.
6. Extend the audit script with parity cases; run audit, tests, and a Playwright pass.
