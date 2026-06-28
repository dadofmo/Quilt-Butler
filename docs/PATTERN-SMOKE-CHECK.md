# Pattern Smoke Check (5 minutes, before any release)

Automated tests cover math, render-safety, and structural snapshots. They
can't catch UX/copy confusion (the kind of thing where the labels are
correct but a user misreads them). This page is the human pass.

Walk through every pattern once. For each:

## In Step 1 (Pick a pattern)

- [ ] Thumbnail looks like the pattern it claims to be.

## In Step 2 (Build your quilt)

- [ ] Default fabric colors in **1 BLOCK** match the **YOUR FULL QUILT**
      colors letter-for-letter (A = A, B = B, etc).
- [ ] Each fabric section's hint text matches what the picker actually
      controls (no "sashing" hints pointing at the wrong region).
- [ ] Changing each fabric assignment one at a time updates the region you
      expect — both in **1 BLOCK** and in **FULL QUILT**.
- [ ] Finished-size readout matches your requested quilt size (or the
      suggestion banner offers a correction).

## In Step 3 (Results)

- [ ] One yardage row appears for every distinct fabric letter assigned in
      Step 2 — no missing fabrics, no extras.
- [ ] Finished size shown here equals the finished size shown in Step 2.
- [ ] Cutting diagram strip labels are readable (not blank/truncated).
- [ ] Shopping list totals match the yardage rows above.

## Pattern-specific spot checks

| Pattern              | Specifically confirm                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| Bear Paw             | In-block cross strips = Background (C). Between-block sashing = Sashing fabric. They are two different sections. |
| Snowball Block       | Every other block reverses fabrics (checkerboard).                       |
| Streak of Lightning  | Top row is a peak at top-center; bottom row is a valley at bottom-center (zigzag). |
| Bow Tie              | Knot diamond corners land on the inner-patch midpoints.                  |
| Sawtooth Star        | Center square uses its own fabric (defaults to C), distinct from star points (A). |
| Rail Fence           | Only pattern with a Yardage / Jelly Roll toggle.                         |
| Friendship Star      | Thumbnail uses yellow / blue / pink (brand fabrics), no off-brand colors. |

## Before shipping

Run, in order:

```bash
bun run audit:math   # hand-calculated yardage cases
bun run test         # vitest: every pattern renders + snapshot stable
bun run build        # production build
```

The single shortcut for all three is `bun run verify`.

If any of the above fails, do not ship. If they all pass and this manual
checklist passes, you have hit the achievable bar for "no known errors."
