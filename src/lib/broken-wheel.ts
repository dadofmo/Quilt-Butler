/**
 * Broken Wheel — a 3×3 macro block of equal units.
 * Corners: square-in-a-square (dark diamond, three outer background
 * triangles, one ring triangle at the corner facing the block centre).
 * Sides: two-bar rail units, dark bar on the outer edge, ring bar inside.
 * Centre: one plain dark square. Fully D4 symmetric.
 */
export type BrokenWheelRole = "background" | "ring" | "dark";
type Pt = [number, number];
export type BrokenWheelPiece = { role: BrokenWheelRole; unit: "corner" | "side" | "centre"; points: Pt[] };

export const BROKEN_WHEEL_UNITS = 3;
const G = 6; // half-unit grid

const CORNER_TL: Omit<BrokenWheelPiece, "unit">[] = [
  { role: "dark", points: [[1, 0], [2, 1], [1, 2], [0, 1]] },
  { role: "background", points: [[0, 0], [1, 0], [0, 1]] },
  { role: "background", points: [[1, 0], [2, 0], [2, 1]] },
  { role: "ring", points: [[2, 1], [2, 2], [1, 2]] },
  { role: "background", points: [[0, 1], [1, 2], [0, 2]] },
];
const SIDE_TOP: Omit<BrokenWheelPiece, "unit">[] = [
  { role: "dark", points: [[2, 0], [4, 0], [4, 1], [2, 1]] },
  { role: "ring", points: [[2, 1], [4, 1], [4, 2], [2, 2]] },
];
const CENTRE: Omit<BrokenWheelPiece, "unit">[] = [
  { role: "dark", points: [[2, 2], [4, 2], [4, 4], [2, 4]] },
];

const fx = ([x, y]: Pt): Pt => [G - x, y];
const fy = ([x, y]: Pt): Pt => [x, G - y];
const tr = ([x, y]: Pt): Pt => [y, x];

/** All pieces on a 6×6 half-unit grid (each macro unit is 2×2). */
export function brokenWheelPieces(): BrokenWheelPiece[] {
  const map = (src: Omit<BrokenWheelPiece, "unit">[], unit: BrokenWheelPiece["unit"], f: (p: Pt) => Pt) =>
    src.map(p => ({ role: p.role, unit, points: p.points.map(f) }));
  return [
    ...map(CORNER_TL, "corner", p => p), ...map(CORNER_TL, "corner", fx),
    ...map(CORNER_TL, "corner", fy), ...map(CORNER_TL, "corner", p => fx(fy(p))),
    ...map(SIDE_TOP, "side", p => p), ...map(SIDE_TOP, "side", fy),
    ...map(SIDE_TOP, "side", tr), ...map(SIDE_TOP, "side", p => fx(tr(p))),
    ...map(CENTRE, "centre", p => p),
  ];
}

export function brokenWheelPolygons(size: number): { role: BrokenWheelRole; points: Pt[] }[] {
  const k = size / G;
  return brokenWheelPieces().map(p => ({ role: p.role, points: p.points.map(([x, y]) => [x * k, y * k] as Pt) }));
}

const up8 = (n: number) => Math.ceil((n - 1e-10) * 8) / 8;

/** Cut sizes (inches) for one finished block size. */
export function brokenWheelDimensions(block: number) {
  if (!(block > 0)) throw new Error("Broken Wheel requires a positive block size");
  const unit = block / BROKEN_WHEEL_UNITS;
  return {
    unit,
    unitUnfinished: unit + 0.5,
    diamondFinished: unit / Math.SQRT2,
    diamondCut: unit / Math.SQRT2 + 0.5,
    // Half-square blanks cut once diagonally: finished leg unit/2 + 7/8, rounded up to 1/8".
    triangleStarter: up8(unit / 2 + 0.875),
    barLength: unit + 0.5,
    barWidth: unit / 2 + 0.5,
    centre: unit + 0.5,
  };
}

/** Per-block piece counts. */
export const BROKEN_WHEEL_COUNTS = {
  diamonds: 4,
  backgroundTriangleSquares: 6, // → 12 triangles, three per corner unit
  ringTriangleSquares: 2, // → 4 triangles, one per corner unit
  darkBars: 4,
  ringBars: 4,
  centres: 1,
} as const;
