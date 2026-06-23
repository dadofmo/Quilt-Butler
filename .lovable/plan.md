## Problem
The SEO/footer paragraph at the bottom of the Pattern Picker page still reads as if every pattern is free. It says *"Choose from multiple quilt patterns — from beginner-friendly Nine Patch and Half Square Triangles to more complex designs"* but now only **Nine Patch** is free; all others are locked behind the paywall.

## Change
Rewrite the `<section>` paragraph in `src/pages/PatternPickerPage.tsx` (the big SEO blurb at the bottom) to accurately reflect the freemium model:
- Lead with Nine Patch as the free pattern to try
- Mention that additional patterns unlock with a one-time purchase
- Keep the rest of the value props (exact yardage, cutting diagrams, visualizer, cost calculator, no login)
- Keep it under ~80 words so it still fits the compact footer style

## No other files touched
Only the single paragraph in `PatternPickerPage.tsx` changes. No license, pattern, or paywall code is affected.