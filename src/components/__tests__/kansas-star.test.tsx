import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { QuiltCanvas, QuiltLayoutPreview } from "../QuiltLayoutPreview";
import { PatternDiagram } from "../PatternDiagram";
import { kansasColorway } from "@/lib/kansas-star";

describe("Kansas Star colorways in planning views", () => {
  it.each([[3, 3], [4, 4], [3, 4], [4, 3]])("renders the intrinsic %s×%s checkerboard with correct assigned fabrics", (rows, cols) => {
    const { container } = render(<QuiltCanvas pattern="kansas-star" assignments={{ navy: "E", ochre: "D", sage: "A" }}
      hasBorder={false} borderFabric="C" blocksAcross={cols} blocksDown={rows} quiltWidth={cols * 12} quiltHeight={rows * 12}
      borderWidth={0} sashingWidth={0} sashingFabric="B" alternateBlocks={true} blockLayout="herringbone" maxSize={220} />);
    const blocks = [...container.querySelectorAll("[data-kansas-colorway]")];
    expect(blocks).toHaveLength(rows * cols);
    blocks.forEach((block, i) => {
      const colorway = kansasColorway(Math.floor(i / cols), i % cols);
      expect(block.getAttribute("data-kansas-colorway")).toBe(colorway);
      const fills = [...block.querySelectorAll("polygon")].map(p => p.getAttribute("fill"));
      expect(fills).toEqual(colorway === "A" ? ["var(--fabric-e)", ...Array(4).fill("var(--fabric-d)")] : ["var(--fabric-d)", ...Array(4).fill("var(--fabric-a)")]);
    });
  });
  it("shows both colorways alongside the quilt", () => {
    const { container } = render(<QuiltLayoutPreview pattern="kansas-star" assignments={{}} hasBorder={false} borderFabric="E"
      blocksAcross={3} blocksDown={3} quiltWidth={36} quiltHeight={36} borderWidth={0} />);
    const variants = [...container.querySelectorAll("[data-kansas-colorway]")].map(e => e.getAttribute("data-kansas-colorway"));
    expect(variants.slice(0, 2)).toEqual(["A", "B"]);
    expect(variants).toHaveLength(11);
  });
  it("supports colorway B and photo fills through the shared diagram", () => {
    const { container } = render(<PatternDiagram pattern="kansas-star" assignments={{ ochre: "E", sage: "D" }} hasBorder={false} colorway="B" photos={{ E: "data:image/jpeg;base64,test" }} />);
    const shapes = container.querySelectorAll("[data-kansas-colorway] polygon");
    expect(shapes).toHaveLength(5);
    const fill = shapes[0].getAttribute("fill");
    expect(fill).toContain("fabric-E");
    expect(container.querySelector(`pattern[id="${fill?.slice(5, -1)}"]`)).not.toBeNull();
    expect(shapes[1].getAttribute("fill")).toBe("var(--fabric-d)");
  });
});