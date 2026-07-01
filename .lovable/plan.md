# Fix Jacob's Ladder: remove the toggle, always rotate

You're right — Jacob's Ladder should always render with every other block rotated 90° so the diagonal chains carry through the whole quilt. No toggle needed.

## Changes

1. **`src/lib/patterns.ts`** — Set `supportsAlternate: false` for `jacobs-ladder` so the "Alternate blocks (optional)" section no longer renders on Step 2 for this pattern.

2. **`src/components/QuiltLayoutPreview.tsx`** — For `jacobs-ladder`, always apply the 90° checkerboard rotation regardless of the `alternateBlocks` flag (previously it was gated on the toggle).

3. **`src/pages/PatternPickerPage.tsx`** — Remove the special-case that force-sets `alternateBlocks: true` when Jacob's Ladder is picked (no longer needed; rotation is intrinsic to the pattern now).

4. **`src/pages/SizePage.tsx`** — Remove the Jacob's Ladder–specific label variant for the toggle (dead code once `supportsAlternate` is false).

5. **`scripts/audit-yardage.ts`** — Drop the "alternate on" Jacob's Ladder case since there's no toggle; keep baseline + sashing cases. Piece counts are unchanged either way.

6. **Snapshots** — Refresh the Jacob's Ladder renderer snapshot if the intrinsic-rotation change alters output for the preview test (Thumb/Diagram unaffected; only QuiltLayoutPreview).

## Verification

`bun run verify` — all tests + math audit + build must pass. Manual: pick Jacob's Ladder → Step 2 shows no "Alternate blocks" section → Step 3 preview always shows the diamond secondary pattern.
