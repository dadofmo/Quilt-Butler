import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";
import { CustomBlockSvg } from "@/components/CustomBlockSvg";
import { emptyDesign, key, blockPolys, unitTally } from "@/lib/custom-block";

const d = emptyDesign(4, "A");
d.cells[key(0,0)] = { kind: "hst", rotation: 0, fabrics: ["A","B"] };

describe("custom render", () => {
  it("polys", () => { console.log("polys", blockPolys(d).length, JSON.stringify(unitTally(d)).slice(0,200)); });
  it("svg", () => { render(<CustomBlockSvg design={d} />); });
  it("quilt", () => {
    render(<QuiltLayoutPreview pattern="custom-block" assignments={{}} hasBorder borderFabric="Z" blocksAcross={4} blocksDown={5} quiltWidth={60} quiltHeight={72} borderWidth={4} customBlock={d} />);
  });
});
