import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { QuiltCanvas, QuiltLayoutPreview } from "../QuiltLayoutPreview";
import { PatternDiagram } from "../PatternDiagram";
import { PatternThumb } from "../PatternThumb";
import { kansasColorway } from "@/lib/kansas-star";

const unitFills = (container: Element) => {
  const polys = [...container.querySelectorAll("polygon[data-kansas-colorway]")];
  return Array.from({ length: polys.length / 5 }, (_, i) => polys.slice(i * 5, i * 5 + 5));
};

describe("Kansas Star 3×3 block in planning views", () => {
  it.each([[3, 3], [2, 4]])("renders %s×%s identical 3×3 blocks with assigned fabrics", (rows, cols) => {
    const { container } = render(<QuiltCanvas pattern="kansas-star" assignments={{ navy: "E", ochre: "D", sage: "A" }}
      hasBorder={false} borderFabric="C" blocksAcross={cols} blocksDown={rows} quiltWidth={cols * 12} quiltHeight={rows * 12}
      borderWidth={0} sashingWidth={0} sashingFabric="B" alternateBlocks={true} blockLayout="herringbone" maxSize={220} />);
    const blocks = [...container.querySelectorAll("[data-kansas-block]")];
    expect(blocks).toHaveLength(rows * cols);
    blocks.forEach(block => {
      const units = unitFills(block);
      expect(units).toHaveLength(9);
      units.forEach((unit, i) => {
        const colorway = kansasColorway(Math.floor(i / 3), i % 3);
        expect(unit.map(p => p.getAttribute("fill"))).toEqual(colorway === "A" ? ["var(--fabric-e)", ...Array(4).fill("var(--fabric-d)")] : ["var(--fabric-d)", ...Array(4).fill("var(--fabric-a)")]);
      });
    });
  });
  it("shows a single block beside the quilt, not two blocks", () => {
    const { container, queryByText } = render(<QuiltLayoutPreview pattern="kansas-star" assignments={{}} hasBorder={false} borderFabric="E"
      blocksAcross={3} blocksDown={3} quiltWidth={36} quiltHeight={36} borderWidth={0} />);
    expect(queryByText("Block B")).toBeNull();
    expect(container.querySelectorAll("[data-kansas-block]")).toHaveLength(10);
  });
  it("shows the full 3×3 block in the picker thumbnail and diagram with photo fills", () => {
    const thumb = render(<PatternThumb pattern="kansas-star" />);
    expect(thumb.container.querySelectorAll("[data-kansas-block]")).toHaveLength(1);
    expect(unitFills(thumb.container)).toHaveLength(9);
    const { container } = render(<PatternDiagram pattern="kansas-star" assignments={{ ochre: "E", sage: "D" }} hasBorder={false} photos={{ E: "data:image/jpeg;base64,test" }} />);
    const units = unitFills(container);
    expect(units).toHaveLength(9);
    const fill = units[1][0].getAttribute("fill");
    expect(fill).toContain("fabric-E");
    expect(container.querySelector(`pattern[id="${fill?.slice(5, -1)}"]`)).not.toBeNull();
    expect(units[1][1].getAttribute("fill")).toBe("var(--fabric-d)");
  });
});
