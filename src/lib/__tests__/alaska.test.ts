import { describe, expect, it } from "vitest";
import { alaskaGeometry, type AlaskaRole } from "@/lib/alaska";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { calculateYardage } from "@/lib/yardage";
import { rotationFor } from "@/lib/block-layouts";
import { EMPTY_FILTERS, filterPatterns } from "@/lib/pattern-filters";
import { alaskaFills } from "@/components/AlaskaBlock";
import { fabricFill } from "@/lib/fabric-fill";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "alaska", quiltWidth: 12, quiltHeight: 12, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0,
  assignments: {}, safetyBuffer: false, fabricNames: {}, fabricPhotos: {},
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18,
  fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null,
  customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (points: [number, number][]) => Math.abs(points.reduce((sum, [x, y], i) => {
  const [nx, ny] = points[(i + 1) % points.length];
  return sum + x * ny - y * nx;
}, 0)) / 2;

describe("Alaska reference and registration", () => {
  it("registers Alaska separately, preserving Alaska Homestead", () => {
    expect(PATTERNS.filter(p => p.id === "alaska")).toHaveLength(1);
    expect(getPattern("alaska")?.name).toBe("Alaska");
    expect(getPattern("alaska-homestead")?.name).toBe("Alaska Homestead");
    expect(getPattern("alaska")?.sections.map(s => s.defaultFabric)).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  });
  it("is searchable and filterable as intermediate, seven-fabric diagonal piecing", () => {
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Alaska", skills: ["intermediate"], fabrics: ["4+"], techniques: ["hst", "onpoint"], features: ["sashing"] }).map(p => p.id)).toEqual(["alaska"]);
    expect(getPattern("alaska")?.fabricCount).toBe(7);
    expect(rotationFor("alaska", "alternating", 0, 1, 3, 3)).toBe(0);
  });
  it("resolves every shared preview role from registry defaults, reassignment and photos", () => {
    const pattern = getPattern("alaska");
    if (!pattern) throw new Error("Alaska missing");
    const fills = alaskaFills({}).fills;
    for (const [role, fill] of Object.entries(fills)) {
      const section = pattern.sections.find(s => s.id === role);
      if (!section) throw new Error(`Missing ${role}`);
      expect(fill).toBe(fabricFill(section.defaultFabric));
    }
    expect(alaskaFills({ dark: "J" }).fills.dark).toBe(fabricFill("J"));
    const photos = { J: "data:image/jpeg;base64,test" };
    expect(alaskaFills({ dark: "J" }, photos).fills.dark).toBe(fabricFill("J", photos));
  });
  it("partitions the entire reference into exact fabric areas", () => {
    const totals = {} as Record<AlaskaRole, number>;
    for (const p of alaskaGeometry()) totals[p.role] = (totals[p.role] ?? 0) + area(p.points);
    expect(totals).toEqual({ peach: 36, coral: 36, edge: 18, diamond: 18, cross: 16, dark: 10, light: 10 });
    expect(Object.values(totals).reduce((a, b) => a + b)).toBe(144);
  });
  it("keeps dark hourglass triangles left/right and the reference corner contrast orientation", () => {
    const pieces = alaskaGeometry();
    expect(pieces.slice(-4)).toEqual([
      { role: "light", points: [[5, 5], [7, 5], [6, 6]] },
      { role: "light", points: [[5, 7], [6, 6], [7, 7]] },
      { role: "dark", points: [[5, 5], [6, 6], [5, 7]] },
      { role: "dark", points: [[7, 5], [7, 7], [6, 6]] },
    ]);
    expect(pieces.slice(0, 8).map(p => p.role)).toEqual(["peach", "coral", "coral", "peach", "peach", "coral", "coral", "peach"]);
  });
});

