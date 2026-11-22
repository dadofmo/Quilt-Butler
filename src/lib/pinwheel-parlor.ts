/** Pinwheel Parlor reference geometry on a 12 × 12 grid (u = block / 12).
 * 3 × 3 macro layout of 4u units: four corners, four edges and a pinwheel centre.
 * Every preview, cut and sewing note reads from this module. */
export type PinwheelParlorRole = "dark" | "background" | "sky" | "accent" | "coral" | "frame" | "pale";
export const PINWHEEL_PARLOR_ROLES: PinwheelParlorRole[] = ["dark", "background", "sky", "accent", "coral", "frame", "pale"];
type Point = [number, number];
export type PinwheelParlorPiece = { role: PinwheelParlorRole; points: Point[]; unit: string };

const rect = (x: number, y: number, w: number, h: number): Point[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

/** Square-in-a-square of side 2 at (x, y): diamond plus four corner triangles. */
function squareInSquare(x: number, y: number, diamond: PinwheelParlorRole, corners: PinwheelParlorRole, unit: string): PinwheelParlorPiece[] {
  const t: Point = [x + 1, y], r: Point = [x + 2, y + 1], b: Point = [x + 1, y + 2], l: Point = [x, y + 1];
  return [
    { role: diamond, points: [t, r, b, l], unit },
    { role: corners, points: [[x, y], t, l], unit },
    { role: corners, points: [t, [x + 2, y], r], unit },
    { role: corners, points: [r, [x + 2, y + 2], b], unit },
    { role: corners, points: [b, [x, y + 2], l], unit },
  ];
}

/** Top-left reference quadrant pieces in grid units (corner macro + left half of top edge + left half of left edge are generated separately). */
function topLeftCorner(): PinwheelParlorPiece[] {
  return [
    { role: "dark", points: rect(0, 0, 2, 2), unit: "corner" },
    // HSTs: diagonal from top-right to bottom-left, sky on the upper-left (toward the dark square), background lower-right.
    { role: "sky", points: [[2, 0], [4, 0], [2, 2]], unit: "corner" },
    { role: "background", points: [[4, 0], [4, 2], [2, 2]], unit: "corner" },
    { role: "sky", points: [[0, 2], [2, 2], [0, 4]], unit: "corner" },
    { role: "background", points: [[2, 2], [2, 4], [0, 4]], unit: "corner" },
    ...squareInSquare(2, 2, "pale", "accent", "corner"),
  ];
}
function topEdge(): PinwheelParlorPiece[] {
  return [
    { role: "frame", points: rect(4, 0, 4, 1), unit: "edge" },
    { role: "background", points: rect(4, 1, 4, 1), unit: "edge" },
    ...squareInSquare(4, 2, "background", "coral", "edge"),
    ...squareInSquare(6, 2, "background", "coral", "edge"),
  ];
}
/** Centre top-left quarter-square triangle; the other three are quarter turns about the block centre. */
function centreQuarter(): PinwheelParlorPiece[] {
  const c: Point = [5, 5];
  return [
    { role: "pale", points: [[4, 4], [6, 4], c], unit: "centre" },
    { role: "accent", points: [[6, 4], [6, 6], c], unit: "centre" },
    { role: "dark", points: [[6, 6], [4, 6], c], unit: "centre" },
    { role: "sky", points: [[4, 6], [4, 4], c], unit: "centre" },
  ];
}
const mapPiece = (p: PinwheelParlorPiece, f: (pt: Point) => Point): PinwheelParlorPiece => ({ ...p, points: p.points.map(f) });
/** Quarter turn clockwise about the block centre (6, 6) in a y-down grid. */
const rot = (k: number) => (pt: Point): Point => { let [x, y] = pt; for (let i = 0; i < k; i++) [x, y] = [12 - y, x]; return [x, y]; };
const mirrorX = ([x, y]: Point): Point => [12 - x, y];
const mirrorY = ([x, y]: Point): Point => [x, 12 - y];

export function pinwheelParlorGridPieces(): PinwheelParlorPiece[] {
  const corner = topLeftCorner(), edge = topEdge(), quarter = centreQuarter();
  return [
    ...corner,
    ...corner.map(p => mapPiece(p, mirrorX)),
    ...corner.map(p => mapPiece(p, mirrorY)),
    ...corner.map(p => mapPiece(p, pt => mirrorX(mirrorY(pt)))),
    ...[0, 1, 2, 3].flatMap(k => edge.map(p => mapPiece(p, rot(k)))),
    ...[0, 1, 2, 3].flatMap(k => quarter.map(p => mapPiece(p, rot(k)))),
  ];
}
export function pinwheelParlorPolygons(size: number): PinwheelParlorPiece[] {
  const u = size / 12;
  return pinwheelParlorGridPieces().map(p => mapPiece(p, ([x, y]) => [x * u, y * u]));
}

const up8 = (v: number) => Math.ceil(v * 8 - 1e-9) / 8;
export function pinwheelParlorDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Pinwheel Parlor requires a positive block size");
  const u = block / 12, cell = 2 * u;
  return {
    u, cell, macro: 4 * u,
    cellTrim: cell + 0.5,                  // every 2u unit trims to this
    cornerSquare: cell + 0.5,              // whole dark corner square
    hstStarter: up8(cell + 1),             // oversized, trims to cellTrim
    qstSquare: up8(cell + 1.25),           // cut twice diagonally: four quarters
    diamondFinished: cell / Math.SQRT2,
    diamondCut: cell / Math.SQRT2 + 0.5,   // exact
    settingSquare: up8(u + 1),             // cut once diagonally; slightly oversized for trimming
    barLength: 4 * u + 0.5, barWidth: u + 0.5,
    macroTrim: 4 * u + 0.5, blockTrim: block + 0.5,
  };
}
/** Cuts per block. */
export const PINWHEEL_PARLOR_COUNTS = {
  darkCornerSquares: 4, qstSquaresPerFabric: 1, skyHstStarters: 4, backgroundHstStarters: 4,
  backgroundBars: 4, frameBars: 4, backgroundDiamonds: 8, paleDiamonds: 4,
  accentSettingSquares: 8, coralSettingSquares: 16,
} as const;
