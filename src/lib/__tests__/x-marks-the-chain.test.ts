import { describe, it, expect } from "vitest";
import { getPattern, PATTERNS } from "@/lib/patterns";
import { calculateYardage } from "@/lib/yardage";
import { blockPolys, unitTally, validateDesign } from "@/lib/custom-block";
import {
  X_CHAIN_BLOCK_A,
  X_CHAIN_BLOCK_B,
  xChainDesigns,
  remapDesign,
} from "@/lib/x-marks-the-chain";
import type { PlannerState } from "@/lib/planner-store";

function base(): PlannerState {
  return {
    pattern: "x-marks-the-chain",
    quiltWidth: 48,
    quiltHeight: 48,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    fabricWidth: 44,
    safetyBuffer: 0,
    assignments: {},
    alternateBlocks: false,
    blockLayout: "straight",
    customBlock: null,
    customBlockB: null,
    useBlockB: false,
    customSwapPair: null,
  } as unknown as PlannerState;
}

describe("X Marks the Chain registration", () => {
  it("is registered with six fabric roles plus sashing and border", () => {
    const def = getPattern("x-marks-the-chain");
    expect(def?.name).toBe("X Marks the Chain");
    expect(def?.hasMath).toBe(true);
    expect(def?.sections.map((s) => s.id)).toEqual([
      "center",
      "points",
      "background",
      "chainCenter",
      "chainAccent",
      "chainCorners",
      "sashing",
      "border",
    ]);
    expect(def?.sections.map((s) => s.defaultFabric)).toEqual([
      "A", "B", "C", "D", "E", "F", "G", "H",
    ]);
  });
});

describe("X Marks the Chain geometry", () => {
  it("all four X arms match the top-left arm after a quarter turn", () => {
    const arms = blockPolys(X_CHAIN_BLOCK_A).filter((p) => p.fabric === "B");
    const canonical = (points: [number, number][]) =>
      points.map(([x, y]) => `${x},${y}`).sort().join("|");
    const actual = arms.map((p) => canonical(p.points)).sort();
    const topLeft = arms.filter((p) => p.points.every(([x, y]) => x <= 2 && y <= 2));
    expect(topLeft).toHaveLength(3);
    for (const turns of [1, 2, 3]) {
      const rotated = topLeft.map((p) => canonical(p.points.map(([x, y]) => {
        for (let turn = 0; turn < turns; turn++) [x, y] = [4 - y, x];
        return [x, y] as [number, number];
      })));
      for (const triangle of rotated) expect(actual).toContain(triangle);
    }
  });

  it("both designs validate cleanly", () => {
    expect(validateDesign(X_CHAIN_BLOCK_A)).toEqual([]);
    expect(validateDesign(X_CHAIN_BLOCK_B)).toEqual([]);
  });

  it("Block A tiles its 4×4 grid with no gaps or overlaps", () => {
    const polys = blockPolys(X_CHAIN_BLOCK_A);
    const area = polys.reduce((sum, p) => {
      let a = 0;
      for (let i = 0; i < p.points.length; i++) {
        const [x1, y1] = p.points[i];
        const [x2, y2] = p.points[(i + 1) % p.points.length];
        a += x1 * y2 - x2 * y1;
      }
      return sum + Math.abs(a) / 2;
    }, 0);
    expect(area).toBeCloseTo(16, 6);
  });

  it("Block A tally: one centre 2×2 of A and twelve B/C HSTs", () => {
    const t = unitTally(X_CHAIN_BLOCK_A);
    expect(t.squares["A"]).toBe(4);
    expect(t.hst["B|C"]).toBe(12);
  });

  it("Block B tally: 4 centre, 4 accent, 4 corner, 24 background squares", () => {
    const t = unitTally(X_CHAIN_BLOCK_B);
    expect(t.squares["D"]).toBe(4);
    expect(t.squares["E"]).toBe(4);
    expect(t.squares["F"]).toBe(4);
    expect(t.squares["C"]).toBe(24);
  });

  it("fabric assignments remap roles instead of hard-coding colours", () => {
    const { a, b } = xChainDesigns({ center: "K", chainCorners: "M" });
    const aFabrics = new Set(blockPolys(a).map((p) => p.fabric));
    const bFabrics = new Set(blockPolys(b).map((p) => p.fabric));
    expect(aFabrics.has("K")).toBe(true);
    expect(aFabrics.has("A")).toBe(false);
    expect(bFabrics.has("M")).toBe(true);
    expect(bFabrics.has("F")).toBe(false);
  });

  it("remapDesign leaves unmapped roles untouched", () => {
    const d = remapDesign(X_CHAIN_BLOCK_A, { B: "Z" });
    const t = unitTally(d);
    expect(t.hst["C|Z"]).toBe(12);
    expect(t.squares["A"]).toBe(4);
  });
});

