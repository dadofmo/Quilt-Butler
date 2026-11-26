import { describe, expect, it } from "vitest";
import { SAWTOOTH_CELLS, SAWTOOTH_COUNTS, sawtoothDimensions, sawtoothPolygons } from "../sawtooth";
import { calculateYardage, describePieceSet } from "../yardage";
import { countBlockFabrics, getPattern, PATTERNS } from "../patterns";
import { EMPTY_FILTERS, filterPatterns } from "../pattern-filters";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "sawtooth", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom", blockSize: 12,
  fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {}, safetyBuffer: false,
  fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0, patchworkFabricCount: 4, patchworkGrid: {},
  pricePerYard: "", itemPrices: {}, fabricSource: "yardage", jellyRollStripCount: 40,
  fatQuarterWidth: 18, fatQuarterHeight: 21, fatQuarterTrimMargin: 0.5, fatQuarterCount: 20,
  alternateBlocks: false, blockLayout: "straight", customBlock: null, customBlockB: null,
  useBlockB: false, customSwapPair: null,
};

const count = (result: ReturnType<typeof calculateYardage>, fabric: string, label: string) =>
  result.fabrics.find((f) => f.fabric === fabric)?.pieces
    .filter((p) => p.label.startsWith(label)).reduce((sum, p) => sum + p.count, 0) ?? 0;
const area = (points: [number, number][]) => Math.abs(points.reduce((sum, [x, y], i) => {
  const [nx, ny] = points[(i + 1) % points.length]; return sum + x * ny - nx * y;
}, 0)) / 2;

