import { describe, it, expect } from "vitest";
import { rulerMark, brokenWheelDimensions } from "../broken-wheel";

describe("Broken Wheel ruler marks", () => {
  it("12in block diamond 3.3284 is a hair over 3 5/16", () => {
    const r = rulerMark(brokenWheelDimensions(12).diamondCut);
    expect(r.label).toBe('3 5/16"');
    expect(r.relation).toBe("a hair over");
  });
  it("exact marks are labelled exactly", () => {
    expect(rulerMark(2.875)).toMatchObject({ label: '2 7/8"', relation: "exactly" });
  });
});
