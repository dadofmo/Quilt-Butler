/**
 * Guardrail: any pattern that declares a `sashing` section MUST have that
 * sashing rendered by QuiltLayoutPreview when sashingWidth > 0, AND its
 * default border fabric MUST NOT collide with the sashing fabric.
 *
 * This test exists because Shoofly regressed both invariants: yardage math
 * counted sashing correctly, but FabricsPage/ResultsPage had a hardcoded
 * pattern-id whitelist that omitted `shoofly`, so no sashing gaps rendered
 * and getEffectiveBorderDefault(false, ...) chose the sashing letter for
 * the border. The fix routes both pages through patternHasSashingSection().
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  PATTERNS,
  patternHasSashingSection,
  getEffectiveBorderDefault,
} from "@/lib/patterns";
import { FABRIC_COLORS } from "@/lib/planner-store";
import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";

function defaults(sections: { id: string; defaultFabric: FabricKey }[]): SectionAssignments {
  const a: SectionAssignments = {};
  for (const s of sections) a[s.id] = s.defaultFabric;
  return a;
}

describe("Sashing wiring — every pattern with a sashing section", () => {
  const sashed = PATTERNS.filter(patternHasSashingSection);

  it("at least one pattern in the library has a sashing section (sanity)", () => {
    expect(sashed.length).toBeGreaterThan(0);
  });

  for (const p of sashed) {
    describe(`${p.id} (${p.name})`, () => {
      const sashingFabric = p.sections.find((s) => s.id === "sashing")!
        .defaultFabric as FabricKey;

      it("QuiltLayoutPreview draws the sashing background when sashingWidth > 0", () => {
        const borderFabric = getEffectiveBorderDefault(p, true, false);
        const { container } = render(
          <QuiltLayoutPreview
            pattern={p.id}
            assignments={defaults(p.sections)}
            hasBorder={false}
            borderFabric={borderFabric}
            blocksAcross={3}
            blocksDown={4}
            quiltWidth={50}
            quiltHeight={65}
            borderWidth={0}
            sashingWidth={3}
            sashingFabric={sashingFabric}
          />,
        );
        // The preview paints a full-inner-rect background in the sashing
        // fabric colour, then overlays the block tiles. That fill = the
        // hex swatch of the sashing fabric (photos are undefined in tests).
        const html = container.innerHTML;
        const expected = FABRIC_COLORS[sashingFabric].toLowerCase();
        expect(html.toLowerCase()).toContain(`fill="${expected}"`);
      });

      it("effective border default does not collide with the sashing fabric", () => {
        const borderDefault = getEffectiveBorderDefault(p, true, false);
        expect(borderDefault).not.toBe(sashingFabric);
      });
    });
  }
});
