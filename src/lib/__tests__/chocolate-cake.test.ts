import { describe, expect, it } from "vitest";
import { calculateYardage } from "@/lib/yardage";
import { getPattern } from "@/lib/patterns";
import { rotationFor } from "@/lib/block-layouts";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "chocolate-cake", quiltWidth: 12, quiltHeight: 12, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0,
  assignments: {}, safetyBuffer: false, fabricNames: {}, fabricPhotos: {},
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18,
  fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null,
  customBlockB: null, useBlockB: false, customSwapPair: null,
};

describe("Chocolate Cake reference construction", () => {
  it("keeps the four diamonds whole and the four frame bars continuous", () => {
    const result = calculateYardage(base);
    const frame = result.fabrics.find(f => f.fabric === "A");
    expect(frame?.pieces.map(p => [p.count, p.w, p.h])).toEqual([
      [4, 4 / Math.SQRT2 + 0.5, 4 / Math.SQRT2 + 0.5], [4, 4.5, 2.5],
    ]);
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[1, 4.5, 4.5]]);
    expect(frame?.totalInches).toBeCloseTo(4 / Math.SQRT2 + 3);
  });

  it("makes four geese from one large square and four wing squares, plus sixteen diamond triangles", () => {
    const result = calculateYardage(base);
    expect(result.fabrics.find(f => f.fabric === "B")?.pieces.map(p => [p.count, p.w])).toEqual([[1, 5.25]]);
    expect(result.fabrics.find(f => f.fabric === "D")?.pieces.map(p => [p.count, p.w])).toEqual([[8, 2.875], [4, 2.875]]);
    expect(result.fabrics.find(f => f.fabric === "D")?.totalInches).toBe(5.75);
  });

  it("scales the same construction to an eighteen-inch block", () => {
    const result = calculateYardage({ ...base, quiltWidth: 18, quiltHeight: 18, blockSize: 18 });
    expect(result.fabrics.find(f => f.fabric === "A")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([
      [4, 6 / Math.SQRT2 + 0.5, 6 / Math.SQRT2 + 0.5], [4, 6.5, 3.5],
    ]);
    expect(result.fabrics.find(f => f.fabric === "B")?.pieces[0].w).toBe(7.25);
    expect(result.fabrics.find(f => f.fabric === "D")?.pieces[0].w).toBe(3.875);
  });

  it("fits nine blocks and twelve between-block sashing strips into fifty inches", () => {
    const result = calculateYardage({ ...base, quiltWidth: 50, quiltHeight: 50, sashingWidth: 2 });
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces[0].count).toBe(9);
    expect(result.fabrics.find(f => f.fabric === "E")?.pieces.map(p => [p.count, p.w, p.h])).toEqual([[12, 12.5, 2.5]]);
  });

  it("preserves cuts under shared fabric assignments and ignores unsupported rotations", () => {
    const result = calculateYardage({ ...base, assignments: { frame: "G", points: "G", center: "H", background: "I" } });
    expect(result.fabrics.map(f => f.fabric).sort()).toEqual(["G", "H", "I"]);
    expect(result.fabrics.find(f => f.fabric === "G")?.pieces.reduce((n, p) => n + p.count, 0)).toBe(9);
    expect(getPattern("chocolate-cake")?.fabricCount).toBe(4);
    expect(rotationFor("chocolate-cake", "alternating", 0, 1, 3, 3)).toBe(0);
  });

  it("keeps sixteen inner blocks when a two-inch border is added", () => {
    const result = calculateYardage({ ...base, quiltWidth: 52, quiltHeight: 52, borderWidth: 2 });
    expect(result.fabrics.find(f => f.fabric === "C")?.pieces[0].count).toBe(16);
    expect(result.fabrics.find(f => f.fabric === "E")?.pieces[0].label).toBe("Border strips");
  });
});