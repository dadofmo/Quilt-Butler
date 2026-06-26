# Pilot: Rail Fence with Jelly Roll Strips

Add a "precut" path for **one pattern** (Rail Fence) and **one precut type** (jelly roll, 2.5" × ~42" strips) so quilters can plan a quilt from a jelly roll instead of yardage — using every existing screen, layout preview, and shopping-list flow with minimal new code.

Rail Fence is the right pilot because each block is literally 3 stacked 2.5" strips sub-cut to length — a natural jelly-roll fit with no feasibility math required.

## User flow

1. **Step 1 (pattern picker):** unchanged. User picks Rail Fence.
2. **Step 2 (size):** new "What fabric are you using?" toggle at the top:
   - **Yardage from a bolt** (current behavior, default)
   - **Jelly roll** (new — Rail Fence only for now; other patterns show this option grayed out with a "coming soon" note)

   When Jelly Roll is selected:
   - Hide the "Fabric width" input.
   - Replace it with **"How many strips in your jelly roll?"** (default 40).
   - Block size is **locked to 6"** (3 strips × 2" finished) with a short explainer. Border/sashing inputs stay as-is.
3. **Step 3 (fabrics):** unchanged. User still assigns Fabric A/B/C to the three rails.
4. **Step 4 (results):** cutting diagram and shopping list switch into "precut mode":
   - Shopping list shows **"X jelly roll strips of Fabric A"** instead of yards. Border/sashing/backing/batting/binding stay in yardage.
   - Cutting diagram renders a **stack of 2.5"-wide strips** (one row per strip) with sub-cut marks, instead of WOF strips cut from a bolt.
   - A feasibility banner appears if the design needs more strips per fabric than the jelly roll provides, with a one-line fix suggestion ("reduce quilt size" / "buy a second jelly roll").

## Technical changes (kept small and reversible)

- **`planner-store.ts`:** add `fabricSource: "yardage" | "jelly-roll"` (default `"yardage"`) and `jellyRollStripCount: number` (default 40). Existing fields untouched.
- **`SizePage.tsx`:** new source toggle; conditional inputs; lock block size to 6" in jelly-roll mode.
- **`yardage.ts`:** add a new `computePrecutPlan()` function that runs alongside the existing yardage function. It reuses `addRails` / `piecesPerStrip` semantics but treats each precut strip as a fixed 2.5" × 42" usable rectangle. **The existing yardage code path is not modified** — yardage mode users see zero behavior change.
- **`ResultsPage.tsx`:** branch on `planner.fabricSource`. Yardage mode = today's renderer. Jelly-roll mode = new strip-stack cutting diagram + precut-aware shopping-list lines. Borders/backing/batting/binding still flow through the existing yardage calculator.
- **`scripts/audit-yardage.ts`:** add 3 jelly-roll Rail Fence cases (small/medium/large quilt) with expected strip counts.

## Safety guarantees

- Yardage mode is the default and its code path is untouched — every existing user, license flow, and the other 18 patterns behave identically.
- The toggle only exposes "Jelly roll" as selectable when `pattern === "rail-fence"`; other patterns show it disabled with "Coming soon."
- New audit cases run via `bun audit:math` before shipping.
- License/Freemius flow is not touched at all.

## What is explicitly NOT in this pilot

- Fat quarters and charm packs (separate future pilots).
- Jelly-roll support for the other 18 patterns (each needs its own feasibility rules — defer until this pilot proves out).
- Mixing precut + yardage in the same quilt beyond border/backing/batting/binding (those stay yardage by necessity).

## Deliverable

A working Rail Fence + jelly roll end-to-end flow that you can demo, plus the architecture (planner field + precut calc function + results branch) that the next precut/pattern combo can plug into without touching yardage mode.
