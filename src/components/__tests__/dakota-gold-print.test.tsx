import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";
import { DakotaGoldBlock } from "../DakotaGoldBlock";
import { PatternThumb } from "../PatternThumb";
import { PatternDiagram } from "../PatternDiagram";
import { QuiltCanvas } from "../QuiltLayoutPreview";

describe("Dakota Gold shared previews, photos and print", () => {
  it("resolves all five independent roles in the printed key and omits inactive finishing", () => {
    const { container } = render(<PrintBlockLegend pattern="dakota-gold"
      assignments={{ cross: "F", dark: "D", teal: "C", pale: "B", squares: "A" }}
      hasBorder={false} borderFabric="G" sashingWidth={0} />);
    for (const [role, fabric, total] of [["cross", "f", 3], ["dark", "d", 8], ["teal", "c", 8], ["pale", "b", 8], ["squares", "a", 4]] as const) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(total);
      expect(pieces.every((p) => p.getAttribute("fill") === `var(--fabric-${fabric})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(5);
  });

  it("includes active sashing and the selected border in the printed key", () => {
    const { container } = render(<PrintBlockLegend pattern="dakota-gold" assignments={{ sashing: "H" }}
      hasBorder borderFabric="I" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(7);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-i)");
  });

  it("uses photo fills consistently on every piece of all five roles", () => {
    const { container } = render(<svg><DakotaGoldBlock size={100}
      assignments={{ cross: "H", dark: "I", teal: "J", pale: "K", squares: "L" }}
      photos={{ H: "photo-h", I: "photo-i", J: "photo-j", K: "photo-k", L: "photo-l" }} /></svg>);
    for (const [role, fabric, total] of [["cross", "H", 3], ["dark", "I", 8], ["teal", "J", 8], ["pale", "K", 8], ["squares", "L", 4]] as const) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(total);
      expect(pieces.every((p) => p.getAttribute("fill") === `url(#fabric-${fabric})`)).toBe(true);
    }
  });

  it("uses the same full block in picker, diagram and every quilt position", () => {
    const assignments = { cross: "F", dark: "E", teal: "D", pale: "C", squares: "B" } as const;
    const thumb = render(<PatternThumb pattern="dakota-gold" />);
    expect(thumb.container.querySelectorAll("[data-dakota-gold-block]")).toHaveLength(1);
    expect(thumb.container.querySelectorAll("polygon")).toHaveLength(31);
    const diagram = render(<PatternDiagram pattern="dakota-gold" assignments={assignments} hasBorder={false} />);
    expect(diagram.container.querySelectorAll("[data-dakota-gold-block]")).toHaveLength(1);
    expect(diagram.container.querySelectorAll('[data-role="pale"]')).toHaveLength(8);
    const quilt = render(<QuiltCanvas pattern="dakota-gold" assignments={assignments} hasBorder={false}
      borderFabric="G" blocksAcross={3} blocksDown={2} quiltWidth={36} quiltHeight={24} borderWidth={0}
      sashingWidth={0} sashingFabric="F" alternateBlocks blockLayout="herringbone" maxSize={320} />);
    const blocks = [...quilt.container.querySelectorAll("[data-dakota-gold-block]")];
    expect(blocks).toHaveLength(6);
    blocks.forEach((block) => {
      expect(block.querySelectorAll("polygon")).toHaveLength(31);
      expect([...block.querySelectorAll('[data-role="dark"]')].every((p) => p.getAttribute("fill") === "var(--fabric-e)")).toBe(true);
    });
    expect(quilt.container.querySelectorAll("polygon[stroke], polygon[stroke-width]")).toHaveLength(0);
  });
});
