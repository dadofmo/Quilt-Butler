/** Reference draft: 8×8, assembled as 2+4+2 bands, not uniform cells. */
export type EightHandsRole = "outer" | "background" | "inner" | "center";
type Pt = [number, number];
export type EightHandsPolygon = { role: EightHandsRole; points: Pt[] };
export const EIGHT_HANDS_COUNTS = { cornerHsts: 4, outerGeese: 4, innerGeese: 4, smallSquares: 4, centers: 1 } as const;
export function eightHandsDimensions(blockSize: number) {
  const u = blockSize / 8;
  const up = (n: number) => Math.ceil(n * 8 - 1e-9) / 8;
  // Oversized four-at-a-time starters: preserve the large/small relationship.
  const innerSmall = up(u + 1), outerSmall = up(2 * u + 1);
  return { u, smallSquare: u + .5, center: 2 * u + .5,
    corner: 2 * u + .5, hstStarter: up(2 * u + 1),
    innerSmall, innerLarge: 2 * innerSmall - .5,
    outerSmall, outerLarge: 2 * outerSmall - .5,
    innerWidth: 2 * u + .5, innerHeight: u + .5,
    outerWidth: 4 * u + .5, outerHeight: 2 * u + .5,
    middle: 4 * u + .5, unfinished: blockSize + .5 };
}
export function eightHandsPolygons(size: number): EightHandsPolygon[] {
  const p: EightHandsPolygon[] = [];
  const square = (role: EightHandsRole, x: number, y: number, w: number) =>
    p.push({ role, points: [[x,y],[x+w,y],[x+w,y+w],[x,y+w]] });
  // Rotate top units around the block centre; precompute coordinates so photos
  // share one fabric plane rather than rotating a print inside each unit.
  const rotate = ([x,y]: Pt, turns: number): Pt => {
    for (let i=0;i<turns;i++) [x,y]=[8-y,x];
    return [x,y];
  };
  const goose = (x: number, y: number, w: number, h: number, wing: "outer" | "inner", t: number) => {
    const tl: Pt=[x,y], tr: Pt=[x+w,y], bl: Pt=[x,y+h], br: Pt=[x+w,y+h], tip: Pt=[x+w/2,y+h];
    for (const poly of [
      {role:"background" as const,points:[tl,tr,tip]},
      {role:wing,points:[tl,tip,bl]}, {role:wing,points:[tr,br,tip]},
    ]) p.push({...poly,points:poly.points.map(pt=>rotate(pt,t))});
  };
  for (let t=0;t<4;t++) {
    p.push({role:"outer",points:([[0,0],[2,0],[0,2]] as Pt[]).map(pt=>rotate(pt,t))});
    p.push({role:"background",points:([[2,0],[2,2],[0,2]] as Pt[]).map(pt=>rotate(pt,t))});
    goose(2,0,4,2,"outer",t);
    goose(3,2,2,1,"inner",t);
  }
  for (const [x,y] of [[2,2],[5,2],[2,5],[5,5]]) square("background",x,y,1);
  square("center",3,3,2);
  return p.map(poly=>({...poly,points:poly.points.map(([x,y])=>[x*size/8,y*size/8])}));
}