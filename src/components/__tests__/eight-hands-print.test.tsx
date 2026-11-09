import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";

describe("Eight Hands Around printed fabric assignments",()=>{
  it("resolves all four independent roles and suppresses inactive finishing",()=>{
    const {container}=render(<PrintBlockLegend pattern="eight-hands-around"
      assignments={{outer:"D",background:"C",inner:"B",center:"A"}}
      hasBorder={false} borderFabric="E" sashingWidth={0} />);
    for(const [role,f] of [["outer","d"],["background","c"],["inner","b"],["center","a"]]){
      const pieces=[...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every(p=>p.getAttribute("fill")===`var(--fabric-${f})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(4);
  });
  it("shows active finishing without changing block roles",()=>{
    const {container}=render(<PrintBlockLegend pattern="eight-hands-around" assignments={{}}
      hasBorder borderFabric="F" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(6);
    expect(container.querySelector('[data-role="center"]')?.getAttribute("fill")).toBe("var(--fabric-d)");
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-f)");
  });
});