import { describe, it, expect } from "vitest";
import { describePieceSet } from "../yardage";

describe("describePieceSet", () => {
  it("calls a mix of squares and rectangles 'pieces'", () => {
    expect(describePieceSet([{ w: 3.3284, h: 3.3284 }, { w: 4.5, h: 2.5 }]).nounPlural).toBe("pieces");
  });
  it("keeps 'squares' when every piece is square", () => {
    expect(describePieceSet([{ w: 2.875, h: 2.875 }, { w: 4.5, h: 4.5 }]).nounPlural).toBe("squares");
  });
  it("keeps 'rectangles' when every piece is a rectangle", () => {
    expect(describePieceSet([{ w: 4.5, h: 2.5 }]).nounPlural).toBe("rectangles");
  });
});
