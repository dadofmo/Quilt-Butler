import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";
import { EccentricStarBlock } from "../EccentricStarBlock";
describe("Eccentric Star fabric rendering and printed choices",()=> {
  it("resolves every independently selected block role in print and skips inactive finishing",()=> {
    const {container}=render(<PrintBlockLegend pattern="eccentric-star" assignments={{dark:"E",background:"D",points:"B"}} hasBorder={false} borderFabric="F" sashingWidth={0} />);
    for(const [role,f] of [["dark","e"],["background","d"],["points","b"]]) {
      const pieces=[...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every(p=>p.getAttribute("fill")===`var(--fabric-${f})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
  it("includes active sashing and the actual border choice",()=> {
    const {container}=render(<PrintBlockLegend pattern="eccentric-star" assignments={{sashing:"F"}} hasBorder borderFabric="G" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(5);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-g)");
  });
  it("uses fabric photo fills in all eight HSTs and the whole centre",()=> {
    const {container}=render(<svg><EccentricStarBlock size={90} assignments={{dark:"H",background:"I",points:"J"}} photos={{H:"photo-h",I:"photo-i",J:"photo-j"}} /></svg>);
    for(const [role,f,n] of [["dark","H",9],["background","I",4],["points","J",4]] as const) {
      const pieces=[...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(n);
      expect(pieces.every(p=>p.getAttribute("fill")===`url(#fabric-${f})`)).toBe(true);
    }
  });
});