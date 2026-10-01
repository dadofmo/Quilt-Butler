import type { FabricKey } from "./planner-store";

/**
 * Grid-cutting optimizer.
 *
 * Given a 2D grid of plain-square fabric cells, merge contiguous same-fabric
 * cells into maximal non-overlapping RECTANGLES (never L-shapes — those would
 * need Y-seams). A merged W×H piece is cut at (W·cell + 0.5") × (H·cell + 0.5"),
 * so every eliminated internal seam saves 0.5" of fabric plus a sewing step.
 *
 * Two passes, in the order an experienced quilter works:
 *
 * 1. FRAMES. If a fabric forms a closed ring around an inner rectangle (a
 *    "framed square" / bordered medallion), cut it the way a quilter builds a
 *    border: two strips that span the inner block and two strips that span the
 *    full outer width, with opposite sides always matching. Never a lopsided
 *    4-unit top with a 2-unit bottom.
 * 2. GREEDY. Everything left over merges into maximal rectangles.
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

  /** Record a merged rectangle; normalizes orientation so 1×4 and 4×1 pool. */
  const emit = (f: FabricKey, w: number, h: number) => {
    const a = Math.max(w, h);
    const b = Math.min(w, h);
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
  };

  const claim = (r0: number, c0: number, w: number, h: number) => {
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) used[r][c] = true;
  };

  // ---- Pass 1: symmetrical frames / borders --------------------------------
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const f = grid[r][c];
      if (f == null || used[r][c]) continue;
      const comp = floodFill(grid, used, r, c, f);
      const ring = asRing(comp, grid, f);
      if (!ring) continue;
      const { r0, r1, c0, c1, hr0, hr1, hc0, hc1 } = ring;
      // Top and bottom bands span the full frame width; left and right bands
      // fill the gap beside the hole. Opposite sides always match.
      const topH = hr0 - r0;
      const botH = r1 - hr1;
      const leftW = hc0 - c0;
      const rightW = c1 - hc1;
      const fullW = c1 - c0 + 1;
      const midH = hr1 - hr0 + 1;
      if (topH > 0) {
        emit(f, fullW, topH);
        claim(r0, c0, fullW, topH);
      }
      if (botH > 0) {
        emit(f, fullW, botH);
        claim(hr1 + 1, c0, fullW, botH);
      }
      if (leftW > 0) {
        emit(f, leftW, midH);
        claim(hr0, c0, leftW, midH);
      }
      if (rightW > 0) {
        emit(f, rightW, midH);
        claim(hr0, hc1 + 1, rightW, midH);
      }
    }
  }

  // ---- Pass 2: greedy maximal rectangles -----------------------------------
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
      claim(r, c, best.w, best.h);
      emit(f, best.w, best.h);
    }
  }
  return [...tally.values()];
}

/** 4-connected same-fabric cells reachable from (r, c), ignoring used cells. */
function floodFill(
  grid: GridCell[][],
  used: boolean[][],
  r: number,
  c: number,
  f: FabricKey,
): Array<[number, number]> {
  const rows = grid.length;
  const cols = grid[0].length;
  const seen = new Set<string>([`${r},${c}`]);
  const out: Array<[number, number]> = [];
  const stack: Array<[number, number]> = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    out.push([cr, cc]);
    for (const [dr, dc] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (used[nr][nc] || grid[nr][nc] !== f) continue;
      const k = `${nr},${nc}`;
      if (seen.has(k)) continue;
      seen.add(k);
      stack.push([nr, nc]);
    }
  }
  return out;
}

interface Ring {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
  /** Bounds of the enclosed hole. */
  hr0: number;
  hr1: number;
  hc0: number;
  hc1: number;
}

/**
 * True when a component is exactly its bounding box minus one rectangular hole
 * that sits strictly inside it — i.e. a closed frame around an inner block.
 */
function asRing(
  comp: Array<[number, number]>,
  grid: GridCell[][],
  f: FabricKey,
): Ring | null {
  let r0 = Infinity;
  let r1 = -Infinity;
  let c0 = Infinity;
  let c1 = -Infinity;
  const inComp = new Set<string>();
  for (const [r, c] of comp) {
    inComp.add(`${r},${c}`);
    if (r < r0) r0 = r;
    if (r > r1) r1 = r;
    if (c < c0) c0 = c;
    if (c > c1) c1 = c;
  }
  const boxArea = (r1 - r0 + 1) * (c1 - c0 + 1);
  const missing: Array<[number, number]> = [];
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) if (!inComp.has(`${r},${c}`)) missing.push([r, c]);
  if (missing.length === 0) return null; // solid rectangle — greedy handles it
  if (comp.length + missing.length !== boxArea) return null;
  let hr0 = Infinity;
  let hr1 = -Infinity;
  let hc0 = Infinity;
  let hc1 = -Infinity;
  for (const [r, c] of missing) {
    if (grid[r][c] === f) return null; // same fabric but unreachable — not a clean ring
    if (r < hr0) hr0 = r;
    if (r > hr1) hr1 = r;
    if (c < hc0) hc0 = c;
    if (c > hc1) hc1 = c;
  }
  if ((hr1 - hr0 + 1) * (hc1 - hc0 + 1) !== missing.length) return null; // hole isn't a rectangle
  if (hr0 <= r0 || hr1 >= r1 || hc0 <= c0 || hc1 >= c1) return null; // open on a side
  return { r0, r1, c0, c1, hr0, hr1, hc0, hc1 };
}
