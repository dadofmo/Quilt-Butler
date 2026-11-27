import { describe, expect, it } from "vitest";
import { unionSquareDimensions, unionSquarePolygons, UNION_SQUARE_COUNTS as c } from "../union-square";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import { rotationFor } from "../block-layouts";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "union-square", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  blockSize: 12, fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {},
  safetyBuffer: false, fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0,
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: 0.5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
type Result = ReturnType<typeof calculateYardage>;
const pieces = (r: Result, f: string, label: string) => r.fabrics.find(x=>x.fabric===f)?.pieces.filter(p=>p.label.startsWith(label)) ?? [];
const count = (r: Result, f: string, label: string) => pieces(r,f,label).reduce((n,p)=>n+p.count,0);
const area = (p: [number,number][]) => Math.abs(p.reduce((s,[x,y],i)=> {
  const [nx,ny]=p[(i+1)%p.length]; return s+x*ny-nx*y;
},0))/2;
function roleAt(x: number,y: number) {
  return unionSquarePolygons(6).filter(p=> {
    const cross=p.points.map(([ax,ay],i)=> {const [bx,by]=p.points[(i+1)%p.points.length];return (bx-ax)*(y-ay)-(by-ay)*(x-ax);});
    return cross.every(v=>v>1e-9)||cross.every(v=>v< -1e-9);
  }).map(p=>p.role);
}

