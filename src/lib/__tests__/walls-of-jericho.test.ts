import { describe, it, expect } from "vitest";
import { JERICHO_CELLS, jerichoCell, jerichoPolygons } from "../walls-of-jericho";
import { getPattern, PATTERNS } from "../patterns";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "walls-of-jericho", quiltWidth: 42, quiltHeight: 42, sizePreset: "custom",
  fabricWidth: 44, blockSize: 14, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (pts: [number, number][]) => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;

describe("Walls of Jericho geometry", () => {
  it("is a 7×7 grid with 20 HSTs and a background centre", () => {
    expect(JERICHO_CELLS).toHaveLength(49);
    expect(JERICHO_CELLS.filter(c => c.kind === "hst")).toHaveLength(20);
    expect(JERICHO_CELLS.filter(c => c.kind === "arm")).toHaveLength(12);
    expect(jerichoCell(3, 3)).toMatchObject({ kind: "square", role: "background" });
  });
  it("matches the reference triangle placement in the top-left and mirrored corners", () => {
    expect(jerichoCell(0, 2)).toMatchObject({ kind: "hst", darkCorner: "bottom-right" });
    expect(jerichoCell(1, 2)).toMatchObject({ kind: "hst", darkCorner: "top-left" });
    expect(jerichoCell(2, 0)).toMatchObject({ kind: "hst", darkCorner: "bottom-right" });
    expect(jerichoCell(2, 2)).toMatchObject({ kind: "square" });
    expect(jerichoCell(0, 4)).toMatchObject({ kind: "hst", darkCorner: "bottom-left" });
    expect(jerichoCell(6, 4)).toMatchObject({ kind: "hst", darkCorner: "top-left" });
    expect(jerichoCell(4, 0)).toMatchObject({ kind: "hst", darkCorner: "top-right" });
  });
  it("tiles the block exactly with three fabric areas", () => {
    const polys = jerichoPolygons(7);
    expect(polys.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(49);
    const by = (r: string) => polys.filter(p => p.role === r).reduce((s, p) => s + area(p.points), 0);
    expect(by("cross")).toBeCloseTo(12);
    expect(by("triangles")).toBeCloseTo(10);
    expect(by("background")).toBeCloseTo(27);
    expect(new Set(polys.map(p => p.role))).toEqual(new Set(["background", "cross", "triangles"]));
  });
  it("is registered with standard fabrics and Nine Patch stays first", () => {
    const p = getPattern("walls-of-jericho")!;
    expect(p.sections.map(s => [s.id, s.defaultFabric])).toEqual([["background", "A"], ["cross", "B"], ["triangles", "C"], ["sashing", "D"], ["border", "E"]]);
    expect(p.layouts).toBeUndefined();
    expect(PATTERNS.filter(x => x.id === "walls-of-jericho")).toHaveLength(1);
  });
});

describe("Walls of Jericho cutting", () => {
  it("cuts 9 blocks of a 14-inch block correctly", () => {
    const r = calculateYardage(base);
    const A = r.fabrics.find(f => f.fabric === "A")!, B = r.fabrics.find(f => f.fabric === "B")!, C = r.fabrics.find(f => f.fabric === "C")!;
    expect(B.pieces).toEqual([{ label: "Cross arm rectangles", count: 36, w: 6.5, h: 2.5 }]);
    expect(A.pieces.find(p => p.label.startsWith("Corner outer-row"))).toMatchObject({ count: 36, w: 4.5, h: 2.5 });
    expect(A.pieces.find(p => p.label === "Background squares")).toMatchObject({ count: 81, w: 2.5 });
    expect(A.pieces.find(p => p.label.startsWith("HST"))).toMatchObject({ count: 90, w: 2.875 });
    expect(C.pieces).toEqual([expect.objectContaining({ count: 90, w: 2.875 })]);
    expect(r.notes.join(" ")).toContain("20 HSTs per block");
  });
  it("adds sashing only when requested", () => {
    const r = calculateYardage({ ...base, quiltWidth: 46, quiltHeight: 46, sashingWidth: 2 });
    const D = r.fabrics.find(f => f.fabric === "D")!;
    expect(D.pieces[0].count).toBe(12);
    expect(D.pieces[1].count).toBe(4);
    expect(calculateYardage(base).fabrics.find(f => f.fabric === "D")).toBeUndefined();
  });
});
