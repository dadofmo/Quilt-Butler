import { describe, expect, it } from "vitest";
import { countryRoadsCell, countryRoadsPolygons, COUNTRY_ROADS_CELLS } from "../country-roads";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "country-roads", quiltWidth: 42, quiltHeight: 42, sizePreset: "custom",
  blockSize: 14, fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {},
  safetyBuffer: false, fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0,
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: .5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
const total = (r: ReturnType<typeof calculateYardage>, f: string, label: string) =>
  (r.fabrics.find(x => x.fabric === f)?.pieces ?? []).filter(p => p.label.startsWith(label)).reduce((a, p) => a + p.count, 0);
const area = (pts: [number, number][]) => Math.abs(pts.reduce((a, [x, y], i) => {
  const [nx, ny] = pts[(i + 1) % pts.length]; return a + x * ny - nx * y;
}, 0)) / 2;

describe("Country Roads", () => {
  it("registers four block fabrics with centre C and corners D, Nine Patch still first", () => {
    const p = getPattern("country-roads")!;
    expect(Object.fromEntries(p.sections.map(s => [s.id, s.defaultFabric]))).toMatchObject({ main: "A", light: "B", centre: "C", corners: "D" });
    expect(countBlockFabrics(p.sections)).toBe(4);
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
  it("matches the reference cell map", () => {
    expect(countryRoadsCell(3, 3)).toMatchObject({ kind: "square", role: "centre" });
    for (const [r, c] of [[0, 0], [0, 6], [6, 0], [6, 6]]) expect(countryRoadsCell(r, c)).toMatchObject({ role: "corners" });
    expect(countryRoadsCell(0, 1)).toMatchObject({ kind: "hst", darkCorner: "top-right" });
    expect(countryRoadsCell(1, 0)).toMatchObject({ kind: "hst", darkCorner: "bottom-left" });
    expect(countryRoadsCell(0, 5)).toMatchObject({ kind: "hst", darkCorner: "top-left" });
    expect(countryRoadsCell(6, 5)).toMatchObject({ kind: "hst", darkCorner: "bottom-left" });
    expect(COUNTRY_ROADS_CELLS.filter(c => c.kind === "hst")).toHaveLength(16);
    expect(COUNTRY_ROADS_CELLS.filter(c => c.kind === "square" && c.role === "main")).toHaveLength(16);
    const areas: Record<string, number> = {};
    for (const p of countryRoadsPolygons(7)) areas[p.role] = (areas[p.role] ?? 0) + area(p.points);
    expect(areas).toEqual({ main: 24, light: 20, centre: 1, corners: 4 });
  });
  it("cuts the right pieces for nine 14-inch blocks", () => {
    const r = calculateYardage(base);
    expect(total(r, "B", "Road bars")).toBe(36);
    expect(total(r, "C", "Centre squares")).toBe(9);
    expect(total(r, "D", "Block corner squares")).toBe(36);
    expect(total(r, "A", "Corner-unit squares")).toBe(144);
    expect(total(r, "A", "HST starting squares")).toBe(72);
    expect(total(r, "B", "HST starting squares")).toBe(72);
    const bar = r.fabrics.find(f => f.fabric === "B")!.pieces.find(p => p.label.startsWith("Road bars"))!;
    expect([bar.w, bar.h].sort()).toEqual([2.5, 6.5]);
    expect(r.notes.join(" ")).toContain('2.875"');
  });
  it("adds sashing strips and intersections when sashed", () => {
    const r = calculateYardage({ ...base, quiltWidth: 46, quiltHeight: 46, blockSize: 14, sashingWidth: 2, assignments: {} });
    expect(total(r, "E", "Sashing strips")).toBe(12);
    expect(total(r, "E", "Sashing intersection")).toBe(4);
  });
});
