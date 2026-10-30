import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";

describe("Walls of Jericho printed fabric requirements", () => {
  it.each([
    { sashingWidth: 0, hasBorder: false, fabrics: ["A", "B", "C"] },
    { sashingWidth: 2, hasBorder: false, fabrics: ["A", "B", "C", "D"] },
    { sashingWidth: 2, hasBorder: true, fabrics: ["A", "B", "C", "D", "E"] },
  ])("includes only active fabrics with sashing $sashingWidth and border $hasBorder", ({ sashingWidth, hasBorder, fabrics }) => {
    const { container } = render(<PrintBlockLegend pattern="walls-of-jericho" assignments={{}} hasBorder={hasBorder} borderFabric="E" sashingWidth={sashingWidth} />);
    const printedFabrics = [...container.querySelectorAll("li strong")].map(el => el.textContent?.match(/Fabric ([A-Z]):/)?.[1]);
    expect(printedFabrics).toEqual(fabrics);
  });
});