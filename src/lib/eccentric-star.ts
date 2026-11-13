/** Eccentric Star reference: eight HSTs around one continuous centre square.
 * Corners name the right angle of the dark triangle, not a star-point tip. */
export type EccentricStarRole = "dark" | "background" | "points";
export const ECCENTRIC_STAR_CELLS = [
  { row: 0, col: 0, opposite: "background", darkCorner: "top-right" },
  { row: 0, col: 1, opposite: "points", darkCorner: "top-left" },
  { row: 0, col: 2, opposite: "background", darkCorner: "bottom-right" },
  { row: 1, col: 0, opposite: "points", darkCorner: "bottom-left" },
  { row: 1, col: 1, role: "dark" },
  { row: 1, col: 2, opposite: "points", darkCorner: "top-right" },
  { row: 2, col: 0, opposite: "background", darkCorner: "top-left" },
  { row: 2, col: 1, opposite: "points", darkCorner: "bottom-right" },
  { row: 2, col: 2, opposite: "background", darkCorner: "bottom-left" },
] as const;
type Point = [number, number];
export function eccentricStarPolygons(size: number): {role: EccentricStarRole; points: Point[]}[] {
  const u = size / 3;
  return ECCENTRIC_STAR_CELLS.flatMap(cell => {
    const x = cell.col*u, y = cell.row*u;
    const tl: Point = [x,y], tr: Point = [x+u,y], br: Point = [x+u,y+u], bl: Point = [x,y+u];
    if ("role" in cell) return [{role: cell.role, points: [tl,tr,br,bl]}];
    const triangles: Record<typeof cell.darkCorner, [Point[],Point[]]> = {
      "top-left": [[tl,tr,bl],[tr,br,bl]],
      "top-right": [[tl,tr,br],[tl,br,bl]],
      "bottom-right": [[tr,br,bl],[tl,tr,bl]],
      "bottom-left": [[tl,br,bl],[tl,tr,br]],
    };
    const [dark, opposite] = triangles[cell.darkCorner];
    return [{role: "dark" as const, points: dark}, {role: cell.opposite, points: opposite}];
  });
}
export function eccentricStarDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Eccentric Star requires a positive block size");
  const unit = block/3;
  return {unit, unitTrim: unit+.5, hstStarter: Math.ceil((unit+1)*8-1e-9)/8, blockTrim: block+.5};
}
export const ECCENTRIC_STAR_COUNTS = { centre: 1, darkStarters: 4, backgroundStarters: 2, pointStarters: 2 } as const;