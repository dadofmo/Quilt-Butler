import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";
import { SawtoothBlock } from "../SawtoothBlock";
import { PatternThumb } from "../PatternThumb";
import { PatternDiagram } from "../PatternDiagram";
import { QuiltCanvas } from "../QuiltLayoutPreview";

describe("Sawtooth shared previews, photos and print", () => {
  it("resolves all four independent roles in the printed key and omits inactive finishing", () => {
    const { container } = render(<PrintBlockLegend pattern="sawtooth"
      assignments={{ outer: "E", inward: "D", diamonds: "B", light: "A" }}
      hasBorder={false} borderFabric="F" sashingWidth={0} />);
    for (const [role, fabric, total] of [["outer", "e", 16], ["inward", "d", 4], ["diamonds", "b", 5], ["light", "a", 8]] as const) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(total);
      expect(pieces.every((p) => p.getAttribute("fill") === `var(--fabric-${fabric})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(4);
  });

  it("includes active sashing and the selected border in the printed key", () => {
    const { container } = render(<PrintBlockLegend pattern="sawtooth" assignments={{ sashing: "G" }}
      hasBorder borderFabric="H" sashingWidth={2} />);
    expect(container.querySelectorAll("li")).toHaveLength(6);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-h)");
  });

  it("uses one photo-fill role consistently on all 33 pieces", () => {
    const { container } = render(<svg><SawtoothBlock size={90}
      assignments={{ outer: "H", inward: "I", diamonds: "J", light: "K" }}
      photos={{ H: "photo-h", I: "photo-i", J: "photo-j", K: "photo-k" }} /></svg>);
    for (const [role, fabric, total] of [["outer", "H", 16], ["inward", "I", 4], ["diamonds", "J", 5], ["light", "K", 8]] as const) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(total);
      expect(pieces.every((p) => p.getAttribute("fill") === `url(#fabric-${fabric})`)).toBe(true);
    }
  });

  it("uses the same full block in picker, diagram and every quilt position", () => {
    const assignments = { outer: "E", inward: "D", diamonds: "C", light: "B" } as const;
    const thumb = render(<PatternThumb pattern="sawtooth" />);
    expect(thumb.container.querySelectorAll("[data-sawtooth-block]")).toHaveLength(1);
    expect(thumb.container.querySelectorAll("polygon")).toHaveLength(33);
    const diagram = render(<PatternDiagram pattern="sawtooth" assignments={assignments} hasBorder={false} />);
    expect(diagram.container.querySelectorAll("[data-sawtooth-block]")).toHaveLength(1);
    expect(diagram.container.querySelectorAll('[data-role="outer"]')).toHaveLength(16);
    const quilt = render(<QuiltCanvas pattern="sawtooth" assignments={assignments} hasBorder={false}
      borderFabric="F" blocksAcross={3} blocksDown={2} quiltWidth={36} quiltHeight={24} borderWidth={0}
      sashingWidth={0} sashingFabric="E" alternateBlocks blockLayout="herringbone" maxSize={320} />);
    const blocks = [...quilt.container.querySelectorAll("[data-sawtooth-block]")];
    expect(blocks).toHaveLength(6);
    blocks.forEach((block) => {
      expect(block.querySelectorAll("polygon")).toHaveLength(33);
      expect([...block.querySelectorAll('[data-role="inward"]')].every((p) => p.getAttribute("fill") === "var(--fabric-d)")).toBe(true);
    });
    expect(quilt.container.querySelectorAll("polygon[stroke], polygon[stroke-width]")).toHaveLength(0);
  });
});
