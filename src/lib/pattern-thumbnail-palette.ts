import { getPattern, type PatternDef } from "./patterns";
import type { FabricKey, PatternId, SectionAssignments } from "./planner-store";

export const THUMBNAIL_FABRICS: readonly FabricKey[] = ["A", "B", "C", "D", "E"];
const NON_BLOCK = new Set(["sashing", "cornerstone", "border"]);

/** Picker-only colours: preserve shared roles without changing planning defaults. */
export function thumbnailAssignments(id: PatternId): SectionAssignments {
  const pattern: PatternDef | undefined = getPattern(id);
  if (!pattern) return {};
  const remap = new Map<FabricKey, FabricKey>();
  const assignments: SectionAssignments = {};
  for (const section of pattern.sections) {
    if (NON_BLOCK.has(section.id)) continue;
    let fabric = remap.get(section.defaultFabric);
    if (!fabric) {
      fabric = THUMBNAIL_FABRICS[remap.size % THUMBNAIL_FABRICS.length];
      remap.set(section.defaultFabric, fabric);
    }
    assignments[section.id] = fabric;
  }
  return assignments;
}