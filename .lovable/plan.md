# Add Pinwheel pattern (sashing deferred)

A new fully-functional pattern that behaves identically to Half Square Triangles in every screen, with a 2×2 pinwheel block diagram and HST-based math.

## Decisions locked in

- **Sashing:** fully deferred — not built in this pass. To be layered into all patterns later.
- **Complexity rating:** skipped — keeps tile UI consistent with the existing 10 patterns.
- **Fabric defaults:** blades = A (blue), background = B (yellow), border = C — matches the prompt's blue/yellow visual and the pattern of HST/Nine Patch.

## Files to change

### 1. `src/lib/planner-store.ts`
Add `"pinwheel"` to the `PatternId` union.

### 2. `src/lib/patterns.ts`
Add a new `PATTERNS[]` entry:

```ts
{
  id: "pinwheel",
  name: "Pinwheel",
  hasMath: true,
  intro: "Each Pinwheel block is made from 4 Half Square Triangle units arranged in a 2×2 grid so the blade triangles all spin clockwise around the center, creating the iconic pinwheel illusion. Pick a bold fabric for the blades and a contrasting fabric for the background.",
  sections: [
    { id: "blades", label: "Pinwheel blades", defaultFabric: "A",
      hint: "The 4 spinning triangles per block — usually a bold print or solid so the pinwheel reads clearly." },
    { id: "bg", label: "Background", defaultFabric: "B",
      hint: "The other half of each HST unit — pick something that contrasts strongly with your blades." },
    borderSection, // shared default = "C"
  ],
}
```

### 3. `src/components/PatternThumb.tsx`
- Add `pinwheel` entry to `PATTERN_ALT`: `"Pinwheel quilt block diagram showing four half square triangle units arranged with blades spinning clockwise"`
- Add a `case "pinwheel"` SVG: 2×2 grid where each quadrant is an HST unit, with the dark (blade) triangles oriented to spin clockwise around the center. Geometry:

```text
+------+------+      Quadrant orientations (dark/A triangle position):
|     /|\    |        TL: top-right     (apex toward center, spinning →)
|    / | \   |        TR: bottom-right  (apex toward center, spinning ↓)
|   /  |  \  |        BR: bottom-left   (apex toward center, spinning ←)
+------+------+        BL: top-left     (apex toward center, spinning ↑)
|   \  |  /  |
|    \ | /   |
|     \|/    |
+------+------+
```

Uses `C.a` (blue) for blades, `C.b` (yellow) for background — same color tokens HST uses, so the visual blue/yellow story matches the prompt automatically.

### 4. `src/components/PatternDiagram.tsx`
Add a `case "pinwheel"` to `renderInner` that draws the same 4-unit clockwise-spinning layout in the 200×200 viewBox, reading fabrics via `get("blades", "A")` and `get("bg", "B")`. Live-updates when the user picks fabrics, supports photo fills via the existing `FabricPatternDefs` (which is already rendered by the parent).

### 5. `src/lib/yardage.ts`
Add a `pinwheel` branch in `calculateYardage`. Math is identical to HST (4 HSTs per block instead of 1), so it routes through `addSquares` per the core memory rule.

```ts
} else if (s.pattern === "pinwheel") {
  const cut = (s.blockSize / 2) + HST_EXTRA;       // HST cut size based on HALF block
  const hstUnits = blockCount * 4;                  // 4 HST units per Pinwheel block
  const squaresEach = Math.ceil(hstUnits / 2);      // each pair of squares yields 2 HSTs
  const blades = (s.assignments["blades"] ?? "A") as FabricKey;
  const bg     = (s.assignments["bg"]     ?? "B") as FabricKey;
  addSquares(reqs[blades], "Blade squares",      squaresEach, cut, s.fabricWidth);
  addSquares(reqs[bg],     "Background squares", squaresEach, cut, s.fabricWidth);
  notes.push(
    `Each Pinwheel block = 4 Half Square Triangle units arranged 2×2 so the blades spin clockwise. Across ${blockCount} blocks: ${hstUnits} HST units total.`
  );
  notes.push(
    `Cut ${squaresEach} squares of Fabric ${blades} (blades) and ${squaresEach} squares of Fabric ${bg} (background), all at ${cut}" × ${cut}" (finished ${(s.blockSize/2).toFixed(2)}" half-block + 7/8" extra for the diagonal seam).`
  );
  // Same 3-step HST construction notes as the hst branch (pair RST, draw
  // diagonal, sew 1/4" each side, cut on the line, press, trim to (blockSize/2)").
  notes.push( /* identical wording to HST steps, swapping "Fabric tri1/tri2" → "Fabric blades/bg" */ );
  notes.push(
    `Trim each finished HST unit to ${(s.blockSize/2 + SEAM).toFixed(2)}" square (so it finishes at ${(s.blockSize/2).toFixed(2)}").`
  );
  notes.push(
    `Pinwheel assembly: lay out 4 HST units in a 2×2 grid. Rotate each unit so all 4 blade triangles point toward the center and "spin" the same direction (clockwise). Sew the top pair together, sew the bottom pair together, then join the two rows. Press seams open at the center to reduce bulk where all 4 points meet.`
  );
}
```

The cutting diagram on the Results page reuses the existing strip-diagram component — no changes needed there because we go through `addSquares`.

### 6. `src/pages/FabricsPage.tsx` — sashing card NOT added
Per your decision, no sashing card, no sashing toggle, no sashing math. The existing FabricsPage iterates `pattern.sections` and renders one card per section, so adding the two Pinwheel sections to `patterns.ts` is enough to get the "Pinwheel blades" + "Background" + "Border" cards automatically. **No FabricsPage code changes needed.**

> Note on fabric swatch limiting: the existing FabricsPage shows all available fabric swatches per card (matches every other pattern). The prompt asked to limit blades/background to A+B and border to A/B/C. I'm flagging that this would diverge from every other pattern's UX, but if you want it I can add a per-section `allowedFabrics?: FabricKey[]` to the schema and apply it only to Pinwheel. Default plan: **match existing behavior, show all swatches.** Confirm in your reply if you want the limit instead.

### 7. Results page — Pinwheel assembly tip
The existing `ResultsPage.tsx` already renders `result.notes` under the "Cutting & sewing steps" heading. The pinwheel-specific assembly tip is included in `notes` (last push above), so it appears in the same place as every other pattern's tips — no special-case UI needed.

### 8. SEO/meta — already covered
Home-page meta says "10+ patterns" so no copy change needed. The new tile inherits the same accessible markup as every other tile.

## Verification

After the edits, run `bun audit:math` (per the core memory rule for any change to `yardage.ts` or `patterns.ts`) to confirm the Pinwheel math passes the same invariants as the other 10 patterns.

## What's explicitly NOT in this build

- Sashing card, sashing math, sashing diagram — deferred to the future "sashing for all patterns" pass.
- Complexity / "3 bolts" rating UI.
- Pattern-specific page heading ("Assign fabrics — Pinwheel") — keeping the generic heading used by all other patterns.
- Per-card fabric swatch limiting — keeping the existing "show all fabrics" UX (flagged above; tell me if you want it changed).
