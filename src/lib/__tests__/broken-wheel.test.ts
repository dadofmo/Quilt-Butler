import { describe, it, expect } from "vitest";
import { brokenWheelPolygons, brokenWheelDimensions } from "../broken-wheel";
import { PATTERNS, PATTERN_META } from "../patterns";
import { calculateYardage } from "../yardage";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "broken-wheel", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
  cornerAccentSize: 0, assignments: {}, safetyBuffer: false, fabricNames: {},
  fabricPhotos: {}, patchworkFabricCount: 4, patchworkGrid: {}, pricePerYard: "",
  itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
type P = [number, number];
const area = (pts: P[]) => Math.abs(pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
const piece = (r: ReturnType<typeof calculateYardage>, f: string, label: string) =>
  r.fabrics.find(x => x.fabric === f)?.pieces.find(p => p.label.startsWith(label));

describe("Broken Wheel geometry", () => {
  const polys = brokenWheelPolygons(6); // 2 per unit
  const by = (r: string) => polys.filter(p => p.role === r).reduce((s, p) => s + area(p.points), 0);
  it("tiles the block with reference fabric areas", () => {
    expect(polys.reduce((s, p) => s + area(p.points), 0)).toBeCloseTo(36);
    expect(by("dark")).toBeCloseTo(4 * 2 + 4 * 2 + 4); // diamonds, outer bars, centre
    expect(by("ring")).toBeCloseTo(4 * 0.5 + 4 * 2);
    expect(by("background")).toBeCloseTo(12 * 0.5);
  });
  it("puts each corner's ring triangle at the corner facing the centre", () => {
    const ringTris = polys.filter(p => p.role === "ring" && p.points.length === 3);
    expect(ringTris).toHaveLength(4);
    for (const t of ringTris) expect(t.points.some(([x, y]) => (x === 2 || x === 4) && (y === 2 || y === 4))).toBe(true);
  });
  it("has the dark bar on the outer edge of each side unit", () => {
    const darkBars = polys.filter(p => p.role === "dark" && p.points.length === 4 && area(p.points) === 2 && p.points.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y)) && !p.points.some(([x, y]) => x === 1 || y === 1 && x === 0));
    for (const b of darkBars) expect(b.points.some(([x, y]) => x === 0 || x === 6 || y === 0 || y === 6)).toBe(true);
  });
  it("is mirror symmetric", () => {
    const key = (ps: P[]) => ps.map(p => p.join(",")).sort().join("|");
    const set = new Set(polys.map(p => p.role + key(p.points)));
    for (const p of polys) expect(set.has(p.role + key(p.points.map(([x, y]) => [6 - x, y] as P)))).toBe(true);
  });
  it("sizes a 12-inch block from 4-inch units", () => {
    const d = brokenWheelDimensions(12);
    expect(d).toMatchObject({ unit: 4, unitUnfinished: 4.5, triangleStarter: 2.875, barLength: 4.5, barWidth: 2.5, centre: 4.5 });
    expect(d.diamondCut).toBeCloseTo(4 / Math.SQRT2 + 0.5);
  });
  it("is registered with three fabrics and Nine Patch first", () => {
    expect(PATTERNS.some(p => p.id === "broken-wheel")).toBe(true);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERN_META["broken-wheel"].fabricCount).toBe(3);
  });
});

describe("Broken Wheel cutting (9 blocks)", () => {
  it("cuts the exact per-block pieces", () => {
    const r = calculateYardage(base);
    expect(piece(r, "C", "Corner diamond")?.count).toBe(36);
    expect(piece(r, "C", "Centre squares")).toMatchObject({ count: 9, w: 4.5 });
    expect(piece(r, "C", "Outer side bars")?.count).toBe(36);
    expect(piece(r, "B", "Inner side bars")?.count).toBe(36);
    expect(piece(r, "B", "Ring triangle")).toMatchObject({ count: 18, w: 2.875 });
    expect(piece(r, "A", "Corner triangle")).toMatchObject({ count: 54, w: 2.875 });
    expect(r.fabrics.find(f => f.fabric === "D")).toBeFalsy();
  });
});
