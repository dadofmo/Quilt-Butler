import { describe, expect, it } from "vitest";
import {
  HOVERING_HAWKS_CELLS,
  HOVERING_HAWKS_COUNTS,
  hoveringHawksDimensions,
  hoveringHawksPolygons,
} from "../hovering-hawks";
import { calculateYardage } from "../yardage";
import { getPattern, PATTERNS, countBlockFabrics } from "../patterns";
import { rotationFor } from "../block-layouts";
import type { PlannerState } from "../planner-store";

const base: PlannerState = {
  pattern: "hovering-hawks",
  quiltWidth: 36,
  quiltHeight: 36,
  sizePreset: "custom",
  blockSize: 12,
  fabricWidth: 44,
  borderWidth: 0,
  sashingWidth: 0,
  assignments: {},
  safetyBuffer: false,
  fabricNames: {},
  fabricPhotos: {},
  cornerAccentSize: 0,
  patchworkFabricCount: 3,
  patchworkGrid: {},
  pricePerYard: "",
  itemPrices: {},
  fabricSource: "yardage",
  jellyRollStripCount: 40,
  fatQuarterWidth: 18,
  fatQuarterHeight: 21,
  fatQuarterTrimMargin: 0.5,
  fatQuarterCount: 20,
  alternateBlocks: false,
  blockLayout: "straight",
  customBlock: null,
  customBlockB: null,
  useBlockB: false,
  customSwapPair: null,
};

const count = (result: ReturnType<typeof calculateYardage>, fabric: string, label: string) =>
  result.fabrics.find((f) => f.fabric === fabric)?.pieces
    .filter((p) => p.label.startsWith(label))
    .reduce((sum, p) => sum + p.count, 0) ?? 0;

const area = (points: [number, number][]) => Math.abs(points.reduce((sum, [x, y], i) => {
  const [nx, ny] = points[(i + 1) % points.length];
  return sum + x * ny - nx * y;
}, 0)) / 2;

