import { describe, expect, it } from "vitest";
import { duckAndDucklingDimensions, duckAndDucklingGeometry } from "../duck-and-duckling";
import { getPattern, PATTERNS } from "../patterns";
import { calculateYardage } from "../yardage";
import { EMPTY_FILTERS, filterPatterns } from "../pattern-filters";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "duck-and-duckling", quiltWidth: 15, quiltHeight: 15, sizePreset: "custom", blockSize: 15,
  fabricWidth: 44, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0, assignments: {}, safetyBuffer: false,
  fabricNames: {}, fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: .5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length]; return a + x * ny - nx * y;
}, 0)) / 2;
function inside(x: number, y: number, pts: [number, number][]) {
  const signs = pts.map(([px, py], i) => {
    const [nx, ny] = pts[(i + 1) % pts.length]; return (nx - px) * (y - py) - (ny - py) * (x - px);
  });
  return signs.every(v => v > 1e-9) || signs.every(v => v < -1e-9);
}
describe("Duck and Duckling reference and construction", () => {
  it("registers in the standard collection without displacing free Nine Patch", () => {
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Duck and Duckling" }).map(p => p.id)).toEqual(["duck-and-duckling"]);
    expect(getPattern("duck-and-duckling")?.fabricCount).toBe(4);
    expect(getPattern("duck-and-duckling")?.techniques).toEqual(["squares", "hst"]);
    expect(getPattern("duck-and-duckling")?.layouts).toBeUndefined();
  });
  it("preserves the reference layout: coral corner fields, ochre cross, sage accents", () => {
    const pieces = duckAndDucklingGeometry(5);
    // 4 coral triangles + 8 sage + 8 background HST halves + 9 cross squares
    // + 4 corner background squares = 29 pieces.
    expect(pieces).toHaveLength(29);
    expect(pieces.filter(p => p.role === "coral")).toHaveLength(4);
    expect(pieces.filter(p => p.role === "sage")).toHaveLength(8);
    expect(pieces.filter(p => p.role === "ochre")).toHaveLength(5);
    expect(pieces.filter(p => p.role === "background")).toHaveLength(12);
    // Each coral triangle covers half a 2×2 corner unit (area 2 grid units).
    expect(pieces.filter(p => p.role === "coral").map(p => area(p.points))).toEqual([2, 2, 2, 2]);
    // Ochre cross: four arm ends plus the solid centre.
    const ochre = pieces.filter(p => p.role === "ochre").map(p => p.points[0]);
    expect(ochre).toContainEqual([2, 2]);
    expect(ochre).toContainEqual([2, 0]);
    expect(ochre).toContainEqual([0, 2]);
    expect(ochre).toContainEqual([4, 2]);
    expect(ochre).toContainEqual([2, 4]);
  });
  it.each([5, 12, 15, 20])("tiles a %s-inch square without gaps or overlaps", size => {
    const pieces = duckAndDucklingGeometry(size);
    expect(pieces.reduce((a, p) => a + area(p.points), 0)).toBeCloseTo(size * size, 10);
    for (let row = 0; row < 71; row++) for (let col = 0; col < 73; col++) {
      const x = (col + .314159) * size / 73, y = (row + .271828) * size / 71;
      expect(pieces.filter(p => inside(x, y, p.points))).toHaveLength(1);
    }
  });
  it.each([10, 15, 20])("derives all cutting blanks for a %s-inch block", blockSize => {
    const d = duckAndDucklingDimensions(blockSize), u = blockSize / 5;
    const r = calculateYardage({ ...base, blockSize, quiltWidth: blockSize, quiltHeight: blockSize });
    const pieces = (f: string) => r.fabrics.find(p => p.fabric === f)?.pieces.map(p => [p.count, p.w]);
    expect(pieces("E")).toEqual([[2, 2 * u + .875]]);
    expect(pieces("B")).toEqual([[5, u + .5]]);
    expect(pieces("C")).toEqual([[4, u + .875]]);
    expect(pieces("D")).toEqual([[8, u + .5], [4, u + .875]]);
    expect(d.unitUnfinished).toBeCloseTo(u + .5, 12);
    expect(5 * d.unitUnfinished - 4 * .5).toBeCloseTo(blockSize + .5, 10);
  });
  it("packs blanks using usable bolt width and applies safety rounding", () => {
    const r = calculateYardage(base);
    const coral = r.fabrics.find(f => f.fabric === "E");
    expect(coral?.strips.map(s => s.count)).toEqual([1]);
    expect(coral?.totalInches).toBe(6.875);
    expect(coral?.yards).toBe(.25);
    expect(calculateYardage({ ...base, safetyBuffer: true }).fabrics.find(f => f.fabric === "E")?.yards).toBe(.25);
  });
  it("fits a 3×3 quilt with between-block sashing and a border", () => {
    const r = calculateYardage({ ...base, quiltWidth: 53, quiltHeight: 53, borderWidth: 2, sashingWidth: 2 });
    expect(r.fabrics.find(f => f.fabric === "E")?.pieces[0].count).toBe(18);
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[12, 15.5, 2.5], [4, 2.5, 2.5]]);
    expect(r.fabrics.find(f => f.fabric === "F")?.pieces[0].label).toBe("Border strips");
  });
  it("keeps all cuts when fabrics are reassigned to one shared bolt", () => {
    const assignments = Object.fromEntries(["coral", "background", "ochre", "sage"].map(id => [id, "C" as const]));
    const r = calculateYardage({ ...base, assignments });
    expect(r.fabrics).toHaveLength(1);
    expect(r.fabrics[0].pieces.reduce((a, p) => a + p.count, 0)).toBe(23);
  });
});
