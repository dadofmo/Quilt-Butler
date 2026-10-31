/**
 * Fool's Square — a 5×5 grid of equal finished units, sewn in five rows.
 * Centre: accent square framed by four cross-arm squares; four inner corner
 * squares in the star-point fabric; eight background/star-point HSTs whose
 * points touch the inner corner squares; four background/accent corner HSTs
 * with the accent tip at each outer corner; four background edge squares.
 */
export type FoolsRole = "background" | "points" | "cross" | "accent";
export type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
type Pt = [number, number];

export const FOOLS_GRID = 5;

export type FoolsCell =
  | { row: number; col: number; kind: "square"; role: FoolsRole }
  | { row: number; col: number; kind: "hst"; role: "points" | "accent"; darkCorner: Corner };

const S = (role: FoolsRole) => ({ kind: "square" as const, role });
const H = (role: "points" | "accent", darkCorner: Corner) => ({ kind: "hst" as const, role, darkCorner });

/** Reference map, verified cell by cell against the supplied image. */
const MAP = [
  [H("accent", "top-left"), H("points", "bottom-left"), S("background"), H("points", "bottom-right"), H("accent", "top-right")],
  [H("points", "top-right"), S("points"), S("cross"), S("points"), H("points", "top-left")],
  [S("background"), S("cross"), S("accent"), S("cross"), S("background")],
  [H("points", "bottom-right"), S("points"), S("cross"), S("points"), H("points", "bottom-left")],
  [H("accent", "bottom-left"), H("points", "top-left"), S("background"), H("points", "top-right"), H("accent", "bottom-right")],
];

export function foolsCell(row: number, col: number): FoolsCell {
  return { row, col, ...MAP[row][col] } as FoolsCell;
}

export const FOOLS_CELLS: FoolsCell[] = Array.from({ length: 25 }, (_, i) => foolsCell(Math.floor(i / 5), i % 5));

export function foolsPolygons(size: number): { role: FoolsRole; points: Pt[] }[] {
  const u = size / FOOLS_GRID;
  const out: { role: FoolsRole; points: Pt[] }[] = [];
  for (const cell of FOOLS_CELLS) {
    const x = cell.col * u, y = cell.row * u;
    const tl: Pt = [x, y], tr: Pt = [x + u, y], bl: Pt = [x, y + u], br: Pt = [x + u, y + u];
    if (cell.kind === "square") { out.push({ role: cell.role, points: [tl, tr, br, bl] }); continue; }
    const tri: Record<Corner, [Pt[], Pt[]]> = {
      "bottom-right": [[tr, br, bl], [tl, tr, bl]],
      "top-left": [[tl, tr, bl], [tr, br, bl]],
      "bottom-left": [[tl, br, bl], [tl, tr, br]],
      "top-right": [[tl, tr, br], [tl, br, bl]],
    };
    const [dark, light] = tri[cell.darkCorner];
    out.push({ role: "background", points: light }, { role: cell.role, points: dark });
  }
  return out;
}

/** Per-block construction counts (HSTs are made two at a time). */
export function foolsCounts() {
  const sq = (r: FoolsRole) => FOOLS_CELLS.filter(c => c.kind === "square" && c.role === r).length;
  const hst = (r: "points" | "accent") => FOOLS_CELLS.filter(c => c.kind === "hst" && c.role === r).length;
  return {
    backgroundSquares: sq("background"), // 4
    pointSquares: sq("points"), // 4
    crossSquares: sq("cross"), // 4
    accentSquares: sq("accent"), // 1
    pointHst: hst("points"), // 8
    accentHst: hst("accent"), // 4
  };
}
