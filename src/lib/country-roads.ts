/**
 * Country Roads — a 7×7 grid of equal finished units.
 * A continuous 1×3 light bar runs from the centre square to each edge. Each
 * 3×3 corner quadrant is a nine-patch: an outer-corner square (Fabric D role),
 * four dark squares, and four HSTs whose light halves all touch the quadrant's
 * middle dark square. Quadrants are mirror images of the top-left one.
 *
 * Top-left quadrant (local r, c):
 *   row 0: corner | HST dark top-right   | dark
 *   row 1: HST dark bottom-left | dark   | HST dark top-right
 *   row 2: dark   | HST dark bottom-left | dark
 */
export type CountryRoadsRole = "main" | "light" | "centre" | "corners";
export type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
type Pt = [number, number];

export const COUNTRY_ROADS_GRID = 7;

export type CountryRoadsCell =
  | { row: number; col: number; kind: "square"; role: "main" | "centre" | "corners" }
  | { row: number; col: number; kind: "hst"; darkCorner: Corner }
  | { row: number; col: number; kind: "bar" };

const flipH: Record<Corner, Corner> = { "top-left": "top-right", "top-right": "top-left", "bottom-left": "bottom-right", "bottom-right": "bottom-left" };
const flipV: Record<Corner, Corner> = { "top-left": "bottom-left", "bottom-left": "top-left", "top-right": "bottom-right", "bottom-right": "top-right" };

export function countryRoadsCell(row: number, col: number): CountryRoadsCell {
  if (row === 3 && col === 3) return { row, col, kind: "square", role: "centre" };
  if (row === 3 || col === 3) return { row, col, kind: "bar" };
  const mirrorH = col > 3, mirrorV = row > 3;
  const r = mirrorV ? 6 - row : row, c = mirrorH ? 6 - col : col;
  if (r === 0 && c === 0) return { row, col, kind: "square", role: "corners" };
  if ((r + c) % 2 === 0) return { row, col, kind: "square", role: "main" };
  let corner: Corner = r === 0 || (r === 1 && c === 2) ? "top-right" : "bottom-left";
  if (mirrorH) corner = flipH[corner];
  if (mirrorV) corner = flipV[corner];
  return { row, col, kind: "hst", darkCorner: corner };
}

export const COUNTRY_ROADS_CELLS: CountryRoadsCell[] = Array.from({ length: 49 }, (_, i) => countryRoadsCell(Math.floor(i / 7), i % 7));

/** Flush polygons; each bar is one continuous rectangle. */
export function countryRoadsPolygons(size: number): { role: CountryRoadsRole; points: Pt[] }[] {
  const u = size / COUNTRY_ROADS_GRID;
  const out: { role: CountryRoadsRole; points: Pt[] }[] = [];
  const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  for (const cell of COUNTRY_ROADS_CELLS) {
    const x = cell.col * u, y = cell.row * u;
    if (cell.kind === "square") out.push({ role: cell.role, points: rect(x, y, u, u) });
    else if (cell.kind === "hst") {
      const tl: Pt = [x, y], tr: Pt = [x + u, y], bl: Pt = [x, y + u], br: Pt = [x + u, y + u];
      const tri: Record<Corner, [Pt[], Pt[]]> = {
        "top-right": [[tl, tr, br], [tl, br, bl]],
        "bottom-left": [[tl, br, bl], [tl, tr, br]],
        "top-left": [[tl, tr, bl], [tr, br, bl]],
        "bottom-right": [[tr, br, bl], [tl, tr, bl]],
      };
      const [dark, light] = tri[cell.darkCorner];
      out.push({ role: "light", points: light }, { role: "main", points: dark });
    }
  }
  out.push(
    { role: "light", points: rect(3 * u, 0, u, 3 * u) },
    { role: "light", points: rect(3 * u, 4 * u, u, 3 * u) },
    { role: "light", points: rect(0, 3 * u, 3 * u, u) },
    { role: "light", points: rect(4 * u, 3 * u, 3 * u, u) },
  );
  return out;
}

/** Per-block construction counts. No same-fabric neighbours can merge inside a quadrant row. */
export const COUNTRY_ROADS_COUNTS = {
  bars: 4,
  centre: 1,
  cornerSquares: 4,
  mainSquares: 16,
  hst: 16,
  hstStarterPairs: 8,
} as const;