describe("Alaska construction-aware cutting", () => {
  it("cuts the central four squares, four HSTs, and one hourglass at the smaller unit scale", () => {
    const r = calculateYardage(base);
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces.map(p => [p.count, p.w])).toEqual([[4, 2.5]]);
    for (const f of ["A", "B"]) expect(r.fabrics.find(row => row.fabric === f)?.pieces.map(p => [p.count, p.w])).toEqual([[2, 2.875], [1, 3.25]]);
  });
  it("cuts four outer HSTs and eight split-triangle units at the larger scale", () => {
    const r = calculateYardage(base);
    for (const f of ["D", "E"]) expect(r.fabrics.find(row => row.fabric === f)?.pieces.map(p => [p.count, p.w])).toEqual([[2, 3.875], [2, 3.875]]);
    for (const f of ["F", "G"]) expect(r.fabrics.find(row => row.fabric === f)?.pieces.map(p => [p.count, p.w])).toEqual([[2, 4.25]]);
    expect(r.fabrics.map(f => f.totalInches)).toEqual([6.125, 6.125, 2.5, 7.75, 7.75, 4.25, 4.25]);
  });
  it("rounds quarter-square blanks up for three hourglasses without counting unused triangles as units", () => {
    const r = calculateYardage({ ...base, quiltWidth: 36 });
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p => [p.count, p.w])).toEqual([[6, 2.875], [2, 3.25]]);
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces[0].count).toBe(12);
  });
  it("scales the two different grids proportionally to an eighteen-inch block", () => {
    const r = calculateYardage({ ...base, blockSize: 18, quiltWidth: 18, quiltHeight: 18 });
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces[0].w).toBe(3.5);
    expect(r.fabrics.find(f => f.fabric === "A")?.pieces.map(p => p.w)).toEqual([3.875, 4.25]);
    expect(r.fabrics.find(f => f.fabric === "D")?.pieces.map(p => p.w)).toEqual([5.375, 5.375]);
    expect(r.fabrics.find(f => f.fabric === "F")?.pieces[0].w).toBe(5.75);
  });
  it("fits nine blocks with twelve sashing strips and a two-inch border in forty-four inches", () => {
    const r = calculateYardage({ ...base, quiltWidth: 44, quiltHeight: 44, sashingWidth: 2, borderWidth: 2 });
    expect(r.fabrics.find(f => f.fabric === "C")?.pieces[0].count).toBe(36);
    expect(r.fabrics.find(f => f.fabric === "H")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[12, 12.5, 2.5]]);
    expect(r.fabrics.find(f => f.fabric === "I")?.strips[0].count).toBe(4);
  });
  it("uses trimmed bolt width, quarter-yard rounding and the ten-percent safety buffer", () => {
    const state = { ...base, quiltWidth: 48, quiltHeight: 48 };
    const r = calculateYardage(state);
    const dark = r.fabrics.find(f => f.fabric === "A");
    expect(dark?.totalInches).toBe(11.875); // ceil(32/14)*2.875 + ceil(8/13)*3.25
    expect(dark?.yards).toBe(0.5);
    expect(calculateYardage({ ...state, safetyBuffer: true }).fabrics.find(f => f.fabric === "D")?.yards).toBe(1);
    expect(calculateYardage({ ...state, fabricWidth: 22 }).fabrics.find(f => f.fabric === "A")?.totalInches).toBe(20.875);
  });
  it("preserves counts with shared and reassigned fabrics", () => {
    const r = calculateYardage({ ...base, assignments: { dark: "J", light: "J", cross: "K", peach: "L", coral: "L", diamond: "M", edge: "M" } });
    expect(r.fabrics.map(f => f.fabric)).toEqual(["J", "K", "L", "M"]);
    expect(r.fabrics.find(f => f.fabric === "J")?.pieces.reduce((n, p) => n + p.count, 0)).toBe(6);
    expect(r.fabrics.find(f => f.fabric === "L")?.pieces.reduce((n, p) => n + p.count, 0)).toBe(8);
    expect(r.fabrics.find(f => f.fabric === "M")?.pieces.reduce((n, p) => n + p.count, 0)).toBe(4);
  });
});