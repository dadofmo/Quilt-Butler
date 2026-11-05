import { describe, it, expect } from "vitest";
import { getPattern, PATTERNS } from "@/lib/patterns";

describe("Churn Dash four-fabric reference", () => {
  it("defaults to four distinct block fabrics", () => {
    const p = getPattern("churn-dash")!;
    const d = Object.fromEntries(p.sections.map((s) => [s.id, s.defaultFabric]));
    expect([d.corners, d.bg, d.bars, d.center]).toEqual(["A", "B", "C", "D"]);
    expect(PATTERNS[0].id).toBe("nine-patch");
  });
});
