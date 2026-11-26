import { describe, it, expect } from "vitest";
import { GRECIAN_SQUARE_CORNERS, GRECIAN_SQUARE_SIDES, grecianSquareDimensions, grecianSquarePolygons } from "../grecian-square";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"grecian-square", quiltWidth:36, quiltHeight:36, sizePreset:"custom",
  blockSize:12, fabricWidth:44, borderWidth:0, sashingWidth:0, assignments:{},
  safetyBuffer:false, fabricNames:{}, fabricPhotos:{}, cornerAccentSize:0,
  patchworkFabricCount:3, patchworkGrid:{}, pricePerYard:"", itemPrices:{},
  fabricSource:"yardage", jellyRollStripCount:40, fatQuarterWidth:18, fatQuarterHeight:21,
  fatQuarterTrimMargin:.5, fatQuarterCount:20, alternateBlocks:false, blockLayout:"straight",
  customBlock:null, customBlockB:null, useBlockB:false, customSwapPair:null,
};
type R = ReturnType<typeof calculateYardage>;
const cuts=(r:R,f:string,label:string)=>r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label))??[];
const count=(r:R,f:string,label:string)=>cuts(r,f,label).reduce((s,p)=>s+p.count,0);
const area=(pts:[number,number][])=>Math.abs(pts.reduce((s,[x,y],i)=>{const [nx,ny]=pts[(i+1)%pts.length];return s+x*ny-nx*y;},0))/2;
const roleAt=(x:number,y:number)=>grecianSquarePolygons(6).filter(p=>{
  const c=p.points.map(([ax,ay],i)=>{const [bx,by]=p.points[(i+1)%p.points.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
  return c.every(v=>v>1e-8)||c.every(v=>v< -1e-8);
}).map(p=>p.role);

describe("Grecian Square reference and construction",()=>{
  it("registers four block fabrics and keeps Nine Patch first",()=>{
    const p=getPattern("grecian-square"); if(!p) throw new Error("missing");
    expect(countBlockFabrics(p.sections)).toBe(4);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERNS).toHaveLength(87);
  });
  it("matches the reference: corner fabric at outside corners, dark bars outside, light bars inside, whole centre",()=>{
    expect(GRECIAN_SQUARE_CORNERS.map(c=>c.outer)).toEqual(["top-left","top-right","bottom-left","bottom-right"]);
    expect(GRECIAN_SQUARE_SIDES.map(s=>s.outside)).toEqual(["top","left","right","bottom"]);
    // 6-unit block: each cell 2. Spot-check against the reference.
    expect(roleAt(.3,.3)).toEqual(["corners"]); expect(roleAt(1.7,1.7)).toEqual(["dark"]);
    expect(roleAt(5.7,.3)).toEqual(["corners"]); expect(roleAt(4.3,1.7)).toEqual(["dark"]);
    expect(roleAt(3,.5)).toEqual(["dark"]); expect(roleAt(3,1.5)).toEqual(["light"]);
    expect(roleAt(.5,3)).toEqual(["dark"]); expect(roleAt(1.5,3)).toEqual(["light"]);
    expect(roleAt(5.5,3)).toEqual(["dark"]); expect(roleAt(4.5,3)).toEqual(["light"]);
    expect(roleAt(3,5.5)).toEqual(["dark"]); expect(roleAt(3,4.5)).toEqual(["light"]);
    expect(roleAt(3,3)).toEqual(["centre"]);
    const areas:Record<string,number>={};
    for(const p of grecianSquarePolygons(6)) areas[p.role]=(areas[p.role]??0)+area(p.points);
    expect(areas).toEqual({corners:8,dark:16,light:8,centre:4});
  });
  it("tiles the block exactly once everywhere and is mirror-symmetric",()=>{
    for(let y=.071;y<6;y+=.293) for(let x=.113;x<6;x+=.311){
      expect(roleAt(x,y)).toHaveLength(1);
      expect(roleAt(x,y)).toEqual(roleAt(6-x,y));
      expect(roleAt(x,y)).toEqual(roleAt(x,6-y));
    }
  });
  it.each([6,9,10,12,15,18])("exact unit sizes and enough HST allowance at %s inches",block=>{
    const d=grecianSquareDimensions(block);
    expect(d.unitTrim*3-1).toBeCloseTo(d.blockTrim,12);
    expect(d.barWidth*2-.5).toBeCloseTo(d.unitTrim,12); // two bars sewn = one unit
    expect(d.hstStarter-Math.SQRT2/4-d.unitTrim).toBeGreaterThanOrEqual(.1464466);
    expect(d.hstStarter*8).toBeCloseTo(Math.round(d.hstStarter*8),12);
    const r=calculateYardage({...base,blockSize:block,quiltWidth:block*3,quiltHeight:block*3});
    expect(count(r,"A","Dark HST")).toBe(18);
    expect(count(r,"D","Corner HST")).toBe(18);
    expect(count(r,"A","Outer side bars")).toBe(36);
    expect(count(r,"C","Inner side bars")).toBe(36);
    expect(count(r,"B","Whole centre")).toBe(9);
  });
  it("matches hand-calculated 12-inch cuts",()=>{
    expect(grecianSquareDimensions(12)).toEqual({unit:4,unitTrim:4.5,barWidth:2.5,barLength:4.5,hstStarter:5,blockTrim:12.5});
    const r=calculateYardage(base);
    expect(cuts(r,"B","Whole centre")[0]?.w).toBe(4.5);
    expect(cuts(r,"D","Corner HST")[0]?.w).toBe(5);
    const bar=cuts(r,"C","Inner side bars")[0];
    expect([bar?.w,bar?.h].sort()).toEqual([2.5,4.5]);
  });
  it("fits sashing with intersections and honours reassigned fabrics",()=>{
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{sashing:"G",border:"H"}});
    expect(count(r,"G","Sashing strips")).toBe(12);
    expect(count(r,"G","Sashing intersection")).toBe(4);
    const x=calculateYardage({...base,assignments:{dark:"H",corners:"I",light:"J",centre:"G"}});
    expect(count(x,"H","Outer side bars")).toBe(36);
    expect(count(x,"I","Corner HST")).toBe(18);
    expect(count(x,"J","Inner side bars")).toBe(36);
    expect(count(x,"G","Whole centre")).toBe(9);
  });
});