describe("Union Square approved reference and construction",()=> {
  it("registers four adjustable block fabrics and preserves all 87 prior patterns and Nine Patch first",()=> {
    const p=getPattern("union-square"); if(!p) throw new Error("Missing pattern");
    expect(PATTERNS).toHaveLength(88); expect(PATTERNS[0].id).toBe("nine-patch");
    expect(countBlockFabrics(p.sections)).toBe(4);
    expect(p.sections.map(s=>[s.id,s.defaultFabric])).toEqual([["background","A"],["main","B"],["accent","C"],["outer","D"],["sashing","E"],["border","F"]]);
    expect(p.skill).toBe("confident"); expect(p.techniques).toEqual(["squares","hst"]);
    expect(p.layouts).toEqual(["alternating"]);
  });
  it("matches all four reference corners, including both corrected bottom-left HSTs",()=> {
    // Independent points on each side of all eight diagonals, plus whole squares.
    for(const [x,y,role] of [
      [.5,.5,"main"],[1.5,1.5,"background"],[1.8,.2,"main"],[1.2,.8,"background"],[.2,1.8,"main"],[.8,1.2,"background"],
      [5.5,.5,"main"],[4.5,1.5,"background"],[4.2,.2,"main"],[4.8,.8,"background"],[5.8,1.8,"main"],[5.2,1.2,"background"],
      [.5,5.5,"main"],[1.5,4.5,"background"],[.2,4.2,"main"],[.8,4.8,"background"],[1.8,5.8,"main"],[1.2,5.2,"background"],
      [5.5,5.5,"main"],[4.5,4.5,"background"],[5.8,4.2,"main"],[5.2,4.8,"background"],[4.2,5.8,"main"],[4.8,5.2,"background"],
    ] as [number,number,string][]) expect(roleAt(x,y),`${x},${y}`).toEqual([role]);
    expect(roleAt(3,3)).toEqual(["main"]);
  });
  it("keeps four accent bases against the centre, outer bases on the perimeter, and background flanks",()=> {
    for(const [x,y,role] of [[3,.2,"outer"],[3,1.8,"accent"],[2.2,1,"background"],[3.8,1,"background"],
      [5.8,3,"outer"],[4.2,3,"accent"],[5,2.2,"background"],[5,3.8,"background"],
      [3,5.8,"outer"],[3,4.2,"accent"],[2.2,5,"background"],[3.8,5,"background"],
      [.2,3,"outer"],[1.8,3,"accent"],[1,2.2,"background"],[1,3.8,"background"]] as [number,number,string][])
      expect(roleAt(x,y)).toEqual([role]);
  });
  it("tiles without gaps/overlaps and preserves exact 16/12/4/4 areas and 90-degree symmetry",()=> {
    const totals: Record<string,number>={};
    const polys=unionSquarePolygons(6); expect(polys).toHaveLength(41);
    for(const p of polys) totals[p.role]=(totals[p.role]??0)+area(p.points);
    expect(totals).toEqual({main:12,background:16,outer:4,accent:4});
    // Irrational offsets avoid sampling exactly on legitimate shared seam edges.
    for(let y=Math.SQRT2/37;y<6;y+=.197) for(let x=Math.sqrt(3)/31;x<6;x+=.179) {
      expect(roleAt(x,y)).toHaveLength(1); expect(roleAt(6-y,x)).toEqual(roleAt(x,y));
    }
    expect(unionSquarePolygons(300).reduce((sum,p)=>sum+area(p.points),0)).toBe(90000);
  });
  it("uses one AC and one AD starter pair and consumes every intermediate with no surplus QSTs",()=> {
    expect(c.backgroundQstStarters).toBe(2); expect(c.accentQstStarters).toBe(1); expect(c.outerQstStarters).toBe(1);
    const acIntermediates=c.accentQstStarters*2, adIntermediates=c.outerQstStarters*2;
    expect(acIntermediates).toBe(adIntermediates);
    expect(acIntermediates*2).toBe(4); expect(c.qsts).toBe(4);
    expect(c.backgroundHstStarters*2).toBe(8); expect(c.hsts).toBe(8);
  });
  it.each([6,8,9,12,15,18])("verifies exact cuts, both seam allowances and assembled fit at %s inches",block=> {
    const d=unionSquareDimensions(block), small=block/6, unit=block/3;
    expect(d.smallCut).toBe(small+.5); expect(d.unitTrim).toBe(unit+.5);
    expect(d.hstStarter).toBe(Math.ceil((small+1)*8-1e-9)/8);
    expect(d.qstStarter).toBe(Math.ceil((unit+1.5)*8-1e-9)/8);
    expect(d.qstIntermediate).toBe(unit+1);
    // An exact 1/4-inch seam parallel to the diagonal removes sqrt(2)/4
    // from the unfolded HST square side; each stage leaves room to trim.
    expect(d.hstStarter-Math.SQRT2/4-d.smallCut).toBeGreaterThan(.14);
    expect(d.qstStarter-Math.SQRT2/4-d.qstIntermediate).toBeGreaterThan(.14);
    expect(d.qstIntermediate-Math.SQRT2/4-d.unitTrim).toBeGreaterThan(.14);
    expect(2*d.smallCut-.5).toBeCloseTo(d.unitTrim,12);
    expect(3*d.unitTrim-1).toBeCloseTo(block+.5,12);
    const r=calculateYardage({...base,blockSize:block,quiltWidth:3*block,quiltHeight:3*block});
    for(const f of ["A","B"]) {
      expect(count(r,f,"Small corner squares")).toBe(36);
      expect(count(r,f,"Corner HST starter squares")).toBe(36);
      expect(pieces(r,f,"Small corner squares")[0]?.w).toBe(d.smallCut);
      expect(pieces(r,f,"Corner HST starter squares")[0]?.w).toBe(d.hstStarter);
    }
    expect(count(r,"B","Whole centre squares")).toBe(9);
    expect(pieces(r,"B","Whole centre squares")[0]?.w).toBe(d.unitTrim);
    expect(count(r,"A","Side QST starter squares")).toBe(18);
    for(const f of ["C","D"]) {expect(count(r,f,"Side QST starter squares")).toBe(9);expect(pieces(r,f,"Side QST starter squares")[0]?.w).toBe(d.qstStarter);}
  });
  it.each([[36,33,21],[48,41.5,28.5]])("matches independent strip math for 36×%s inch quilts",(height,a,b)=> {
    const r=calculateYardage({...base,quiltHeight:height});
    for(const [f,inches] of [["A",a],["B",b],["C",11],["D",11]] as [string,number][]) {
      const fabric=r.fabrics.find(x=>x.fabric===f);
      expect(fabric?.totalInches).toBe(inches); expect(fabric?.yards).toBe(Math.ceil(inches/36*4)/4);
    }
  });
  it("turns only finished blocks, leaving geometry and yardage unchanged",()=> {
    expect(rotationFor("union-square","straight",0,1)).toBe(0);
    expect(rotationFor("union-square","alternating",0,1)).toBe(90);
    expect(rotationFor("union-square","alternating",1,1)).toBe(0);
    expect(calculateYardage({...base,blockLayout:"alternating"}).fabrics).toEqual(calculateYardage(base).fabrics);
  });
  it("hand-checks sashing, intersections, border and independently reassigned fabrics",()=> {
    const r=calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3});
    expect(count(r,"E","Sashing strips")).toBe(12); expect(count(r,"E","Sashing intersection")).toBe(4);
    expect(pieces(r,"E","Sashing strips")[0]).toMatchObject({w:12.5,h:2.5});
    expect(r.fabrics.find(f=>f.fabric==="E")?.totalInches).toBe(12.5);
    expect(r.fabrics.find(f=>f.fabric==="F")?.totalInches).toBe(17.5);
    const reassigned=calculateYardage({...base,assignments:{background:"H",main:"I",accent:"J",outer:"K"}});
    expect(count(reassigned,"H","Side QST starter squares")).toBe(18);
    expect(count(reassigned,"I","Whole centre squares")).toBe(9);
    expect(count(reassigned,"J","Side QST starter squares")).toBe(9);
    expect(count(reassigned,"K","Side QST starter squares")).toBe(9);
    const shared=calculateYardage({...base,assignments:{outer:"C"}});
    expect(count(shared,"C","Side QST starter squares")).toBe(18);
    expect(pieces(shared,"C","Side QST starter squares")).toHaveLength(1);
  });
  it.each([0,-1,NaN,Infinity])("rejects invalid block size %s",block=>expect(()=>unionSquareDimensions(block)).toThrow());
});