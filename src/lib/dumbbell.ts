/**
 * Dumbbell — a 6×6-unit block assembled as a 3×3 macro layout of 2×2 units.
 * Corners: a main square plus three main/background HSTs whose main triangles
 * meet at the unit centre. Edges: an outer flying goose (background body,
 * accent wings) above an inner main goose (background wings), both pointing
 * to the block centre. Centre: a main square-in-a-square diamond.
 * Fully mirror-symmetric (D4).
 */
export type DumbbellRole = "background" | "main" | "accent";
type Pt = [number, number];
export type DumbbellPiece = { role: DumbbellRole; unit: "corner" | "edge" | "centre"; points: Pt[] };

export const DUMBBELL_GRID = 6;

/** Top-left corner unit and top edge unit, in grid units. */
const CORNER_TL: Omit<DumbbellPiece, "unit">[] = [
  { role: "main", points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
  // (row 0, col 1): main right angle bottom-left
  { role: "background", points: [[1, 0], [2, 0], [2, 1]] },
  { role: "main", points: [[1, 0], [2, 1], [1, 1]] },
  // (row 1, col 0): main right angle top-right
  { role: "main", points: [[0, 1], [1, 1], [1, 2]] },
  { role: "background", points: [[0, 1], [1, 2], [0, 2]] },
  // (row 1, col 1): main right angle top-left
  { role: "main", points: [[1, 1], [2, 1], [1, 2]] },
  { role: "background", points: [[2, 1], [2, 2], [1, 2]] },
];
const EDGE_TOP: Omit<DumbbellPiece, "unit">[] = [
  // outer goose: background body pointing down, accent wings
  { role: "background", points: [[2, 0], [4, 0], [3, 1]] },
  { role: "accent", points: [[2, 0], [3, 1], [2, 1]] },
  { role: "accent", points: [[4, 0], [4, 1], [3, 1]] },
  // inner goose: main body pointing down, background wings
  { role: "main", points: [[2, 1], [4, 1], [3, 2]] },
  { role: "background", points: [[2, 1], [3, 2], [2, 2]] },
  { role: "background", points: [[4, 1], [4, 2], [3, 2]] },
];
const CENTRE: Omit<DumbbellPiece, "unit">[] = [
  { role: "main", points: [[3, 2], [4, 3], [3, 4], [2, 3]] },
  { role: "background", points: [[2, 2], [3, 2], [2, 3]] },
  { role: "background", points: [[3, 2], [4, 2], [4, 3]] },
  { role: "background", points: [[4, 3], [4, 4], [3, 4]] },
  { role: "background", points: [[2, 3], [3, 4], [2, 4]] },
];

const G = DUMBBELL_GRID;
const fx = ([x, y]: Pt): Pt => [G - x, y];
const fy = ([x, y]: Pt): Pt => [x, G - y];
const tr = ([x, y]: Pt): Pt => [y, x];

/** All pieces in grid units (0–6). */
export function dumbbellPieces(): DumbbellPiece[] {
  const map = (src: Omit<DumbbellPiece, "unit">[], unit: DumbbellPiece["unit"], f: (p: Pt) => Pt) =>
    src.map(p => ({ role: p.role, unit, points: p.points.map(f) }));
  const id = (p: Pt) => p;
  return [
    ...map(CORNER_TL, "corner", id), ...map(CORNER_TL, "corner", fx),
    ...map(CORNER_TL, "corner", fy), ...map(CORNER_TL, "corner", p => fx(fy(p))),
    ...map(EDGE_TOP, "edge", id), ...map(EDGE_TOP, "edge", fy),
    ...map(EDGE_TOP, "edge", tr), ...map(EDGE_TOP, "edge", p => fx(tr(p))),
    ...map(CENTRE, "centre", id),
  ];
}

export function dumbbellPolygons(size: number): { role: DumbbellRole; points: Pt[] }[] {
  const k = size / G;
  return dumbbellPieces().map(p => ({ role: p.role, points: p.points.map(([x, y]) => [x * k, y * k] as Pt) }));
}

const up8 = (n: number) => Math.ceil((n - 1e-10) * 8) / 8;

/** Cut sizes (inches) for one finished block size. */
export function dumbbellDimensions(block: number) {
  if (!(block > 0)) throw new Error("Dumbbell requires a positive block size");
  const unit = block / G;
  return {
    unit,
    square: unit + 0.5,
    hstStarter: unit + 0.875,
    geeseLarge: 2 * unit + 1.25,
    geeseSmall: unit + 0.875,
    centreFinished: (2 * unit) / Math.SQRT2,
    centreCut: (2 * unit) / Math.SQRT2 + 0.5,
    settingStarter: up8(unit + 0.875),
    unitUnfinished: 2 * unit + 0.5,
  };
}

/** Per-block piece counts. */
export const DUMBBELL_COUNTS = {
  mainSquares: 4,
  cornerHst: 12, // 6 pairs → 6 main + 6 background starters
  mainGeese: 4, // one four-at-a-time set: 1 main large + 4 background small
  accentGeese: 4, // one set: 1 background large + 4 accent small
  centreSquares: 1,
  settingStarters: 2, // background, cut once diagonally → 4 triangles
} as const;
