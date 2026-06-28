## What's actually happening

The Bear Paw block has **two different things that look like sashing**:

1. **Inside each block** — the green cross-strips you see in the "1 BLOCK" image. These are part of the block itself and use the **Background fabric (C)**. They separate the four paw units within a single block.
2. **Between blocks** — the orange strips you see in the "YOUR FULL QUILT" image. These use the **Sashing between blocks fabric (E)** you selected.

So the renderer is actually working correctly:
- 1 BLOCK view → shows only one block, so between-block sashing isn't visible (by definition).
- Full quilt view → correctly shows orange (E) between blocks.

This is a **labeling / UX problem**, not a math or render bug. The two sections look identical in the picker, so changing "Sashing between blocks" feels like it should update the green strips inside the block too.

## Fix

Update wording in `src/lib/patterns.ts` for the Bear Paw `bg` section so users understand the green in-block strips come from the Background fabric, not the between-block sashing:

- Keep `Background` label but tighten the hint to explicitly call out: "Also forms the cross-strips inside each block that separate the four paws (visible in the 1 BLOCK preview)."
- Tighten the "Sashing between blocks" hint to: "Only appears in the full quilt view between blocks — not inside a single block."

No renderer, no yardage, no math changes.

## How to verify the other 19 patterns don't have this issue

I'll do a one-time audit (read-only, no code changes) and report back:

- For every pattern in `src/lib/patterns.ts`, list every fabric section.
- Cross-check against the renderer in `src/components/PatternDiagram.tsx` and `QuiltLayoutPreview.tsx` to confirm each section's fabric token is actually painted somewhere.
- Flag any pattern (like Bear Paw) where two sections paint visually similar regions in different views, so we can preemptively clarify the hint copy.

Bear Paw is the only pattern with an in-block "cross" that mirrors between-block sashing, so I expect zero other hits — but I'll confirm.

## Files touched

- `src/lib/patterns.ts` — hint text only, two sections.

Nothing else changes. Yardage math, audit script, and all renderers stay untouched.