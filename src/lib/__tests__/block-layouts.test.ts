import { describe, expect, it } from "vitest";
import { rotationFor } from "@/lib/block-layouts";

describe("block layout rotation safeguards", () => {
  it("keeps every Streak of Lightning block facing the same direction", () => {
    for (const staleLayout of ["alternating", "barn-raising", "herringbone"] as const) {
      for (let row = 0; row < 6; row += 1) {
        for (let col = 0; col < 5; col += 1) {
          expect(rotationFor("streak-of-lightning", staleLayout, row, col, 5, 6)).toBe(0);
        }
      }
    }
  });

  it("ignores layout settings a pattern does not offer", () => {
    expect(rotationFor("bow-tie", "barn-raising", 0, 0, 5, 6)).toBe(0);
    expect(rotationFor("bow-tie", "herringbone", 0, 1, 5, 6)).toBe(0);
    expect(rotationFor("bow-tie", "alternating", 0, 1, 5, 6)).toBe(90);
  });

  it("preserves declared layout choices", () => {
    expect(rotationFor("hst", "alternating", 0, 1, 5, 6)).toBe(90);
    expect(rotationFor("hst", "herringbone", 0, 2, 5, 6)).toBe(180);
  });

  it("preserves dynamically offered custom-block layouts", () => {
    expect(rotationFor("custom-block", "alternating", 0, 1, 5, 6)).toBe(90);
  });
});