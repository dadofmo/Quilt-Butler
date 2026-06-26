## The bug

In `src/pages/SizePage.tsx` the **"current finished size"** display computes how many blocks fit using:

```ts
blocksAcross = floor(innerW / blockSize)   // ignores sashing
blocksDown   = floor(innerH / blockSize)
```

But the **suggester** correctly uses `floor((inner + sashing) / (block + sashing))`. The two formulas disagree whenever sashing > 0.

Walk-through with your screenshot (50×65 desired, 6" block, 3.25" border, 1.5" sashing):

- Suggester (correct): `(50 − 6.5 + 1.5) / (6 + 1.5) = 45 / 7.5 = 6` blocks across → finished width `6·6 + 5·1.5 + 6.5 = 50"` ✓
- Display (buggy): `floor((50 − 6.5) / 6) = floor(7.25) = 7` → finished width `7·6 + 6·1.5 + 6.5 = 57.5"` ✗

That's why Option 1 ("3.25" border and 1.5" sashing") looks identical to the current settings yet is reported as 57.5×72.5 instead of 50×65. The suggested options are actually correct — the page is just miscounting blocks before rendering the result.

## The fix

One change in `src/pages/SizePage.tsx`, around lines 152–153 — make the current-fit calculation match the suggester:

```ts
const denom = blockSizeNum + sashing;
const blocksAcross = Math.max(1, Math.floor((innerW + sashing) / denom));
const blocksDown   = Math.max(1, Math.floor((innerH + sashing) / denom));
```

(`usedW` / `usedH` / `actualW` / `actualH` already include the sashing terms, so they become correct automatically once the block counts are right.)

## Why this is safe

- Pure UI/preview math in `SizePage.tsx`. Does not touch `src/lib/yardage.ts`, `patterns.ts`, the cutting diagram, the license/paywall flow, or any pattern renderer.
- When `sashing === 0` the formula collapses to the existing one — every non-sashed pattern is byte-identical.
- When `sashing > 0` the new value is the mathematically correct block count (matches what the suggester, the yardage engine, and a real quilter would lay out). All 19 patterns benefit; none regress.
- After the change I'll run `bun audit:math` to confirm yardage results are unchanged.

## What you'll see after the fix

With 50×65 desired, 6" jelly-roll block, 3.25" border, 1.5" sashing:

- Finished size renders as **50" × 65" · 6 × 8 = 48 blocks**.
- The green "✓ This matches your desired size exactly" message appears.
- The amber "Heads up" panel disappears (because the current settings are already exact).
- If the user later picks border/sashing that doesn't divide evenly, the Heads-up options will now lead to a truly exact match when tapped.

No copy change needed — once the math is right, "Here are options to get to 50" × 65"" is accurate.
