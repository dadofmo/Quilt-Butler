/** Hovering Hawks reference: a 4×4 grid with six plain squares and ten HSTs.
 * Every reference HST seam runs top-left to bottom-right. `corner` names the
 * right-angle corner occupied by the hawk or accent triangle. */
export type HoveringHawksRole = "background" | "hawks" | "accent";
export type HoveringHawksCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
export type HoveringHawksCell =
  | { row: number; col: number; role: "background" }
  | { row: number; col: number; role: "hawks" | "accent"; corner: HoveringHawksCorner };

export const HOVERING_HAWKS_CELLS: readonly HoveringHawksCell[] = [
  { row: 0, col: 0, role: "background" },
  { row: 0, col: 1, role: "hawks", corner: "bottom-left" },
  { row: 0, col: 2, role: "accent", corner: "bottom-left" },
  { row: 0, col: 3, role: "background" },
  { row: 1, col: 0, role: "hawks", corner: "top-right" },
  { row: 1, col: 1, role: "background" },
  { row: 1, col: 2, role: "hawks", corner: "bottom-left" },
  { row: 1, col: 3, role: "accent", corner: "bottom-left" },
  { row: 2, col: 0, role: "accent", corner: "top-right" },
  { row: 2, col: 1, role: "hawks", corner: "top-right" },
  { row: 2, col: 2, role: "background" },
  { row: 2, col: 3, role: "hawks", corner: "bottom-left" },
  { row: 3, col: 0, role: "background" },
  { row: 3, col: 1, role: "accent", corner: "top-right" },
  { row: 3, col: 2, role: "hawks", corner: "top-right" },
  { row: 3, col: 3, role: "background" },
] as const;

type Point = [number, number];
export type HoveringHawksPolygon = {
  role: HoveringHawksRole;
  row: number;
  col: number;
  points: Point[];
};

export function hoveringHawksPolygons(size: number): HoveringHawksPolygon[] {
  const u = size / 4;
  return HOVERING_HAWKS_CELLS.flatMap((cell) => {
    const x = cell.col * u;
    const y = cell.row * u;
    const tl: Point = [x, y];
    const tr: Point = [x + u, y];
    const br: Point = [x + u, y + u];
    const bl: Point = [x, y + u];
    if (cell.role === "background") {
      return [{ role: "background" as const, row: cell.row, col: cell.col, points: [tl, tr, br, bl] }];
    }
    const triangles: Record<HoveringHawksCorner, [Point[], Point[]]> = {
      "top-left": [[tl, tr, bl], [tr, br, bl]],
      "top-right": [[tl, tr, br], [tl, br, bl]],
      "bottom-right": [[tr, br, bl], [tl, tr, bl]],
      "bottom-left": [[tl, br, bl], [tl, tr, br]],
    };
    const [coloured, background] = triangles[cell.corner];
    return [
      { role: cell.role, row: cell.row, col: cell.col, points: coloured },
      { role: "background" as const, row: cell.row, col: cell.col, points: background },
    ];
  });
}

const upEighth = (value: number) => Math.ceil(value * 8 - 1e-9) / 8;

export function hoveringHawksDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) {
    throw new Error("Hovering Hawks requires a positive block size");
  }
  const unit = block / 4;
  return {
    unit,
    unitTrim: unit + 0.5,
    // Oversized two-at-a-time HST blank; trim back to the exact unitTrim.
    hstStarter: upEighth(unit + 1),
    blockTrim: block + 0.5,
  };
}

export const HOVERING_HAWKS_COUNTS = {
  backgroundSquares: 6,
  backgroundStarters: 5,
  hawkStarters: 3,
  accentStarters: 2,
  hawkHsts: 6,
  accentHsts: 4,
} as const;
