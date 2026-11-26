/** Flying Dutchman reference: a 4×4 grid of equal units — four whole background
 * squares, eight background/main "wing" HSTs and four main/accent centre-star HSTs.
 * `dark` names the right-angle corner of the Fabric-main triangle; the other half
 * is background (wing) or accent (star). The block is 180° rotationally symmetric. */
export type FlyingDutchmanRole = "background" | "main" | "accent";
export type FlyingDutchmanCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
export type FlyingDutchmanCell =
  | { row: number; col: number; kind: "square" }
  | { row: number; col: number; kind: "wing" | "star"; dark: FlyingDutchmanCorner };

export const FLYING_DUTCHMAN_CELLS: readonly FlyingDutchmanCell[] = [
  { row: 0, col: 0, kind: "wing", dark: "bottom-right" },
  { row: 0, col: 1, kind: "square" },
  { row: 0, col: 2, kind: "wing", dark: "bottom-left" },
  { row: 0, col: 3, kind: "wing", dark: "bottom-left" },
  { row: 1, col: 0, kind: "square" },
  { row: 1, col: 1, kind: "star", dark: "top-left" },
  { row: 1, col: 2, kind: "star", dark: "bottom-left" },
  { row: 1, col: 3, kind: "wing", dark: "bottom-left" },
  { row: 2, col: 0, kind: "wing", dark: "top-right" },
  { row: 2, col: 1, kind: "star", dark: "top-right" },
  { row: 2, col: 2, kind: "star", dark: "bottom-right" },
  { row: 2, col: 3, kind: "square" },
  { row: 3, col: 0, kind: "wing", dark: "top-right" },
  { row: 3, col: 1, kind: "wing", dark: "top-right" },
  { row: 3, col: 2, kind: "square" },
  { row: 3, col: 3, kind: "wing", dark: "top-left" },
] as const;

export const OPPOSITE_CORNER: Record<FlyingDutchmanCorner, FlyingDutchmanCorner> = {
  "top-left": "bottom-right", "bottom-right": "top-left", "top-right": "bottom-left", "bottom-left": "top-right",
};
/** Seam direction for a triangle whose right angle sits at `corner`. */
export const seamFor = (corner: FlyingDutchmanCorner) =>
  corner === "top-left" || corner === "bottom-right" ? "bottom-left to top-right" : "top-left to bottom-right";

type Point = [number, number];
export type FlyingDutchmanPolygon = { role: FlyingDutchmanRole; row: number; col: number; points: Point[] };

export function flyingDutchmanPolygons(size: number): FlyingDutchmanPolygon[] {
  const u = size / 4;
  return FLYING_DUTCHMAN_CELLS.flatMap((cell) => {
    const x = cell.col * u, y = cell.row * u;
    const tl: Point = [x, y], tr: Point = [x + u, y], br: Point = [x + u, y + u], bl: Point = [x, y + u];
    if (cell.kind === "square") return [{ role: "background" as const, row: cell.row, col: cell.col, points: [tl, tr, br, bl] }];
    const triangles: Record<FlyingDutchmanCorner, [Point[], Point[]]> = {
      "top-left": [[tl, tr, bl], [tr, br, bl]],
      "top-right": [[tl, tr, br], [tl, br, bl]],
      "bottom-right": [[tr, br, bl], [tl, tr, bl]],
      "bottom-left": [[tl, br, bl], [tl, tr, br]],
    };
    const [dark, other] = triangles[cell.dark];
    return [
      { role: "main" as const, row: cell.row, col: cell.col, points: dark },
      { role: cell.kind === "wing" ? "background" as const : "accent" as const, row: cell.row, col: cell.col, points: other },
    ];
  });
}

const upEighth = (value: number) => Math.ceil(value * 8 - 1e-9) / 8;

export function flyingDutchmanDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Flying Dutchman requires a positive block size");
  const unit = block / 4;
  return {
    unit,
    unitTrim: unit + 0.5,
    // Oversized two-at-a-time HST blank; trim back to the exact unitTrim.
    hstStarter: upEighth(unit + 1),
    blockTrim: block + 0.5,
  };
}

/** Per block. Starters are squares; each matched pair makes two HSTs. */
export const FLYING_DUTCHMAN_COUNTS = {
  backgroundSquares: 4,
  backgroundStarters: 4,
  mainWingStarters: 4,
  mainStarStarters: 2,
  accentStarters: 2,
  wingHsts: 8,
  starHsts: 4,
} as const;
