/**
 * Duck and Duckling: 5×5 draft. Each corner is a 2×2 unit built from one
 * large coral/pale half-square triangle with a small sage/pale HST at the
 * outer corner; an ochre-and-pale cross runs through the middle around a
 * solid ochre centre. Cream lines in the reference are seams, not fabric.
 */
export type DuckRole = "coral" | "background" | "ochre" | "sage";
export type DuckPoint = [number, number];
export interface DuckPiece { role: DuckRole; points: DuckPoint[] }

/** One corner unit in a 2×2 cell box; `turn` rotates it 0–3 quarter turns
 *  around the block centre (5×5 grid). Base orientation = top-left corner
 *  (matches the reference): large coral triangle toward the centre cross,
 *  large pale triangle toward the outer corner, small sage triangle at the
 *  outer corner cell with its right angle pointing into the block. */
function cornerPieces(turn: number, add: (role: DuckRole, pts: DuckPoint[]) => void) {
  const rotate = ([x0, y0]: DuckPoint): DuckPoint => {
    let x = x0, y = y0;
    for (let i = 0; i < turn; i++) [x, y] = [5 - y, x];
    return [x, y];
  };
  const p = (role: DuckRole, pts: DuckPoint[]) => add(role, pts.map(rotate));
  p("coral", [[2, 0], [2, 2], [0, 2]]);
  p("background", [[0, 0], [2, 0], [0, 2]]);
  // Small sage HST half at the outer corner cell, drawn over the pale
  // triangle (its pale half is the same fabric, so no seam shows).
  p("sage", [[1, 0], [1, 1], [0, 1]]);
}

export function duckAndDucklingGeometry(size: number): DuckPiece[] {
  if (!(size > 0)) throw new Error("Duck and Duckling requires a positive size");
  const pieces: DuckPiece[] = [];
  const add = (role: DuckRole, points: DuckPoint[]) =>
    pieces.push({ role, points: points.map(([x, y]) => [x * size / 5, y * size / 5]) });
  for (let turn = 0; turn < 4; turn++) cornerPieces(turn, add);
  // Cross: ochre at the four arm ends and the centre, pale between.
  const cross: [number, number, DuckRole][] = [
    [2, 0, "ochre"], [2, 1, "background"],
    [0, 2, "ochre"], [1, 2, "background"], [2, 2, "ochre"], [3, 2, "background"], [4, 2, "ochre"],
    [2, 3, "background"], [2, 4, "ochre"],
  ];
  for (const [x, y, role] of cross) add(role, [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]]);
  return pieces;
}

export function duckAndDucklingDimensions(block: number) {
  if (!(block > 0)) throw new Error("Duck and Duckling requires a positive size");
  const unit = block / 5;
  return {
    unit,
    unitUnfinished: unit + 0.5,
    hstStarter: unit + 0.875,
    bigTriangleStarter: 2 * unit + 0.875,
  };
}
