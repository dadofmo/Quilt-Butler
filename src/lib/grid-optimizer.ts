import type { FabricKey } from "./planner-store";

/**
 * Grid-cutting optimizer.
 *
 * Given a 2D grid of plain-square fabric cells, merge contiguous same-fabric
 * cells into maximal non-overlapping RECTANGLES (never L-shapes — those would
 * need Y-seams). A merged W×H piece is cut at (W·cell + 0.5") × (H·cell + 0.5"),
 * so every eliminated internal seam saves 0.5" of fabric plus a sewing step.
 *
 * Pure function: callers route the result through addSquares / addRails via
 * `addOptimizedGridPieces` in yardage.ts — never push to req.pieces directly.
 */

export interface GridPiece {
  fabric: FabricKey;
  /** Width in cells (columns). */
  cellsW: number;
  /** Height in cells (rows). */
  cellsH: number;
  /** Cut width including seam allowance (inches). */
  cutW: number;
  /** Cut height including seam allowance (inches). */
  cutH: number;
  /** Number of identical pieces (per grid). */
  count: number;
}

const SEAM = 0.5;

/** Cells are null when not a plain square (e.g. an HST) and must not merge. */
export type GridCell = FabricKey | null;

export function optimizeGrid(grid: GridCell[][], finishedCell: number): GridPiece[] {
  const rows = grid.length;
  const cols = rows ? grid[0].length : 0;
  const used = grid.map((r) => r.map(() => false));
  const tally = new Map<string, GridPiece>();

  const free = (r: number, c: number, f: FabricKey) =>
    r < rows && c < cols && !used[r][c] && grid[r][c] === f;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = grid[r][c];
      if (f == null || used[r][c]) continue;
      // Find the largest-area rectangle anchored at (r, c). Tie-break: prefer
      // squares (more compact), then wider.
      let best = { w: 1, h: 1 };
      let maxW = 0;
      while (free(r, c + maxW, f)) maxW++;
      let widthLimit = maxW;
      for (let h = 1; r + h - 1 < rows && widthLimit > 0; h++) {
        let w = 0;
        while (w < widthLimit && free(r + h - 1, c + w, f)) w++;
        widthLimit = w;
        if (w === 0) break;
        const area = w * h;
        const bestArea = best.w * best.h;
        const sq = Math.min(w, h) / Math.max(w, h);
        const bestSq = Math.min(best.w, best.h) / Math.max(best.w, best.h);
        if (area > bestArea || (area === bestArea && sq > bestSq)) best = { w, h };
      }
      for (let dr = 0; dr < best.h; dr++)
        for (let dc = 0; dc < best.w; dc++) used[r + dr][c + dc] = true;
      // Normalize orientation: long side first so 1×4 and 4×1 pool together.
      const a = Math.max(best.w, best.h);
      const b = Math.min(best.w, best.h);
      const key = `${f}|${a}|${b}`;
      const existing = tally.get(key);
      if (existing) existing.count++;
      else
        tally.set(key, {
          fabric: f,
          cellsW: a,
          cellsH: b,
          cutW: a * finishedCell + SEAM,
          cutH: b * finishedCell + SEAM,
          count: 1,
        });
    }
  }
  return [...tally.values()];
}
