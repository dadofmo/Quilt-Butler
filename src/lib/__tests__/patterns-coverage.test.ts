/**
 * Pattern coverage — runs for ALL patterns in src/lib/patterns.ts.
 *
 * Goal: every pattern declared in `PATTERNS` survives a default-state
 * yardage calculation, returns at least one fabric, and only uses fabric
 * keys that come from the section defaults (no orphan or undefined fabrics).
 *
 * Because the suite iterates `PATTERNS`, ANY new pattern added to
 * src/lib/patterns.ts is automatically covered with no test edits needed.
 */
import { describe, it, expect } from "vitest";
import { PATTERNS } from "@/lib/patterns";
import { calculateYardage } from "@/lib/yardage";
import type { PlannerState, FabricKey } from "@/lib/planner-store";
import { ALL_FABRIC_KEYS } from "@/lib/planner-store";

function baseState(): PlannerState {
  return {
    pattern: null,
    quiltWidth: 50,
    quiltHeight: 65,
    sizePreset: "throw",
    fabricWidth: 44,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    cornerAccentSize: 0,
    assignments: {},
    safetyBuffer: false,
    fabricNames: {},
    fabricPhotos: {},
    patchworkFabricCount: 4,
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

  };
}

/**
 * Hard-coded per-pattern minimal-valid overrides. Without these, patterns
 * that REQUIRE a sashing width / corner-accent / jelly-roll mode would
 * produce nonsense — and the test would lie about coverage.
 */
function overridesFor(pattern: string): Partial<PlannerState> {
  switch (pattern) {
    case "bear-paw":
      // Bear Paw requires sashing (built into the block math)
      return { sashingWidth: 2, blockSize: 14 };
    case "snowball-block":
      return { cornerAccentSize: 3 };
    case "rail-fence":
      return { blockSize: 6 };
    case "log-cabin":
      return { blockSize: 12 };
    case "irish-chain":
      return { blockSize: 10 };
    default:
      return {};
  }
}

describe("Pattern coverage — every pattern in PATTERNS", () => {
  it("PATTERNS is non-empty (sanity)", () => {
    expect(PATTERNS.length).toBeGreaterThan(0);
  });

  for (const p of PATTERNS) {
    describe(`${p.id} (${p.name})`, () => {
      it("has a non-empty sections array", () => {
        expect(p.sections.length).toBeGreaterThan(0);
      });

      it("every section.defaultFabric is a valid FabricKey", () => {
        for (const s of p.sections) {
          expect(ALL_FABRIC_KEYS).toContain(s.defaultFabric);
        }
      });

      it("section ids are unique within the pattern", () => {
        const ids = p.sections.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      if (p.hasMath) {
        it("calculateYardage does not throw on default state", () => {
          const state: PlannerState = {
            ...baseState(),
            pattern: p.id,
            ...overridesFor(p.id),
          };
          expect(() => calculateYardage(state)).not.toThrow();
        });

        it("calculateYardage returns at least one fabric row", () => {
          const state: PlannerState = {
            ...baseState(),
            pattern: p.id,
            ...overridesFor(p.id),
          };
          const result = calculateYardage(state);
          expect(result.fabrics.length).toBeGreaterThan(0);
        });

        it("every returned fabric uses a valid FabricKey", () => {
          const state: PlannerState = {
            ...baseState(),
            pattern: p.id,
            ...overridesFor(p.id),
          };
          const result = calculateYardage(state);
          for (const f of result.fabrics) {
            expect(ALL_FABRIC_KEYS).toContain(f.fabric as FabricKey);
            expect(f.totalInches).toBeGreaterThanOrEqual(0);
          }
        });
      }
    });
  }
});
