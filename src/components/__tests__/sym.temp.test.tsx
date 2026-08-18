import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { PatternDiagram } from "@/components/PatternDiagram";
import type { PatternId } from "@/lib/planner-store";

const ids: PatternId[] = ["log-cabin","hst","flying-geese","bow-tie","maple-star","love-in-a-mist","antique-tile","idaho-beauty","oh-susannah","economy-block","cabin-in-the-cotton","alaska-homestead","churn-dash"] as PatternId[];

describe("sym", () => {
  it("dumps", () => {
    for (const id of ids) {
      const { container } = render(
        <PatternDiagram pattern={id} assignments={{}} hasBorder={false} size={200} />,
      );
      const svg = container.querySelector("svg")!.outerHTML;
      console.log("@@@", id, svg.length);
      require("fs").writeFileSync(`/tmp/svg-${id}.svg`, svg);
    }
  });
});
