import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";

describe("Five Spot printed assignments",()=> {
  it("resolves five independent fabrics without inactive finishing",()=> {
    const {container}=render(<PrintBlockLegend pattern="five-spot"
      assignments={{dark:"E",background:"D",spots:"C",inner:"B",centreCorners:"A"}}
      hasBorder={false} borderFabric="F" sashingWidth={0} />);
    for (const [role,f] of [["dark","e"],["background","d"],["spots","c"],["inner","b"],["centreCorners","a"]]) {
      const pieces=[...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every(p=>p.getAttribute("fill")===`var(--fabric-${f})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(5);
  });
  it("includes active sashing and the independently assigned border",()=> {
    const {container}=render(<PrintBlockLegend pattern="five-spot" assignments={{sashing:"F"}}
      hasBorder borderFabric="G" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(7);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-g)");
  });
});