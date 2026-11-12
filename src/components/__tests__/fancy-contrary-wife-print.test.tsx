import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";
describe("Fancy Contrary Wife printed fabric choices",()=> {
  it("resolves the three independent roles and excludes inactive finishing",()=> {
    const {container}=render(<PrintBlockLegend pattern="fancy-contrary-wife" assignments={{dark:"E",background:"D",centre:"B"}} hasBorder={false} borderFabric="F" sashingWidth={0} />);
    for(const [role,f] of [["dark","e"],["background","d"],["centre","b"]]) {
      const pieces=[...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every(p=>p.getAttribute("fill")===`var(--fabric-${f})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });
  it("includes active sashing and the actual border choice",()=> {
    const {container}=render(<PrintBlockLegend pattern="fancy-contrary-wife" assignments={{sashing:"F"}} hasBorder borderFabric="G" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(5);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-g)");
  });
});