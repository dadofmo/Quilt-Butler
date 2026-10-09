import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FabricPatternDefs } from "../FabricPatternDefs";

describe("fabric photo coordinates", () => {
  it("cancels a translated and rotated piece's local coordinates", () => {
    const inverse = { a: 0, b: -1, c: 1, d: 0, e: -20, f: 50 };
    const root = { root: true };
    const multiply = vi.fn(() => inverse);
    const getCTM = vi.fn(function (this: Element) {
      return this.tagName === "svg" ? root : { inverse: () => ({ multiply }) };
    });
    Object.defineProperty(SVGElement.prototype, "getCTM", { configurable: true, value: getCTM });
    try {
      const { container } = render(<svg>
        <FabricPatternDefs photos={{ A: "photo-a" }} />
        <g transform="translate(50 20) rotate(90)"><rect width="20" height="20" fill="url(#fabric-A)" /></g>
      </svg>);
      expect(multiply).toHaveBeenCalledWith(root);
      expect(container.querySelector("[data-fabric-aligned]")?.getAttribute("patternTransform"))
        .toBe("matrix(0 -1 1 0 -20 50)");
    } finally {
      Reflect.deleteProperty(SVGElement.prototype, "getCTM");
    }
  });

  it("keeps two previews' photo references isolated when photos change", () => {
    const pair = (photo: string) => <>
      <svg><FabricPatternDefs photos={{ A: photo }} /><rect fill="url(#fabric-A)" /></svg>
      <svg><FabricPatternDefs photos={{ A: "second-photo" }} /><rect fill="url(#fabric-A)" /></svg>
    </>;
    const { container, rerender } = render(pair("first-photo"));
    const refs = () => Array.from(container.querySelectorAll("rect")).map(r => r.getAttribute("fill"));
    expect(new Set(refs()).size).toBe(2);
    rerender(pair("replacement-photo"));
    const svgs = container.querySelectorAll("svg");
    expect(svgs[0].querySelector("image")?.getAttribute("href")).toBe("replacement-photo");
    expect(svgs[1].querySelector("image")?.getAttribute("href")).toBe("second-photo");
    expect(new Set(refs()).size).toBe(2);
    for (const svg of svgs) {
      const fill = svg.querySelector("rect")?.getAttribute("fill");
      const id = fill?.slice(5, -1);
      expect(Array.from(svg.querySelectorAll("pattern")).some(p => p.id === id)).toBe(true);
    }
  });
});