import { describe, it, expect } from "vitest";
import { calculateYardage } from "@/lib/yardage";
import { getPattern } from "@/lib/patterns";
import { rotationFor } from "@/lib/block-layouts";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "attic-window", quiltWidth: 48, quiltHeight: 48, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};

describe("Attic Window reference construction", () => {
  it("cuts a two-thirds pane and continuous one-third shadows for each block", () => {
    const result = calculateYardage(base);
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces).toEqual([
      { label: "Pane squares", count: 16, w: 8.5, h: 8.5 },
    ]);
    for (const key of ["B", "C"]) {
      const f = result.fabrics.find(f => f.fabric === key);
      expect(f?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[16, 8.5, 4.5], [8, 4.875, 4.875]]);
      expect(f?.totalInches).toBe(22.875);
    }
    expect(result.fabrics.find(f => f.fabric === "A")?.totalInches).toBe(34);
  });

  it("rounds odd miter counts up to complete two-at-a-time pairs", () => {
    const result = calculateYardage({ ...base, quiltWidth: 36, quiltHeight: 36 });
    expect(result.fabrics.find(f => f.fabric === "B")?.pieces.map(p => p.count)).toEqual([9, 5]);
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces.map(p => p.count)).toEqual([9, 5]);
  });

  it("fits sashing inside the requested size and cuts only between-block strips", () => {
    const result = calculateYardage({ ...base, quiltWidth: 50, quiltHeight: 50, sashingWidth: 2 });
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces[0].count).toBe(9);
    expect(result.fabrics.find(f => f.fabric === "D")?.pieces).toEqual([
      { label: "Sashing strips between blocks", count: 12, w: 12.5, h: 2.5 },
    ]);
    expect(calculateYardage(base).fabrics.some(f => f.fabric === "D")).toBe(false);
  });

  it("honours reassignment, shared fabric roles, and registry defaults", () => {
    expect(getPattern("attic-window")?.sections.map(s => s.defaultFabric)).toEqual(["A", "B", "C", "D", "E"]);
    const result = calculateYardage({ ...base, assignments: { pane: "F", casing: "G", sill: "G" } });
    expect(result.fabrics.map(f => f.fabric)).toEqual(["F", "G"]);
    expect(result.fabrics.find(f => f.fabric === "G")?.pieces.reduce((n, p) => n + p.count, 0)).toBe(48);
  });

  it("preserves the top-right pane direction even with stale rotation settings", () => {
    expect(rotationFor("attic-window", "alternating", 0, 1, 4, 4)).toBe(0);
    expect(rotationFor("attic-window", "herringbone", 0, 2, 4, 4)).toBe(0);
  });

  it("keeps block cuts unchanged when a border is added around the same inner grid", () => {
    const result = calculateYardage({ ...base, quiltWidth: 52, quiltHeight: 52, borderWidth: 2 });
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces[0].count).toBe(16);
    expect(result.fabrics.some(f => f.fabric === "E")).toBe(true);
  });
});