import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { PatternThumb } from "@/components/PatternThumb";
import { PATTERNS, getPattern } from "@/lib/patterns";
import { setPlanner } from "@/lib/planner-store";
import quiltButlerLogo from "@/assets/quilt-butler-logo.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuiltButler — Fabric calculator for quilters" },
      { name: "description", content: "Pick a pattern, enter your quilt size, and get accurate fabric yardage with a printable cutting plan." },
      { property: "og:title", content: "QuiltButler — Fabric calculator for quilters" },
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
    const assignments: Record<string, import("@/lib/planner-store").FabricKey> = {};
    pattern.sections.forEach((s) => (assignments[s.id] = s.defaultFabric));
    setPlanner({ pattern: id, assignments });
    navigate({ to: "/size" });
  };

  return (
    <StepShell step={1} title="">
      <div className="-mt-2 mb-4 flex justify-center sm:-mt-4">
        <img
          src={quiltButlerLogo}
          alt="QuiltButler — Plan smart. Cut confidently. Quilt beautifully."
          width={900}
          height={600}
          fetchPriority="high"
          className="h-auto w-full max-w-sm sm:max-w-md"
        />
      </div>
      <h1 className="text-foreground text-2xl font-semibold sm:text-3xl">Pick a quilt pattern</h1>
      <p className="text-muted-foreground mt-2 text-base">Tap a tile to start planning your quilt.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
        {PATTERNS.map((p) => {
          const ready = p.hasMath;
          return (
            <button
              key={p.id}
              onClick={() => ready && choose(p.id)}
              disabled={!ready}
              aria-disabled={!ready}
              className={
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-center transition-all focus:outline-none focus:ring-2 focus:ring-ring " +
                (ready
                  ? "hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
                  : "cursor-not-allowed")
              }
            >
              <div
                className={
                  "flex aspect-square w-full items-center justify-center rounded-lg bg-muted/50 p-3 " +
                  (ready ? "" : "opacity-40 grayscale")
                }
              >
                <PatternThumb pattern={p.id} size={110} />
              </div>
              <span
                className={
                  "text-sm font-semibold leading-tight sm:text-base " +
                  (ready ? "text-foreground" : "text-muted-foreground")
                }
              >
                {p.name}
              </span>
              {!ready && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 rounded-md border-2 border-primary bg-background/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-md">
                  Coming soon
                </span>
              )}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
