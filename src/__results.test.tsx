import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ResultsPage from "@/pages/ResultsPage";
import { setPlanner } from "@/lib/planner-store";

describe("results", () => {
  it("nine patch renders", () => {
    setPlanner({ pattern: "nine-patch" } as never);
    render(<HelmetProvider><MemoryRouter><ResultsPage /></MemoryRouter></HelmetProvider>);
  });
});
