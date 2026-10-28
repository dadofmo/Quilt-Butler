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
  it.each([6, 12, 15.25])("builds one block as a flush 3×3 grid of square-in-a-square units at %s inches", size => {
    const pieces = kansasGeometry(size), u = size / 3;
    expect(pieces).toHaveLength(45);
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3, unit = pieces.slice(i * 5, i * 5 + 5);
      const colorway = kansasColorway(r, c);
      expect(unit.map(p => p.role)).toEqual(colorway === "A" ? ["navy", "ochre", "ochre", "ochre", "ochre"] : ["ochre", "sage", "sage", "sage", "sage"]);
      const x = c * u, y = r * u, h = u / 2;
      expect(unit[0].points).toEqual([[x + h, y], [x + u, y + h], [x + h, y + u], [x, y + h]]);
      expect(area(unit[0].points)).toBeCloseTo(u * u / 2, 10);
      unit.slice(1).forEach(p => expect(area(p.points)).toBeCloseTo(u * u / 8, 10));
    }
    expect(pieces.reduce((n, p) => n + area(p.points), 0)).toBeCloseTo(size * size, 8);
  });
  it("matches the reference block: A units at corners and centre, B units on the sides", () => {
    expect(Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, c) => kansasColorway(r, c)))).toEqual([["A", "B", "A"], ["B", "A", "B"], ["A", "B", "A"]]);
    expect(kansasCounts(1)).toEqual({ blocks: 1, a: 5, b: 4, navyCenters: 5, ochreCenters: 4, ochreTriangles: 20, sageTriangles: 16 });
  });
  it.each([[4, 4], [3, 4], [5, 3], [1, 1]])("counts every block identically in a %s×%s quilt", (rows, cols) => {
    const n = rows * cols;
    const result = calculateYardage({ ...base, quiltWidth: cols * 12, quiltHeight: rows * 12 });
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces.map(p => p.count)).toEqual([5 * n]);
    expect(result.fabrics.find(f => f.fabric === "B")?.pieces.map(p => p.count)).toEqual([4 * n, 10 * n]);
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces.map(p => p.count)).toEqual([8 * n]);
  });
  it.each([6, 12, 15.25])("sizes units at a third of the %s inch block with all cut-edge allowances", block => {
    const d = kansasDimensions(block), u = block / 3;
    expect(d.unit).toBeCloseTo(u, 12);
    expect((d.centerCut - .5) * Math.SQRT2).toBeCloseTo(u, 12);
    expect(d.triangleStarter).toBeGreaterThanOrEqual(u / 2 + .875);
    expect(d.triangleStarter - (u / 2 + .875)).toBeLessThan(.125);
    expect(d.unitUnfinished - .5).toBeCloseTo(u, 12);
    expect(d.unfinished - .5).toBe(block);
    const r = calculateYardage({ ...base, blockSize: block, quiltWidth: block, quiltHeight: block });
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p => [p.count, p.w])).toEqual([[5, d.centerCut]]);
    expect(r.fabrics.find(f => f.fabric === "B")?.pieces.map(p => [p.count, p.w])).toEqual([[4, d.centerCut], [10, d.triangleStarter]]);
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces.map(p => [p.count, p.w])).toEqual([[8, d.triangleStarter]]);
  });
  it("tells the quilter to sew three rows of three units per block", () => {
    const notes = calculateYardage(base).notes.join(" ");
    expect(notes).toContain("3 × 3 grid of nine 4.000\" square-in-a-square units");
    expect(notes).toContain("top row A–B–A, middle row B–A–B, bottom row A–B–A");
  });
  it("pools centres and corners on the shared bolt using usable fabric width and safety rounding", () => {
    const d = kansasDimensions(12), r = calculateYardage(base);
    const b = r.fabrics.find(f => f.fabric === "B");
    const inches = Math.ceil(36 / piecesPerStrip(d.centerCut, 44)) * d.centerCut + Math.ceil(90 / piecesPerStrip(d.triangleStarter, 44)) * d.triangleStarter;
    expect(b?.totalInches).toBeCloseTo(inches, 10);
    expect(b?.yards).toBe(Math.ceil(inches / 36 * 4) / 4);
    expect(calculateYardage({ ...base, safetyBuffer: true }).fabrics.find(f => f.fabric === "B")?.yards).toBe(Math.ceil(inches * 1.1 / 36 * 4) / 4);
    expect(calculateYardage({ ...base, fabricWidth: 20 }).fabrics.find(f => f.fabric === "B")?.totalInches).toBeGreaterThan(inches);
    const pooled = calculateYardage({ ...base, assignments: { navy: "C", ochre: "C", sage: "C" } });
    expect(pooled.fabrics).toHaveLength(1);
    expect(pooled.fabrics[0].pieces.reduce((n, p) => n + p.count, 0)).toBe(9 * 27);
  });
  it("fits optional sashing and border without altering per-block counts", () => {
    const r = calculateYardage({ ...base, quiltWidth: 44, quiltHeight: 44, borderWidth: 2, sashingWidth: 2 });
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces[0].count).toBe(45);
    expect(r.fabrics.find(f => f.fabric === "D")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[12, 12.5, 2.5], [4, 2.5, 2.5]]);
    expect(r.fabrics.find(f => f.fabric === "E")?.pieces[0].label).toBe("Border strips");
    expect(calculateYardage(base).fabrics.some(f => ["D", "E"].includes(f.fabric))).toBe(false);
  });
  it("ignores stale rotation and reversal settings for counts and cuts", () => {
    expect(calculateYardage({ ...base, alternateBlocks: true, blockLayout: "herringbone" }).fabrics).toEqual(calculateYardage(base).fabrics);
  });
});