import { describe, expect, it } from "vitest";
import { FLYING_DUTCHMAN_CELLS, flyingDutchmanDimensions, flyingDutchmanPolygons } from "../flying-dutchman";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics, PATTERN_META } from "../patterns";
import { rotationFor } from "../block-layouts";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "flying-dutchman", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom",
  blockSize: 12, fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {},
  safetyBuffer: false, fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0,
  patchworkFabricCount: 3, patchworkGrid: {}, pricePerYard: "", itemPrices: {},
  fabricSource: "yardage", jellyRollStripCount: 40, fatQuarterWidth: 18, fatQuarterHeight: 21,
  fatQuarterTrimMargin: 0.5, fatQuarterCount: 20, alternateBlocks: false, blockLayout: "straight",
  customBlock: null, customBlockB: null, useBlockB: false, customSwapPair: null,
};
type R = ReturnType<typeof calculateYardage>;
const cuts = (r: R, f: string, label: string) => r.fabrics.find(x => x.fabric === f)?.pieces.filter(p => p.label.startsWith(label)) ?? [];
const count = (r: R, f: string, label: string) => cuts(r, f, label).reduce((s, p) => s + p.count, 0);
const area = (pts: [number, number][]) => Math.abs(pts.reduce((s, [x, y], i) => { const [nx, ny] = pts[(i + 1) % pts.length]; return s + x * ny - nx * y; }, 0)) / 2;
/** Role at a point in a 4-unit block (1 unit per cell). */
const roleAt = (x: number, y: number) => flyingDutchmanPolygons(4).filter(p => {
  const c = p.points.map(([ax, ay], i) => { const [bx, by] = p.points[(i + 1) % p.points.length]; return (bx - ax) * (y - ay) - (by - ay) * (x - ax); });
  return c.every(v => v > 1e-9) || c.every(v => v < -1e-9);
}).map(p => p.role);
const near = { "top-left": [0.15, 0.15], "top-right": [0.85, 0.15], "bottom-right": [0.85, 0.85], "bottom-left": [0.15, 0.85] } as const;

