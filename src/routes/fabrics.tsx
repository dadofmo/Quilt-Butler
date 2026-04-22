import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { PatternDiagram } from "@/components/PatternDiagram";
import { FABRIC_COLORS, FABRIC_LABELS, setPlanner, usePlanner, type FabricKey } from "@/lib/planner-store";
import { getPattern, fabricsForPattern } from "@/lib/patterns";

export const Route = createFileRoute("/fabrics")({
  head: () => ({
    meta: [
      { title: "Assign fabrics — Quilt Planner" },
      { name: "description", content: "Assign Fabric A, B, C, or D to each section of your quilt block." },
    ],
  }),
  component: FabricsStep,
});

function FabricsStep() {
  const planner = usePlanner();
  const navigate = useNavigate();
  const pattern = getPattern(planner.pattern);

  if (!pattern) {
    return (
      <StepShell step={3} title="Pick a pattern first" backTo="/">
        <Link to="/" className="text-primary underline">Go back to patterns</Link>
      </StepShell>
    );
  }

  const hasBorder = planner.borderWidth > 0;
  const sections = pattern.sections.filter((s) => s.id !== "border" || hasBorder);
  const availableFabrics = fabricsForPattern(pattern, hasBorder);

  const update = (sectionId: string, fab: FabricKey) => {
    setPlanner({ assignments: { ...planner.assignments, [sectionId]: fab } });
  };

  return (
    <StepShell
      step={3}
      title={`Assign fabrics — ${pattern.name}`}
      subtitle="Pick a fabric for each part of the block. The diagram updates as you choose."
      backTo="/size"
    >
      <div className="bg-accent/60 border-primary/30 mb-6 rounded-xl border-2 p-4">
        <div className="text-accent-foreground mb-1 text-sm font-semibold uppercase tracking-wide">
          How {pattern.name} works
        </div>
        <p className="text-foreground text-sm leading-relaxed">{pattern.intro}</p>
        <p className="text-muted-foreground mt-2 text-xs">
          Tip: each "Fabric" ({availableFabrics.join(" / ")}) is one bolt you'll buy
          {availableFabrics.length === 1
            ? ""
            : ". Use the same letter for parts you want to look the same"}
          .
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-8">
        <div className="flex flex-col items-center gap-2">
          <PatternDiagram
            pattern={pattern.id}
            assignments={planner.assignments}
            hasBorder={hasBorder}
          />
          <p className="text-muted-foreground max-w-[280px] text-center text-xs">
            Preview only — use the fabric buttons below to change colors.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((s) => {
            const current = (planner.assignments[s.id] ?? s.defaultFabric) as FabricKey;
            return (
              <div key={s.id} className="bg-card rounded-xl border-2 border-border p-4">
                <div className="text-foreground mb-1 text-base font-semibold">{s.label}</div>
                {s.hint && (
                  <div className="text-muted-foreground mb-3 text-xs leading-snug">{s.hint}</div>
                )}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${availableFabrics.length}, minmax(0,1fr))` }}
                >
                  {availableFabrics.map((f) => (
                    <button
                      key={f}
                      onClick={() => update(s.id, f)}
                      aria-label={FABRIC_LABELS[f]}
                      className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 text-sm font-medium transition-all ${
                        current === f
                          ? "border-primary ring-primary/20 ring-2"
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <span
                        className="h-8 w-full rounded"
                        style={{ background: FABRIC_COLORS[f] }}
                      />
                      <span className="text-foreground">{f}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate({ to: "/results" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
          >
            Calculate yardage →
          </button>
        </div>
      </div>
    </StepShell>
  );
}
