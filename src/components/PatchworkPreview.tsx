import { useMemo } from "react";
import {
  ALL_FABRIC_KEYS,
  FABRIC_COLORS,
  type FabricKey,
} from "@/lib/planner-store";
import { fabricBackgroundStyle } from "@/lib/fabric-fill";

interface Props {
  /** Number of distinct fabrics to cycle through (2–12). */
  fabricCount: number;
  /** Quilt size — used with blockSize/borderWidth to match real layout. */
  quiltWidth: number;
  quiltHeight: number;
  /** Block size (inches) — drives how many blocks fit across/down. */
  blockSize: number;
  /** Border width (inches) — subtracted from quilt size before dividing. */
  borderWidth: number;
  /** Per-cell assignments, keyed "r,c". */
  grid: Record<string, FabricKey>;
  onChange: (next: Record<string, FabricKey>) => void;
  /** Optional uploaded photos per fabric — overrides solid color in cells. */
  photos?: Partial<Record<FabricKey, string>>;
}

/**
 * Compute the grid shape based on the REAL block layout — how many whole
 * blocks fit across and down inside the inner (un-bordered) area. That way
 * the preview matches what the quilt will actually look like.
 */
export function computeGridShape(
  quiltWidth: number,
  quiltHeight: number,
  blockSize: number,
  borderWidth: number,
) {
  const innerW = Math.max(0, quiltWidth - 2 * borderWidth);
  const innerH = Math.max(0, quiltHeight - 2 * borderWidth);
  const safeBlock = Math.max(0.0001, blockSize);
  const cols = Math.max(1, Math.floor(innerW / safeBlock));
  const rows = Math.max(1, Math.floor(innerH / safeBlock));
  return { rows, cols };
}

/**
 * Tap-to-cycle patchwork preview. Each cell shows the currently assigned
 * fabric color; tapping cycles to the next fabric in the active palette
 * (A through the Nth fabric, wrapping back to A).
 *
 * The grid mirrors the actual quilt layout: blocks-across × blocks-down
 * given the user's chosen block size and border width.
 */
export function PatchworkPreview({
  fabricCount,
  quiltWidth,
  quiltHeight,
  blockSize,
  borderWidth,
  grid,
  onChange,
}: Props) {
  const { rows, cols } = useMemo(
    () => computeGridShape(quiltWidth, quiltHeight, blockSize, borderWidth),
    [quiltWidth, quiltHeight, blockSize, borderWidth],
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
        {palette.length === 1 ? "" : "s"}. This is your real layout:{" "}
        <strong>{cols} × {rows} = {cols * rows} blocks</strong> at {blockSize}&quot; each.
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
  blockSize: number,
  borderWidth: number,
): Record<FabricKey, number> {
  const { rows, cols } = computeGridShape(
    quiltWidth,
    quiltHeight,
    blockSize,
    borderWidth,
  );
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
