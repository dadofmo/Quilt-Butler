import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FabricPatternDefs, FABRIC_TILE_UNITS } from "@/components/FabricPatternDefs";

describe("FabricPatternDefs", () => {
  it("uses one fixed user-space scale so strips, squares and triangles match", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <FabricPatternDefs photos={{ A: "data:image/jpeg;base64,photo" }} />
      </svg>,
    );
    expect(markup).toContain('patternUnits="userSpaceOnUse"');
    expect(markup).not.toContain("objectBoundingBox");
    expect(markup).toContain(`width="${2 * FABRIC_TILE_UNITS}"`);
    // Mirrored 2x2 repeat hides tile edges (no false seams).
    expect(markup.match(/<image/g)?.length).toBe(4);
  });

  it("honours a custom tile size for sashing scaled to quilt pixels", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <FabricPatternDefs photos={{ B: "x" }} idSuffix="-sash" tileSize={20} />
      </svg>,
    );
    expect(markup).toContain('id="fabric-B-sash"');
    expect(markup).toContain('width="40"');
  });
});
