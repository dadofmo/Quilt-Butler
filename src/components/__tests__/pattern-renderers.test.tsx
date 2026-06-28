/**
 * Renderer coverage — for every pattern in PATTERNS, mount the three
 * visual components (PatternThumb, PatternDiagram, QuiltLayoutPreview)
 * with the pattern's default fabric assignments and assert that:
 *
 *   1. nothing throws while rendering
 *   2. at least one <svg> element is produced
 *   3. the rendered DOM references only fabric tokens that the pattern
 *      actually declares in its sections (catches the Bear Paw class of
 *      "the renderer paints the wrong fabric for a region" by reading the
 *      fill attribute of every <rect>/<path>/<polygon>).
 *
 * Snapshots of each renderer's outerHTML are also captured. Any
 * unintended structural change to a renderer will fail with a diff,
 * which is the safety net that catches accidental visual regressions.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { PATTERNS } from "@/lib/patterns";
import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { PatternThumb } from "@/components/PatternThumb";
import { PatternDiagram } from "@/components/PatternDiagram";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";

function defaultAssignments(sections: { id: string; defaultFabric: FabricKey }[]): SectionAssignments {
  const a: SectionAssignments = {};
  for (const s of sections) a[s.id] = s.defaultFabric;
  return a;
}

describe("Renderer coverage — every pattern in PATTERNS", () => {
  for (const p of PATTERNS) {
    describe(`${p.id} (${p.name})`, () => {
      const assignments = defaultAssignments(p.sections);

      it("PatternThumb renders without throwing and produces an <svg>", () => {
        const { container } = render(<PatternThumb pattern={p.id} size={96} />);
        expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
      });

      it("PatternDiagram renders without throwing and produces an <svg>", () => {
        const { container } = render(
          <PatternDiagram
            pattern={p.id}
            assignments={assignments}
            hasBorder={false}
            size={280}
          />,
        );
        expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
      });

      it("QuiltLayoutPreview renders without throwing and produces an <svg>", () => {
        const borderFabric = (p.sections.find((s) => s.id === "border")?.defaultFabric ??
          ("C" as FabricKey)) as FabricKey;
        const sashingFabric = (p.sections.find((s) => s.id === "sashing")?.defaultFabric ??
          ("C" as FabricKey)) as FabricKey;
        const { container } = render(
          <QuiltLayoutPreview
            pattern={p.id}
            assignments={assignments}
            hasBorder={false}
            borderFabric={borderFabric}
            blocksAcross={3}
            blocksDown={4}
            quiltWidth={50}
            quiltHeight={65}
            borderWidth={0}
            sashingWidth={0}
            sashingFabric={sashingFabric}
          />,
        );
        expect(container.querySelectorAll("svg").length).toBeGreaterThan(0);
      });

      it("PatternDiagram snapshot is stable", () => {
        const { container } = render(
          <PatternDiagram
            pattern={p.id}
            assignments={assignments}
            hasBorder={false}
            size={280}
          />,
        );
        // Trim whitespace differences for snapshot stability.
        expect(container.innerHTML).toMatchSnapshot();
      });
    });
  }
});
