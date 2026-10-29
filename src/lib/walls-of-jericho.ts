/**
 * Walls of Jericho — a 7×7 grid of equal finished units.
 * Centre cell: background. A continuous 1×3 cross arm runs from the centre to
 * each edge. Each 3×3 corner holds a two-triangle-wide diagonal band of five
 * dark HSTs; the rest of the corner is background.
 *
 * In top-left local coordinates (r, c ∈ 0..2) the band fills 3 < x + y < 4:
 * cells with r + c = 2 are dark toward the block centre, cells with r + c = 3
 * are dark away from it. Other corners are mirror images.
 */
export type JerichoRole = "background" | "cross" | "triangles";
export type Corner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
type Pt = [number, number];

export const JERICHO_GRID = 7;
export const JERICHO_HST_PER_BLOCK = 20;

export type JerichoCell =
  | { row: number; col: number; kind: "square"; role: JerichoRole }
  | { row: number; col: number; kind: "hst"; darkCorner: Corner }
  | { row: number; col: number; kind: "arm" };

const flipH: Record<Corner, Corner> = { "top-left": "top-right", "top-right": "top-left", "bottom-left": "bottom-right", "bottom-right": "bottom-left" };
const flipV: Record<Corner, Corner> = { "top-left": "bottom-left", "bottom-left": "top-left", "top-right": "bottom-right", "bottom-right": "top-right" };

export function jerichoCell(row: number, col: number): JerichoCell {
  if (row === 3 && col === 3) return { row, col, kind: "square", role: "background" };
  if (row === 3 || col === 3) return { row, col, kind: "arm" };
  const mirrorH = col > 3, mirrorV = row > 3;
  const r = mirrorV ? 6 - row : row, c = mirrorH ? 6 - col : col;
  const s = r + c;
  if (s !== 2 && s !== 3) return { row, col, kind: "square", role: "background" };
  let corner: Corner = s === 2 ? "bottom-right" : "top-left";
  if (mirrorH) corner = flipH[corner];
  if (mirrorV) corner = flipV[corner];
  return { row, col, kind: "hst", darkCorner: corner };
}

export const JERICHO_CELLS: JerichoCell[] = Array.from({ length: 49 }, (_, i) => jerichoCell(Math.floor(i / 7), i % 7));

/** Flush polygons for the whole block; arms are one continuous rectangle each. */
export function jerichoPolygons(size: number): { role: JerichoRole; points: Pt[] }[] {
  const u = size / JERICHO_GRID;
  const out: { role: JerichoRole; points: Pt[] }[] = [];
  const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  for (const cell of JERICHO_CELLS) {
    const x = cell.col * u, y = cell.row * u;
    if (cell.kind === "square") out.push({ role: cell.role, points: rect(x, y, u, u) });
    else if (cell.kind === "hst") {
      const tl: Pt = [x, y], tr: Pt = [x + u, y], bl: Pt = [x, y + u], br: Pt = [x + u, y + u];
      const tri: Record<Corner, [Pt[], Pt[]]> = {
        "bottom-right": [[tr, br, bl], [tl, tr, bl]],
        "top-left": [[tl, tr, bl], [tr, br, bl]],
        "bottom-left": [[tl, br, bl], [tl, tr, br]],
        "top-right": [[tl, tr, br], [tl, br, bl]],
      };
      const [dark, light] = tri[cell.darkCorner];
      out.push({ role: "background", points: light }, { role: "triangles", points: dark });
    }
  }
  out.push(
    { role: "cross", points: rect(3 * u, 0, u, 3 * u) },
    { role: "cross", points: rect(3 * u, 4 * u, u, 3 * u) },
    { role: "cross", points: rect(0, 3 * u, 3 * u, u) },
    { role: "cross", points: rect(4 * u, 3 * u, 3 * u, u) },
  );
  return out;
}

/** Per-block construction counts (rows of each 3×3 corner merge the outer-row background pair). */
export function jerichoCounts() {
  return {
    hst: JERICHO_HST_PER_BLOCK,
    hstStarterPairs: JERICHO_HST_PER_BLOCK / 2,
    crossArms: 4,
    backgroundRects: 4, // 1×2 outer-row pair in each corner
    backgroundSquares: 9, // 2 per corner + centre
  };
}
