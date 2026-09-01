# Remove Flying Geese from the custom block editor

Drop the Flying Geese option from the "Your unit" palette in Design Your Own Block. The palette becomes three units: Solid square, Half-square triangle, Quarter-square triangle.

## Changes

**`src/lib/custom-block.ts`**
- Remove `"geese"` from the `UnitKind` type and from `REGION_COUNT`, `UNIT_LABEL`, `REGION_LABELS`, `ROTATION_STEPS`.
- Delete geese handling from `cellsCovered`, `geeseFootprint`, `unitPolys` (the 2×1 geometry), and `unitTally` (the `geese` tally record).
- Keep the `UnitTally.geese` field in the type only if `src/lib/yardage.ts` reads it — otherwise remove it there too, in the same pass, so nothing references a dead key.

**`src/pages/DesignBlockPage.tsx`**
- `UNIT_KINDS` drops `"geese"` — palette shows 3 units.
- Remove the geese-specific preview helpers (`buildGeesePreview`, the 2×2 `previewDesign` special case) — all remaining units render in a 1×1 preview.
- The `paint` / occupancy logic still works unchanged since it iterates `cellsCovered` generically (now always a single cell).

**Existing saved designs**
- Users who already placed geese units in a saved design would have orphaned cells. Handle by treating a `geese` cell as an HST on load (graceful fallback in the type guard), or simply let `validateDesign` flag them — decide during implementation; simplest safe route is a small migration in the reader that converts `geese` cells to HSTs using [goose, sky] fabrics.

## Verification
- `bun audit:math` passes.
- Build passes; editor grid, previews, full-quilt preview, and cutting list all render with only the three remaining unit types.
