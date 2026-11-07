import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";

describe("Churn Dash printed fabric resolution", () => {
  it("uses the effective border fabric even when no explicit border assignment is saved", () => {
    const { container } = render(<PrintBlockLegend pattern="churn-dash" assignments={{ corners: "E", bg: "D", bars: "B", center: "A" }} hasBorder borderFabric="F" sashingWidth={2} />);
    const diagram = container.querySelector(".relative.inline-block");
    expect(diagram?.getAttribute("style")).toContain("var(--fabric-f)");
    expect([...container.querySelectorAll("li strong")].map(el => el.textContent)).toContain("Fabric F:");
  });
});