/**
 * Duck and Duckling: 5×5 draft. Four 2×2 corner units (one large coral
 * triangle plus two small sage/pale HSTs), an ochre-and-pale cross through
 * the middle, and a solid ochre centre. Cream lines in the reference are
 * seams, not extra fabric.
 */
export type DuckRole = "coral" | "background" | "ochre" | "sage";
export type DuckPoint = [number, number];
export interface DuckPiece { role: DuckRole; points: DuckPoint[] }

/** One corner unit: large coral triangle + two sage/pale HSTs, in a 2×2 cell
 *  box whose inner corner touches the cross. `turn` rotates the unit 0–3
 *  quarter turns around the block centre (5×5 grid). */
function cornerPieces(turn: number, add: (role: DuckRole, pts: DuckPoint[]) => void) {
  const rotate = ([x0, y0]: DuckPoint): DuckPoint => {
    let x = x0, y = y0;
    for (let i = 0; i < turn; i++) [x, y] = [5 - y, x];
    return [x, y];
  };
  const p = (role: DuckRole, pts: DuckPoint[]) => add(role, pts.map(rotate));
  // Base orientation = top-left corner unit (matches the reference):
  // large coral triangle fills the inner half, diagonal from (2,0) to (0,2).
  p("coral", [[2, 0], [2, 2], [0, 2]]);
  // Outer edge HST (top edge, cols 0–1): sage at the outer corner.
  p("background", [[0, 0], [1, 0], [0, 1]]);
  p("sage", [[0, 0], [1, 0], [1, 1]]);
  // HST against the cross arm (rows 0–1, col 1): sage faces the coral field.
  p("background", [[1, 0], [2, 0], [1, 1]]);
  p("sage", [[2, 0], [2, 1], [1, 1]]);
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
    coralStarter: 2 * unit + 0.875,
  };
}
