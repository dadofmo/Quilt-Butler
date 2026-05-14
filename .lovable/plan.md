## Goal

When the user picks Irish Chain and their inputs produce an even block count in either dimension (e.g. 4 × 6), show an inline warning that explains the symmetry issue **and offers 2–3 concrete one-click fixes** — including options that adjust the border to stay closer to the desired finished size.

## Answers to your questions

**Yes, both bump-down and bump-up.** For a 4 × 6 starting point, the warning would offer the closest odd-on-each-side neighbors: **3 × 5** (smaller) and **5 × 7** (larger), so the user can pick whichever is closer to what they want.

**Yes, border-adjusted options too.** A bump from 4 → 5 across changes finished width by one block (e.g. +10" for a 10" block). The user's border is the natural lever to claw that back. So alongside each "bump blocks" option, we compute the border width that lands the new layout closest to their original desired finished size, and surface that as a combined "5 × 7 with a 2.5" border (80" × 80") — closest to your 80" × 80" goal" suggestion.

## What the warning looks like

Placement: directly below the existing "Finished quilt size" preview card on the Size step, only when `pattern === "irish-chain"` and `(blocksAcross % 2 === 0 || blocksDown % 2 === 0)`.

```text
⚠ Irish Chain looks most balanced when both block counts are odd.
  Your current 4 × 6 layout puts chain blocks in only two corners.

  Closest symmetric layouts:
  ┌──────────────────────────────────────────────────────────────┐
  │ ○ 3 × 5 blocks · 30" × 50"  ·  -1500 sq in vs your goal      │
  │ ● 5 × 5 blocks · 50" × 50"  ·  closest to 60" × 60"  [Apply] │
  │ ○ 5 × 7 blocks · 50" × 70"  ·  +1100 sq in                   │
  │ ○ 5 × 5 + 5" border · 60" × 60"  ·  exact match     [Apply] │
  └──────────────────────────────────────────────────────────────┘
```

Each row is a one-click "Apply" that writes the new `blocksAcross / blocksDown` (via `blockSize` if needed) and `borderWidth` into the planner state, then refreshes the preview.

## Suggestion algorithm

Reuse the existing `fitsCols / isInt` helpers in `SizePage.tsx`. Filter to **odd × odd** results. Generate three buckets:

1. **Bump down** — nearest odd ≤ current in each dimension (here 3 × 5). Keep current block size and border.
2. **Bump up** — nearest odd ≥ current in each dimension (here 5 × 7). Keep current block size and border.
3. **Border-adjusted match** — for each candidate odd × odd block count near the user's target, sweep border widths in 0.25" steps and pick the combo whose finished size is closest (by area) to the user's desired `quiltW × quiltH`. Surface the single best one.

Sort by closeness of finished size to the user's stated desired size and show up to 3 options. Each option shows: block grid, finished dimensions, and a short delta phrase ("exact match" / "1" narrower" / "+200 sq in").

## Files to change

- `src/pages/SizePage.tsx` — add Irish Chain symmetry detection in the existing `fit` memo, generate odd-only suggestions (reusing the math already there), render the warning card under the Finished Size preview, wire one-click apply handlers.

No changes to `yardage.ts`, `patterns.ts`, or the layout preview — this is purely a Size-step UX layer over math that already exists.

## Out of scope

- Auto-snapping (you can still build a 4 × 6 if you want — we recommend, never force).
- Changing the Irish Chain math or visual rendering.
- Warnings on other patterns (none of the current patterns have a comparable symmetry constraint).
