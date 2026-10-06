import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FabricPatternDefs } from "@/components/FabricPatternDefs";

describe("FabricPatternDefs", () => {
  it("restarts each fabric photo inside every SVG piece", () => {
    const markup = renderToStaticMarkup(
      <svg>
        <FabricPatternDefs photos={{ A: "data:image/jpeg;base64,photo" }} />
        <rect x="0" y="0" width="50" height="50" fill="url(#fabric-A)" />
        <rect x="50" y="0" width="50" height="50" fill="url(#fabric-A)" />
      </svg>,
    );

    expect(markup).toContain('patternUnits="objectBoundingBox"');
    expect(markup).toContain('patternContentUnits="objectBoundingBox"');
    expect(markup).toContain('width="1" height="1"');
    expect(markup).toContain('preserveAspectRatio="xMidYMid slice"');
    expect(markup).not.toContain('patternUnits="userSpaceOnUse"');
  });
});