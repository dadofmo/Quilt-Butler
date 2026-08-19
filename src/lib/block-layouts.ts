import type { BlockLayout, PatternId } from "./planner-store";

/**
 * Block-setting (layout) helpers.
 *
 * Every setting here is ROTATION ONLY: each block is pieced identically, so
 * the cutting list and yardage never change — only how the finished blocks
 * are turned when they're sewn together, which is what produces (or breaks)
 * a secondary design across the quilt.
 *
 * Two things live here so the rules stay in one place:
 *
 * 1. `INTRINSIC_ROTATION` — patterns whose secondary design depends on a
 *    fixed, non-negotiable tiling (Rail Fence's weave, Jacob's Ladder's
 *    on-point chain, Broken Dishes' diamonds). These are NOT user
 *    selectable; `PatternDef.layouts` is undefined for them and the picker
 *    never renders.
 * 2. `rotationFor()` — the single source of truth used by the full-quilt
 *    preview, replacing the old ad-hoc per-pattern rotate flags.
 */

/** Patterns that always rotate every other block, by design. */
const INTRINSIC_ROTATION: PatternId[] = [
  "rail-fence",
  "jacobs-ladder",
  "broken-dishes",
];

export function hasIntrinsicRotation(pattern: PatternId): boolean {
  return INTRINSIC_ROTATION.includes(pattern);
}

export const LAYOUT_LABELS: Record<BlockLayout, string> = {
  straight: "Straight set",
  alternating: "Alternating turn",
  "barn-raising": "Barn raising",
  herringbone: "Diagonal streak",
};

export const LAYOUT_HINTS: Record<BlockLayout, string> = {
  straight: "Every block faces the same way — the classic setting.",
  alternating: "Give every other block a quarter turn, checkerboard style.",
  "barn-raising": "Turn blocks in concentric rings so the design spirals out from the centre.",
  herringbone: "Step the quarter turns along each diagonal for a streaking, woven look.",
};

/**
 * Rotation (degrees, clockwise) for the block at `row`/`col`.
 * Always a multiple of 90 so blocks stay square and butt up flush.
 */
export function rotationFor(
  pattern: PatternId,
  layout: BlockLayout,
  row: number,
  col: number,
  blocksAcross = 1,
  blocksDown = 1,
): number {
  if (hasIntrinsicRotation(pattern)) return (row + col) % 2 === 1 ? 90 : 0;
  switch (layout) {
    case "alternating":
      return (row + col) % 2 === 1 ? 90 : 0;
    case "barn-raising": {
      // Concentric rings measured from the centre of the quilt.
      const cx = (blocksAcross - 1) / 2;
      const cy = (blocksDown - 1) / 2;
      const ring = Math.round(Math.max(Math.abs(col - cx), Math.abs(row - cy)));
      return 90 * (ring % 4);
    }
    case "herringbone":
      return 90 * ((row + col) % 4);
    case "straight":
    default:
      return 0;
  }
}

/** Plain-English assembly note for the results page. */
export function layoutAssemblyNote(layout: BlockLayout): string | null {
  switch (layout) {
    case "alternating":
      return "Block setting — alternating turn: piece every block the same way, then give every other block a quarter turn (clockwise) as you lay out the rows, checkerboard style. Same blocks, same cutting list — only the orientation changes.";
    case "barn-raising":
      return "Block setting — barn raising: piece every block the same way, then lay them out in rings around the centre of the quilt, turning each ring a further quarter turn (centre ring 0°, next ring 90°, then 180°, then 270°, repeating outward). Lay the whole top out on the floor or a design wall before sewing rows together.";
    case "herringbone":
      return "Block setting — diagonal streak: piece every block the same way, then turn each block a quarter turn more than the block up and to its left (0°, 90°, 180°, 270°, repeating along each diagonal). Label your rows as you lay them out so the streaks stay lined up.";
    case "straight":
    default:
      return null;
  }
}
