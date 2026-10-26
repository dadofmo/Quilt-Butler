import { describe, expect, it } from "vitest";
import { kansasColorway, kansasCounts, kansasDimensions, kansasGeometry } from "../kansas-star";
import { getPattern, PATTERNS } from "../patterns";
import { calculateYardage, piecesPerStrip } from "../yardage";
import { EMPTY_FILTERS, filterPatterns } from "../pattern-filters";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "kansas-star", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom", blockSize: 12,
  fabricWidth: 44, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0, assignments: {}, safetyBuffer: false,
  fabricNames: {}, fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: .5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length]; return a + x * ny - nx * y;
}, 0)) / 2;

describe("Kansas Star reference and construction", () => {
  it("registers exactly once in the standard collection with three block fabrics", () => {
    expect(PATTERNS.filter(p => p.id === "kansas-star")).toHaveLength(1);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(getPattern("kansas-star")?.fabricCount).toBe(3);
    expect(getPattern("kansas-star")?.techniques).toEqual(["squares", "onpoint"]);
    expect(getPattern("kansas-star")?.supportsAlternate).toBeUndefined();
    expect(getPattern("kansas-star")?.layouts).toBeUndefined();
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Kansas Star" }).map(p => p.id)).toEqual(["kansas-star"]);
  });
  it.each([6, 12, 15.25])("preserves the diamond and four disjoint corners at %s inches", size => {
    for (const colorway of ["A", "B"] as const) {
      const pieces = kansasGeometry(size, colorway);
      expect(pieces).toHaveLength(5);
      expect(pieces[0].points).toEqual([[size / 2, 0], [size, size / 2], [size / 2, size], [0, size / 2]]);
      expect(pieces.map(p => p.role)).toEqual(colorway === "A" ? ["navy", "ochre", "ochre", "ochre", "ochre"] : ["ochre", "sage", "sage", "sage", "sage"]);
      expect(area(pieces[0].points)).toBeCloseTo(size * size / 2, 10);
      expect(pieces.slice(1).map(p => area(p.points))).toEqual(Array(4).fill(size * size / 8));
      expect(pieces.reduce((n, p) => n + area(p.points), 0)).toBeCloseTo(size * size, 10);
    }
  });
  it("matches the reference's five A centres, four B centres, twenty B corners and sixteen C corners", () => {
    expect(kansasCounts(3, 3)).toEqual({ a: 5, b: 4, navyCenters: 5, ochreCenters: 4, ochreTriangles: 20, sageTriangles: 16 });
    expect(Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, c) => kansasColorway(r, c)))).toEqual([["A", "B", "A"], ["B", "A", "B"], ["A", "B", "A"]]);
  });
  it.each([[4, 4, 8, 8], [3, 4, 6, 6], [5, 3, 8, 7], [4, 3, 6, 6]])("counts a %s×%s grid consistently with parity", (rows, cols, a, b) => {
    const variants = Array.from({ length: rows }, (_, r) => Array.from({ length: cols }, (_, c) => kansasColorway(r, c))).flat();
    expect(variants.filter(v => v === "A")).toHaveLength(a);
    expect(variants.filter(v => v === "B")).toHaveLength(b);
    const result = calculateYardage({ ...base, quiltWidth: cols * 12, quiltHeight: rows * 12 });
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces[0].count).toBe(a);
    expect(result.fabrics.find(f => f.fabric === "B")?.pieces.map(p => p.count)).toEqual([b, 2 * a]);
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces[0].count).toBe(2 * b);
  });
  it.each([6, 12, 15.25])("includes all cut-edge allowances at %s inches", block => {
    const d = kansasDimensions(block);
    expect((d.centerCut - .5) * Math.SQRT2).toBeCloseTo(block, 12);
    expect(d.triangleStarter).toBeGreaterThanOrEqual(block / 2 + .875);
    expect(d.triangleStarter - (block / 2 + .875)).toBeLessThan(.125);
    expect(d.unfinished - .5).toBe(block);
    const r = calculateYardage({ ...base, blockSize: block, quiltWidth: block * 3, quiltHeight: block * 3 });
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p => [p.count, p.w])).toEqual([[5, d.centerCut]]);
    expect(r.fabrics.find(f => f.fabric === "B")?.pieces.map(p => [p.count, p.w])).toEqual([[4, d.centerCut], [10, d.triangleStarter]]);
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces.map(p => [p.count, p.w])).toEqual([[8, d.triangleStarter]]);
  });
  it("pools centres and corners on the shared bolt using usable fabric width and safety rounding", () => {
    const d = kansasDimensions(12), r = calculateYardage(base);
    const b = r.fabrics.find(f => f.fabric === "B");
    const inches = Math.ceil(4 / piecesPerStrip(d.centerCut, 44)) * d.centerCut + Math.ceil(10 / piecesPerStrip(d.triangleStarter, 44)) * d.triangleStarter;
    expect(b?.totalInches).toBeCloseTo(inches, 10);
    expect(b?.yards).toBe(Math.ceil(inches / 36 * 4) / 4);
    expect(calculateYardage({ ...base, safetyBuffer: true }).fabrics.find(f => f.fabric === "B")?.yards).toBe(Math.ceil(inches * 1.1 / 36 * 4) / 4);
    expect(calculateYardage({ ...base, fabricWidth: 20 }).fabrics.find(f => f.fabric === "B")?.totalInches).toBeGreaterThan(inches);
    const pooled = calculateYardage({ ...base, assignments: { navy: "C", ochre: "C", sage: "C" } });
    expect(pooled.fabrics).toHaveLength(1);
    expect(pooled.fabrics[0].pieces.reduce((n, p) => n + p.count, 0)).toBe(27);
  });
  it("fits optional sashing and border without altering the checkerboard counts", () => {
    const r = calculateYardage({ ...base, quiltWidth: 44, quiltHeight: 44, borderWidth: 2, sashingWidth: 2 });
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces[0].count).toBe(5);
    expect(r.fabrics.find(f => f.fabric === "D")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[12, 12.5, 2.5], [4, 2.5, 2.5]]);
    expect(r.fabrics.find(f => f.fabric === "E")?.pieces[0].label).toBe("Border strips");
    expect(calculateYardage(base).fabrics.some(f => ["D", "E"].includes(f.fabric))).toBe(false);
  });
  it("ignores stale rotation and reversal settings for counts and cuts", () => {
    expect(calculateYardage({ ...base, alternateBlocks: true, blockLayout: "herringbone" }).fabrics).toEqual(calculateYardage(base).fabrics);
  });
});