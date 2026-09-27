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

describe("Custom blocks use optimized plain-square cuts", () => {
  const sq = (f: FabricKey) => ({ kind: "square" as const, rotation: 0 as const, fabrics: [f] });
  const hst = (a: FabricKey, b: FabricKey) => ({ kind: "hst" as const, rotation: 0 as const, fabrics: [a, b] });
  const run = (cells: Record<string, unknown>, size = 2) =>
    calculateYardage({
      pattern: "custom-block", quiltWidth: 48, quiltHeight: 48, sizePreset: "custom",
      fabricWidth: 42, blockSize: 12, borderWidth: 0, sashingWidth: 0,
      assignments: {}, safetyBuffer: false, customBlock: { size, cells },
      customBlockB: null, useBlockB: false, alternateBlocks: false, customSwapPair: null,
      blockLayout: "straight",
    } as never);

  it("merges a solid 2×2 block into one large square per block", () => {
    const r = run({ "0,0": sq("A"), "0,1": sq("A"), "1,0": sq("A"), "1,1": sq("A") });
    const a = r.fabrics.find((f) => f.fabric === "A")!;
    expect(a.pieces).toHaveLength(1);
    expect(a.pieces[0].w).toBe(12.5);
    expect(a.pieces[0].count).toBe(16); // 4×4 blocks
    // 16 at 12.5": 3 per strip → 6 strips → 75" (vs 64 small 6.5" squares → 11 strips → 71.5"? compare seams)
    expect(a.totalInches).toBe(75);
  });

  it("merges a row into a strip and leaves HSTs as units", () => {
    // 3×3 block, u=4: top row A A A → one 12.5"×4.5" strip; rest HSTs/B squares.
    const r = run(
      {
        "0,0": sq("A"), "0,1": sq("A"), "0,2": sq("A"),
        "1,0": hst("A", "B"), "1,1": sq("B"), "1,2": hst("A", "B"),
        "2,0": sq("C"), "2,1": sq("B"), "2,2": sq("C"),
      },
      3,
    );
    const a = r.fabrics.find((f) => f.fabric === "A")!;
    const strip = a.pieces.find((p) => p.w === 12.5 && p.h === 4.5)!;
    expect(strip.count).toBe(16);
    expect(a.pieces.some((p) => p.label.includes("HST"))).toBe(true);
    const b = r.fabrics.find((f) => f.fabric === "B")!;
    const bStrip = b.pieces.find((p) => p.label.startsWith("Plain strips"))!;
    expect([bStrip.w, bStrip.h]).toEqual([8.5, 4.5]); // vertical 2-cell B strip
    const c = r.fabrics.find((f) => f.fabric === "C")!;
    expect(c.pieces[0].w).toBe(4.5); // non-adjacent C squares stay separate
    expect(c.pieces[0].count).toBe(32);
  });
});
