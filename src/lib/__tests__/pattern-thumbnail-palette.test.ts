import { describe, expect, it } from "vitest";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { thumbnailAssignments, THUMBNAIL_FABRICS } from "@/lib/pattern-thumbnail-palette";

describe("standard picker palette", () => {
  it("uses the exact five standard fabric identities", () => {
    expect(THUMBNAIL_FABRICS).toEqual(["A", "B", "C", "D", "E"]);
  });
  it.each(PATTERNS)("$name picker assignments use only the standard palette without changing planning defaults", p => {
    const before = p.sections.map(s => s.defaultFabric);
    const assignments = thumbnailAssignments(p.id);
    expect(Object.values(assignments).length).toBeGreaterThan(0);
    Object.values(assignments).forEach(f => expect(THUMBNAIL_FABRICS).toContain(f));
    expect(getPattern(p.id)?.sections.map(s => s.defaultFabric)).toEqual(before);
  });
  it("maps Duck and Duckling onto the standard palette", () => {
    expect(thumbnailAssignments("duck-and-duckling")).toEqual({ coral: "A", background: "B", ochre: "C", sage: "D" });
  });
  it("maps Bird Nest onto the standard palette while keeping its six roles adjustable", () => {
    expect(thumbnailAssignments("bird-nest")).toEqual({ background: "A", peach: "B", dark: "C", turquoise: "D", mint: "E", center: "A" });
    expect(getPattern("bird-nest")?.sections.filter(s => !["sashing", "border"].includes(s.id))).toHaveLength(6);
  });
});