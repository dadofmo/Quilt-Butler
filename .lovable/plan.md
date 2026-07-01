# Fix: Shoofly sashing not rendered + border color wrong

## What's broken

Shoofly's sashing width (3") is honored by the yardage math (Fabric C shows up as "Sashing strips between blocks — 2 yd" in the shopping list) but is **ignored by the two preview surfaces**, and that also cascades into the wrong border color:

1. **`src/pages/FabricsPage.tsx`** has two hardcoded "is this pattern sashed?" lists (lines 55–65 for `hasSashing`, lines 218–237 for the layout preview's `isSashed`). Neither includes `shoofly`.
2. **`src/pages/ResultsPage.tsx`** line 71 has the same hardcoded list for the Results-page "Your full quilt" preview. Also missing `shoofly`.

Effect on the user's screenshot:
- `hasSashing = false` on the Fabrics step → no sashing gaps drawn → and `getEffectiveBorderDefault(pattern, false, false)` picks the first unused letter *ignoring sashing*, which is **C (green)** instead of **D**. That's the green border in the "Your full quilt" image.
- The shopping list still lists sashing = C (green, 2 yd) and border = D (pink, 1.25 yd) because `computeYardageRequirements` reads the sashing section directly from `patterns.ts`.

## Fix (surgical)

Replace the hardcoded lists with a single derivation from the pattern definition so no future pattern can regress the same way:

- Add a small helper `patternHasSashingSection(pattern)` in `src/lib/patterns.ts` = `pattern.sections.some(s => s.id === "sashing")`.
- **`src/pages/FabricsPage.tsx`** — replace both hardcoded booleans with `patternHasSashingSection(pattern)`. Same for the layout-preview block. Nothing else changes.
- **`src/pages/ResultsPage.tsx`** — replace the same hardcoded list on line 71 with `patternHasSashingSection(pattern)`.

No changes to `patterns.ts` shoofly definition (already has the sashing section), no changes to `yardage.ts` (already correct), no changes to `QuiltLayoutPreview.tsx` (already correct — it just receives `sashingWidth={0}` from the pages).

## Guardrail so this doesn't happen again

Extend `src/lib/__tests__/patterns-coverage.test.ts` with a new test that, for every pattern that declares a sashing section:

1. Sets `sashingWidth = 3` in a fake `PlannerState`.
2. Runs `computeYardageRequirements` and asserts the sashing fabric appears with `count > 0`.
3. Renders `<QuiltLayoutPreview>` with the same props FabricsPage/ResultsPage would pass, and asserts the SVG contains a `<rect>` filled with the sashing fabric (i.e. sashing gaps are drawn).

This catches the exact regression: pattern declares sashing → math counts it → preview must render it. Any future pattern that adds a sashing section but forgets to wire it into a page will fail this test.

Also add a second assertion in the same loop: `getEffectiveBorderDefault(pattern, /*hasSashing=*/true, /*hasCornerstones=*/false)` must not collide with the sashing fabric — this catches the "border defaults to green because we forgot sashing exists" side effect.

## Verification

- `bun run verify` (vitest + audit + build) — new test should pass after the FabricsPage/ResultsPage fix and fail if either page's shoofly wiring is reverted.
- Manual smoke: pick Shoofly → Step 2 sashing 3" → Step 3 shows sashing picker + sashing gaps in preview + border defaults to D (pink) → Results shows sashing gaps in "Your full quilt".

## Out of scope

- Refactoring the other 18 patterns' hardcoded checks to use the helper too. The plan only removes the *sashing* list (the one that caused this bug) and leaves the isolated pattern-specific booleans in place to keep the diff small. They can migrate to the helper later.
