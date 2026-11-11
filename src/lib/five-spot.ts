/** Five Spot: 6×6 half-unit draft, sewn as nine equal square macro units. */
export type FiveSpotRole = "dark" | "background" | "spots" | "inner" | "centreCorners";
type Pt = [number, number];
export type FiveSpotPiece = { role: FiveSpotRole; unit: "corner" | "side" | "centre"; points: Pt[] };
const CORNER: Omit<FiveSpotPiece, "unit">[] = [
  { role: "spots", points: [[0,0],[1,0],[1,1],[0,1]] },
  { role: "background", points: [[1,0],[2,0],[1,1]] },
  { role: "background", points: [[0,1],[1,1],[0,2]] },
  { role: "dark", points: [[2,0],[2,2],[0,2]] },
];
const SIDE: Omit<FiveSpotPiece, "unit">[] = [
  { role: "spots", points: [[3,0],[4,1],[3,2],[2,1]] },
  { role: "background", points: [[2,0],[3,0],[2,1]] },
  { role: "background", points: [[3,0],[4,0],[4,1]] },
  { role: "inner", points: [[4,1],[4,2],[3,2]] },
  { role: "inner", points: [[2,1],[3,2],[2,2]] },
];
const CENTRE: Omit<FiveSpotPiece, "unit">[] = [
  { role: "background", points: [[3,2],[4,3],[3,4],[2,3]] },
  { role: "centreCorners", points: [[2,2],[3,2],[2,3]] },
  { role: "centreCorners", points: [[3,2],[4,2],[4,3]] },
  { role: "centreCorners", points: [[4,3],[4,4],[3,4]] },
  { role: "centreCorners", points: [[2,3],[3,4],[2,4]] },
];
export function fiveSpotPieces(): FiveSpotPiece[] {
  const fx = ([x,y]: Pt): Pt => [6-x,y];
  const fy = ([x,y]: Pt): Pt => [x,6-y];
  const tr = ([x,y]: Pt): Pt => [y,x];
  const map = (pieces: Omit<FiveSpotPiece,"unit">[], unit: FiveSpotPiece["unit"], f: (p: Pt)=>Pt) =>
    pieces.map(p => ({ ...p, unit, points: p.points.map(f) }));
  return [
    ...map(CORNER,"corner",p=>p), ...map(CORNER,"corner",fx),
    ...map(CORNER,"corner",fy), ...map(CORNER,"corner",p=>fx(fy(p))),
    ...map(SIDE,"side",p=>p), ...map(SIDE,"side",fy),
    ...map(SIDE,"side",tr), ...map(SIDE,"side",p=>fx(tr(p))),
    ...map(CENTRE,"centre",p=>p),
  ];
}
export function fiveSpotPolygons(size: number) {
  return fiveSpotPieces().map(p => ({ ...p, points: p.points.map(([x,y]): Pt => [x*size/6,y*size/6]) }));
}
const up8 = (n: number) => Math.ceil(n*8-1e-9)/8;
export function fiveSpotDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Five Spot requires a positive block size");
  const unit = block/3;
  return {
    unit, unfinished: unit+.5, blockUnfinished: block+.5,
    smallSquare: unit/2+.5,
    diamondCut: unit/Math.SQRT2+.5,
    // Conventional leg + 7/8 blanks, with an extra 1/8 trimming margin.
    settingStarter: up8(unit/2+1),
    darkStarter: up8(unit+1),
  };
}
export const FIVE_SPOT_COUNTS = {
  spotDiamonds: 4, backgroundDiamonds: 1, cornerSquares: 4,
  backgroundStarters: 8, innerStarters: 4, centreCornerStarters: 2, darkStarters: 2,
} as const;