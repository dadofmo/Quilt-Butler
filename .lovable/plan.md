# Audit: construction-valid cut merges for every built-in pattern (no code changes)

## Goal
Write a checked, pattern-by-pattern checklist covering all 54 built-in patterns. For each one, it says whether real quilt construction allows merging same-fabric patches, and exactly how. No cutting math or pattern code changes in this pass. The only output is a written report you can review before we build anything.

## Why this is a plan and not the finished list yet
Getting the list right means reading each pattern's cutting code (about 4,000 lines across 54 separate sections) side by side with its block drawing. That's the only way to see how each block is really sewn together. A quick skim is exactly how the Star & Cross mistake happened, so I won't hand you a list that wasn't checked this carefully.

## The standard every entry must meet
- Only merge when a real quilter would: the merged piece must be a plain rectangle, and it must sit inside a row, column, or unit that gets sewn with straight seams.
- Watch for L-shapes and corners where the Star & Cross problem can happen. Name which pair can merge (the horizontal pair OR the vertical pair) and why merging both would create a Y-seam.
- Respect the order the block is sewn in. If two same-fabric patches touch but end up in different sub-units (for example, one half of an HST pair and a square next to it), they are NOT a merge.
- Say so plainly when no merge exists. Never force one.
- Mark anything I can't pin down with confidence as "Needs verification".

## Format for each pattern
```text
Pattern: <name> (<id>)
1. How it's cut today: pieces, sizes, and the way it's calculated (squares, strips, HSTs two at a time, flying geese, etc.)
2. Same-fabric, same-size patches touching? Yes / No
3. Real merge: which units, which seams disappear, and the fabric saved
   (0.5" per removed seam, then re-checked against how pieces fit across the fabric width)
4. Verdict: Merge recommended / No real merge / Already handled / Needs verification
```

## Already handled (status confirmed only, not redone)
- Rail Fence, Log Cabin, Cabin in the Cotton (Courthouse Steps-style strips sewn in sequence)
- Autumn Tints (large squares for its 2×2 corners)
- Plus Block (one center strip plus six squares)
- Star & Cross: shown with the corrected L-shape rule as the reference example

## How the audit will be done
1. Go through all 54 patterns in the order they appear in the app. For each, read its cutting section and its block drawing, and write down the grid and each fabric's position cell by cell.
2. Work out how the block is actually sewn (by row, by column, as a nine-patch, in quadrants, or from sub-units) before looking for any merges.
3. For every candidate merge, calculate the fabric saved by hand, including whether it changes how many pieces fit across the width of fabric. A merge that saves seams but costs more fabric gets flagged.
4. Cross-check the tricky ones a second time: anything with L-shaped background areas, on-point centers, or pieces that could belong to two different units.
5. Summarize at the top: how many patterns get a merge recommendation, how many have no real merge, how many are already handled, and how many need verification.

## What you'll get
- A single written checklist covering all 54 patterns, saved with the project's other documents, for you to review.
- A short list of recommended merges in priority order (biggest fabric or seam savings first), so you can pick which ones to build.
- No changes to the cutting math, instructions, or drawings until you approve specific items.

## Technical detail
- Sources: every `s.pattern === "<id>"` section of `src/lib/yardage.ts`, the block renderers in `src/components/PatternDiagram.tsx`, and the section definitions in `src/lib/patterns.ts`.
- Report path: `docs/CUTTING-MERGE-AUDIT.md`.
- Merged pieces in any later build would go through `optimizeGrid` / `addOptimizedGridPieces` with the existing fabric-safety fallback. That's out of scope here.
