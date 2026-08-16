import type { PatternDef, PatternSkill, TechniqueTag } from "./patterns";

/** Fabric-count buckets shown in the filter panel. */
export type FabricBucket = "1-2" | "3" | "4+";

/** Extra capability flags a quilter can filter on. */
export type FeatureTag = "precut" | "alternate" | "sashing";

export interface FilterState {
  query: string;
  skills: PatternSkill[];
  fabrics: FabricBucket[];
  techniques: TechniqueTag[];
  features: FeatureTag[];
}

export const EMPTY_FILTERS: FilterState = {
  query: "",
  skills: [],
  fabrics: [],
  techniques: [],
  features: [],
};

export const SKILL_OPTIONS: { value: PatternSkill; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "confident", label: "Confident beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const FABRIC_OPTIONS: { value: FabricBucket; label: string }[] = [
  { value: "1-2", label: "1–2 fabrics" },
  { value: "3", label: "3 fabrics" },
  { value: "4+", label: "4+ fabrics" },
];

export const TECHNIQUE_OPTIONS: { value: TechniqueTag; label: string }[] = [
  { value: "squares", label: "Squares & rectangles" },
  { value: "hst", label: "Half-square triangles" },
  { value: "geese", label: "Flying geese" },
  { value: "flip", label: "Stitch-and-flip corners" },
  { value: "onpoint", label: "On-point / diagonal seams" },
  { value: "strips", label: "Strip piecing" },
];

export const FEATURE_OPTIONS: { value: FeatureTag; label: string }[] = [
  { value: "precut", label: "Precut friendly" },
  { value: "alternate", label: "Reversible A/B blocks" },
  { value: "sashing", label: "Sashing friendly" },
];

/** Which bucket a pattern's fabric count falls into. */
export function fabricBucket(count: number): FabricBucket {
  if (count <= 2) return "1-2";
  if (count === 3) return "3";
  return "4+";
}

function hasFeature(p: PatternDef, f: FeatureTag): boolean {
  if (f === "precut") return Boolean(p.precut);
  if (f === "alternate") return Boolean(p.supportsAlternate);
  return p.sections.some((s) => s.id === "sashing");
}

/**
 * AND across groups, OR within a group. An empty group means "no constraint".
 * Search matches the pattern name, case- and punctuation-insensitively.
 */
export function filterPatterns(patterns: PatternDef[], state: FilterState): PatternDef[] {
  const q = normalize(state.query);
  return patterns.filter((p) => {
    if (q && !normalize(p.name).includes(q)) return false;
    if (state.skills.length && !state.skills.includes(p.skill)) return false;
    if (state.fabrics.length && !state.fabrics.includes(fabricBucket(p.fabricCount))) return false;
    if (state.techniques.length && !state.techniques.some((t) => p.techniques.includes(t))) return false;
    if (state.features.length && !state.features.every((f) => hasFeature(p, f))) return false;
    return true;
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function activeFilterCount(state: FilterState): number {
  return (
    state.skills.length + state.fabrics.length + state.techniques.length + state.features.length
  );
}

export function isFiltering(state: FilterState): boolean {
  return activeFilterCount(state) > 0 || state.query.trim().length > 0;
}

/** Toggle a value in one of the array-valued filter groups. */
export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

const PARAM_KEYS = {
  query: "q",
  skills: "level",
  fabrics: "fabrics",
  techniques: "tech",
  features: "feat",
} as const;

/** Encode filter state as URL search params (omits empty groups). */
export function encodeFilters(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set(PARAM_KEYS.query, state.query.trim());
  if (state.skills.length) params.set(PARAM_KEYS.skills, state.skills.join(","));
  if (state.fabrics.length) params.set(PARAM_KEYS.fabrics, state.fabrics.join(","));
  if (state.techniques.length) params.set(PARAM_KEYS.techniques, state.techniques.join(","));
  if (state.features.length) params.set(PARAM_KEYS.features, state.features.join(","));
  return params;
}

function readList<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  const raw = params.get(key);
  if (!raw) return [];
  const allow = new Set<string>(allowed);
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter((v) => allow.has(v)) as T[];
}

/** Decode filter state from URL search params, dropping unknown values. */
export function decodeFilters(params: URLSearchParams): FilterState {
  return {
    query: params.get(PARAM_KEYS.query) ?? "",
    skills: readList(params, PARAM_KEYS.skills, SKILL_OPTIONS.map((o) => o.value)),
    fabrics: readList(params, PARAM_KEYS.fabrics, FABRIC_OPTIONS.map((o) => o.value)),
    techniques: readList(params, PARAM_KEYS.techniques, TECHNIQUE_OPTIONS.map((o) => o.value)),
    features: readList(params, PARAM_KEYS.features, FEATURE_OPTIONS.map((o) => o.value)),
  };
}

/** Human labels for the active-chip row. */
export function describeActiveFilters(
  state: FilterState,
): { group: keyof Omit<FilterState, "query">; value: string; label: string }[] {
  const out: { group: keyof Omit<FilterState, "query">; value: string; label: string }[] = [];
  state.skills.forEach((v) =>
    out.push({ group: "skills", value: v, label: SKILL_OPTIONS.find((o) => o.value === v)!.label }),
  );
  state.fabrics.forEach((v) =>
    out.push({ group: "fabrics", value: v, label: FABRIC_OPTIONS.find((o) => o.value === v)!.label }),
  );
  state.techniques.forEach((v) =>
    out.push({
      group: "techniques",
      value: v,
      label: TECHNIQUE_OPTIONS.find((o) => o.value === v)!.label,
    }),
  );
  state.features.forEach((v) =>
    out.push({ group: "features", value: v, label: FEATURE_OPTIONS.find((o) => o.value === v)!.label }),
  );
  return out;
}
