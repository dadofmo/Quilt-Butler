import { describe, it, expect } from "vitest";
import { FOOLS_CELLS, foolsCell, foolsPolygons, foolsCounts } from "../fools-square";
import { PATTERNS } from "../patterns";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "fools-square", quiltWidth: 45, quiltHeight: 45, sizePreset: "custom",
  fabricWidth: 44, blockSize: 15, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (pts: [number, number][]) => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
const piece = (r: ReturnType<typeof calculateYardage>, f: string, label: string) =>
  r.fabrics.find(x => x.fabric === f)?.pieces.find(p => p.label.startsWith(label));

describe("Fool's Square geometry", () => {
  it("matches the reference 5×5 map", () => {
    expect(FOOLS_CELLS).toHaveLength(25);
    expect(foolsCell(2, 2)).toMatchObject({ kind: "square", role: "accent" });
    expect(foolsCell(0, 0)).toMatchObject({ kind: "hst", role: "accent", darkCorner: "top-left" });
    expect(foolsCell(4, 4)).toMatchObject({ kind: "hst", role: "accent", darkCorner: "bottom-right" });
    expect(foolsCell(0, 1)).toMatchObject({ kind: "hst", role: "points", darkCorner: "bottom-left" });
    expect(foolsCell(1, 0)).toMatchObject({ kind: "hst", role: "points", darkCorner: "top-right" });
    expect(foolsCell(3, 4)).toMatchObject({ kind: "hst", role: "points", darkCorner: "bottom-left" });
    expect(foolsCell(1, 1)).toMatchObject({ kind: "square", role: "points" });
    expect(foolsCell(1, 2)).toMatchObject({ kind: "square", role: "cross" });
    expect(foolsCell(0, 2)).toMatchObject({ kind: "square", role: "background" });
  });
  it("tiles flush with the right fabric areas", () => {
    const polys = foolsPolygons(5);
    const by = (r: string) => polys.filter(p => p.role === r).reduce((s, p) => s + area(p.points), 0);
    expect(polys.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(25);
    expect(by("background")).toBeCloseTo(4 + 6);
    expect(by("points")).toBeCloseTo(4 + 4);
    expect(by("cross")).toBeCloseTo(4);
    expect(by("accent")).toBeCloseTo(1 + 2);
  });
  it("counts 13 squares and 12 HSTs", () => {
    expect(foolsCounts()).toEqual({ backgroundSquares: 4, pointSquares: 4, crossSquares: 4, accentSquares: 1, pointHst: 8, accentHst: 4 });
  });
  it("keeps Nine Patch first", () => {
    expect(PATTERNS.find(p => p.id === "fools-square")).toBeTruthy();
  });
});

describe("Fool's Square cutting", () => {
  it("cuts 9 blocks of 15 inches (3-inch units)", () => {
    const r = calculateYardage(base);
    expect(piece(r, "A", "Plain squares")).toMatchObject({ count: 36, w: 3.5 });
    expect(piece(r, "A", "HST starting")).toMatchObject({ count: 54, w: 3.875 });
    expect(piece(r, "B", "Plain squares")?.count).toBe(36);
    expect(piece(r, "B", "HST starting")?.count).toBe(36);
    expect(piece(r, "C", "Plain squares")?.count).toBe(36);
    expect(piece(r, "D", "Plain squares")?.count).toBe(9);
    expect(piece(r, "D", "HST starting")?.count).toBe(18);
  });
  it("adds sashing only when requested", () => {
    expect(calculateYardage(base).fabrics.find(f => f.fabric === "E")).toBeFalsy();
    const r = calculateYardage({ ...base, quiltWidth: 49, quiltHeight: 49, sashingWidth: 2 });
    expect(piece(r, "E", "Sashing strips")?.count).toBe(12);
  });
});
