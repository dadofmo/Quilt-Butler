/** Union Square: 3×3 macro units on a 6×6 grid. No seam-line fabric. */
export type UnionSquareRole = "background" | "main" | "accent" | "outer";
type Point = [number, number];
export type UnionSquarePolygon = { role: UnionSquareRole; points: Point[] };

/** Draft one corner, then rotate it to preserve the reference's fourfold symmetry. */
export function unionSquarePolygons(size: number): UnionSquarePolygon[] {
  const corner: UnionSquarePolygon[] = [
    { role: "main", points: [[0,0],[1,0],[1,1],[0,1]] },
    { role: "background", points: [[1,1],[2,1],[2,2],[1,2]] },
    { role: "main", points: [[1,0],[2,0],[2,1]] },
    { role: "background", points: [[1,0],[2,1],[1,1]] },
    { role: "main", points: [[0,1],[1,2],[0,2]] },
    { role: "background", points: [[0,1],[1,1],[1,2]] },
  ];
  const top: UnionSquarePolygon[] = [
    { role: "outer", points: [[2,0],[4,0],[3,1]] },
    { role: "accent", points: [[2,2],[4,2],[3,1]] },
    { role: "background", points: [[2,0],[2,2],[3,1]] },
    { role: "background", points: [[4,0],[4,2],[3,1]] },
  ];
  const polygons: UnionSquarePolygon[] = [{ role: "main", points: [[2,2],[4,2],[4,4],[2,4]] }];
  for (let turn = 0; turn < 4; turn++) {
    for (const piece of [...corner, ...top]) polygons.push({ role: piece.role, points: piece.points.map(([x,y]) => {
      for (let i = 0; i < turn; i++) [x,y] = [6-y,x];
      return [x*size/6,y*size/6];
    }) });
  }
  polygons[0].points = polygons[0].points.map(([x,y]) => [x*size/6,y*size/6]);
  return polygons;
}

const upEighth = (value: number) => Math.ceil(value*8-1e-9)/8;
export function unionSquareDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Union Square requires a positive block size");
  const small = block/6, unit = block/3;
  return { small, unit, smallCut: small+0.5, unitTrim: unit+0.5,
    hstStarter: upEighth(small+1), qstStarter: upEighth(unit+1.5),
    qstIntermediate: unit+1, blockTrim: block+0.5 };
}

/** Starter counts are cut squares, not sewn units. One AC + one AD pair
 * makes four intermediates, then two second-stage pairs make four QSTs. */
export const UNION_SQUARE_COUNTS = {
  backgroundSquares: 4, mainSquares: 4, centreSquares: 1,
  backgroundHstStarters: 4, mainHstStarters: 4,
  backgroundQstStarters: 2, accentQstStarters: 1, outerQstStarters: 1,
  hsts: 8, qsts: 4,
} as const;