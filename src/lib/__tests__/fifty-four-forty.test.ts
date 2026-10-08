import { describe, it, expect } from "vitest";
import { calculateYardage } from "@/lib/yardage";
import { vBlockTemplates } from "@/lib/v-block";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "fifty-four-forty-or-fight", quiltWidth: 12, quiltHeight: 12,
  sizePreset: "custom", fabricWidth: 44, blockSize: 12, borderWidth: 0,
  sashingWidth: 0, cornerAccentSize: 0, assignments: {}, safetyBuffer: false,
  fabricNames: {}, fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {},
  pricePerYard: "", itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};

describe("54-40 or Fight construction", () => {
  it("cuts ten contrast and ten background squares at B/6 + half an inch", () => {
    const fabrics = calculateYardage(base).fabrics;
    for (const key of ["B", "C"]) {
      expect(fabrics.find(f => f.fabric === key)?.pieces[0]).toMatchObject({ count: 10, w: 2.5, h: 2.5 });
    }
  });
  it("allocates four center blanks and eight one-triangle side blanks, not HST pairs", () => {
    const fabrics = calculateYardage(base).fabrics;
    expect(fabrics.find(f => f.fabric === "C")?.pieces[1]).toMatchObject({ count: 4, w: 5, h: 5 });
    expect(fabrics.find(f => f.fabric === "A")?.pieces).toEqual([
      { label: "V-block side template blanks", count: 8, w: 5, h: 3 },
    ]);
  });
  it("fits sashing within the top and allocates 12 between-block strips for a 3x3 grid", () => {
    const fabrics = calculateYardage({ ...base, quiltWidth: 50, quiltHeight: 50, sashingWidth: 2 }).fabrics;
    expect(fabrics.find(f => f.fabric === "B")?.pieces[0].count).toBe(90);
    expect(fabrics.find(f => f.fabric === "D")?.pieces[0]).toMatchObject({ count: 12, w: 12.5, h: 2.5 });
  });
  it("preserves every construction role when all block fabrics are reassigned to one fabric", () => {
    const fabrics = calculateYardage({ ...base, assignments: { points: "G", accent: "G", background: "G" } }).fabrics;
    expect(fabrics.map(f => f.fabric)).toEqual(["G"]);
    expect(fabrics[0].pieces.reduce((sum, piece) => sum + piece.count, 0)).toBe(32);
  });
  it("uses a quarter-inch perpendicular allowance on every template seam", () => {
    for (const u of [1, 3, 4, 8]) {
      for (const template of vBlockTemplates(u)) {
        template.seam.forEach(([x, y], i) => {
          const [nx, ny] = template.seam[(i + 1) % 3];
          const dx = nx - x, dy = ny - y, len = Math.hypot(dx, dy);
          const distances = template.cut.map(([cx, cy]) => (dy * (cx - x) - dx * (cy - y)) / len);
          expect(Math.max(...distances)).toBeCloseTo(0.25, 9);
        });
        const xs = template.cut.map(p => p[0]), ys = template.cut.map(p => p[1]);
        expect(Math.max(...ys) - Math.min(...ys)).toBeLessThanOrEqual(u + 1);
        expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(template.name === "Background center" ? u + 1 : u / 2 + 1);
      }
    }
  });
  it("keeps center triangle tips inward with a 2:1 slope rather than an HST diagonal", () => {
    const templates = vBlockTemplates(4);
    expect(templates[0].seam).toEqual([[0, 0], [4, 0], [2, 4]]);
    expect(templates[1].seam).toEqual([[0, 0], [2, 4], [0, 4]]);
    expect(templates[2].seam).toEqual([[4, 0], [4, 4], [2, 4]]);
  });
});