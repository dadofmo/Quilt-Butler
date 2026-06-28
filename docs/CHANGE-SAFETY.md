# Change Safety Rules

These rules exist to protect two things from regressions:

1. **Yardage math accuracy** — if the site says "buy 2.5 yards of fabric A,"
   the cutting diagram must actually fit in 2.5 yards.
2. **License flow** — the device-management / unlock flow must keep working
   for paying customers.

## Yardage math invariants

- Never push directly to `req.pieces`. Always go through `addSquares` /
  `addRails` in `src/lib/yardage.ts`.
- All fabric defaults come from `getPattern(id).sections[*].defaultFabric`
  in `src/lib/patterns.ts`. Never hardcode literals like `"D"` / `"C"` in
  diagrams or previews.
- After any change to `yardage.ts`, `patterns.ts`, or the cutting diagram,
  run `bun audit:math`.

## Pre-release verification ritual

Before pushing to production, run:

```bash
bun run verify
```

This runs, in order:

1. `bun audit:math` — hand-calculated yardage cases (`scripts/audit-yardage.ts`).
2. `bun run test` — Vitest suites:
   - `src/lib/__tests__/patterns-coverage.test.ts` iterates **every**
     pattern in `PATTERNS` and asserts `calculateYardage` doesn't throw,
     returns ≥1 fabric, and only uses valid fabric keys.
   - `src/components/__tests__/pattern-renderers.test.tsx` mounts each
     of `PatternThumb`, `PatternDiagram`, and `QuiltLayoutPreview` for
     every pattern and snapshots the SVG output — any unintended visual
     regression fails the build with a diff.
3. `bun run build` — production build.

If all three pass, run the 5-minute human pass in
[`PATTERN-SMOKE-CHECK.md`](./PATTERN-SMOKE-CHECK.md).

## Adding a new pattern

The Vitest suites iterate `PATTERNS`, so a new pattern is automatically
covered by render + snapshot tests the moment it's added to
`src/lib/patterns.ts`. The only thing that is NOT automatic is hand-calc
cases for yardage math — when you add a new pattern, also add at least
one minimal case and one sashing+border case to `scripts/audit-yardage.ts`.

## License flow

Smoke-test the unlock flow manually after any change to:

- `api/license-devices.ts`
- `api/license-deactivate.ts`
- `src/lib/license.ts`
- `src/components/UnlockModal.tsx`

Steps: enter a real license key on a fresh device, confirm unlock; then
re-enter on a 4th device and confirm the "sign out a device" flow works.