describe("Sawtooth reference geometry and construction", () => {
  it("registers a separate four-fabric pattern and preserves Nine Patch and Sawtooth Star", () => {
    const pattern = getPattern("sawtooth"), star = getPattern("sawtooth-star");
    if (!pattern || !star) throw new Error("Missing Sawtooth pattern registration");
    expect(PATTERNS.filter((p) => p.id === "sawtooth")).toHaveLength(1);
    expect(PATTERNS).toHaveLength(87);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(star.name).toBe("Sawtooth Star");
    expect(star.fabricCount).toBe(3);
    expect(countBlockFabrics(pattern.sections)).toBe(4);
    expect(pattern.sections.slice(0, 4).map((s) => s.defaultFabric)).toEqual(["A", "B", "C", "D"]);
    expect(pattern.techniques).toEqual(["squares", "hst", "onpoint"]);
    expect(pattern.skill).toBe("confident");
    expect(pattern.precut).toBeUndefined();
    expect(pattern.supportsAlternate).toBeUndefined();
    expect(pattern.layouts).toBeUndefined();
  });

  it("appears in search, four-plus fabric, technique and sashing filters", () => {
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Sawtooth" }).map((p) => p.id)).toContain("sawtooth");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, fabrics: ["4+"] }).map((p) => p.id)).toContain("sawtooth");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, fabrics: ["3"] }).map((p) => p.id)).not.toContain("sawtooth");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, techniques: ["onpoint"] }).map((p) => p.id)).toContain("sawtooth");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, features: ["sashing"] }).map((p) => p.id)).toContain("sawtooth");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, features: ["alternate"] }).map((p) => p.id)).not.toContain("sawtooth");
  });

  it("matches all nine cells and every clockwise setting-corner assignment", () => {
    expect(SAWTOOTH_CELLS.map((cell) => cell.kind === "hst"
      ? [cell.row, cell.col, cell.kind, cell.outerCorner, cell.inwardCorner]
      : [cell.row, cell.col, cell.kind, ...cell.corners])).toEqual([
      [0, 0, "hst", "top-left", "bottom-right"], [0, 1, "onpoint", "outer", "outer", "light", "light"], [0, 2, "hst", "top-right", "bottom-left"],
      [1, 0, "onpoint", "outer", "light", "light", "outer"], [1, 1, "onpoint", "outer", "outer", "outer", "outer"], [1, 2, "onpoint", "light", "outer", "outer", "light"],
      [2, 0, "hst", "bottom-left", "top-right"], [2, 1, "onpoint", "light", "light", "outer", "outer"], [2, 2, "hst", "bottom-right", "top-left"],
    ]);
  });

  it("covers the block exactly once with 33 flush polygons and reference role areas", () => {
    const pieces = sawtoothPolygons(3);
    expect(pieces).toHaveLength(33);
    expect(pieces.filter((p) => p.part === "hst")).toHaveLength(8);
    expect(pieces.filter((p) => p.part === "diamond")).toHaveLength(5);
    expect(pieces.filter((p) => p.part === "setting")).toHaveLength(20);
    expect(pieces.reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(9, 10);
    for (const [role, total] of [["outer", 3.5], ["inward", 2], ["diamonds", 2.5], ["light", 1]] as const) {
      expect(pieces.filter((p) => p.role === role).reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(total, 10);
    }
    expect(pieces.every((p) => p.points.length >= 3)).toBe(true);
  });

  it("places every HST outer and inward triangle at its reference corner", () => {
    const pieces = sawtoothPolygons(3);
    for (const cell of SAWTOOTH_CELLS.filter((cell) => cell.kind === "hst")) {
      if (cell.kind !== "hst") continue;
      const pair = pieces.filter((p) => p.row === cell.row && p.col === cell.col && p.part === "hst");
      expect(pair.map((p) => [p.role, p.corner])).toEqual([["outer", cell.outerCorner], ["inward", cell.inwardCorner]]);
      pair.forEach((p) => expect(area(p.points)).toBeCloseTo(0.5, 10));
    }
  });

  it.each([6, 9, 10, 12, 13.5, 15, 18, 15.25])("keeps exact geometry and conservative starters at %s inches", (block) => {
    const d = sawtoothDimensions(block), u = block / 3;
    expect(d.unit).toBeCloseTo(u, 12);
    expect(d.unitTrim).toBeCloseTo(u + 0.5, 12);
    expect(3 * d.unitTrim - 1).toBeCloseTo(d.blockTrim, 12);
    expect((d.diamondCut - 0.5) * Math.SQRT2).toBeCloseTo(u, 12);
    expect(d.diamondFinished).toBeCloseTo(u / Math.SQRT2, 12);
    expect(d.hstStarter).toBeGreaterThanOrEqual(u + 0.875);
    expect(d.hstStarter - (u + 0.875)).toBeLessThan(0.125);
    expect(d.settingStarter).toBeGreaterThanOrEqual(u / 2 + 0.875);
    expect(d.settingStarter - (u / 2 + 0.875)).toBeLessThan(0.125);
    const result = calculateYardage({ ...base, blockSize: block, quiltWidth: block * 3, quiltHeight: block * 3 });
    expect(count(result, "A", "Outer-corner HST")).toBe(18);
    expect(count(result, "B", "Inward HST")).toBe(18);
    expect(count(result, "C", "On-point centre")).toBe(45);
    expect(count(result, "A", "Outer setting")).toBe(54);
    expect(count(result, "D", "Light setting")).toBe(36);
    expect(result.fabrics.every((f) => f.pieces.every((p) => p.count > 0 && p.w > 0 && p.h > 0 && Number.isFinite(p.w)))).toBe(true);
  });

  it("keeps the exact diamond visible instead of rounding an 18-inch block's cut down", () => {
    const d = sawtoothDimensions(18);
    expect(d.diamondCut).toBeCloseTo(4.742640687119285, 12);
    expect(describePieceSet([{ w: d.diamondCut, h: d.diamondCut }], 4).sizeLabel).toBe("4.7426\" × 4.7426\"");
    expect(describePieceSet([{ w: d.diamondCut, h: d.diamondCut }]).sizeLabel).toBe("4.74\" × 4.74\"");
  });

  it("matches hand-calculated nine-block cuts and bolt totals", () => {
    const d = sawtoothDimensions(12), result = calculateYardage(base);
    expect(d.hstStarter).toBe(4.875);
    expect(d.settingStarter).toBe(2.875);
    expect(d.diamondCut).toBeCloseTo(4 / Math.SQRT2 + 0.5, 12);
    // A: eighteen 4.875-inch HST starters = 3 strips; fifty-four 2.875-inch setting starters = 4 strips.
    expect(result.fabrics.find((f) => f.fabric === "A")?.totalInches).toBeCloseTo(3 * 4.875 + 4 * 2.875, 12);
    expect(result.fabrics.find((f) => f.fabric === "B")?.totalInches).toBe(3 * 4.875);
    // C: 45 exact diamonds, twelve across a 42.5-inch usable bolt = 4 strips.
    expect(result.fabrics.find((f) => f.fabric === "C")?.totalInches).toBeCloseTo(4 * d.diamondCut, 12);
    expect(result.fabrics.find((f) => f.fabric === "D")?.totalInches).toBe(3 * 2.875);
    expect(SAWTOOTH_COUNTS).toEqual({ hstUnits: 4, outerHstStarters: 2, inwardHstStarters: 2, diamondSquares: 5, outerSettingStarters: 6, lightSettingStarters: 4, outerSettingTriangles: 12, lightSettingTriangles: 8 });
  });

  it.each([[1, 1], [2, 3], [4, 2]])("scales every role to a %s×%s quilt", (rows, cols) => {
    const n = rows * cols, result = calculateYardage({ ...base, quiltWidth: cols * 12, quiltHeight: rows * 12 });
    expect(count(result, "A", "Outer-corner HST")).toBe(2 * n);
    expect(count(result, "B", "Inward HST")).toBe(2 * n);
    expect(count(result, "C", "On-point centre")).toBe(5 * n);
    expect(count(result, "A", "Outer setting")).toBe(6 * n);
    expect(count(result, "D", "Light setting")).toBe(4 * n);
  });

  it("honours independent assignments and merges repeated choices without losing role labels", () => {
    const independent = calculateYardage({ ...base, assignments: { outer: "H", inward: "I", diamonds: "J", light: "K" } });
    expect(count(independent, "H", "Outer setting")).toBe(54);
    expect(count(independent, "I", "Inward HST")).toBe(18);
    expect(count(independent, "J", "On-point centre")).toBe(45);
    expect(count(independent, "K", "Light setting")).toBe(36);
    const merged = calculateYardage({ ...base, assignments: { outer: "A", inward: "A", diamonds: "A", light: "A" } });
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum, p) => sum + p.count, 0)).toBe(171);
    expect(merged.fabrics[0].pieces.map((p) => p.label)).toEqual(expect.arrayContaining([expect.stringMatching(/^Outer-corner HST/), expect.stringMatching(/^Light setting/)]));
  });

  it("fits sashing, intersections and border on the same nine-block grid", () => {
    const result = calculateYardage({ ...base, quiltWidth: 46, quiltHeight: 46, sashingWidth: 2, borderWidth: 3 });
    expect(count(result, "C", "On-point centre")).toBe(45);
    expect(count(result, "E", "Sashing strips")).toBe(12);
    expect(count(result, "E", "Sashing intersection")).toBe(4);
    expect(result.fabrics.find((f) => f.fabric === "E")?.totalInches).toBe(12.5);
    expect(result.fabrics.find((f) => f.fabric === "F")?.totalInches).toBe(17.5);
    expect(calculateYardage(base).fabrics.some((f) => ["E", "F"].includes(f.fabric))).toBe(false);
  });

  it("creates no sashing for one block and ignores stale layout toggles", () => {
    const one = calculateYardage({ ...base, quiltWidth: 18, quiltHeight: 18, borderWidth: 3, sashingWidth: 2 });
    expect(count(one, "C", "On-point centre")).toBe(5);
    expect(one.fabrics.some((f) => f.fabric === "E")).toBe(false);
    expect(calculateYardage({ ...base, alternateBlocks: true, blockLayout: "herringbone" }).fabrics).toEqual(calculateYardage(base).fabrics);
  });

  it("prints the exact corner maps, trim targets and guide-line explanation", () => {
    const notes = calculateYardage(base).notes?.join(" ") ?? "";
    expect(notes).toContain("top middle A/A/D/D");
    expect(notes).toContain("middle left A/D/D/A");
    expect(notes).toContain("middle right D/A/A/D");
    expect(notes).toContain("bottom middle D/D/A/A");
    expect(notes).toContain("white reference lines are construction guides, not fabric");
    expect(notes).toContain("EXACT 3.3284\"");
    expect(notes).toContain("Trim every cell to 4.5000\" unfinished");
  });
});
