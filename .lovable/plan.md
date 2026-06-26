## No additional changes needed

The cutting-diagram label fix from the last turn lives in one shared renderer (`src/pages/ResultsPage.tsx`, the `rows.map(...)` SVG block around lines 857–1024). That renderer:

- Runs once per strip for **every** fabric requirement.
- Has no pattern-specific branching — it only reads generic per-strip fields (`subCutCount`, `subCutWidth`, `hIn`, `isBorder`, `groupLabel`) that all 19 patterns populate the same way through `addSquares` / `addRails` in `src/lib/yardage.ts`.
- There is no second copy of this code anywhere else in the project.

So the new behavior (always render the cut label, overflow into the leftover area when needed, suppress the "leftover X"" caption to avoid collision, shrink font down to 7px as a last resort) automatically applies to all 19 patterns: Nine Patch, HST, Simple Squares, Rail Fence, Log Cabin, Ohio Star, Flying Geese, Disappearing Nine Patch, Squares on Point, Plus Block, Pinwheel, Churn Dash, Bear Paw, Irish Chain, Sawtooth Star, Friendship Star, Snowball Block, Four Patch, Streak of Lightning, and Bow Tie.

### Recommendation

No code changes required. If you'd like extra confidence, I can (in build mode) add a small audit step that walks each pattern's generated `req.pieces` and asserts every strip's short label fits within `usedW + leftoverW` at the chosen font size — but given the renderer is now guaranteed to display a legible label for any geometry, this is optional.
