import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { PrintBlockLegend } from "../PrintBlockLegend";
import { HoveringHawksBlock } from "../HoveringHawksBlock";
import { QuiltCanvas } from "../QuiltLayoutPreview";

describe("Hovering Hawks fabric rendering, turning, and print", () => {
  it("resolves every independently selected block role in print and skips inactive finishing", () => {
    const { container } = render(
      <PrintBlockLegend
        pattern="hovering-hawks"
        assignments={{ background: "D", hawks: "E", accent: "B" }}
        hasBorder={false}
        borderFabric="F"
        sashingWidth={0}
      />,
    );
    for (const [role, fabric] of [["background", "d"], ["hawks", "e"], ["accent", "b"]]) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces.length).toBeGreaterThan(0);
      expect(pieces.every((p) => p.getAttribute("fill") === `var(--fabric-${fabric})`)).toBe(true);
    }
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  it("includes active sashing and the actual border choice", () => {
    const { container } = render(
      <PrintBlockLegend
        pattern="hovering-hawks"
        assignments={{ sashing: "F" }}
        hasBorder
        borderFabric="G"
        sashingWidth={2}
      />,
    );
    expect(container.querySelectorAll("li")).toHaveLength(5);
    expect(container.querySelector(".relative.inline-block")?.getAttribute("style")).toContain("var(--fabric-g)");
  });

  it("uses photo fills on all six hawks, four accents, and sixteen background shapes", () => {
    const { container } = render(
      <svg><HoveringHawksBlock
        size={200}
        assignments={{ background: "H", hawks: "I", accent: "J" }}
        photos={{ H: "photo-h", I: "photo-i", J: "photo-j" }}
      /></svg>,
    );
    for (const [role, fabric, total] of [["background", "H", 16], ["hawks", "I", 6], ["accent", "J", 4]] as const) {
      const pieces = [...container.querySelectorAll(`[data-role="${role}"]`)];
      expect(pieces).toHaveLength(total);
      expect(pieces.every((p) => p.getAttribute("fill") === `url(#fabric-${fabric})`)).toBe(true);
    }
  });

  it("draws a straight set without turns and an alternating set with eight quarter turns", () => {
    const props = {
      pattern: "hovering-hawks" as const,
      assignments: {},
      hasBorder: false,
      borderFabric: "E" as const,
      blocksAcross: 4,
      blocksDown: 4,
      quiltWidth: 48,
      quiltHeight: 48,
      borderWidth: 0,
      sashingWidth: 0,
      sashingFabric: "D" as const,
      alternateBlocks: false,
      maxSize: 320,
    };
    const straight = render(<QuiltCanvas {...props} blockLayout="straight" />);
    expect(straight.container.querySelectorAll('g[transform^="rotate("]')).toHaveLength(0);
    straight.unmount();
    const alternating = render(<QuiltCanvas {...props} blockLayout="alternating" />);
    const turns = [...alternating.container.querySelectorAll('g[transform="rotate(90 100 100)"]')];
    expect(turns).toHaveLength(8);
    expect(turns.every((turn) => turn.querySelector("[data-hovering-hawks-block]"))).toBe(true);
  });
});
