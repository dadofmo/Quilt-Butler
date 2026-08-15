# Pattern Filter & Search for the Picker

With 50 patterns, the picker is a long scroll with no way to narrow down. This adds a search box and a filter bar to Step 1 so quilters can find the right block by skill level, fabric count, and technique.

## What the user sees

At the top of "Pick a quilt pattern", above the tile grid:

- **Search box** — type a name ("pinwheel", "star", "queens") and the grid filters live.
- **Filter button** — opens a panel with grouped toggle chips:
  - **Skill level**: Beginner / Confident beginner / Intermediate / Advanced
  - **Number of fabrics**: 2 / 3 / 4+
  - **Technique**: Squares only, Half-square triangles, Flying geese, Stitch-and-flip corners, On-point / diagonal seams, Strip piecing
  - **Features**: Precut friendly (jelly roll / fat quarter), Reversible A/B blocks, Sashing friendly
- **Active filter chips** shown inline with an "x" on each, plus "Clear all".
- **Result count** line: "Showing 12 of 50 patterns".
- **Empty state** when nothing matches: a short message plus a "Clear filters" button.
- Filters persist in the URL query string (e.g. `/?level=beginner&tech=hst`) so a filtered view is shareable and survives a back-navigation from Step 2.

Locked patterns stay in the results (they still show the lock) — filtering is about discovery, not gating.

```text
┌──────────────────────────────────────────────┐
│  Pick a quilt pattern                        │
│  [ search patterns…            ] [ Filters ▾]│
│  Beginner ×   Half-square triangles ×  Clear │
│  Showing 12 of 50 patterns                   │
│  ┌────┐ ┌────┐ ┌────┐                        │
│  │ ▨  │ │ ▨  │ │ ▨  │  …                     │
└──────────────────────────────────────────────┘
```

## Technical notes

**1. Pattern metadata (`src/lib/patterns.ts`)**

Extend `PatternDef` with optional-but-required-in-practice fields:

```ts
skill: "beginner" | "confident" | "intermediate" | "advanced";
fabricCount: 2 | 3 | 4;            // distinct block fabrics, excluding sashing/border
techniques: TechniqueTag[];        // "squares" | "hst" | "geese" | "flip" | "onpoint" | "strips"
precut?: "jelly-roll" | "fat-quarter";
```

Tag all 50 patterns. `supportsAlternate` is already present and feeds the "Reversible A/B blocks" filter; the two existing precut badges (`rail-fence`, `simple-squares`) move from hardcoded IDs in `PatternPickerPage.tsx` to the new `precut` field, so the badge render is data-driven.

**2. Filter logic (`src/lib/pattern-filters.ts`, new)**

Pure module: filter option definitions, a `filterPatterns(patterns, state)` function, and URL-param encode/decode. Keeping it out of the page makes it unit-testable.

**3. UI (`src/components/PatternFilterBar.tsx`, new)**

Search input plus a shadcn `Popover` (desktop) / `Sheet` (mobile) holding the chip groups, built from existing shadcn primitives and semantic tokens only. `PatternPickerPage.tsx` holds filter state (synced to `useSearchParams`) and maps over the filtered list instead of `PATTERNS`.

**4. Tests**

Add `src/lib/__tests__/pattern-filters.test.ts`:
- Every pattern has `skill`, `fabricCount`, and at least one technique tag.
- `fabricCount` matches the number of distinct non-sashing/non-border sections in each pattern.
- Filters combine with AND across groups and OR within a group.
- URL round-trip: encode → decode returns the same state.

No changes to `yardage.ts` or any renderer, so quilt math is untouched.

**5. SEO**

The picker's `<title>`/description stay as-is (filters are a query-string view, and the canonical already points at `https://quiltbutler.com/`). Filtered views inherit that canonical so no duplicate-content pages are created.
