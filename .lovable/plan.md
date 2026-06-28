## Goal

End every chat with high confidence that all 20 patterns are mathematically, visually, and functionally correct — not just "the audit passed."

## Why we can't ever say "zero errors of any kind"

Software has three classes of errors and they need different defenses:

1. **Math/yardage errors** — wrong cut counts, wrong yardage, broken sashing/border formulas. Catchable by automated tests.
2. **Visual/render errors** — the right fabric token painted in the wrong region (your Bear Paw scare). Hard to fully automate; needs structural checks + a visual spot check.
3. **UX/copy errors** — confusing labels, misleading hints (the real Bear Paw issue). Only humans catch these reliably.

The plan below drives #1 and #2 to near-zero automatically, and gives you a 5-minute checklist for #3.

## What already protects you

- `bun audit:math` — `scripts/audit-yardage.ts` runs hundreds of hand-calculated checks against `calculateYardage` for every pattern with math.
- `tsgo` typecheck on every change — catches missing fields, bad fabric keys, undefined sections.
- The "Core" memory rule forces every piece through `addSquares` / `addRails`, so no renderer can silently fabricate yardage.

## What I'll add

### A. Pattern-coverage test (Vitest, automated)

Iterates over every entry in `src/lib/patterns.ts`. For each pattern:

1. Builds a default `PlannerState` and calls `calculateYardage` — must not throw and must return ≥1 fabric.
2. Asserts every `section.defaultFabric` actually appears in `PatternDiagram` and `QuiltLayoutPreview` output (queried via `data-fabric` attributes I'll add to each fill).
3. Asserts every fabric the renderer paints corresponds to a declared section — catches orphan paints.
4. Warns (not fails) if a pattern has no hand-calc case in `audit-yardage.ts`.

### B. Snapshot tests for the 1-block and full-quilt diagrams

Render each pattern with a fixed fabric-assignment seed and snapshot the SVG. Any unintended structural change in any renderer fails with a diff — would have caught the Streak of Lightning regressions automatically.

### C. Yardage audit expansion

Extend `scripts/audit-yardage.ts` so every pattern has at least:
- a small case (no sashing, no border)
- a sashing + border case
- a fabric-pooling case (two sections share a fabric letter)

### D. Manual 5-minute smoke checklist

`docs/PATTERN-SMOKE-CHECK.md` — one page you walk through before any release:
- Open each pattern, confirm Step 2 "1 BLOCK" colors match "FULL QUILT" colors per fabric letter
- Confirm Step 3 yardage row exists for every assigned fabric letter
- Confirm finished size on Step 3 matches Step 2
- Jelly-roll only on Rail Fence

### E. Pre-release ritual

Single command `bun verify` runs in order:
1. `tsgo` typecheck
2. `bun audit:math`
3. `bun test` (the new specs)
4. `bun run build`

## Works for future patterns

All four automated checks iterate `patterns.ts`, so new patterns are picked up automatically. The only thing not automatic is the hand-calc cases in `audit-yardage.ts` — the coverage test prints a warning when they're missing so it can't be silently forgotten.

## Scope of files

- **New**: `vitest.config.ts`, `src/test/setup.ts`, `src/lib/__tests__/patterns-coverage.test.ts`, `src/components/__tests__/pattern-renderers.test.tsx`, `docs/PATTERN-SMOKE-CHECK.md`
- **Edited**: `scripts/audit-yardage.ts` (broader cases), `package.json` (add `test` + `verify` scripts, add `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` devDeps), `tsconfig.app.json` (add `vitest/globals`), `docs/CHANGE-SAFETY.md` (document ritual), `src/components/PatternDiagram.tsx` + `QuiltLayoutPreview.tsx` + `PatternThumb.tsx` (add non-visual `data-fabric` attributes to fills — no pixel changes)
- **Untouched**: every pattern's math, fabric defaults, yardage.ts, patterns.ts content, license flow.

## Honest caveats

- Tests catch what they assert. Snapshots catch *changes*, not original mistakes — if a renderer was wrong on day one, the snapshot freezes the wrong output until the manual smoke check finds it.
- "Zero errors of any kind" is not provable in software; "every known class of error automatically guarded plus one human smoke pass" is the achievable bar.