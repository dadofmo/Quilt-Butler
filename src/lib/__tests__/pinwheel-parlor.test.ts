import { describe, it, expect } from "vitest";
import { pinwheelParlorGridPieces, pinwheelParlorDimensions } from "../pinwheel-parlor";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern:"pinwheel-parlor", quiltWidth:36, quiltHeight:36, sizePreset:"custom",
  blockSize:12, fabricWidth:44, borderWidth:0, sashingWidth:0, assignments:{},
  safetyBuffer:false, fabricNames:{}, fabricPhotos:{}, cornerAccentSize:0,
  patchworkFabricCount:3, patchworkGrid:{}, pricePerYard:"", itemPrices:{},
  fabricSource:"yardage", jellyRollStripCount:40, fatQuarterWidth:18, fatQuarterHeight:21,
  fatQuarterTrimMargin:.5, fatQuarterCount:20, alternateBlocks:false, blockLayout:"straight",
  customBlock:null, customBlockB:null, useBlockB:false, customSwapPair:null,
};
type Pt=[number,number];
const inside=([x,y]:Pt,poly:Pt[])=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
const roleAt=(pt:Pt)=>{const hits=pinwheelParlorGridPieces().filter(p=>inside(pt,p.points));expect(hits).toHaveLength(1);return hits[0].role;};
const area=(p:Pt[])=>Math.abs(p.reduce((s,[x,y],i)=>{const[x2,y2]=p[(i+1)%p.length];return s+x*y2-x2*y;},0))/2;
const total=(r:ReturnType<typeof calculateYardage>,f:string,label:string)=>r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label)).reduce((s,p)=>s+p.count,0)??0;

describe("Pinwheel Parlor",()=>{
  it("registers seven block fabrics with red and coral separate, Nine Patch still first",()=>{
    const p=getPattern("pinwheel-parlor"); if(!p) throw new Error("missing");
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(countBlockFabrics(p.sections)).toBe(7);
    expect(p.sections.find(s=>s.id==="accent")?.defaultFabric).not.toBe(p.sections.find(s=>s.id==="coral")?.defaultFabric);
  });
  it("tiles the 12 × 12 grid exactly with no overlaps",()=>{
    expect(pinwheelParlorGridPieces().reduce((s,p)=>s+area(p.points),0)).toBeCloseTo(144,9);
  });
  it("matches the reference placements",()=>{
    const expected:[Pt,string][]=[[[1,1],"dark"],[[2.4,0.4],"sky"],[[3.6,1.6],"background"],[[0.4,2.4],"sky"],[[6,0.5],"frame"],[[6,1.5],"background"],
      [[3,3],"pale"],[[2.2,2.2],"accent"],[[5,3],"background"],[[4.2,2.2],"coral"],[[6,2.2],"coral"],[[0.5,6],"frame"],[[11.5,6],"frame"],[[6,11.5],"frame"],
      [[5,4.3],"pale"],[[5.8,5],"accent"],[[5,5.8],"dark"],[[4.2,5],"sky"],[[7,4.3],"sky"],[[6.2,5],"dark"],[[7.8,5],"pale"],[[7,5.8],"accent"],
      [[7,7.8],"pale"],[[6.2,7],"accent"],[[7.8,7],"sky"],[[5,6.2],"accent"],[[4.2,7],"pale"],[[5,7.8],"sky"],[[9,9],"pale"],[[11,11],"dark"],[[9.6,11.6],"sky"],[[8.4,10.4],"background"],[[11.6,9.6],"sky"]];
    for(const [pt,role] of expected) expect(roleAt(pt),String(pt)).toBe(role);
  });
  it("uses the exact finished piece count per fabric",()=>{
    const c:Record<string,number>={}; for(const p of pinwheelParlorGridPieces()) c[p.role]=(c[p.role]??0)+1;
    // HST halves count individually; bars and squares once.
    expect(c).toEqual({dark:8,sky:12,background:20,accent:20,coral:32,frame:4,pale:8});
  });
  it.each([[12,{u:1,cellTrim:2.5,hstStarter:3,qstSquare:3.25,settingSquare:2,barLength:4.5,barWidth:1.5,blockTrim:12.5}],[18,{u:1.5,cellTrim:3.5,hstStarter:4,qstSquare:4.25,settingSquare:2.5,barLength:6.5,barWidth:2}]] as const)("dimensions at %s\"",(b,exp)=>{
    expect(pinwheelParlorDimensions(b)).toMatchObject(exp);
    const d=pinwheelParlorDimensions(b);
    expect(d.diamondCut).toBeCloseTo(2*d.u/Math.SQRT2+.5,12);
    // square-in-a-square: diamond finished side × √2 = finished cell
    expect(d.diamondFinished*Math.SQRT2).toBeCloseTo(d.cell,12);
    expect(d.hstStarter).toBeGreaterThanOrEqual(d.cell+0.875);
    expect(d.settingSquare).toBeGreaterThanOrEqual(d.u+0.875);
    expect(d.qstSquare).toBeGreaterThanOrEqual(d.cell+1.25);
  });
  it.each([9,10,15,24])("starters at %s\" stay oversized and on eighths",b=>{
    const d=pinwheelParlorDimensions(b);
    for(const v of [d.hstStarter,d.qstSquare,d.settingSquare]) expect((v*8)%1).toBeCloseTo(0,9);
    expect(d.hstStarter).toBeGreaterThanOrEqual(d.cell+0.875);
  });
  it("cuts nine 12\" blocks with no spares, red and coral apart",()=>{
    const r=calculateYardage(base);
    expect(total(r,"A","Whole corner squares")).toBe(36);
    expect(total(r,"C","HST starter")).toBe(36);
    expect(total(r,"B","HST starter")).toBe(36);
    expect(total(r,"B","Inner edge bars")).toBe(36);
    expect(total(r,"F","Outer edge bars")).toBe(36);
    expect(total(r,"B","On-point edge diamond")).toBe(72);
    expect(total(r,"G","On-point corner diamond")).toBe(36);
    expect(total(r,"D","Setting triangle")).toBe(72);
    expect(total(r,"E","Setting triangle")).toBe(144);
    for(const f of ["A","C","D","G"]) expect(total(r,f,"Pinwheel quarter")).toBe(9);
  });
});

import { thumbnailAssignments } from "../pattern-thumbnail-palette";
describe("Pinwheel Parlor picker colours",()=>{
  it("gives the outer edge bars a colour different from the corner squares and inner bars",()=>{
    const t=thumbnailAssignments("pinwheel-parlor");
    expect(t.frame).not.toBe(t.dark);
    expect(t.frame).not.toBe(t.background);
  });
  it("planning defaults keep outer bars separate from corner squares",()=>{
    const p=getPattern("pinwheel-parlor")!;
    const def=(id:string)=>p.sections.find(s=>s.id===id)!.defaultFabric;
    expect(def("frame")).not.toBe(def("dark"));
  });
});