describe("Hovering Hawks reference geometry and construction", () => {
  it("registers three standard fabrics, two layouts, and preserves the existing library", () => {
    const pattern = getPattern("hovering-hawks");
    if (!pattern) throw new Error("Missing Hovering Hawks pattern");
    expect(countBlockFabrics(pattern.sections)).toBe(3);
    expect(pattern.sections.slice(0, 3).map((s) => s.defaultFabric)).toEqual(["A", "B", "C"]);
    expect(["straight", ...(pattern.layouts ?? [])]).toEqual(["straight", "alternating"]);
    expect(PATTERNS[0].id).toBe("nine-patch");
    expect(PATTERNS).toHaveLength(88);
    expect(getPattern("indian-puzzle")?.id).toBe("indian-puzzle");
  });

  it("matches every square and triangle orientation in the reference", () => {
    expect(HOVERING_HAWKS_CELLS.map((cell) => [
      cell.row,
      cell.col,
      cell.role,
      "corner" in cell ? cell.corner : "whole",
    ])).toEqual([
      [0, 0, "background", "whole"], [0, 1, "hawks", "bottom-left"], [0, 2, "accent", "bottom-left"], [0, 3, "background", "whole"],
      [1, 0, "hawks", "top-right"], [1, 1, "background", "whole"], [1, 2, "hawks", "bottom-left"], [1, 3, "accent", "bottom-left"],
      [2, 0, "accent", "top-right"], [2, 1, "hawks", "top-right"], [2, 2, "background", "whole"], [2, 3, "hawks", "bottom-left"],
      [3, 0, "background", "whole"], [3, 1, "accent", "top-right"], [3, 2, "hawks", "top-right"], [3, 3, "background", "whole"],
    ]);
    const pieces = hoveringHawksPolygons(4);
    expect(pieces).toHaveLength(26);
    expect(pieces.filter((p) => p.role === "background")).toHaveLength(16);
    expect(pieces.filter((p) => p.role === "hawks")).toHaveLength(6);
    expect(pieces.filter((p) => p.role === "accent")).toHaveLength(4);
    const roleArea = (role: "background" | "hawks" | "accent") => pieces
      .filter((p) => p.role === role)
      .reduce((sum, p) => sum + area(p.points), 0);
    expect(roleArea("background")).toBe(11);
    expect(roleArea("hawks")).toBe(3);
    expect(roleArea("accent")).toBe(2);
    expect(pieces.reduce((sum, p) => sum + area(p.points), 0)).toBe(16);
  });

  it("turns identical blocks in the checkerboard arrangement that creates the star", () => {
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        expect(rotationFor("hovering-hawks", "straight", row, col, 4, 4)).toBe(0);
        expect(rotationFor("hovering-hawks", "alternating", row, col, 4, 4)).toBe((row + col) % 2 ? 90 : 0);
      }
    }
    expect(rotationFor("hovering-hawks", "barn-raising", 0, 1, 4, 4)).toBe(0);
    expect(rotationFor("hovering-hawks", "herringbone", 0, 1, 4, 4)).toBe(0);
  });

  it.each([6, 9, 10, 12, 13.5, 15, 18])("has exact cuts and sufficient HST trimming allowance at %s inches", (block) => {
    const d = hoveringHawksDimensions(block);
    expect(d.unitTrim).toBeCloseTo(block / 4 + 0.5, 12);
    expect(4 * d.unitTrim - 1.5).toBeCloseTo(d.blockTrim, 12);
    expect(d.hstStarter).toBeGreaterThanOrEqual(d.unit + 0.875);
    expect(d.hstStarter - (d.unit + 1)).toBeLessThan(0.125);
    const result = calculateYardage({ ...base, blockSize: block, quiltWidth: block * 3, quiltHeight: block * 3 });
    expect(count(result, "A", "Background plain")).toBe(54);
    expect(count(result, "A", "Background HST")).toBe(45);
    expect(count(result, "B", "Hawk HST")).toBe(27);
    expect(count(result, "C", "Accent HST")).toBe(18);
    expect(result.fabrics.find((f) => f.fabric === "A")?.pieces.find((p) => p.label.startsWith("Background plain"))?.w).toBe(d.unitTrim);
    expect(result.fabrics.find((f) => f.fabric === "B")?.pieces[0].w).toBe(d.hstStarter);
  });

  it("matches hand-calculated nine-block cutting and bolt totals", () => {
    const d = hoveringHawksDimensions(12);
    expect(d.unitTrim).toBe(3.5);
    expect(d.hstStarter).toBe(4);
    const result = calculateYardage(base);
    // A: 54 plain 3.5-inch squares = five strips; 45 four-inch starters = five strips.
    expect(result.fabrics.find((f) => f.fabric === "A")?.totalInches).toBe(37.5);
    // B: 27 four-inch starters, ten across the 42.5-inch usable bolt = three strips.
    expect(result.fabrics.find((f) => f.fabric === "B")?.totalInches).toBe(12);
    // C: 18 four-inch starters = two strips.
    expect(result.fabrics.find((f) => f.fabric === "C")?.totalInches).toBe(8);
    expect(HOVERING_HAWKS_COUNTS).toEqual({
      backgroundSquares: 6,
      backgroundStarters: 5,
      hawkStarters: 3,
      accentStarters: 2,
      hawkHsts: 6,
      accentHsts: 4,
    });
  });

  it("keeps cuts and yardage identical in either block setting", () => {
    const turned = calculateYardage({ ...base, blockLayout: "alternating" });
    expect(turned.fabrics).toEqual(calculateYardage(base).fabrics);
    expect(turned.notes?.some((note) => note.includes("every other block a quarter turn"))).toBe(true);
    expect(calculateYardage(base).notes?.some((note) => note.includes("every other block a quarter turn"))).toBe(false);
  });

  it("fits sashing, intersections, and border using the same nine-block grid", () => {
    const result = calculateYardage({
      ...base,
      quiltWidth: 46,
      quiltHeight: 46,
      sashingWidth: 2,
      borderWidth: 3,
      assignments: { sashing: "F", border: "G" },
    });
    expect(count(result, "A", "Background plain")).toBe(54);
    expect(count(result, "F", "Sashing strips")).toBe(12);
    expect(count(result, "F", "Sashing intersection")).toBe(4);
    expect(result.fabrics.find((f) => f.fabric === "F")?.totalInches).toBe(12.5);
    expect(result.fabrics.find((f) => f.fabric === "G")?.totalInches).toBe(17.5);
  });

  it("honours independent and shared fabric assignments without losing pieces", () => {
    const independent = calculateYardage({ ...base, assignments: { background: "H", hawks: "I", accent: "J" } });
    expect(count(independent, "H", "Background HST")).toBe(45);
    expect(count(independent, "I", "Hawk HST")).toBe(27);
    expect(count(independent, "J", "Accent HST")).toBe(18);
    const merged = calculateYardage({ ...base, assignments: { background: "A", hawks: "A", accent: "A" } });
    expect(merged.fabrics).toHaveLength(1);
    expect(merged.fabrics[0].pieces.reduce((sum, p) => sum + p.count, 0)).toBe(144);
  });

  it("creates no sashing for a single block", () => {
    const result = calculateYardage({
      ...base,
      quiltWidth: 18,
      quiltHeight: 18,
      borderWidth: 3,
      sashingWidth: 2,
      assignments: { sashing: "F", border: "G" },
    });
    expect(count(result, "A", "Background plain")).toBe(6);
    expect(result.fabrics.some((f) => f.fabric === "F")).toBe(false);
  });
});
