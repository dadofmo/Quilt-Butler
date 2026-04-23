import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { PatternThumb } from "@/components/PatternThumb";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { setPlanner } from "@/lib/planner-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Quilt Fabric Planner — Fabric calculator for quilters" },
      { name: "description", content: "Pick a pattern, enter your quilt size, and get accurate fabric yardage with a printable cutting plan." },
      { property: "og:title", content: "Quilt Fabric Planner — Fabric calculator for quilters" },
      { property: "og:description", content: "Pick a pattern, enter your quilt size, and get accurate fabric yardage with a printable cutting plan." },
    ],
  }),
  component: PatternPicker,
});

function PatternPicker() {
  const navigate = useNavigate();

  const choose = (id: (typeof PATTERNS)[number]["id"]) => {
    const pattern = getPattern(id);
    if (!pattern) return;
    const assignments: Record<string, "A" | "B" | "C" | "D"> = {};
    pattern.sections.forEach((s) => (assignments[s.id] = s.defaultFabric));
    setPlanner({ pattern: id, assignments });
    navigate({ to: "/size" });
  };

  return (
    <StepShell step={1} title="Pick a quilt pattern" subtitle="Tap a tile to start planning your quilt.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {PATTERNS.map((p) => (
          <button
            key={p.id}
            onClick={() => choose(p.id)}
            className="bg-card hover:border-primary group flex flex-col items-center gap-3 rounded-xl border-2 border-border p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="bg-muted/50 flex aspect-square w-full items-center justify-center rounded-lg p-3">
              <PatternThumb pattern={p.id} size={110} />
            </div>
            <span className="text-foreground text-sm font-semibold leading-tight sm:text-base">
              {p.name}
            </span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}
