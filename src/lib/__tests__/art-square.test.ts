import { describe, expect, it } from "vitest";
import { artSquareDimensions, artSquareGeometry, artSquareTemplates } from "@/lib/art-square";
import { artSquareFills } from "@/components/ArtSquareBlock";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern, PATTERNS } from "@/lib/patterns";
import { EMPTY_FILTERS, filterPatterns } from "@/lib/pattern-filters";
import { calculateYardage } from "@/lib/yardage";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "art-square", quiltWidth: 12, quiltHeight: 12, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0,
  assignments: {}, safetyBuffer: false, fabricNames: {}, fabricPhotos: {},
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18,
  fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null,
  customBlockB: null, useBlockB: false, customSwapPair: null,
};

describe("Art Square three-fabric reference and construction", () => {
  it("registers independent A centre, B background and C corners", () => {
    expect(getPattern("art-square")?.sections.slice(0,3).map(s=>[s.id,s.defaultFabric])).toEqual([
      ["center","A"],["background","B"],["corners","C"],
    ]);
    expect(filterPatterns(PATTERNS, {...EMPTY_FILTERS, query:"Art Square", skills:["confident"], techniques:["onpoint"], features:["sashing"]}).map(p=>p.id)).toEqual(["art-square"]);
    expect(getPattern("art-square")?.fabricCount).toBe(3);
  });
  it("partitions the block into one midpoint diamond, four corner squares and eight triangles", () => {
    const pieces=artSquareGeometry();
    expect(pieces[0].points).toEqual([[2,0],[4,2],[2,4],[0,2]]);
    expect(pieces.filter(p=>p.role==="corners")).toHaveLength(4);
    expect(pieces.filter(p=>p.role==="background")).toHaveLength(8);
    const totals: Record<string,number> = {};
    for (const p of pieces) {
      const area=Math.abs(p.points.reduce((sum,[x,y],i)=>{
        const [nx,ny]=p.points[(i+1)%p.points.length];
        return sum+x*ny-y*nx;
      },0))/2;
      totals[p.role]=(totals[p.role]??0)+area;
    }
    expect(totals).toEqual({center:8,corners:4,background:4});
    // Interior sample points must belong to exactly one piece: no gaps/overlap.
    for (let x=0.037; x<4; x+=Math.SQRT2/10) for (let y=0.053; y<4; y+=Math.sqrt(3)/10) {
      const inside=pieces.filter(p=>p.points.every(([px,py],i)=>{
        const [nx,ny]=p.points[(i+1)%p.points.length];
        return (nx-px)*(y-py)-(ny-py)*(x-px)>1e-9;
      }));
      expect(inside).toHaveLength(1);
    }
  });
  it("reassigns corners and photos independently without repainting the centre", () => {
    expect(artSquareFills({}).fills).toEqual({center:fabricFill("A"),background:fabricFill("B"),corners:fabricFill("C")});
    expect(artSquareFills({corners:"J"},{J:"photo"}).fills).toEqual({center:fabricFill("A"),background:fabricFill("B"),corners:fabricFill("J",{J:"photo"})});
  });
  it("cuts one continuous centre, four corners and four diagonal-split starting squares", () => {
    const r=calculateYardage(base);
    expect(r.fabrics.find(f=>f.fabric==="A")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[1,9,9]]);
    expect(r.fabrics.find(f=>f.fabric==="B")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[4,3.875,3.875]]);
    expect(r.fabrics.find(f=>f.fabric==="C")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[4,3.5,3.5]]);
  });
  it("matches setting-unit hypotenuses to the centre and provides true seam offsets at multiple sizes", () => {
    for (const b of [6,10,12,15.5,18,24]) {
      const d=artSquareDimensions(b);
      expect(2*d.corner*Math.SQRT2).toBeCloseTo(d.center);
      expect(d.centerBlank).toBeGreaterThanOrEqual(d.center+0.5);
      expect(d.cornerBlank).toBeGreaterThanOrEqual(d.corner+0.5);
      expect(d.backgroundBlank).toBeGreaterThanOrEqual(d.corner+0.5+Math.SQRT2/4);
      for (const t of artSquareTemplates(b)) for (let i=0;i<t.seam.length;i++) {
        const [x,y]=t.seam[i], [nx,ny]=t.seam[(i+1)%t.seam.length], [cx,cy]=t.cut[i];
        expect(((ny-y)*(cx-x)-(nx-x)*(cy-y))/Math.hypot(nx-x,ny-y)).toBeCloseTo(0.25,10);
      }
    }
  });
  it("packs sixteen blocks using usable fabric width, quarter-yard rounding and buffer", () => {
    const state={...base,quiltWidth:48,quiltHeight:48};
    const r=calculateYardage(state);
    expect(r.fabrics.map(f=>f.totalInches)).toEqual([36,27.125,21]);
    expect(r.fabrics.map(f=>f.yards)).toEqual([1,1,0.75]);
    expect(calculateYardage({...state,safetyBuffer:true}).fabrics.map(f=>f.yards)).toEqual([1.25,1,0.75]);
    expect(calculateYardage({...state,fabricWidth:22}).fabrics[0].totalInches).toBe(72);
  });
  it("fits nine blocks with twelve between-block sashing strips and optional border", () => {
    const r=calculateYardage({...base,quiltWidth:44,quiltHeight:44,sashingWidth:2,borderWidth:2});
    expect(r.fabrics.find(f=>f.fabric==="A")?.pieces[0].count).toBe(9);
    expect(r.fabrics.find(f=>f.fabric==="D")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[12,12.5,2.5]]);
    expect(r.fabrics.find(f=>f.fabric==="E")?.strips[0].count).toBe(4);
  });
  it("keeps all cuts when users deliberately share fabric slots", () => {
    const r=calculateYardage({...base,assignments:{center:"J",background:"J",corners:"J"}});
    expect(r.fabrics.map(f=>f.fabric)).toEqual(["J"]);
    expect(r.fabrics[0].pieces.reduce((n,p)=>n+p.count,0)).toBe(9);
  });
});