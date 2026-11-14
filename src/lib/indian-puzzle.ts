/** Indian Puzzle: a 6×6 half-unit draft sewn as nine equal macro squares. */
export type IndianPuzzleRole = "dark" | "background" | "accent";
type Point = [number, number];
export type IndianPuzzlePiece = { role: IndianPuzzleRole; unit: "corner" | "side" | "centre"; points: Point[] };
const CORNER: Omit<IndianPuzzlePiece,"unit">[] = [
  {role:"background",points:[[0,0],[1,0],[1,1],[0,1]]},
  {role:"accent",points:[[1,0],[2,1],[1,1]]},
  {role:"background",points:[[1,0],[2,0],[2,1]]},
  {role:"accent",points:[[0,1],[1,1],[1,2]]},
  {role:"background",points:[[0,1],[1,2],[0,2]]},
  {role:"accent",points:[[1,1],[2,1],[2,2],[1,2]]},
];
const SIDE: Omit<IndianPuzzlePiece,"unit">[] = [
  {role:"background",points:[[2,1],[3,0],[4,1]]},
  {role:"dark",points:[[2,0],[3,0],[2,1]]},
  {role:"dark",points:[[3,0],[4,0],[4,1]]},
  {role:"dark",points:[[2,1],[4,1],[3,2]]},
  {role:"background",points:[[2,1],[3,2],[2,2]]},
  {role:"background",points:[[4,1],[4,2],[3,2]]},
];
const CENTRE: Omit<IndianPuzzlePiece,"unit">[] = [
  {role:"background",points:[[3,2],[4,3],[3,4],[2,3]]},
  {role:"dark",points:[[2,2],[3,2],[2,3]]},
  {role:"dark",points:[[3,2],[4,2],[4,3]]},
  {role:"dark",points:[[4,3],[4,4],[3,4]]},
  {role:"dark",points:[[2,3],[3,4],[2,4]]},
];
export function indianPuzzlePieces(): IndianPuzzlePiece[] {
  const fx=([x,y]:Point):Point=>[6-x,y], fy=([x,y]:Point):Point=>[x,6-y], tr=([x,y]:Point):Point=>[y,x];
  const map=(src:Omit<IndianPuzzlePiece,"unit">[],unit:IndianPuzzlePiece["unit"],f:(p:Point)=>Point)=>src.map(p=>({...p,unit,points:p.points.map(f)}));
  return [...map(CORNER,"corner",p=>p),...map(CORNER,"corner",fx),...map(CORNER,"corner",fy),...map(CORNER,"corner",p=>fx(fy(p))),
    ...map(SIDE,"side",p=>p),...map(SIDE,"side",fy),...map(SIDE,"side",tr),...map(SIDE,"side",p=>fx(tr(p))),...map(CENTRE,"centre",p=>p)];
}
export function indianPuzzlePolygons(size:number) {
  return indianPuzzlePieces().map(p=>({...p,points:p.points.map(([x,y]):Point=>[x*size/6,y*size/6])}));
}
const up8=(n:number)=>Math.ceil(n*8-1e-9)/8;
export function indianPuzzleDimensions(block:number) {
  if (!Number.isFinite(block)||block<=0) throw new Error("Indian Puzzle requires a positive block size");
  const unit=block/3, small=block/6;
  return {unit,small,smallCut:small+.5,unitTrim:unit+.5,blockTrim:block+.5,
    hstStarter:up8(small+1),geeseLarge:up8(unit+1.5),geeseSmall:up8(small+1),
    geeseWidth:unit+.5,geeseHeight:small+.5,diamondCut:unit/Math.SQRT2+.5,settingStarter:up8(small+1)};
}
export const INDIAN_PUZZLE_COUNTS={backgroundSquares:4,accentSquares:4,cornerHsts:8,backgroundGeese:4,darkGeese:4,centreDiamonds:1,settingTriangles:4} as const;