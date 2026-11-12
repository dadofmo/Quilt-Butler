/** Reference draft: four mirrored 2×2 corners, four hourglasses, one whole centre. */
export type FancyContraryRole = "dark" | "background" | "centre";
type Point = [number, number];
export type FancyContraryPiece = { role: FancyContraryRole; points: Point[] };
export function fancyContraryPieces(): FancyContraryPiece[] {
  const corner: FancyContraryPiece[] = [
    { role: "background", points: [[0,0],[1,0],[1,1],[0,1]] },
    { role: "dark", points: [[1,1],[2,1],[2,2],[1,2]] },
    { role: "dark", points: [[1,0],[1,1],[2,1]] },
    { role: "background", points: [[1,0],[2,0],[2,1]] },
    { role: "dark", points: [[0,1],[1,1],[1,2]] },
    { role: "background", points: [[0,1],[1,2],[0,2]] },
  ];
  const result: FancyContraryPiece[] = [];
  for (const [flipX,flipY] of [[false,false],[true,false],[false,true],[true,true]]) {
    result.push(...corner.map(p=>({...p,points:p.points.map(([x,y]):Point=>[flipX?6-x:x,flipY?6-y:y])})));
  }
  for (const [x,y,horizontalDark] of [[2,0,true],[0,2,false],[4,2,false],[2,4,true]] as const) {
    const sides: Point[][] = [
      [[x,y],[x+2,y],[x+1,y+1]],
      [[x+2,y],[x+2,y+2],[x+1,y+1]],
      [[x+2,y+2],[x,y+2],[x+1,y+1]],
      [[x,y+2],[x,y],[x+1,y+1]],
    ];
    sides.forEach((points,i)=>result.push({points,role:(horizontalDark ? i%2===1 : i%2===0)?"dark":"background"}));
  }
  result.push({role:"centre",points:[[2,2],[4,2],[4,4],[2,4]]});
  return result;
}
const up8=(n:number)=>Math.ceil(n*8-1e-9)/8;
export function fancyContraryDimensions(block:number) {
  if (!Number.isFinite(block)||block<=0) throw new Error("Fancy Contrary Wife requires a positive block size");
  const small=block/6, unit=block/3;
  return {small,unit,smallCut:small+.5,unitTrim:unit+.5,
    hstStarter:up8(small+1),qstStarter:up8(unit+1.5),qstIntermediate:unit+1,blockTrim:block+.5};
}