describe("X Marks the Chain yardage", () => {
  it("splits a 4×4 quilt into 8 X blocks and 8 chain blocks", () => {
    const r = calculateYardage(base());
    // 8 X blocks: centre 2×2 merges into one 6.5" square per block.
    const a = r.fabrics.find((f) => f.fabric === "A");
    expect(a?.pieces[0]).toMatchObject({ count: 8, w: 6.5, h: 6.5 });
    // 96 HST units → 48 starting squares of each of B and C at 3.88".
    const b = r.fabrics.find((f) => f.fabric === "B");
    expect(b?.pieces[0]).toMatchObject({ count: 48, w: 3.88 });
    const c = r.fabrics.find((f) => f.fabric === "C");
    expect(c?.pieces.some((p) => p.count === 48 && p.w === 3.88)).toBe(true);
    // 8 chain blocks: centre merges to one 4.5" square per block.
    const d = r.fabrics.find((f) => f.fabric === "D");
    expect(d?.pieces[0]).toMatchObject({ count: 8, w: 4.5, h: 4.5 });
    // Accent and corner squares: 4 per chain block at 2.5".
    const e = r.fabrics.find((f) => f.fabric === "E");
    expect(e?.pieces[0]).toMatchObject({ count: 32, w: 2.5 });
    const f = r.fabrics.find((f) => f.fabric === "F");
    expect(f?.pieces[0]).toMatchObject({ count: 32, w: 2.5 });
  });

  it("handles an odd block count with the exact even/odd split", () => {
    // 3×5 = 15 blocks → 8 X blocks, 7 chain blocks.
    const r = calculateYardage({ ...base(), quiltWidth: 36, quiltHeight: 60 });
    const a = r.fabrics.find((f) => f.fabric === "A");
    expect(a?.pieces[0].count).toBe(8);
    const d = r.fabrics.find((f) => f.fabric === "D");
    expect(d?.pieces[0].count).toBe(7);
    const e = r.fabrics.find((f) => f.fabric === "E");
    expect(e?.pieces[0].count).toBe(28);
  });

  it("cuts sashing only between blocks when sashing is set", () => {
    const r = calculateYardage({ ...base(), sashingWidth: 2 });
    const g = r.fabrics.find((f) => f.fabric === "G");
    // 4×4 blocks: 3×4 vertical + 3×4 horizontal = 24 strips.
    expect(g?.pieces[0].count).toBe(24);
    expect(g?.pieces[0].w).toBe(12.5);
  });

  it("flexes the block layout to the quilt size instead of fixing it", () => {
    // A 60×60 quilt at 12" blocks is 5×5 = 25 blocks: 13 X, 12 chain.
    const r = calculateYardage({ ...base(), quiltWidth: 60, quiltHeight: 60 });
    const a = r.fabrics.find((f) => f.fabric === "A");
    expect(a?.pieces[0].count).toBe(13);
    const d = r.fabrics.find((f) => f.fabric === "D");
    expect(d?.pieces[0].count).toBe(12);
  });
});

describe("pattern library claim", () => {
  it("still advertises a multiple-of-ten count that actually ships", () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(60);
  });
});
