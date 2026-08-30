import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ResultsPage from "@/pages/ResultsPage";
import { setPlanner } from "@/lib/planner-store";
import { emptyDesign, key } from "@/lib/custom-block";

describe("custom results", () => {
  it("renders", () => {
    const d = emptyDesign(4, "A");
    d.cells[key(0,0)] = { kind: "hst", rotation: 0, fabrics: ["A","B"] };
    setPlanner({ pattern: "custom-block", customBlock: d, assignments: { sashing: "Y" } } as never);
    render(<HelmetProvider><MemoryRouter><ResultsPage /></MemoryRouter></HelmetProvider>);
  });
});
