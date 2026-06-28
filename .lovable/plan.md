## Goal
Let users assign a separate fabric to the Sawtooth Star **center square**, independent of the star-point fabric — matching how many quilters actually make this block (reference photo: green points, pink HST backgrounds against green corners, teal center).

## Changes

### 1. `src/lib/patterns.ts` — Sawtooth Star sections
Add a new `center` section and tighten the `star` hint so each fabric maps to one visual area.

```
sections: [
  { id: "star",    label: "Star points",   defaultFabric: "A",
    hint: "The 8 star-point triangles in the HST units." },
  { id: "center",  label: "Center square", defaultFabric: "C",
    hint: "The large square in the middle of the star — can match the star points or be a different accent fabric." },
  { id: "bg",      label: "Background",    defaultFabric: "B",
    hint: "The 4 corner squares and the background triangles in each HST unit." },
  { id: "sashing", label: "Sashing between blocks", defaultFabric: "D", hint: "…" },
  borderSection,
]
```

Update the `intro` to mention the center square is its own fabric choice (can match star points for a traditional 2-color look, or contrast for a pop of color).

### 2. `src/lib/yardage.ts` — sawtooth-star branch (~lines 1157–1198)
Route the 1 center square per block to a new fabric:

```ts
const starFab   = (s.assignments["star"]   ?? "A") as FabricKey;
const centerFab = (s.assignments["center"] ?? starFab) as FabricKey; // falls back to star
const bgFab     = (s.assignments["bg"]     ?? "B") as FabricKey;

addSquares(reqs[centerFab], "Star center squares", centerCount, centerCut, s.fabricWidth);
addSquares(reqs[starFab],   "HST starting squares (star points)", hstStarCount, hstCut, s.fabricWidth);
addSquares(reqs[bgFab],     "Background corner squares", cornerCount, cornerCut, s.fabricWidth);
addSquares(reqs[bgFab],     "HST starting squares (background)", hstBgCount, hstCut, s.fabricWidth);
```

Update the descriptive notes (lines 1187/1190) to name the center fabric separately. When `centerFab === starFab`, keep the legacy wording so the existing "traditional" 2-color quilter sees no change.

### 3. Renderers — use the center fabric for the inner 2u×2u square
- `src/components/PatternDiagram.tsx` (~line 484): read `center = get("center", star)` and paint the center 2×2 block with `center` instead of `star`.
- `src/components/QuiltLayoutPreview.tsx` (~line 596): same change.
- `src/components/PatternThumb.tsx` (~line 313): same change so Step 1 thumbnail can show the 3-fabric look (default A points, B bg, C center).

No changes to HST geometry — only the center fill.

### 4. `scripts/audit-yardage.ts`
Add (or update) a Sawtooth Star case that assigns a distinct `center` fabric and asserts:
- center fabric receives exactly `blockCount` squares at `(2u + 0.5)"`.
- star fabric no longer carries the center square.
- bg fabric counts unchanged.
Also keep an existing case where center is left unset → falls back to star fabric, identical yardage to today (backward compatibility).

### 5. Backward compatibility
Existing saved planner states have no `assignments.center`. The `?? starFab` fallback means:
- Yardage totals stay identical to today's output.
- Diagrams render identical (center painted with star color).
Users who want the new look just pick a fabric for "Center square" on the Assign Fabrics step.

## Verification
- `bun audit:math` — must pass all 20 patterns, including the new and legacy Sawtooth Star cases.
- Manual smoke: open Sawtooth Star → Step 3 shows the new "Center square" row; assigning Fabric C updates Step 2 diagram, Step 3 preview, and Results page diagram + cutting list (center square now under Fabric C, HST starting squares still under Fabric A).
- Confirm license/paywall flow untouched (no changes to any of those files).

## Files to change
- `src/lib/patterns.ts`
- `src/lib/yardage.ts`
- `src/components/PatternDiagram.tsx`
- `src/components/QuiltLayoutPreview.tsx`
- `src/components/PatternThumb.tsx`
- `scripts/audit-yardage.ts`
