import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";
import { PatchworkPreview } from "@/components/PatchworkPreview";
import {
  ALL_FABRIC_KEYS,
  FABRIC_COLORS,
  FABRIC_LABELS,
  setPlanner,
  usePlanner,
  type FabricKey,
} from "@/lib/planner-store";
import { getPattern, fabricsForPattern } from "@/lib/patterns";

export const Route = createFileRoute("/fabrics")({
  head: () => ({
    meta: [
      { title: "Assign fabrics — Quilt Fabric Planner" },
      { name: "description", content: "Assign fabrics to each section of your quilt block and preview the patchwork." },
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

  // Patchwork preview is meaningful for "simple-squares" — a grid of squares
  // is exactly what the user is laying out. For block patterns we still show
  // it as a color-mood preview but make the labeling honest.
  const isPatchwork = pattern.id === "simple-squares";
  const palette: FabricKey[] = ALL_FABRIC_KEYS.slice(
    0,
    Math.max(2, Math.min(12, planner.patchworkFabricCount)),
  );

  return (
    <StepShell
      step={3}
      title={`Assign fabrics — ${pattern.name}`}
      subtitle={isPatchwork
        ? "Pick how many fabrics you want, then tap squares in the preview to design your patchwork."
        : "Pick a fabric for each part of the block. The diagram updates as you choose."}
      backTo="/size"
    >
      <div className="bg-accent/60 border-primary/30 mb-6 rounded-xl border-2 p-4">
        <div className="text-accent-foreground mb-1 text-sm font-semibold uppercase tracking-wide">
          How {pattern.name} works
        </div>
        <p className="text-foreground text-sm leading-relaxed">{pattern.intro}</p>
        {!isPatchwork && (
          <p className="text-muted-foreground mt-2 text-xs">
            Tip: each &quot;Fabric&quot; ({availableFabrics.join(" / ")}) is one bolt you&apos;ll buy
            {availableFabrics.length === 1
              ? ""
              : ". Use the same letter for parts you want to look the same"}
            .
          </p>
        )}
      </div>

      {/* PATCHWORK PREVIEW (Simple Squares) */}
      {isPatchwork && (
        <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
          <div className="mb-4">
            <label className="text-foreground mb-2 block text-base font-semibold">
              How many fabrics do you want? (2–12)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={2}
                max={12}
                step={1}
                value={planner.patchworkFabricCount}
                onChange={(e) =>
                  setPlanner({ patchworkFabricCount: Number(e.target.value) })
                }
                className="flex-1 accent-primary"
                aria-label="Number of fabrics"
              />
              <span className="text-foreground bg-muted min-w-[2.5rem] rounded-md px-2 py-1 text-center text-base font-semibold">
                {planner.patchworkFabricCount}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {palette.map((f) => (
                <span
                  key={f}
                  className="border-border inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
                >
                  <span
                    className="h-3 w-3 rounded-sm"
                    style={{ background: FABRIC_COLORS[f] }}
                  />
                  {f}
                </span>
              ))}
            </div>
          </div>

          <PatchworkPreview
            fabricCount={planner.patchworkFabricCount}
            quiltWidth={planner.quiltWidth}
            quiltHeight={planner.quiltHeight}
            blockSize={planner.blockSize}
            borderWidth={planner.borderWidth}
            grid={planner.patchworkGrid}
            onChange={(g) => setPlanner({ patchworkGrid: g })}
          />
        </div>
      )}

      {/* Block-vs-quilt visual (kept for non-patchwork patterns). */}
      {!isPatchwork && (
        <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
          {(() => {
            const innerW = planner.quiltWidth - 2 * planner.borderWidth;
            const innerH = planner.quiltHeight - 2 * planner.borderWidth;
            const blocksAcross = Math.max(1, Math.floor(innerW / planner.blockSize));
            const blocksDown = Math.max(1, Math.floor(innerH / planner.blockSize));
            const borderFabric = (planner.assignments["border"] ?? "C") as FabricKey;
            return (
              <>
                <QuiltLayoutPreview
                  pattern={pattern.id}
                  assignments={planner.assignments}
                  hasBorder={hasBorder}
                  borderFabric={borderFabric}
                  blocksAcross={blocksAcross}
                  blocksDown={blocksDown}
                  quiltWidth={planner.quiltWidth}
                  quiltHeight={planner.quiltHeight}
                  borderWidth={planner.borderWidth}
                />
                <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
                  You&apos;re designing <strong>one block</strong>. That block will be sewn{" "}
                  <strong>{blocksAcross * blocksDown} times</strong> and arranged in a{" "}
                  {blocksAcross} × {blocksDown} grid to make your finished quilt.
                  {hasBorder && " The border wraps around the outside."}
                </p>
              </>
            );
          })()}
        </div>
      )}

      {/* SECTION-BY-SECTION FABRIC PICKER (always shown — even for patchwork,
          so the border + the canonical "all squares" fabric stay assignable). */}
      <div className="space-y-4">
          {sections.map((s) => {
            const current = (planner.assignments[s.id] ?? s.defaultFabric) as FabricKey;
            // For patchwork patterns, only show border picker here (the squares
            // section is driven by the tap-to-cycle preview above).
            if (isPatchwork && s.id !== "border") return null;
            // Border choices = every fabric used in the block, PLUS one extra
            // "accent" option (the next unused letter) for users who want a
            // unique border fabric. Anything beyond that is noise.
            const isBorder = s.id === "border";
            const nextAccent = ALL_FABRIC_KEYS.find((f) => !availableFabrics.includes(f));
            const choices = isBorder
              ? (nextAccent ? [...availableFabrics, nextAccent] : availableFabrics)
              : availableFabrics;
            return (
              <div key={s.id} className="bg-card rounded-xl border-2 border-border p-4">
                <div className="text-foreground mb-1 text-base font-semibold">{s.label}</div>
                {s.hint && (
                  <div className="text-muted-foreground mb-3 text-xs leading-snug">{s.hint}</div>
                )}
                {isBorder && (
                  <div className="text-muted-foreground mb-3 text-xs leading-snug">
                    Pick the same fabric as one in your block to reuse a bolt, or choose a brand-new fabric for a distinct accent border — it&apos;ll be added to your shopping list automatically.
                  </div>
                )}
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(choices.length, 6)}, minmax(0,1fr))` }}
                >
                  {choices.map((f) => (
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
    </StepShell>
  );
}
