/** Bird Nest: 2+1+2 macro bands; nine square-in-a-square units and four pieced corners. */
export type BirdNestRole = "background" | "peach" | "dark" | "turquoise" | "mint" | "center";
export type BirdNestPoint = [number, number];
export interface BirdNestPiece { role: BirdNestRole; points: BirdNestPoint[] }
export const BIRD_NEST_DIAMONDS = [
  { col: 2, row: 0, role: "turquoise" },
  { col: 2, row: 1, role: "mint" },
  { col: 0, row: 2, role: "turquoise" },
  { col: 1, row: 2, role: "mint" },
  { col: 2, row: 2, role: "center" },
  { col: 3, row: 2, role: "mint" },
  { col: 4, row: 2, role: "turquoise" },
  { col: 2, row: 3, role: "mint" },
  { col: 2, row: 4, role: "turquoise" },
] as const;

export function birdNestGeometry(size: number): BirdNestPiece[] {
  if (!(size > 0)) throw new Error("Bird Nest requires a positive size");
  const pieces: BirdNestPiece[] = [];
  const add = (role: BirdNestRole, points: BirdNestPoint[]) => pieces.push({ role, points: points.map(([x,y]) => [x*size/5,y*size/5]) });
  for (const { col: x, row: y, role } of BIRD_NEST_DIAMONDS) {
    add(role, [[x+.5,y],[x+1,y+.5],[x+.5,y+1],[x,y+.5]]);
    add("background", [[x,y],[x+.5,y],[x,y+.5]]);
    add("background", [[x+.5,y],[x+1,y],[x+1,y+.5]]);
    add("background", [[x+1,y+.5],[x+1,y+1],[x+.5,y+1]]);
    add("background", [[x,y+.5],[x+.5,y+1],[x,y+1]]);
  }
  for (let turn=0; turn<4; turn++) {
    const rotate = ([x0,y0]: BirdNestPoint): BirdNestPoint => {
      let x=x0, y=y0;
      for (let i=0;i<turn;i++) [x,y]=[5-y,x];
      return [x,y];
    };
    const p = (role: BirdNestRole, pts: BirdNestPoint[]) => add(role,pts.map(rotate));
    p("dark", [[2,0],[2,2],[0,2]]);
    p("background", [[0,0],[1,0],[0,1]]);
    p("peach", [[1,0],[1,1],[0,1]]);
    p("background", [[1,0],[2,0],[1,1]]);
    p("background", [[0,1],[1,1],[0,2]]);
  }
  return pieces;
}

const upEighth = (n: number) => Math.ceil((n-1e-10)*8)/8;
export function birdNestDimensions(block: number) {
  if (!(block > 0)) throw new Error("Bird Nest requires a positive size");
  const unit = block/5;
  return {
    unit, unitUnfinished: unit+.5, cornerUnfinished: 2*unit+.5,
    diamondCut: unit/Math.SQRT2+.5,
    diamondTriangleStarter: upEighth(unit/2+.875),
    hstStarter: unit+.875,
    settingTriangleStarter: unit+.875,
    darkTriangleStarter: 2*unit+.875,
  };
}