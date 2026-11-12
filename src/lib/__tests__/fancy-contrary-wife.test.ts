import { describe, it, expect } from "vitest";
import { fancyContraryDimensions, fancyContraryPieces } from "../fancy-contrary-wife";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"fancy-contrary-wife", quiltWidth:36, quiltHeight:36, sizePreset:"custom",
  blockSize:12, fabricWidth:44, borderWidth:0, sashingWidth:0, assignments:{},
  safetyBuffer:false, fabricNames:{}, fabricPhotos:{}, cornerAccentSize:0,
  patchworkFabricCount:3, patchworkGrid:{}, pricePerYard:"", itemPrices:{},
  fabricSource:"yardage", jellyRollStripCount:40, fatQuarterWidth:18, fatQuarterHeight:21,
  fatQuarterTrimMargin:.5, fatQuarterCount:20, alternateBlocks:false, blockLayout:"straight",
  customBlock:null, customBlockB:null, useBlockB:false, customSwapPair:null,
};
const cuts=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label))??[];
const count=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>cuts(r,f,label).reduce((s,p)=>s+p.count,0);
describe("Fancy Contrary Wife reference and construction",()=> {
  it("adds a separate three-fabric pattern without replacing Contrary Wife or Nine Patch",()=> {
    const p=getPattern("fancy-contrary-wife"); if (!p) throw new Error("Missing pattern");
    expect(countBlockFabrics(p.sections)).toBe(3);
    expect(p.sections.slice(0,3).map(s=>s.defaultFabric)).toEqual(["A","B","C"]);
    expect(getPattern("contrary-wife")?.id).toBe("contrary-wife");
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
  it("preserves the whole centre, eight HSTs and four continuous-triangle hourglasses",()=> {
    const p=fancyContraryPieces(); expect(p).toHaveLength(41);
    expect(p.filter(x=>x.role==="centre").map(x=>x.points)).toEqual([[[2,2],[4,2],[4,4],[2,4]]]);
    const areas:Record<string,number>={};
    for (const x of p) {
      const a=Math.abs(x.points.reduce((s,[px,py],i)=>{const [nx,ny]=x.points[(i+1)%x.points.length];return s+px*ny-nx*py;},0))/2;
      areas[x.role]=(areas[x.role]??0)+a;
    }
    expect(areas).toEqual({background:16,dark:16,centre:4});
    expect(p.filter(x=>x.role==="dark" && x.points.length===4)).toHaveLength(4);
    expect(p[25]).toEqual({role:"dark",points:[[4,0],[4,2],[3,1]]});
    expect(p[28]).toEqual({role:"dark",points:[[0,2],[2,2],[1,3]]});
  });
  it("covers the reference block exactly once and is mirrored on both axes",()=> {
    const pieces=fancyContraryPieces();
    const roleAt=(x:number,y:number)=>pieces.filter(p=> {
      const c=p.points.map(([ax,ay],i)=>{const [bx,by]=p.points[(i+1)%p.points.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
      return c.every(v=>v>1e-8)||c.every(v=>v< -1e-8);
    }).map(p=>p.role);
    for(let y=.0341;y<6;y+=.163) for(let x=.0713;x<6;x+=.179) {
      expect(roleAt(x,y)).toHaveLength(1);
      expect(roleAt(x,y)).toEqual(roleAt(6-x,y));
      expect(roleAt(x,y)).toEqual(roleAt(x,6-y));
    }
  });
  it.each([10,12,15,18])("provides sufficient two-stage QST allowance and matching units at %s inches",block=> {
    const d=fancyContraryDimensions(block);
    expect(d.smallCut*2-.5).toBeCloseTo(d.unitTrim,12);
    expect(d.unitTrim*3-1).toBeCloseTo(d.blockTrim,12);
    // Two diagonal seam operations consume sqrt(2)/2 in blank-side length each.
    expect(d.hstStarter-Math.SQRT1_2).toBeGreaterThan(d.smallCut);
    expect(d.qstStarter-Math.SQRT1_2).toBeGreaterThan(d.qstIntermediate);
    expect(d.qstIntermediate-Math.SQRT1_2).toBeGreaterThan(d.unitTrim);
    const r=calculateYardage({...base,blockSize:block,quiltWidth:block*3,quiltHeight:block*3});
    for(const f of ["A","B"]) {
      expect(count(r,f,"Corner plain")).toBe(36);
      expect(count(r,f,"Corner HST")).toBe(36);
      expect(count(r,f,"Hourglass QST")).toBe(18);
      expect(cuts(r,f,"Corner HST")[0]?.w).toBe(d.hstStarter);
      expect(cuts(r,f,"Hourglass QST")[0]?.w).toBe(d.qstStarter);
    }
    expect(count(r,"C","Whole centre")).toBe(9);
    expect(cuts(r,"C","Whole centre")[0]?.w).toBe(d.unitTrim);
  });
  it("matches independently calculated 12-inch bolt usage",()=> {
    const r=calculateYardage(base);
    // Each A/B: 36×2.5 (17/strip =>3),36×3 (14=>3),18×5.5 (7=>3).
    for(const f of ["A","B"]) expect(r.fabrics.find(x=>x.fabric===f)?.totalInches).toBe(33);
    expect(r.fabrics.find(x=>x.fabric==="C")?.totalInches).toBe(4.5);
  });
  it("counts sashing intersections and border without changing the nine-block layout",()=> {
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{sashing:"F",border:"G"}});
    expect(count(r,"C","Whole centre")).toBe(9);
    expect(count(r,"F","Sashing strips")).toBe(12);
    expect(count(r,"F","Sashing intersection")).toBe(4);
    expect(r.fabrics.find(x=>x.fabric==="F")?.totalInches).toBe(12.5);
    expect(r.fabrics.find(x=>x.fabric==="G")?.totalInches).toBe(17.5);
  });
  it("honours all independent fabric choices and preserves counts when fabrics merge",()=> {
    const r=calculateYardage({...base,assignments:{dark:"H",background:"I",centre:"J"}});
    expect(count(r,"H","Hourglass QST")).toBe(18);
    expect(count(r,"I","Corner HST")).toBe(36);
    expect(count(r,"J","Whole centre")).toBe(9);
    const merged=calculateYardage({...base,assignments:{dark:"A",background:"A",centre:"A"}});
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum,p)=>sum+p.count,0)).toBe(189);
  });
});