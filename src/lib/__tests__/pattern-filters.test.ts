import { describe, it, expect } from "vitest";
import { PATTERNS } from "@/lib/patterns";
import {
  EMPTY_FILTERS,
  FABRIC_OPTIONS,
  FEATURE_OPTIONS,
  SKILL_OPTIONS,
  TECHNIQUE_OPTIONS,
  activeFilterCount,
  decodeFilters,
  encodeFilters,
  fabricBucket,
  filterPatterns,
  toggleValue,
  type FilterState,
} from "@/lib/pattern-filters";

const SKILLS = SKILL_OPTIONS.map((o) => o.value);
const TECHS = TECHNIQUE_OPTIONS.map((o) => o.value);

/** Sections that don't count toward a pattern's block-fabric total. */
const NON_BLOCK = new Set(["sashing", "cornerstone", "border"]);

describe("pattern metadata", () => {
  it.each(PATTERNS.map((p) => [p.name, p] as const))("%s has complete filter metadata", (_n, p) => {
    expect(SKILLS).toContain(p.skill);
    expect(p.techniques.length).toBeGreaterThan(0);
    p.techniques.forEach((t) => expect(TECHS).toContain(t));
    expect(p.fabricCount).toBeGreaterThan(0);
  });

  it.each(PATTERNS.map((p) => [p.name, p] as const))(
    "%s fabricCount matches its distinct block fabrics",
    (_n, p) => {
      const blockSections = p.sections.filter((s) => !NON_BLOCK.has(s.id));
      const distinct = new Set(blockSections.map((s) => s.defaultFabric)).size;
      expect(p.fabricCount).toBe(distinct);
    },
  );

  it("keeps precut badges on the two precut-friendly patterns", () => {
    const precut = PATTERNS.filter((p) => p.precut).map((p) => p.id).sort();
    expect(precut).toEqual(["rail-fence", "simple-squares"]);
  });
});

describe("fabricBucket", () => {
  it("buckets counts", () => {
    expect(fabricBucket(1)).toBe("1-2");
    expect(fabricBucket(2)).toBe("1-2");
    expect(fabricBucket(3)).toBe("3");
    expect(fabricBucket(4)).toBe("4+");
    expect(fabricBucket(5)).toBe("4+");
  });
});

describe("filterPatterns", () => {
  const f = (partial: Partial<FilterState>): FilterState => ({ ...EMPTY_FILTERS, ...partial });

  it("returns everything with no filters", () => {
    expect(filterPatterns(PATTERNS, EMPTY_FILTERS)).toHaveLength(PATTERNS.length);
  });

  it("searches by name, ignoring case and punctuation", () => {
    const res = filterPatterns(PATTERNS, f({ query: "clowns choice" }));
    expect(res.map((p) => p.id)).toEqual(["clowns-choice"]);
    expect(filterPatterns(PATTERNS, f({ query: "PINWHEEL" })).map((p) => p.id)).toContain("pinwheel");
  });

  it("returns nothing for a non-matching search", () => {
    expect(filterPatterns(PATTERNS, f({ query: "zzzz" }))).toHaveLength(0);
  });

  it("ORs within a group", () => {
    const beginner = filterPatterns(PATTERNS, f({ skills: ["beginner"] }));
    const advanced = filterPatterns(PATTERNS, f({ skills: ["advanced"] }));
    const both = filterPatterns(PATTERNS, f({ skills: ["beginner", "advanced"] }));
    expect(both).toHaveLength(beginner.length + advanced.length);
  });

  it("ANDs across groups", () => {
    const res = filterPatterns(PATTERNS, f({ skills: ["beginner"], techniques: ["hst"] }));
    res.forEach((p) => {
      expect(p.skill).toBe("beginner");
      expect(p.techniques).toContain("hst");
    });
    expect(res.length).toBeGreaterThan(0);
  });

  it("matches a pattern with ANY of the selected techniques", () => {
    const res = filterPatterns(PATTERNS, f({ techniques: ["geese", "strips"] }));
    res.forEach((p) =>
      expect(p.techniques.includes("geese") || p.techniques.includes("strips")).toBe(true),
    );
  });

  it("filters by fabric bucket", () => {
    filterPatterns(PATTERNS, f({ fabrics: ["1-2"] })).forEach((p) =>
      expect(p.fabricCount).toBeLessThanOrEqual(2),
    );
    filterPatterns(PATTERNS, f({ fabrics: ["4+"] })).forEach((p) =>
      expect(p.fabricCount).toBeGreaterThanOrEqual(4),
    );
  });

  it("filters by features (all selected features must be present)", () => {
    const alt = filterPatterns(PATTERNS, f({ features: ["alternate"] }));
    expect(alt.length).toBeGreaterThan(0);
    alt.forEach((p) => expect(p.supportsAlternate).toBe(true));

    const precut = filterPatterns(PATTERNS, f({ features: ["precut"] }));
    expect(precut.map((p) => p.id).sort()).toEqual(["rail-fence", "simple-squares"]);

    const both = filterPatterns(PATTERNS, f({ features: ["precut", "alternate"] }));
    both.forEach((p) => {
      expect(p.precut).toBeTruthy();
      expect(p.supportsAlternate).toBe(true);
    });
  });

  it("sashing feature only keeps patterns with a sashing section", () => {
    filterPatterns(PATTERNS, f({ features: ["sashing"] })).forEach((p) =>
      expect(p.sections.some((s) => s.id === "sashing")).toBe(true),
    );
  });
});

describe("url encoding", () => {
  const state: FilterState = {
    query: "star",
    skills: ["beginner", "advanced"],
    fabrics: ["3"],
    techniques: ["hst", "geese"],
    features: ["alternate"],
  };

  it("round-trips", () => {
    expect(decodeFilters(encodeFilters(state))).toEqual(state);
  });

  it("omits empty groups", () => {
    expect(encodeFilters(EMPTY_FILTERS).toString()).toBe("");
  });

  it("drops unknown values", () => {
    const params = new URLSearchParams("level=beginner,wizard&tech=nope&fabrics=3");
    expect(decodeFilters(params)).toEqual({
      query: "",
      skills: ["beginner"],
      fabrics: ["3"],
      techniques: [],
      features: [],
    });
  });
});

describe("helpers", () => {
  it("toggleValue adds and removes", () => {
    expect(toggleValue<string>([], "a")).toEqual(["a"]);
    expect(toggleValue(["a", "b"], "a")).toEqual(["b"]);
  });

  it("activeFilterCount ignores the query", () => {
    expect(activeFilterCount({ ...EMPTY_FILTERS, query: "star" })).toBe(0);
    expect(
      activeFilterCount({ ...EMPTY_FILTERS, skills: ["beginner"], features: ["precut"] }),
    ).toBe(2);
  });

  it("exposes stable option lists", () => {
    expect(FABRIC_OPTIONS).toHaveLength(3);
    expect(FEATURE_OPTIONS).toHaveLength(3);
  });
});
