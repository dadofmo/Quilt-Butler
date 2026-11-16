/** Sawtooth reference: a 3×3 grid with four inward-facing HST corners and
 * five square-in-a-square cells. Corner arrays are clockwise TL, TR, BR, BL.
 * White lines in the construction reference are guides, never fabric. */
export type SawtoothRole = "outer" | "inward" | "diamonds" | "light";
export type SawtoothSettingRole = "outer" | "light";
export type SawtoothCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
export type SawtoothPoint = [number, number];

export type SawtoothCell =
  | { row: number; col: number; kind: "hst"; outerCorner: SawtoothCorner; inwardCorner: SawtoothCorner }
  | { row: number; col: number; kind: "onpoint"; corners: readonly [SawtoothSettingRole, SawtoothSettingRole, SawtoothSettingRole, SawtoothSettingRole] };

export const SAWTOOTH_CELLS: readonly SawtoothCell[] = [
  { row: 0, col: 0, kind: "hst", outerCorner: "top-left", inwardCorner: "bottom-right" },
  { row: 0, col: 1, kind: "onpoint", corners: ["outer", "outer", "light", "light"] },
  { row: 0, col: 2, kind: "hst", outerCorner: "top-right", inwardCorner: "bottom-left" },
  { row: 1, col: 0, kind: "onpoint", corners: ["outer", "light", "light", "outer"] },
  { row: 1, col: 1, kind: "onpoint", corners: ["outer", "outer", "outer", "outer"] },
  { row: 1, col: 2, kind: "onpoint", corners: ["light", "outer", "outer", "light"] },
  { row: 2, col: 0, kind: "hst", outerCorner: "bottom-left", inwardCorner: "top-right" },
  { row: 2, col: 1, kind: "onpoint", corners: ["light", "light", "outer", "outer"] },
  { row: 2, col: 2, kind: "hst", outerCorner: "bottom-right", inwardCorner: "top-left" },
] as const;

export interface SawtoothPolygon {
  role: SawtoothRole;
  row: number;
  col: number;
  part: "hst" | "diamond" | "setting";
  corner?: SawtoothCorner;
  points: SawtoothPoint[];
}

function hstTriangles(corner: SawtoothCorner, tl: SawtoothPoint, tr: SawtoothPoint, br: SawtoothPoint, bl: SawtoothPoint): [SawtoothPoint[], SawtoothPoint[]] {
  const triangles: Record<SawtoothCorner, [SawtoothPoint[], SawtoothPoint[]]> = {
    "top-left": [[tl, tr, bl], [tr, br, bl]],
    "top-right": [[tl, tr, br], [tl, br, bl]],
    "bottom-right": [[tr, br, bl], [tl, tr, bl]],
    "bottom-left": [[tl, bl, br], [tl, tr, br]],
  };
  return triangles[corner];
}

/** Canonical flush geometry used by thumbnails, planner, results and print. */
export function sawtoothPolygons(size: number): SawtoothPolygon[] {
  if (!Number.isFinite(size) || size <= 0) throw new Error("Sawtooth requires a positive preview size");
  const u = size / 3;
  const pieces: SawtoothPolygon[] = [];
  for (const cell of SAWTOOTH_CELLS) {
    const x = cell.col * u, y = cell.row * u, h = u / 2;
    const tl: SawtoothPoint = [x, y], tr: SawtoothPoint = [x + u, y];
    const br: SawtoothPoint = [x + u, y + u], bl: SawtoothPoint = [x, y + u];
    if (cell.kind === "hst") {
      const [outer, inward] = hstTriangles(cell.outerCorner, tl, tr, br, bl);
      pieces.push(
        { role: "outer", row: cell.row, col: cell.col, part: "hst", corner: cell.outerCorner, points: outer },
        { role: "inward", row: cell.row, col: cell.col, part: "hst", corner: cell.inwardCorner, points: inward },
      );
      continue;
    }
    pieces.push({
      role: "diamonds", row: cell.row, col: cell.col, part: "diamond",
      points: [[x + h, y], [x + u, y + h], [x + h, y + u], [x, y + h]],
    });
    const corners: Record<SawtoothCorner, SawtoothPoint[]> = {
      "top-left": [tl, [x + h, y], [x, y + h]],
      "top-right": [[x + h, y], tr, [x + u, y + h]],
      "bottom-right": [[x + u, y + h], br, [x + h, y + u]],
      "bottom-left": [[x, y + h], [x + h, y + u], bl],
    };
    (Object.keys(corners) as SawtoothCorner[]).forEach((corner, index) => {
      pieces.push({ role: cell.corners[index], row: cell.row, col: cell.col, part: "setting", corner, points: corners[corner] });
    });
  }
  return pieces;
}

const upEighth = (value: number) => Math.ceil(value * 8 - 1e-9) / 8;

/** Shared cutting dimensions. Rounded starters are trimmed to exact targets. */
export function sawtoothDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Sawtooth requires a positive block size");
  const unit = block / 3;
  return {
    unit,
    unitTrim: unit + 0.5,
    hstStarter: upEighth(unit + 0.875),
    diamondFinished: unit / Math.SQRT2,
    diamondCut: unit / Math.SQRT2 + 0.5,
    settingStarter: upEighth(unit / 2 + 0.875),
    blockTrim: block + 0.5,
  };
}

export const SAWTOOTH_COUNTS = {
  hstUnits: 4,
  outerHstStarters: 2,
  inwardHstStarters: 2,
  diamondSquares: 5,
  outerSettingStarters: 6,
  lightSettingStarters: 4,
  outerSettingTriangles: 12,
  lightSettingTriangles: 8,
} as const;