describe("Flying Dutchman reference geometry and construction", () => {
  it("registers three standard fabrics, alternating layout and keeps Nine Patch first", () => {
    const p = getPattern("flying-dutchman"); if (!p) throw new Error("missing");
    expect(countBlockFabrics(p.sections)).toBe(3);
    expect(p.sections.map(s => [s.id, s.defaultFabric])).toEqual([["background", "A"], ["main", "B"], ["accent", "C"], ["sashing", "D"], ["border", "E"]]);
    expect(p.layouts).toEqual(["alternating"]);
    expect(PATTERN_META["flying-dutchman"]).toEqual({ skill: "confident", fabricCount: 3, techniques: ["squares", "hst"] });
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERNS).toHaveLength(88);
  });

  it("matches the reference cell map exactly", () => {
    // [row][col]: "A" whole square, or the main-triangle right-angle corner + the other half's role.
    const expected: Record<string, [string, string] | "A"> = {
      "0,0": ["bottom-right", "background"], "0,1": "A", "0,2": ["bottom-left", "background"], "0,3": ["bottom-left", "background"],
      "1,0": "A", "1,1": ["top-left", "accent"], "1,2": ["bottom-left", "accent"], "1,3": ["bottom-left", "background"],
      "2,0": ["top-right", "background"], "2,1": ["top-right", "accent"], "2,2": ["bottom-right", "accent"], "2,3": "A",
      "3,0": ["top-right", "background"], "3,1": ["top-right", "background"], "3,2": "A", "3,3": ["top-left", "background"],
    };
    const opposite = { "top-left": "bottom-right", "bottom-right": "top-left", "top-right": "bottom-left", "bottom-left": "top-right" } as const;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const e = expected[`${row},${col}`];
      if (e === "A") { expect(roleAt(col + 0.5, row + 0.5)).toEqual(["background"]); continue; }
      const [corner, other] = e as [keyof typeof near, string];
      const [dx, dy] = near[corner], [ox, oy] = near[opposite[corner]];
      expect(roleAt(col + dx, row + dy), `${row},${col} main`).toEqual(["main"]);
      expect(roleAt(col + ox, row + oy), `${row},${col} other`).toEqual([other]);
    }
    expect(FLYING_DUTCHMAN_CELLS.filter(c => c.kind === "square")).toHaveLength(4);
    expect(FLYING_DUTCHMAN_CELLS.filter(c => c.kind === "wing")).toHaveLength(8);
    expect(FLYING_DUTCHMAN_CELLS.filter(c => c.kind === "star")).toHaveLength(4);
  });

  it("tiles every point exactly once, preserves area 8/6/2 and is 180° symmetric", () => {
    const areas: Record<string, number> = {};
    for (const p of flyingDutchmanPolygons(4)) areas[p.role] = (areas[p.role] ?? 0) + area(p.points);
    expect(areas).toEqual({ background: 8, main: 6, accent: 2 });
    for (let y = 0.037; y < 4; y += 0.173) for (let x = 0.051; x < 4; x += 0.181) {
      expect(roleAt(x, y)).toHaveLength(1);
      expect(roleAt(x, y)).toEqual(roleAt(4 - x, 4 - y));
    }
  });

  it.each([6, 8, 10, 12, 14, 16])("exact cut sizes and per-block counts at %s inches", block => {
    const d = flyingDutchmanDimensions(block);
    expect(d.unit).toBe(block / 4);
    expect(d.unitTrim).toBe(block / 4 + 0.5);
    expect(d.unitTrim * 4 - 1.5).toBeCloseTo(d.blockTrim, 12);
    expect(d.hstStarter).toBe(Math.ceil((block / 4 + 1) * 8 - 1e-9) / 8);
    // Two-at-a-time HST from starter S is S - 3/8 unfinished; leave >= 1/8 to trim.
    expect(d.hstStarter - 0.375 - d.unitTrim).toBeGreaterThanOrEqual(0.125 - 1e-9);
    const r = calculateYardage({ ...base, blockSize: block, quiltWidth: block * 3, quiltHeight: block * 3 });
    expect(count(r, "A", "Background plain squares")).toBe(36);
    expect(count(r, "A", "HST starter squares")).toBe(36);
    expect(count(r, "B", "HST starter squares")).toBe(54);
    expect(count(r, "C", "HST starter squares")).toBe(18);
    expect(cuts(r, "A", "Background plain squares")[0]?.w).toBe(d.unitTrim);
    expect(cuts(r, "B", "HST starter squares")[0]?.w).toBe(d.hstStarter);
  });

  it("matches hand-calculated 12-inch cuts and yardage", () => {
    expect(flyingDutchmanDimensions(12)).toEqual({ unit: 3, unitTrim: 3.5, hstStarter: 4, blockTrim: 12.5 });
    const r = calculateYardage(base);
    expect(r.fabrics.find(f => f.fabric === "A")?.totalInches).toBe(26.5);
    expect(r.fabrics.find(f => f.fabric === "B")?.totalInches).toBe(24);
    expect(r.fabrics.find(f => f.fabric === "C")?.totalInches).toBe(8);
    expect((r.notes ?? []).some(n => n.includes("Four pairs make exactly eight"))).toBe(true);
    expect((r.notes ?? []).some(n => n.includes("Two pairs make exactly four"))).toBe(true);
    expect((r.notes ?? []).filter(n => n.startsWith("Flying Dutchman row "))).toHaveLength(4);
  });

  it("rotates finished blocks only: alternating turns every other block 90° with identical cuts", () => {
    expect(rotationFor("flying-dutchman", "straight", 0, 1)).toBe(0);
    expect(rotationFor("flying-dutchman", "alternating", 0, 0)).toBe(0);
    expect(rotationFor("flying-dutchman", "alternating", 0, 1)).toBe(90);
    expect(rotationFor("flying-dutchman", "alternating", 1, 1)).toBe(0);
    expect(rotationFor("flying-dutchman", "barn-raising", 0, 1, 3, 3)).toBe(0);
    const straight = calculateYardage(base), turned = calculateYardage({ ...base, blockLayout: "alternating" });
    expect(turned.fabrics).toEqual(straight.fabrics);
  });

  it("fits sashing with intersections and honours reassigned or shared fabrics", () => {
    const r = calculateYardage({ ...base, quiltWidth: 46, quiltHeight: 46, sashingWidth: 2, borderWidth: 3, assignments: { sashing: "F", border: "G" } });
    expect(count(r, "F", "Sashing strips")).toBe(12);
    expect(count(r, "F", "Sashing intersection")).toBe(4);
    const x = calculateYardage({ ...base, assignments: { background: "H", main: "I", accent: "J" } });
    expect(count(x, "H", "Background plain squares")).toBe(36);
    expect(count(x, "I", "HST starter squares")).toBe(54);
    expect(count(x, "J", "HST starter squares")).toBe(18);
    // Main and accent the same fabric: starters co-pack into one cut line.
    const shared = calculateYardage({ ...base, assignments: { accent: "B" } });
    expect(cuts(shared, "B", "HST starter squares")).toHaveLength(1);
    expect(count(shared, "B", "HST starter squares")).toBe(72);
  });
});
