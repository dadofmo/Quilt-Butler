import { describe, it, expect } from "vitest";
import { optimizeGrid } from "../grid-optimizer";
import { calculateYardage } from "../yardage";
import type { FabricKey } from "../planner-store";

const unitInches = (count: number, cutLen: number, cutH: number, width = 42) => {
  const per = Math.max(1, Math.floor((width - 1.5) / cutLen));
  return Math.ceil(count / per) * cutH;
};

describe("optimizeGrid", () => {
  it("merges a 1×4 row into one strip", () => {
    const p = optimizeGrid([["A", "A", "A", "A"]], 3);
    expect(p).toEqual([{ fabric: "A", cellsW: 4, cellsH: 1, cutW: 12.5, cutH: 3.5, count: 1 }]);
    // 20 blocks: 20 strips vs 80 squares
    expect(unitInches(20, 12.5, 3.5)).toBeLessThan(unitInches(80, 3.5, 3.5));
  });
  it("merges a 2×2 into one large square", () => {
    const p = optimizeGrid([["A", "A"], ["A", "A"]], 3);
    expect(p).toEqual([{ fabric: "A", cellsW: 2, cellsH: 2, cutW: 6.5, cutH: 6.5, count: 1 }]);
  });
  it("keeps different/non-adjacent fabrics separate and never makes L-shapes", () => {
    const p = optimizeGrid([["A", "B", "A"], ["B", "A", "B"]], 2);
    expect(p.find((x) => x.fabric === "A")!.count).toBe(3);
    expect(p.every((x) => x.cellsW === 1 && x.cellsH === 1)).toBe(true);
    const l = optimizeGrid([["A", "A"], ["A", "B"]] as FabricKey[][], 2);
    const cells = l.reduce((n, x) => n + x.cellsW * x.cellsH * x.count, 0);
    expect(cells).toBe(4);
    expect(l.filter((x) => x.fabric === "A").length).toBe(2);
  });
  it("skips null (non-plain) cells", () => {
    expect(optimizeGrid([["A", null, "A"]], 2)[0].count).toBe(2);
  });
});

describe("Autumn Tints uses optimized cuts", () => {
  it("cuts the dominant fabric as 2×2 large squares", () => {
    const r = calculateYardage({
      pattern: "autumn-tints", quiltWidth: 50, quiltHeight: 65, sizePreset: "throw",
      fabricWidth: 42, blockSize: 12, borderWidth: 0, sashingWidth: 0,
      assignments: {}, safetyBuffer: false,
    } as never);
    const a = r.fabrics.find((f) => f.fabric === "A")!;
    expect(a.pieces).toHaveLength(1);
    expect(a.pieces[0].w).toBe(6.5);
    expect(a.pieces[0].count).toBe(40);
  });
});
