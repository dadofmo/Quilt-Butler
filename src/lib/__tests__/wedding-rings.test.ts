import { describe, expect, it } from "vitest";
import { WEDDING_ROWS, weddingCounts, weddingPolygons } from "../wedding-rings";
import { calculateYardage } from "../yardage";
import { countBlockFabrics, getPattern, PATTERNS } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "wedding-rings", quiltWidth: 45, quiltHeight: 45, sizePreset: "custom",
  fabricWidth: 44, blockSize: 15, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const piece = (r: ReturnType<typeof calculateYardage>, f: string, label: string) =>
  r.fabrics.find(x => x.fabric === f)?.pieces.find(p => p.label.startsWith(label));
const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, [x,y], i) => {
  const [nx,ny] = pts[(i+1)%pts.length]; return a+x*ny-nx*y;
},0))/2;

describe("Wedding Rings reference and construction", () => {
  it("matches all 25 reference cells and triangle orientations", () => {
    const codes = WEDDING_ROWS.map(row => row.map(c => c.kind === "square" ? c.role : `${c.partner}:${c.ringCorner}`));
    expect(codes).toEqual([
      ["accent:top-left","field:bottom-right","ring","field:bottom-left","accent:top-right"],
      ["field:bottom-right","accent:top-left","field","accent:top-right","field:bottom-left"],
      ["ring","field","ring","field","ring"],
      ["field:top-right","accent:bottom-left","field","accent:bottom-right","field:top-left"],
      ["accent:bottom-left","field:top-right","ring","field:top-left","accent:bottom-right"],
    ]);
    expect(weddingCounts()).toEqual({ringSquares:5,fieldSquares:4,fieldHst:8,accentHst:8});
  });
  it("fills the entire block with the correct fabric areas", () => {
    const polygons = weddingPolygons(5);
    expect(polygons.reduce((a,p) => a+area(p.points),0)).toBeCloseTo(25);
    for (const [role,total] of [["ring",13],["field",8],["accent",4]] as const)
      expect(polygons.filter(p=>p.role===role).reduce((a,p)=>a+area(p.points),0)).toBeCloseTo(total);
  });
  it("registers three block fabrics and preserves Nine Patch first", () => {
    const p = getPattern("wedding-rings");
    expect(countBlockFabrics(p?.sections ?? [])).toBe(3);
    expect(p?.sections.slice(0,3).map(s=>s.defaultFabric)).toEqual(["B","A","C"]);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERNS.some(pattern => pattern.id === "wedding-rings")).toBe(true);
  });
  it.each([[10,2.5,2.875],[12,2.9,3.375],[15,3.5,3.875],[18,4.1,4.5]])("scales exact squares and safely rounded HST starters at %s inches", (size,sq,hst) => {
    const r = calculateYardage({...base,blockSize:size,quiltWidth:size*3,quiltHeight:size*3});
    expect(piece(r,"B","Plain squares")).toMatchObject({count:45,w:sq,h:sq});
    expect(piece(r,"A","Plain squares")).toMatchObject({count:36,w:sq,h:sq});
    expect(piece(r,"B","HST starting")).toMatchObject({count:72,w:hst,h:hst});
    expect(piece(r,"A","HST starting")).toMatchObject({count:36,w:hst});
    expect(piece(r,"C","HST starting")).toMatchObject({count:36,w:hst});
    expect(5*sq-4*0.5).toBeCloseTo(size+0.5);
    expect(hst).toBeGreaterThanOrEqual(size/5+0.875-1e-9);
  });
  it("hand-checks nine 15-inch blocks and usable-width strip totals", () => {
    const r=calculateYardage(base);
    // 42.5 usable inches: 12 plain squares or 10 HST starters per strip.
    expect(r.fabrics.map(f=>[f.fabric,f.totalInches,f.yards])).toEqual([
      ["A",26,0.75],["B",45,1.25],["C",15.5,0.5],
    ]);
    expect(calculateYardage({...base,safetyBuffer:true}).fabrics.find(f=>f.fabric==="B")?.yards).toBe(1.5);
  });
  it("fits sashing, cuts intersections, and accounts for the border", () => {
    const r=calculateYardage({...base,blockSize:12,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3,assignments:{border:"E"}});
    expect(piece(r,"B","Plain squares")?.count).toBe(45);
    expect(piece(r,"D","Sashing strips")).toMatchObject({count:12,w:12.5,h:2.5});
    expect(piece(r,"D","Sashing intersection")).toMatchObject({count:4,w:2.5,h:2.5});
    expect(r.fabrics.find(f=>f.fabric==="D")).toMatchObject({totalInches:12.5,yards:0.5});
    expect(r.fabrics.find(f=>f.fabric==="E")).toMatchObject({totalInches:17.5,yards:0.5});
    const fit=calculateYardage({...base,blockSize:12,quiltWidth:50,quiltHeight:65,sashingWidth:2});
    expect(piece(fit,"B","Plain squares")?.count).toBe(60);
    expect(piece(fit,"D","Sashing strips")?.count).toBe(17);
    expect(piece(fit,"D","Sashing intersection")?.count).toBe(6);
  });
  it("respects independent assignments and combines shared-fabric tallies", () => {
    const r=calculateYardage({...base,assignments:{ring:"E",field:"D",accent:"A"}});
    expect(piece(r,"E","Plain squares")?.count).toBe(45);
    expect(piece(r,"D","HST starting")?.count).toBe(36);
    const merged=calculateYardage({...base,assignments:{ring:"A",field:"A",accent:"A"}});
    expect(merged.fabrics).toHaveLength(1);
    expect(piece(merged,"A","Plain squares")?.count).toBe(81);
    expect(piece(merged,"A","HST starting")?.count).toBe(144);
  });
});