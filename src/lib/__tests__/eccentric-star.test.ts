import { describe, it, expect } from "vitest";
import { ECCENTRIC_STAR_CELLS, eccentricStarDimensions, eccentricStarPolygons } from "../eccentric-star";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"eccentric-star", quiltWidth:36, quiltHeight:36, sizePreset:"custom",
  blockSize:12, fabricWidth:44, borderWidth:0, sashingWidth:0, assignments:{},
  safetyBuffer:false, fabricNames:{}, fabricPhotos:{}, cornerAccentSize:0,
  patchworkFabricCount:3, patchworkGrid:{}, pricePerYard:"", itemPrices:{},
  fabricSource:"yardage", jellyRollStripCount:40, fatQuarterWidth:18, fatQuarterHeight:21,
  fatQuarterTrimMargin:.5, fatQuarterCount:20, alternateBlocks:false, blockLayout:"straight",
  customBlock:null, customBlockB:null, useBlockB:false, customSwapPair:null,
};
const cuts=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label))??[];
const count=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>cuts(r,f,label).reduce((s,p)=>s+p.count,0);
describe("Eccentric Star reference and construction",()=> {
  it("adds a separate three-fabric pattern and keeps Nine Patch first",()=> {
    const p=getPattern("eccentric-star");
    expect(countBlockFabrics(p.sections)).toBe(3);
    expect(p.sections.slice(0,3).map(s=>s.defaultFabric)).toEqual(["A","B","C"]);
    expect(getPattern("contrary-wife").id).toBe("contrary-wife");
    expect(getPattern("fancy-contrary-wife").id).toBe("fancy-contrary-wife");
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
  it("matches all eight reference triangle orientations and the whole dark centre",()=> {
    expect(ECCENTRIC_STAR_CELLS.map(c=>"role" in c?"centre":c.darkCorner)).toEqual([
      "top-right","top-left","bottom-right","bottom-left","centre","top-right","top-left","bottom-right","bottom-left",
    ]);
    expect(ECCENTRIC_STAR_CELLS.filter(c=>"opposite" in c&&c.opposite==="background").map(c=>[c.row,c.col])).toEqual([[0,0],[0,2],[2,0],[2,2]]);
    const p=eccentricStarPolygons(3);
    expect(p).toHaveLength(17);
    expect(p.filter(x=>x.points.length===4)).toEqual([{role:"dark",points:[[1,1],[2,1],[2,2],[1,2]]}]);
    const areas:Record<string,number>={};
    for(const x of p) {
      const a=Math.abs(x.points.reduce((s,[px,py],i)=>{const [nx,ny]=x.points[(i+1)%x.points.length];return s+px*ny-nx*py;},0))/2;
      areas[x.role]=(areas[x.role]??0)+a;
    }
    expect(areas).toEqual({dark:5,background:2,points:2});
  });
  it("covers the block once and preserves quarter-turn symmetry, not mirror symmetry",()=> {
    const pieces=eccentricStarPolygons(3);
    const roleAt=(x:number,y:number)=>pieces.filter(p=> {
      const c=p.points.map(([ax,ay],i)=>{const [bx,by]=p.points[(i+1)%p.points.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
      return c.every(v=>v>1e-8)||c.every(v=>v< -1e-8);
    }).map(p=>p.role);
    for(let y=.0341;y<3;y+=.163) for(let x=.0713;x<3;x+=.179) {
      expect(roleAt(x,y)).toHaveLength(1);
      expect(roleAt(x,y)).toEqual(roleAt(3-y,x));
    }
    expect(roleAt(.75,.1)).not.toEqual(roleAt(2.25,.1));
  });
  it.each([6,9,10,12,13.5,15,18])("matches exact units and sufficient HST allowance at %s inches",block=> {
    const d=eccentricStarDimensions(block);
    expect(d.unitTrim*3-1).toBeCloseTo(d.blockTrim,12);
    // Two parallel quarter-inch diagonal seams reduce starter side by sqrt(2)/4.
    expect(d.hstStarter-Math.SQRT2/4-d.unitTrim).toBeGreaterThanOrEqual(.1464466);
    expect(d.hstStarter*8).toBeCloseTo(Math.round(d.hstStarter*8),12);
    const r=calculateYardage({...base,blockSize:block,quiltWidth:block*3,quiltHeight:block*3});
    expect(count(r,"A","Whole centre")).toBe(9);
    expect(count(r,"A","Dark HST")).toBe(36);
    expect(count(r,"B","Background HST")).toBe(18);
    expect(count(r,"C","Star-point HST")).toBe(18);
    expect(cuts(r,"A","Whole centre")[0]?.w).toBe(d.unitTrim);
    for(const [f,label] of [["A","Dark HST"],["B","Background HST"],["C","Star-point HST"]]) expect(cuts(r,f,label)[0]?.w).toBe(d.hstStarter);
  });
  it("matches hand-calculated 12-inch cuts and bolt usage",()=> {
    const r=calculateYardage(base);
    expect(eccentricStarDimensions(12)).toEqual({unit:4,unitTrim:4.5,hstStarter:5,blockTrim:12.5});
    // 42.5 usable: 9 centres at 4.5 -> one strip; 36 starters at 5 -> five strips.
    expect(r.fabrics.find(x=>x.fabric==="A")?.totalInches).toBe(29.5);
    for(const f of ["B","C"]) expect(r.fabrics.find(x=>x.fabric===f)?.totalInches).toBe(15);
  });
  it("fits nine blocks with twelve sashes, four intersections and five border strips",()=> {
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{sashing:"F",border:"G"}});
    expect(count(r,"A","Whole centre")).toBe(9);
    expect(count(r,"F","Sashing strips")).toBe(12);
    expect(count(r,"F","Sashing intersection")).toBe(4);
    expect(cuts(r,"F","Sashing strips")[0]).toMatchObject({w:12.5,h:2.5});
    expect(r.fabrics.find(x=>x.fabric==="F")?.totalInches).toBe(12.5);
    expect(r.fabrics.find(x=>x.fabric==="G")?.totalInches).toBe(17.5);
  });
  it("honours independent fabric assignments and preserves construction when merged",()=> {
    const r=calculateYardage({...base,assignments:{dark:"H",background:"I",points:"J"}});
    expect(count(r,"H","Dark HST")).toBe(36);
    expect(count(r,"I","Background HST")).toBe(18);
    expect(count(r,"J","Star-point HST")).toBe(18);
    expect(count(r,"H","Whole centre")).toBe(9);
    const merged=calculateYardage({...base,assignments:{dark:"A",background:"A",points:"A"}});
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum,p)=>sum+p.count,0)).toBe(81);
  });
  it("does not create between-block sashing for a one-block quilt",()=> {
    const r=calculateYardage({...base,quiltWidth:18,quiltHeight:18,borderWidth:3,sashingWidth:2,assignments:{sashing:"F",border:"G"}});
    expect(count(r,"A","Whole centre")).toBe(1);
    expect(r.fabrics.some(f=>f.fabric==="F")).toBe(false);
  });
});