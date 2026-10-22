import { describe, expect, it } from "vitest";
import { brickWorkDimensions, brickWorkGeometry } from "@/lib/brick-work";
import { getPattern } from "@/lib/patterns";
import { calculateYardage } from "@/lib/yardage";
import type { PlannerState } from "@/lib/planner-store";

const base: PlannerState = {
  pattern: "brick-work", quiltWidth: 48, quiltHeight: 48, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0, cornerAccentSize: 0,
  assignments: {}, safetyBuffer: false, fabricNames: {}, fabricPhotos: {},
  patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18,
  fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null,
  customBlockB: null, useBlockB: false, customSwapPair: null,
};
const area = (pts: [number, number][]) => Math.abs(pts.reduce((s, [x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; return s + x * ny - nx * y; }, 0)) / 2;

describe("Brick Work", () => {
  it("uses the standard A/B/C palette", () => {
    expect(getPattern("brick-work")?.sections.slice(0, 3).map(s => s.defaultFabric)).toEqual(["A", "B", "C"]);
  });
  it("geometry tiles the block exactly with the reference piece counts", () => {
    const p = brickWorkGeometry();
    expect(p.reduce((s, x) => s + area(x.points), 0)).toBeCloseTo(1, 9);
    expect(p.filter(x => x.role === "bars").length).toBe(4);
    expect(p.filter(x => x.role === "squares").length).toBe(8);
    expect(p.filter(x => x.kind === "setting").length).toBe(12);
    expect(p.filter(x => x.kind === "corner").length).toBe(4);
    for (const x of p) for (const [a, b] of x.points) { expect(a).toBeGreaterThanOrEqual(-1e-9); expect(b).toBeLessThanOrEqual(1 + 1e-9); }
  });
  it("12-inch block cuts", () => {
    const d = brickWorkDimensions(12);
    expect(d.squareBlank).toBe(2.625);
    expect(d.barBlankLength).toBe(6.875);
    expect(d.settingBlank).toBe(4.25);
    expect(d.cornerBlank).toBe(2.375);
  });
  it("16 blocks: 64 bars, 128 accent squares, 16 continuous centre bars", () => {
    const r = calculateYardage(base);
    const cnt = (f: string, label: string) => r.fabrics.find(x => x.fabric === f)!.pieces.filter(p => p.label.startsWith(label)).reduce((s, p) => s + p.count, 0);
    expect(cnt("A", "Brick bars")).toBe(64);
    expect(cnt("B", "Accent squares")).toBe(128);
    expect(cnt("C", "Centre background bar")).toBe(16);
    expect(cnt("C", "Setting triangle")).toBe(48);
    expect(cnt("C", "Corner triangle")).toBe(32);
  });
});
