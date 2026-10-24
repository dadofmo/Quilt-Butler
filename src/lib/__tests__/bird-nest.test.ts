import { describe, expect, it } from "vitest";
import { BIRD_NEST_DIAMONDS, birdNestDimensions, birdNestGeometry } from "../bird-nest";
import { getPattern, PATTERNS } from "../patterns";
import { calculateYardage } from "../yardage";
import { EMPTY_FILTERS, filterPatterns } from "../pattern-filters";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"bird-nest",quiltWidth:15,quiltHeight:15,sizePreset:"custom",blockSize:15,
  fabricWidth:44,borderWidth:0,sashingWidth:0,cornerAccentSize:0,assignments:{},safetyBuffer:false,
  fabricNames:{},fabricPhotos:{},patchworkFabricCount:4,patchworkGrid:{},pricePerYard:"",itemPrices:{},
  fabricSource:"yardage",jellyRollStripCount:40,fatQuarterWidth:18,fatQuarterHeight:21,
  fatQuarterTrimMargin:.5,fatQuarterCount:20,alternateBlocks:false,blockLayout:"straight",
  customBlock:null,customBlockB:null,useBlockB:false,customSwapPair:null,
};
const area = (pts: [number,number][]) => Math.abs(pts.reduce((a,[x,y],i)=>{
  const [nx,ny]=pts[(i+1)%pts.length]; return a+x*ny-nx*y;
},0))/2;
function inside(x:number,y:number,pts:[number,number][]) {
  const signs=pts.map(([px,py],i)=>{
    const [nx,ny]=pts[(i+1)%pts.length]; return (nx-px)*(y-py)-(ny-py)*(x-px);
  });
  return signs.every(v=>v>1e-9)||signs.every(v=>v< -1e-9);
}
describe("Bird Nest reference and construction",()=>{
  it("registers in the standard collection without displacing free Nine Patch",()=>{
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(filterPatterns(PATTERNS,{...EMPTY_FILTERS,query:"Bird Nest"}).map(p=>p.id)).toEqual(["bird-nest"]);
    expect(getPattern("bird-nest")?.fabricCount).toBe(6);
    expect(getPattern("bird-nest")?.techniques).toEqual(["squares","hst","onpoint"]);
  });
  it("preserves the nine reference diamonds and separately coloured centre",()=>{
    expect(BIRD_NEST_DIAMONDS.map(d=>[d.col,d.row,d.role])).toEqual([
      [2,0,"turquoise"],[2,1,"mint"],[0,2,"turquoise"],[1,2,"mint"],[2,2,"center"],
      [3,2,"mint"],[4,2,"turquoise"],[2,3,"mint"],[2,4,"turquoise"],
    ]);
    const fields=birdNestGeometry(5).filter(p=>p.role==="dark");
    expect(fields).toHaveLength(4);
    expect(fields.map(p=>area(p.points))).toEqual([2,2,2,2]);
    expect(birdNestGeometry(5).filter(p=>p.role==="peach")).toHaveLength(4);
  });
  it.each([5,12,15,20])("tiles a %s-inch square without gaps or overlaps",size=>{
    const pieces=birdNestGeometry(size);
    expect(pieces).toHaveLength(65);
    expect(pieces.reduce((a,p)=>a+area(p.points),0)).toBeCloseTo(size*size,10);
    for(let row=0;row<71;row++) for(let col=0;col<73;col++) {
      const x=(col+.314159)*size/73,y=(row+.271828)*size/71;
      expect(pieces.filter(p=>inside(x,y,p.points))).toHaveLength(1);
    }
  });
  it.each([10,15,20])("derives all cutting blanks for a %s-inch block",blockSize=>{
    const d=birdNestDimensions(blockSize),u=blockSize/5;
    const r=calculateYardage({...base,blockSize,quiltWidth:blockSize,quiltHeight:blockSize});
    const pieces=(f:string)=>r.fabrics.find(p=>p.fabric===f)?.pieces.map(p=>[p.count,p.w]);
    expect(pieces("F")).toEqual([[4,u/Math.SQRT2+.5]]);
    expect(pieces("J")).toEqual([[4,u/Math.SQRT2+.5]]);
    expect(pieces("S")).toEqual([[1,u/Math.SQRT2+.5]]);
    expect(pieces("L")).toEqual([[2,2*u+.875]]);
    expect(pieces("E")).toEqual([[2,u+.875]]);
    expect(pieces("H")).toEqual([[18,d.diamondTriangleStarter],[2,u+.875],[4,u+.875]]);
    // Finished piece count: 9 diamonds + 36 diamond triangles + 4 HST pairs
    // (8 triangle halves) + 8 outer setting triangles + 4 dark triangles = 65.
    expect(9+18*2+2*2*2+4*2+2*2).toBe(birdNestGeometry(blockSize).length);
    expect((d.unitUnfinished*2-.5)+2*d.cornerUnfinished-1).toBeCloseTo(2*u+.5+4*u,10);
    expect(5*d.unitUnfinished-4*.5).toBeCloseTo(blockSize+.5,10);
    expect(d.diamondCut-.5).toBeCloseTo(Math.hypot(u/2,u/2),12);
  });
  it("packs blanks using usable bolt width and applies safety rounding",()=>{
    const r=calculateYardage(base);
    const h=r.fabrics.find(f=>f.fabric==="H");
    expect(h?.strips.map(s=>s.count)).toEqual([2,1,1]);
    expect(h?.totalInches).toBe(12.5);
    expect(h?.yards).toBe(.5);
    expect(calculateYardage({...base,safetyBuffer:true}).fabrics.find(f=>f.fabric==="H")?.yards).toBe(.5);
    expect(calculateYardage({...base,fabricWidth:20}).fabrics.find(f=>f.fabric==="H")?.strips[0].count).toBe(3);
  });
  it("fits a 3×3 quilt with between-block sashing and a border",()=>{
    const r=calculateYardage({...base,quiltWidth:53,quiltHeight:53,borderWidth:2,sashingWidth:2});
    expect(r.fabrics.find(f=>f.fabric==="F")?.pieces[0].count).toBe(36);
    expect(r.fabrics.find(f=>f.fabric==="A")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[12,15.5,2.5],[4,2.5,2.5]]);
    expect(r.fabrics.find(f=>f.fabric==="B")?.pieces[0].label).toBe("Border strips");
  });
  it("keeps all cuts when fabrics are reassigned to one shared bolt",()=>{
    const assignments=Object.fromEntries(["turquoise","mint","center","background","dark","peach"].map(id=>[id,"C" as const]));
    const r=calculateYardage({...base,assignments});
    expect(r.fabrics).toHaveLength(1);
    expect(r.fabrics[0].pieces.reduce((a,p)=>a+p.count,0)).toBe(39);
  });
});