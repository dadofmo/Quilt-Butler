import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { QuiltCanvas } from "@/components/QuiltLayoutPreview";
import type { FabricKey } from "@/lib/planner-store";

const photos: Partial<Record<FabricKey, string>> = {
  A: "data:image/png;base64,fabric-a",
  B: "data:image/png;base64,fabric-b",
};

describe("quilt border fabric photo scale", () => {
  it.each(["nine-patch", "custom-block"] as const)(
    "keeps a stable repeating tile after changing fabrics for %s",
    (pattern) => {
      const props = {
        pattern,
        assignments: {},
        hasBorder: true,
        blocksAcross: 3,
        blocksDown: 4,
        quiltWidth: 42,
        quiltHeight: 54,
        borderWidth: 3,
        sashingWidth: 0,
        sashingFabric: "C" as FabricKey,
        photos,
        alternateBlocks: false,
        blockLayout: "straight" as const,
        maxSize: 220,
      };

      const { getByTestId, rerender } = render(
        <QuiltCanvas {...props} borderFabric="A" />,
      );
      const frame = getByTestId("quilt-border-frame");
      const initialSize = frame.style.backgroundSize;

      expect(initialSize).toMatch(/^auto \d+px$/);
      expect(frame.style.backgroundImage).toContain("fabric-a");
      expect(frame.style.background).toBe("");

      rerender(<QuiltCanvas {...props} borderFabric="B" />);

      expect(frame.style.backgroundImage).toContain("fabric-b");
      expect(frame.style.backgroundSize).toBe(initialSize);
      expect(frame.style.backgroundRepeat).toBe("repeat");
      expect(frame.style.background).toBe("");
    },
  );
});