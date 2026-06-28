## Goal
Make the fat-quarter trim margin a user-editable field in the Simple Squares fat-quarter flow, with beginner-friendly guidance.

## Decisions locked in so far
- Default FQ size: **Standard 42" bolt** → 18" × 21" raw.
- User confirms FQ size **every time** (no remembering).
- Default trim margin: **0.5" per side** (this plan adds the override).

## UI changes (SizePage.tsx, fat-quarter mode for Simple Squares)

Add a new input directly under the FQ width/height inputs:

```text
Trim margin per side:  [ 0.5 ] inches   (default)
                       ▸ Why does this matter?
```

- Numeric input, step 0.125, min 0.25, max 1.5.
- "Why does this matter?" is a collapsible (shadcn `Collapsible` / `Accordion`) so the page stays clean for users who don't care.
- Inline helper text under the field (always visible, one line):
  *"We shrink each fat quarter by this much on all 4 sides before cutting. Default 0.5" works for most cottons."*

### Expanded "Why does this matter?" content (beginner copy)

> **Why we trim the edges of a fat quarter**
>
> Fat quarters are cut from a bolt of fabric, and the cut edges are almost never perfectly straight. The two "selvage" edges (the tightly woven factory edges) are also stiffer than the rest of the fabric and don't sew well into a quilt. Before cutting your squares, quilters "square up" the fat quarter by trimming a little off all four sides so you start with clean, straight, usable fabric.
>
> **How to pick a number**
> - **0.25" (1/4 inch)** — Fat quarters from a high-quality quilt shop that look clean and straight.
> - **0.5" (1/2 inch) — recommended default.** Safe for most quilt-shop cottons. Covers normal selvage width and small cutting wobbles.
> - **0.75"–1"** — Fat quarters from a bargain bin, pre-washed fabric (which frays), or pieces that look crooked or have a wide printed selvage.
>
> **When in doubt, go bigger.** Trimming a little extra costs you a few squares; trimming too little means your finished squares may have selvage or frayed edges showing.

## Math wiring (yardage.ts)

- `computeFatQuarterPlan()` (or wherever the FQ math lives for Simple Squares) takes `trimMargin` as a parameter instead of a hardcoded 0.5.
- Usable FQ dimensions = `(fqWidth - 2*trimMargin) × (fqHeight - 2*trimMargin)`.
- Squares-per-FQ recomputes from those usable dimensions.
- Clamp: if `trimMargin * 2 >= min(fqWidth, fqHeight) - squareSize`, show an inline error: *"Trim margin too large — no squares fit. Try a smaller value."*

## State

- New state field `trimMargin: number` in SizePage, default `0.5`.
- Passed through to the FQ plan card on ResultsPage so the "X squares per fat quarter" number reflects the override.

## Out of scope
- No change to the bolt-fabric path.
- No change to other patterns.
- No persistence across sessions (matches your "ask every time" decision for FQ size).

## Verification
- Add an audit case in `scripts/audit-yardage.ts` with `trimMargin: 0.25` and `trimMargin: 1.0` to lock the math.
- Run `bun run verify`.
