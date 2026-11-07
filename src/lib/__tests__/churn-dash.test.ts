import { describe, it, expect } from "vitest";
import { getPattern, PATTERNS } from "@/lib/patterns";
import { churnDimensions, churnPolygons } from "../churn-dash";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "churn-dash", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const piece = (r: ReturnType<typeof calculateYardage>, fabric: string, label: string) =>
  r.fabrics.find(f => f.fabric === fabric)?.pieces.find(p => p.label === label);

describe("Churn Dash four-fabric reference", () => {
  it("defaults to four distinct block fabrics", () => {
    const p = getPattern("churn-dash");
    if (!p) throw new Error("Missing Churn Dash");
    const d = Object.fromEntries(p.sections.map((s) => [s.id, s.defaultFabric]));
    expect([d.corners, d.bg, d.bars, d.center]).toEqual(["A", "B", "C", "D"]);
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
  it("places coloured corner triangles at the inner right angles and keeps bars continuous", () => {
    const p = churnPolygons(6);
    expect(p.filter(x => x.role === "corners").map(x => x.points[0])).toEqual([[2, 2], [4, 2], [2, 4], [4, 4]]);
    expect(p.filter(x => x.role === "bars")).toHaveLength(4);
    const area = (points: [number, number][]) => Math.abs(points.reduce((a, [x,y], i) => {
      const [nx,ny] = points[(i + 1) % points.length]; return a + x * ny - nx * y;
    }, 0)) / 2;
    expect(p.reduce((a,x) => a + area(x.points), 0)).toBeCloseTo(36);
    expect(p.filter(x => x.role === "center")).toEqual([{role: "center", points: [[2,2],[4,2],[4,4],[2,4]]}]);
  });
  it.each([6, 9, 10, 12, 13.5, 18])("keeps cuts and assembled dimensions consistent at %s inches", size => {
    const d = churnDimensions(size);
    expect(2 * d.barWidth - 0.5).toBeCloseTo(d.square);
    expect(3 * d.square - 1).toBeCloseTo(size + 0.5);
    const r = calculateYardage({...base, blockSize: size, quiltWidth: size * 3, quiltHeight: size * 3});
    expect(piece(r,"A","HST corner starting squares (triangle fabric)")).toMatchObject({count:18, w:d.hst, h:d.hst});
    expect(piece(r,"B","HST corner starting squares (background)")).toMatchObject({count:18, w:d.hst});
    expect(piece(r,"C","Side bar rectangles (bar fabric)")).toMatchObject({count:36,w:d.barLength,h:d.barWidth});
    expect(piece(r,"D","Center squares")).toMatchObject({count:9,w:d.square});
  });
  it("hand-checks nine 12-inch blocks including strip packing and quarter-yard rounding", () => {
    const r = calculateYardage(base);
    expect(r.fabrics.map(f => [f.fabric,f.totalInches,f.yards])).toEqual([
      ["A",14.625,0.5], ["B",24.625,0.75], ["C",10,0.5], ["D",4.5,0.25],
    ]);
    expect(calculateYardage({...base,safetyBuffer:true}).fabrics.find(f => f.fabric === "B")?.yards).toBe(1);
  });
  it("fits sashing within the requested top and includes intersections and border", () => {
    const r = calculateYardage({...base,quiltWidth:50,quiltHeight:65,sashingWidth:2,borderWidth:0});
    expect(piece(r,"D","Center squares")?.count).toBe(12); // 3 x 4, not 4 x 5
    expect(piece(r,"E","Sashing strips between blocks")).toMatchObject({count:17,w:12.5,h:2.5});
    expect(piece(r,"E","Sashing intersection squares")).toMatchObject({count:6,w:2.5,h:2.5});
    const finished = calculateYardage({...base,quiltWidth:46,quiltHeight:46,sashingWidth:2,borderWidth:3, assignments:{border:"F"}});
    expect(piece(finished,"D","Center squares")?.count).toBe(9);
    expect(piece(finished,"E","Sashing strips between blocks")?.count).toBe(12);
    expect(piece(finished,"E","Sashing intersection squares")?.count).toBe(4);
    expect(finished.fabrics.find(f => f.fabric === "E")).toMatchObject({totalInches:12.5,yards:0.5});
    expect(finished.fabrics.find(f => f.fabric === "F")).toMatchObject({totalInches:17.5,yards:0.5});
  });
  it("preserves independent custom assignments and combined fabric counts", () => {
    const r = calculateYardage({...base,assignments:{corners:"E",bg:"D",bars:"B",center:"A"}});
    expect(piece(r,"E","HST corner starting squares (triangle fabric)")?.count).toBe(18);
    expect(piece(r,"A","Center squares")?.count).toBe(9);
    const combined = calculateYardage({...base,assignments:{corners:"A",bg:"A",bars:"A",center:"A"}});
    expect(combined.fabrics).toHaveLength(1);
    expect(combined.fabrics[0].pieces.reduce((n,p) => n+p.count,0)).toBe(117);
  });
});
