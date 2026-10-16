import { describe, expect, it } from "vitest";
import { albumFivePatchDimensions, albumFivePatchGeometry, albumFivePatchTemplates } from "@/lib/album-five-patch";
import { albumFivePatchFills } from "@/components/AlbumFivePatchBlock";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern, PATTERNS } from "@/lib/patterns";
import { EMPTY_FILTERS, filterPatterns } from "@/lib/pattern-filters";
import { calculateYardage } from "@/lib/yardage";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "album-five-patch", quiltWidth: 12, quiltHeight: 12, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0,
  assignments: {}, safetyBuffer: false, fabricNames: {}, fabricPhotos: {},
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18,
  fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null,
  customBlockB: null, useBlockB: false, customSwapPair: null,
};

describe("Album 5 Patch reference and conventional construction", () => {
  it("registers a separate three-fabric strip/HST/on-point pattern", () => {
    expect(getPattern("album-five-patch")?.name).toBe("Album 5 Patch");
    expect(getPattern("album-cross")?.name).toBe("Album Cross");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Album 5 Patch", skills: ["intermediate"], techniques: ["strips", "onpoint"], features: ["sashing"] }).map(p => p.id)).toEqual(["album-five-patch"]);
    expect(getPattern("album-five-patch")?.fabricCount).toBe(3);
  });
  it("partitions the flush block with three rails, four bars and inward corner triangles", () => {
    const pieces = albumFivePatchGeometry();
    const totals: Record<string, number> = {};
    for (const p of pieces) {
      const area = Math.abs(p.points.reduce((n, [x,y], i) => {
        const next = p.points[(i+1)%p.points.length];
        return n + x*next[1] - y*next[0];
      },0))/2;
      totals[p.role] = (totals[p.role] ?? 0)+area;
    }
    expect(totals.dark).toBeCloseTo(88/3);
    expect(totals.bars).toBeCloseTo(32);
    expect(totals.light).toBeCloseTo(116/3);
    expect(Object.values(totals).reduce((a,b)=>a+b,0)).toBeCloseTo(100);
    expect(pieces.slice(0,3).map(p => p.role)).toEqual(["dark","light","dark"]);
  });
  it("uses registry fabric defaults and respects reassignment and photo fills", () => {
    expect(albumFivePatchFills({}).fills).toEqual({ dark: fabricFill("A"), light: fabricFill("B"), bars: fabricFill("C") });
    expect(albumFivePatchFills({ bars: "J" }, { J: "photo" }).fills.bars).toBe(fabricFill("J", { J: "photo" }));
  });
  it("cuts three continuous rails and four continuous bars from rounded-up straight-grain blanks", () => {
    const r = calculateYardage(base);
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[2,7.375,2.875],[2,3.5,3.5]]);
    expect(r.fabrics.find(f => f.fabric === "B")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[1,7.375,2.875],[2,3.5,3.5],[4,3.375,3.375],[2,2.625,2.625]]);
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[4,7.375,2.25]]);
  });
  it("matches all assembled straight edges without miters, partial seams or Y-seams", () => {
    const d = albumFivePatchDimensions(12);
    expect(3*d.rail).toBeCloseTo(d.panel);
    expect(2*d.corner*Math.SQRT2).toBeCloseTo(d.panel);
    expect(d.bar*Math.SQRT2).toBeCloseTo(d.corner);
    // Two first-added bars plus panel form the same edge as each capped unit.
    expect(d.panel+2*d.bar).toBeCloseTo(3*d.corner*Math.SQRT2);
    expect((d.panel+2*d.bar)*Math.SQRT2).toBeCloseTo(14.4);
  });
  it("offsets EVERY template edge by exactly a quarter inch, including diagonal seams", () => {
    const templates = albumFivePatchTemplates(12);
    expect(templates).toHaveLength(6);
    for (const t of templates) for (let i=0; i<t.seam.length; i++) {
      const [x,y] = t.seam[i], [nx,ny] = t.seam[(i+1)%t.seam.length];
      const [cx,cy] = t.cut[i];
      const distance = ((ny-y)*(cx-x)-(nx-x)*(cy-y))/Math.hypot(nx-x,ny-y);
      expect(distance).toBeCloseTo(0.25,10);
    }
  });
  it("fits every exact rail and bar template inside its yardage blank", () => {
    for (const b of [6,12,15,18,24]) {
      const d = albumFivePatchDimensions(b);
      const ts = albumFivePatchTemplates(b);
      for (const [i,w,h] of [[0,d.railBlankLength,d.railBlankWidth],[1,d.barBlankLength,d.barBlankWidth]]) {
        const xs=ts[i].cut.map(p=>p[0]), ys=ts[i].cut.map(p=>p[1]);
        expect(Math.max(...xs)-Math.min(...xs)).toBeLessThanOrEqual(w+1e-9);
        expect(Math.max(...ys)-Math.min(...ys)).toBeLessThanOrEqual(h+1e-9);
      }
    }
  });
  it("scales an eighteen-inch block while retaining whole triangle blanks", () => {
    const r=calculateYardage({...base, blockSize:18, quiltWidth:18, quiltHeight:18});
    expect(r.fabrics.find(f=>f.fabric==="A")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[2,10.75,4],[2,4.625,4.625]]);
    expect(r.fabrics.find(f=>f.fabric==="C")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[4,10.75,3.125]]);
  });
  it("packs sixteen blocks with usable bolt width, quarter-yard rounding and safety buffer", () => {
    const state={...base,quiltWidth:48,quiltHeight:48};
    const r=calculateYardage(state);
    expect(r.fabrics.map(f=>f.totalInches)).toEqual([30.625,47.5,29.25]);
    expect(r.fabrics.map(f=>f.yards)).toEqual([1,1.5,1]);
    expect(calculateYardage({...state,safetyBuffer:true}).fabrics.map(f=>f.yards)).toEqual([1,1.5,1]);
    expect(calculateYardage({...state,fabricWidth:22}).fabrics.find(f=>f.fabric==="C")?.totalInches).toBe(72);
  });
  it("fits nine blocks, twelve between-block strips and a border within forty-four inches", () => {
    const r=calculateYardage({...base,quiltWidth:44,quiltHeight:44,sashingWidth:2,borderWidth:2});
    expect(r.fabrics.find(f=>f.fabric==="A")?.pieces[0].count).toBe(18);
    expect(r.fabrics.find(f=>f.fabric==="D")?.pieces.map(p=>[p.count,p.w,p.h])).toEqual([[12,12.5,2.5]]);
    expect(r.fabrics.find(f=>f.fabric==="E")?.strips[0].count).toBe(4);
  });
  it("preserves all cuts when fabrics share a slot", () => {
    const r=calculateYardage({...base,assignments:{dark:"J",light:"J",bars:"J"}});
    expect(r.fabrics.map(f=>f.fabric)).toEqual(["J"]);
    expect(r.fabrics[0].pieces.reduce((n,p)=>n+p.count,0)).toBe(17);
  });
});