import { useMemo } from "react";
import {
  ALL_FABRIC_KEYS,
  FABRIC_COLORS,
  type FabricKey,
} from "@/lib/planner-store";

interface Props {
  /** Number of distinct fabrics to cycle through (2–12). */
  fabricCount: number;
  /** Quilt aspect ratio used to shape the preview grid. */
  quiltWidth: number;
  quiltHeight: number;
  /** Per-cell assignments, keyed "r,c". */
  grid: Record<string, FabricKey>;
  onChange: (next: Record<string, FabricKey>) => void;
  /** How many cells to render in total (defaults to ~36). */
  targetCells?: number;
}

/**
 * Compute a rows × cols layout that:
 *   1. Roughly matches the quilt aspect ratio, AND
 *   2. Has ~targetCells squares total.
 */
export function computeGridShape(
  quiltWidth: number,
  quiltHeight: number,
  targetCells = 36,
) {
  const aspect = quiltWidth / quiltHeight; // >1 wide, <1 tall
  // cols / rows ≈ aspect, and cols * rows ≈ targetCells
  // → rows ≈ sqrt(targetCells / aspect), cols ≈ sqrt(targetCells * aspect)
  let rows = Math.round(Math.sqrt(targetCells / aspect));
  let cols = Math.round(Math.sqrt(targetCells * aspect));
  rows = Math.max(3, Math.min(10, rows));
  cols = Math.max(3, Math.min(10, cols));
  return { rows, cols };
}

/**
 * Tap-to-cycle patchwork preview. Each cell shows the currently assigned
 * fabric color; tapping cycles to the next fabric in the active palette
 * (A through the Nth fabric, wrapping back to A).
 *
 * The grid is shaped to roughly match the real quilt's aspect ratio with
 * ~36 squares total — big enough to show a pattern, small enough that
 * tap targets stay phone-friendly.
 */
export function PatchworkPreview({
  fabricCount,
  quiltWidth,
  quiltHeight,
  grid,
  onChange,
  targetCells = 36,
}: Props) {
  const { rows, cols } = useMemo(
    () => computeGridShape(quiltWidth, quiltHeight, targetCells),
    [quiltWidth, quiltHeight, targetCells],
  );

  const palette: FabricKey[] = ALL_FABRIC_KEYS.slice(
    0,
    Math.max(2, Math.min(12, fabricCount)),
  );

  const cellFor = (r: number, c: number): FabricKey => {
    const key = `${r},${c}`;
    if (grid[key] && palette.includes(grid[key])) return grid[key];
    // Default seed: simple checker-ish so first view isn't a wall of one color.
    return palette[(r + c) % palette.length];
  };

  const cycle = (r: number, c: number) => {
    const cur = cellFor(r, c);
    const i = palette.indexOf(cur);
    const nextFab = palette[(i + 1) % palette.length];
    onChange({ ...grid, [`${r},${c}`]: nextFab });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="grid gap-[3px] rounded-lg bg-border p-[3px] shadow-sm"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          width: "min(100%, 360px)",
          aspectRatio: `${cols} / ${rows}`,
        }}
        role="grid"
        aria-label="Patchwork color preview — tap a square to cycle fabric"
      >
        {Array.from({ length: rows }).flatMap((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const fab = cellFor(r, c);
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => cycle(r, c)}
                aria-label={`Row ${r + 1} column ${c + 1}, fabric ${fab}. Tap to change.`}
                className="rounded-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ background: FABRIC_COLORS[fab] }}
              />
            );
          }),
        )}
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Tap any square to cycle through your {palette.length} fabric
        {palette.length === 1 ? "" : "s"}. The preview matches your quilt&apos;s shape ({cols} × {rows}).
      </p>
    </div>
  );
}

/**
 * Returns the percentage (0–1) of cells that use each fabric in the grid.
 * Used to scale yardage — if 25% of the preview is Fabric A, A needs ~25%
 * of the total top-fabric yardage.
 */
export function gridFabricMix(
  grid: Record<string, FabricKey>,
  fabricCount: number,
  quiltWidth: number,
  quiltHeight: number,
  targetCells = 36,
): Record<FabricKey, number> {
  const { rows, cols } = computeGridShape(quiltWidth, quiltHeight, targetCells);
  const palette: FabricKey[] = ALL_FABRIC_KEYS.slice(
    0,
    Math.max(2, Math.min(12, fabricCount)),
  );
  const counts: Partial<Record<FabricKey, number>> = {};
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const fab =
        grid[key] && palette.includes(grid[key])
          ? grid[key]
          : palette[(r + c) % palette.length];
      counts[fab] = (counts[fab] ?? 0) + 1;
      total += 1;
    }
  }
  const out = {} as Record<FabricKey, number>;
  for (const k of ALL_FABRIC_KEYS) out[k] = (counts[k] ?? 0) / total;
  return out;
}
