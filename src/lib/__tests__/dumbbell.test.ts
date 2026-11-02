import { describe, it, expect } from "vitest";
import { dumbbellPolygons, dumbbellDimensions } from "../dumbbell";
import { PATTERNS, PATTERN_META } from "../patterns";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "dumbbell", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
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

describe("Dumbbell geometry", () => {
  it("tiles the 6×6 block with the reference fabric areas", () => {
    const polys = dumbbellPolygons(6);
    const by = (r: string) => polys.filter(p => p.role === r).reduce((s, p) => s + area(p.points), 0);
    expect(polys.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(36);
    // main: 4 squares + 12 half-cells + 4 geese (1 each) + diamond (2)
    expect(by("main")).toBeCloseTo(4 + 6 + 4 + 2);
    expect(by("accent")).toBeCloseTo(4); // 8 wings of 1/2
    expect(by("background")).toBeCloseTo(36 - 16 - 4);
  });
  it("is mirror symmetric", () => {
    const key = (ps: [number, number][]) => ps.map(p => p.join(",")).sort().join("|");
    const polys = dumbbellPolygons(6);
    const set = new Set(polys.map(p => p.role + key(p.points)));
    for (const p of polys) expect(set.has(p.role + key(p.points.map(([x, y]) => [6 - x, y] as [number, number])))).toBe(true);
  });
  it("sizes pieces from 2-inch units for a 12-inch block", () => {
    const d = dumbbellDimensions(12);
    expect(d).toMatchObject({ unit: 2, square: 2.5, hstStarter: 2.875, geeseLarge: 5.25, geeseSmall: 2.875, settingStarter: 2.875 });
    expect(d.centreCut).toBeCloseTo(2 * Math.SQRT2 + 0.5);
  });
  it("is registered with three fabrics and Nine Patch first", () => {
    expect(PATTERNS.some(p => p.id === "dumbbell")).toBe(true);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERN_META.dumbbell.fabricCount).toBe(3);
  });
});

describe("Dumbbell cutting (9 blocks)", () => {
  it("cuts per the four-at-a-time and two-at-a-time methods", () => {
    const r = calculateYardage(base);
    expect(piece(r, "B", "Corner squares")).toMatchObject({ count: 36, w: 2.5 });
    expect(piece(r, "B", "HST starting")?.count).toBe(54);
    expect(piece(r, "A", "HST starting")?.count).toBe(54);
    expect(piece(r, "B", "Flying geese large")?.count).toBe(9);
    expect(piece(r, "A", "Flying geese large")?.count).toBe(9);
    expect(piece(r, "A", "Flying geese small")?.count).toBe(36);
    expect(piece(r, "C", "Flying geese small")?.count).toBe(36);
    expect(piece(r, "B", "Centre diamond")?.count).toBe(9);
    expect(piece(r, "A", "Centre setting")?.count).toBe(18);
    expect(r.fabrics.find(f => f.fabric === "D")).toBeFalsy();
  });
});
