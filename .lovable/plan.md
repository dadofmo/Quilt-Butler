## Problem
The jelly-roll note under **Fabric summary** currently says:

> "Your block fabrics come from your jelly roll and are listed in the Jelly roll plan below. The yardage above covers only your border, sashing, backing, batting, and binding."

That is confusing because:
- The **Fabric summary** table usually only shows border and sashing fabrics (often 2 fabrics).
- Backing, batting, and binding are not shown in the table above the note; they already appear in the separate **Other materials you'll need** section further down the page.

## Plan
Update the note in `src/pages/ResultsPage.tsx` so it is factually accurate and matches the actual page layout.

### New wording
When the user still has yardage fabrics to buy (e.g. border and/or sashing):

> Your block fabrics come from your jelly roll and are listed in the **Jelly Roll Plan** below. The yardage above covers only your border and sashing fabric(s). Backing, batting, and binding are listed under **Other materials you'll need**.

If there are no yardage fabrics at all (no border and no sashing):

> Your block fabrics come from your jelly roll and are listed in the **Jelly Roll Plan** below. There are no yardage fabrics to buy for this quilt top; backing, batting, and binding are listed under **Other materials you'll need**.

### Implementation details
- Replace the static `{precut && ...}` note with a small conditional block that picks the message based on `result.fabrics.length > 0`.
- Keep the same paragraph styling (`text-muted-foreground mt-3 text-sm leading-relaxed`).
- No math changes; this is a copy-only fix.

### Verification
- Run `bun audit:math` after the edit (project rule after any change near yardage/results).
- Spot-check the preview on a Rail Fence jelly-roll plan with a border and sashing to confirm the note reads correctly and no longer mentions backing/batting/binding in the Fabric summary.

## Files to change
- `src/pages/ResultsPage.tsx`