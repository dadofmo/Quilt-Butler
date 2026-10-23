import { describe, it, expect } from "vitest";
import { CONTRARY_WIFE_CELLS, contraryWifePolygons } from "../contrary-wife";
import { getPattern, PATTERNS } from "../patterns";
import { rotationFor } from "../block-layouts";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "contrary-wife", quiltWidth: 48, quiltHeight: 48, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};

function signature(turns: number) {
  return contraryWifePolygons(3).map(poly => {
    const points = poly.points.map(([x0, y0]) => {
      let x = x0, y = y0;
      for (let i = 0; i < turns; i++) [x, y] = [3 - y, x];
      return `${x},${y}`;
    }).sort();
    return `${poly.role}:${points.join(";")}`;
  }).sort();
}

describe("Contrary Wife image-reference construction", () => {
  it("registers four independent standard-palette fabrics and exactly two layouts", () => {
    const p = getPattern("contrary-wife");
    expect(PATTERNS.some(p => p.id === "contrary-wife")).toBe(true);
    expect(p?.sections.map(s => s.defaultFabric)).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(p?.fabricCount).toBe(4);
    expect(p?.skill).toBe("beginner");
    expect(p?.techniques).toEqual(["squares", "hst"]);
    expect(p?.supportsAlternate).toBeUndefined();
    expect(["straight", ...(p?.layouts ?? [])]).toEqual(["straight", "alternating"]);
  });

  it("matches all nine cells and four same-slant triangle seams in the image", () => {
    expect(CONTRARY_WIFE_CELLS.map(c => [c.row, c.col, "role" in c ? c.role : c.darkCorner])).toEqual([
      [0,0,"corners"], [0,1,"bottom-right"], [0,2,"squares"],
      [1,0,"bottom-right"], [1,1,"squares"], [1,2,"top-left"],
      [2,0,"squares"], [2,1,"top-left"], [2,2,"corners"],
    ]);
    expect(contraryWifePolygons(3).filter(p => p.role === "dark").map(p => p.points)).toEqual([
      [[2,0],[2,1],[1,1]], [[1,1],[1,2],[0,2]],
      [[2,1],[3,1],[2,2]], [[1,2],[2,2],[1,3]],
    ]);
  });

  it.each([90, 200, 480])("preserves complete proportional geometry at size %s", size => {
    const polys = contraryWifePolygons(size);
    const area = polys.reduce((total, p) => total + Math.abs(p.points.reduce((a, [x,y], i) => {
      const [nx,ny] = p.points[(i+1) % p.points.length];
      return a + x*ny - nx*y;
    }, 0))/2, 0);
    expect(area).toBeCloseTo(size*size);
    expect(polys.map(p => p.points.map(([x,y]) => [x/size,y/size]))).toEqual(contraryWifePolygons(3).map(p => p.points.map(([x,y]) => [x/3,y/3])));
  });

  it("has 180-degree symmetry, but changes after a quarter turn", () => {
    expect(signature(0)).toEqual(signature(2));
    expect(signature(1)).toEqual(signature(3));
    expect(signature(0)).not.toEqual(signature(1));
    expect([0,1,2,3].map(col => rotationFor("contrary-wife", "alternating", 0, col))).toEqual([0,90,0,90]);
    expect(rotationFor("contrary-wife", "alternating", 1, 0)).toBe(90);
    expect(rotationFor("contrary-wife", "barn-raising", 0, 0)).toBe(0);
    expect(rotationFor("contrary-wife", "herringbone", 0, 1)).toBe(0);
  });

  it.each([9,12,18])("cuts five plain squares and four HST starters per %s-inch block", blockSize => {
    const result = calculateYardage({ ...base, blockSize, quiltWidth: blockSize, quiltHeight: blockSize });
    expect(result.fabrics.map(f => [f.fabric, f.pieces[0].count, f.pieces[0].w])).toEqual([
      ["A",2,blockSize/3+0.5], ["B",3,blockSize/3+0.5],
      ["C",2,blockSize/3+0.875], ["D",2,blockSize/3+0.875],
    ]);
  });

  it("packs 16 blocks using trimmed bolt width and quarter-yard rounding", () => {
    expect(calculateYardage(base).fabrics.map(f => [f.fabric,f.pieces[0].count,f.strips[0].count,f.totalInches,f.yards])).toEqual([
      ["A",32,4,18,0.5], ["B",48,6,27,0.75], ["C",32,4,19.5,0.75], ["D",32,4,19.5,0.75],
    ]);
    expect(calculateYardage({...base,safetyBuffer:true}).fabrics[0].yards).toBe(0.75);
    expect(calculateYardage({...base,fabricWidth:36}).fabrics[0].totalInches).toBe(22.5);
  });

  it("rotation never changes fabric cuts, strips, or yardage", () => {
    expect(calculateYardage({...base,blockLayout:"alternating"}).fabrics).toEqual(calculateYardage(base).fabrics);
  });

  it("fits sashing and border inside the quilt, including junction squares", () => {
    const r = calculateYardage({...base,quiltWidth:54,quiltHeight:54,borderWidth:2,sashingWidth:2});
    expect(r.fabrics[0].pieces[0].count).toBe(18);
    expect(r.fabrics.find(f => f.fabric === "E")?.pieces.map(p => [p.count,p.w,p.h])).toEqual([[12,12.5,2.5],[4,2.5,2.5]]);
    expect(r.fabrics.find(f => f.fabric === "F")?.pieces[0].label).toBe("Border strips");
    expect(calculateYardage({...base,quiltWidth:52,quiltHeight:52,borderWidth:2}).fabrics[0].pieces[0].count).toBe(32);
  });

  it("pools identical assigned fabric roles without losing starter squares", () => {
    const r = calculateYardage({...base, assignments:{corners:"G",squares:"G",light:"H",dark:"H"}});
    expect(r.fabrics.map(f => [f.fabric,f.pieces[0].count])).toEqual([["G",80],["H",64]]);
  });
});