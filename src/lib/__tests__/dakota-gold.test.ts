import { describe, expect, it } from "vitest";
import { DAKOTA_GOLD_CELLS, DAKOTA_GOLD_COUNTS, DAKOTA_GOLD_PAIR_ROLES, dakotaGoldDimensions, dakotaGoldPairCounts, dakotaGoldPieces } from "../dakota-gold";
import { calculateYardage, describePieceSet } from "../yardage";
import { countBlockFabrics, getPattern, PATTERNS } from "../patterns";
import { EMPTY_FILTERS, filterPatterns } from "../pattern-filters";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "dakota-gold", quiltWidth: 36, quiltHeight: 36, sizePreset: "custom", blockSize: 12,
  fabricWidth: 44, borderWidth: 0, sashingWidth: 0, assignments: {}, safetyBuffer: false,
  fabricNames: {}, fabricPhotos: {}, cornerAccentSize: 0, patchworkFabricCount: 5, patchworkGrid: {},
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

describe("Dakota Gold reference geometry and construction", () => {
  it("registers a separate five-fabric pattern while keeping Nine Patch first", () => {
    const pattern = getPattern("dakota-gold");
    if (!pattern) throw new Error("Missing Dakota Gold registration");
    expect(PATTERNS.filter((p) => p.id === "dakota-gold")).toHaveLength(1);
    expect(PATTERNS).toHaveLength(84);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(countBlockFabrics(pattern.sections)).toBe(5);
    expect(pattern.sections.slice(0, 5).map((s) => s.defaultFabric)).toEqual(["B", "A", "C", "D", "E"]);
    expect(pattern.techniques).toEqual(["squares", "hst", "strips"]);
    expect(pattern.skill).toBe("confident");
    expect(pattern.supportsAlternate).toBeUndefined();
    expect(pattern.layouts).toBeUndefined();
  });

  it("appears in search, five-fabric, technique and sashing filters", () => {
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, query: "Dakota Gold" }).map((p) => p.id)).toContain("dakota-gold");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, fabrics: ["4+"] }).map((p) => p.id)).toContain("dakota-gold");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, fabrics: ["3"] }).map((p) => p.id)).not.toContain("dakota-gold");
    for (const technique of ["squares", "hst", "strips"]) {
      expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, techniques: [technique] }).map((p) => p.id)).toContain("dakota-gold");
    }
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, features: ["sashing"] }).map((p) => p.id)).toContain("dakota-gold");
    expect(filterPatterns(PATTERNS, { ...EMPTY_FILTERS, features: ["alternate"] }).map((p) => p.id)).not.toContain("dakota-gold");
  });

  it("matches all 25 cells and all 12 reference triangle orientations", () => {
    expect(DAKOTA_GOLD_CELLS.map((cell) => [cell.row, cell.col, cell.kind, cell.kind === "hst" ? cell.pair : "", cell.kind === "hst" ? cell.firstCorner : ""])).toEqual([
      [0,0,"hst","pale-teal","top-right"], [0,1,"hst","dark-pale","top-right"], [0,2,"cross","",""], [0,3,"hst","dark-pale","top-left"], [0,4,"hst","pale-teal","top-left"],
      [1,0,"hst","dark-teal","bottom-left"], [1,1,"square","",""], [1,2,"cross","",""], [1,3,"square","",""], [1,4,"hst","dark-pale","bottom-right"],
      [2,0,"cross","",""], [2,1,"cross","",""], [2,2,"cross","",""], [2,3,"cross","",""], [2,4,"cross","",""],
      [3,0,"hst","dark-pale","top-left"], [3,1,"square","",""], [3,2,"cross","",""], [3,3,"square","",""], [3,4,"hst","dark-pale","top-right"],
      [4,0,"hst","pale-teal","top-left"], [4,1,"hst","dark-teal","bottom-right"], [4,2,"cross","",""], [4,3,"hst","dark-teal","bottom-left"], [4,4,"hst","pale-teal","top-right"],
    ]);
    const hsts = DAKOTA_GOLD_CELLS.filter((cell) => cell.kind === "hst");
    expect(hsts).toHaveLength(12);
    for (const pair of Object.keys(DAKOTA_GOLD_PAIR_ROLES)) {
      expect(hsts.filter((cell) => cell.kind === "hst" && cell.pair === pair)).toHaveLength(pair === "dark-pale" ? 5 : pair === "dark-teal" ? 3 : 4);
    }
  });

  it("covers the block exactly once with three bars, four squares and 24 triangle halves", () => {
    const pieces = dakotaGoldPieces(5);
    expect(pieces).toHaveLength(31);
    expect(pieces.filter((p) => p.part === "hst")).toHaveLength(24);
    expect(pieces.filter((p) => p.part === "square")).toHaveLength(4);
    expect(pieces.filter((p) => p.part.endsWith("bar"))).toHaveLength(3);
    expect(pieces.reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(25, 10);
    for (const [role, total] of [["cross", 9], ["dark", 4], ["pale", 4.5], ["teal", 3.5], ["squares", 4]] as const) {
      expect(pieces.filter((p) => p.role === role).reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(total, 10);
    }
  });

  it("places both halves of every HST at opposite right-angle corners", () => {
    const pieces = dakotaGoldPieces(5);
    for (const cell of DAKOTA_GOLD_CELLS.filter((cell) => cell.kind === "hst")) {
      if (cell.kind !== "hst") continue;
      const pair = pieces.filter((p) => p.row === cell.row && p.col === cell.col);
      const [first, second] = DAKOTA_GOLD_PAIR_ROLES[cell.pair];
      expect(pair.map((p) => [p.role, p.corner])).toEqual([[first, cell.firstCorner], [second, pair[1].corner]]);
      expect(new Set(pair.map((p) => p.corner)).size).toBe(2);
      pair.forEach((p) => expect(area(p.points)).toBeCloseTo(0.5, 10));
      expect(pair.reduce((sum, p) => sum + area(p.points), 0)).toBeCloseTo(1, 10);
    }
  });

  it.each([5, 10, 12, 12.25, 13.5, 15, 18])("keeps exact cuts and conservative starters at %s inches", (block) => {
    const d = dakotaGoldDimensions(block), u = block / 5;
    expect(d.unit).toBeCloseTo(u, 12);
    expect(d.square).toBeCloseTo(u + 0.5, 12);
    expect(d.barWidth).toBe(d.square);
    expect(d.verticalBarLength).toBeCloseTo(2 * u + 0.5, 12);
    expect(d.horizontalBarLength).toBeCloseTo(block + 0.5, 12);
    expect(d.hstStarter).toBeGreaterThanOrEqual(u + 0.875);
    expect(d.hstStarter - (u + 0.875)).toBeLessThan(0.125);
    expect(2 * (2 * u + 0.5) + (u + 0.5) - 1).toBeCloseTo(d.blockTrim, 12);
    expect(2 * (2 * u + 0.5) + d.horizontalBarLength - 1).toBeCloseTo(d.blockTrim, 12);
    expect(describePieceSet([{ w: d.square, h: d.square }], 4).sizeLabel).toBe(`${d.square.toFixed(4)}" × ${d.square.toFixed(4)}"`);
  });

  it("pools two-at-a-time HST pairs and reports spares only when needed", () => {
    expect(dakotaGoldPairCounts(1)).toMatchObject({ darkPale: 3, darkTeal: 2, paleTeal: 2, darkPaleSpares: 1, darkTealSpares: 1 });
    expect(dakotaGoldPairCounts(2)).toMatchObject({ darkPale: 5, darkTeal: 3, paleTeal: 4, darkPaleSpares: 0, darkTealSpares: 0 });
    expect(dakotaGoldPairCounts(9)).toMatchObject({ darkPale: 23, darkTeal: 14, paleTeal: 18, darkPaleSpares: 1, darkTealSpares: 1 });
  });

  it("matches hand-calculated nine-block cuts and bolt totals", () => {
    const d = dakotaGoldDimensions(12), result = calculateYardage(base);
    expect(d.square).toBe(2.9);
    expect(d.hstStarter).toBe(3.375);
    expect(d.verticalBarLength).toBe(5.3);
    expect(d.horizontalBarLength).toBe(12.5);
    expect(count(result, "A", "Dark HST")).toBe(37);
    expect(count(result, "D", "Pale HST")).toBe(41);
    expect(count(result, "C", "Teal HST")).toBe(32);
    expect(count(result, "E", "Plain inner squares")).toBe(36);
    expect(count(result, "B", "Upper & lower vertical cross bars")).toBe(18);
    expect(count(result, "B", "Full-width centre cross bar")).toBe(9);
    // 42.5-inch usable bolt: 12 starters per strip; 14 plain squares per strip.
    expect(result.fabrics.find((f) => f.fabric === "A")?.totalInches).toBe(4 * 3.375);
    expect(result.fabrics.find((f) => f.fabric === "D")?.totalInches).toBe(4 * 3.375);
    expect(result.fabrics.find((f) => f.fabric === "C")?.totalInches).toBe(3 * 3.375);
    expect(result.fabrics.find((f) => f.fabric === "E")?.totalInches).toBe(3 * 2.9);
    // Eight 5.3-inch bars and three 12.5-inch bars per strip.
    expect(result.fabrics.find((f) => f.fabric === "B")?.totalInches).toBe(6 * 2.9);
    expect(DAKOTA_GOLD_COUNTS).toEqual({ hstUnits: 12, darkPaleHsts: 5, darkTealHsts: 3, paleTealHsts: 4, plainSquares: 4, verticalBars: 2, horizontalBars: 1 });
  });

  it("honours independent assignments and merges repeated choices without losing cuts", () => {
    const independent = calculateYardage({ ...base, assignments: { cross: "H", dark: "I", teal: "J", pale: "K", squares: "L" } });
    expect(count(independent, "H", "Full-width centre")).toBe(9);
    expect(count(independent, "I", "Dark HST")).toBe(37);
    expect(count(independent, "J", "Teal HST")).toBe(32);
    expect(count(independent, "K", "Pale HST")).toBe(41);
    expect(count(independent, "L", "Plain inner")).toBe(36);
    const merged = calculateYardage({ ...base, assignments: { cross: "A", dark: "A", teal: "A", pale: "A", squares: "A" } });
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum, p) => sum + p.count, 0)).toBe(173);
  });

  it("fits sashing, intersections and border on the same nine-block grid", () => {
    const result = calculateYardage({ ...base, quiltWidth: 46, quiltHeight: 46, sashingWidth: 2, borderWidth: 3 });
    expect(count(result, "E", "Plain inner")).toBe(36);
    expect(count(result, "F", "Sashing strips")).toBe(12);
    expect(count(result, "F", "Sashing intersection")).toBe(4);
    expect(result.fabrics.find((f) => f.fabric === "F")?.totalInches).toBe(12.5);
    expect(result.fabrics.find((f) => f.fabric === "G")?.totalInches).toBe(17.5);
    expect(calculateYardage(base).fabrics.some((f) => ["F", "G"].includes(f.fabric))).toBe(false);
  });

  it("creates no sashing for one block and ignores stale layout toggles", () => {
    const one = calculateYardage({ ...base, quiltWidth: 18, quiltHeight: 18, blockSize: 18, borderWidth: 3, sashingWidth: 2 });
    expect(count(one, "E", "Plain inner")).toBe(4);
    expect(one.fabrics.some((f) => f.fabric === "F")).toBe(false);
    expect(calculateYardage({ ...base, alternateBlocks: true, blockLayout: "herringbone" }).fabrics).toEqual(calculateYardage(base).fabrics);
  });

  it("prints every corner-unit orientation, continuous-bar assembly and odd-count spares", () => {
    const notes = calculateYardage(base).notes?.join(" ") ?? "";
    expect(notes).toContain("five dark/pale, three dark/teal and four pale/teal");
    expect(notes).toContain("Top-left corner unit");
    expect(notes).toContain("Top-right corner unit");
    expect(notes).toContain("Bottom-left corner unit");
    expect(notes).toContain("Bottom-right corner unit");
    expect(notes).toContain("1 spare dark/pale HST and 1 spare dark/teal HST");
    expect(notes).toContain("white reference lines are construction guides, not fabric");
    expect(notes).toContain("Do not cut the cross bars into squares");
    expect(notes).toContain("Trim every HST to 2.9000");
    expect(notes).toContain("Square the block to 12.5000");
  });
});
