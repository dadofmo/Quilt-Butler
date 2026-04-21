import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { FABRIC_COLORS, FABRIC_LABELS, setPlanner, usePlanner, type FabricKey } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { calculateYardage, type FabricRequirement } from "@/lib/yardage";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Yardage results — Quilt Planner" },
      { name: "description", content: "Your fabric yardage, cutting diagram, and printable shopping list." },
    ],
  }),
  component: ResultsStep,
});

function ResultsStep() {
  const planner = usePlanner();
  const navigate = useNavigate();
  const pattern = getPattern(planner.pattern);

  if (!pattern) {
    return (
      <StepShell step={4} title="Pick a pattern first" backTo="/">
        <Link to="/" className="text-primary underline">Go back to patterns</Link>
      </StepShell>
    );
  }

  const result = calculateYardage(planner);

  return (
    <StepShell
      step={4}
      title="Your quilt plan"
      subtitle={`${pattern.name} • ${planner.quiltWidth}" × ${planner.quiltHeight}"`}
      backTo="/fabrics"
    >
      {result.unsupported ? (
        <div className="bg-accent text-accent-foreground rounded-2xl border-2 border-primary/30 p-6 text-center">
          <div className="text-3xl">🧵</div>
          <h2 className="text-foreground mt-3 text-xl font-semibold">
            Yardage calculation for this pattern coming soon
          </h2>
          <p className="text-muted-foreground mt-2 text-base">
            Check back shortly — we're adding accurate math for {pattern.name} in a future update.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 inline-flex rounded-xl px-5 py-3 text-base font-semibold"
          >
            Try another pattern
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="no-print bg-card flex items-center justify-between rounded-xl border-2 border-border p-4">
            <div>
              <div className="text-foreground text-base font-semibold">10% safety buffer</div>
              <div className="text-muted-foreground text-sm">Adds extra fabric for shrinkage & mistakes.</div>
            </div>
            <Toggle
              on={planner.safetyBuffer}
              onChange={(v) => setPlanner({ safetyBuffer: v })}
            />
          </div>

          <Section title="Fabric summary">
            <div className="bg-card overflow-hidden rounded-xl border-2 border-border">
              <table className="w-full text-base">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold">Fabric</th>
                    <th className="px-4 py-3 font-semibold">Used for</th>
                    <th className="px-4 py-3 text-right font-semibold">Yardage</th>
                  </tr>
                </thead>
                <tbody>
                  {result.fabrics.map((f) => (
                    <tr key={f.fabric} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="border-border inline-block h-5 w-5 rounded border"
                            style={{ background: FABRIC_COLORS[f.fabric] }}
                          />
                          <span className="font-semibold">{f.fabric}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-sm">
                        {f.pieces.map((p) => p.label).join(", ")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{f.yards} yd</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.notes && (
              <ul className="text-muted-foreground mt-3 list-disc space-y-1 pl-5 text-sm">
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
          </Section>

          <Section title="Cutting diagrams">
            <div className="space-y-4">
              {result.fabrics.map((f) => (
                <CuttingDiagram key={f.fabric} req={f} fabricWidth={planner.fabricWidth} />
              ))}
            </div>
          </Section>

          <Section title="Shopping list">
            <div className="bg-card rounded-xl border-2 border-border p-5">
              <ul className="divide-y divide-border">
                {result.fabrics.map((f) => (
                  <li key={f.fabric} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="border-border inline-block h-6 w-6 rounded border"
                        style={{ background: FABRIC_COLORS[f.fabric] }}
                      />
                      <span className="text-foreground font-medium">{FABRIC_LABELS[f.fabric]}</span>
                    </div>
                    <span className="text-foreground text-lg font-semibold">{f.yards} yd</span>
                  </li>
                ))}
              </ul>
              <div className="text-muted-foreground mt-3 text-sm">
                {planner.safetyBuffer ? "Includes 10% safety buffer." : "No safety buffer."} Rounded up to ¼ yard.
              </div>
            </div>
          </Section>

          <button
            onClick={() => window.print()}
            className="no-print bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
          >
            <Printer className="h-5 w-5" /> Print / Save as PDF
          </button>
        </div>
      )}
    </StepShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-foreground mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted-foreground/40"}`}
    >
      <span
        className={`bg-card absolute top-0.5 h-6 w-6 rounded-full shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function CuttingDiagram({ req, fabricWidth }: { req: FabricRequirement; fabricWidth: number }) {
  // Visual width = fabricWidth scaled
  const SCALE = 8; // 1 inch = 8px
  const totalLen = req.strips.reduce((acc, s) => acc + s.stripWidth * s.count, 0);
  return (
    <div className="bg-card rounded-xl border-2 border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="border-border inline-block h-5 w-5 rounded border"
            style={{ background: FABRIC_COLORS[req.fabric as FabricKey] }}
          />
          <span className="text-foreground font-semibold">Fabric {req.fabric}</span>
        </div>
        <span className="text-muted-foreground text-sm">{req.yards} yd from {fabricWidth}" bolt</span>
      </div>

      <div className="overflow-x-auto">
        <div
          className="border-border relative border-2 bg-muted/30"
          style={{ width: fabricWidth * SCALE, minHeight: 40 }}
        >
          {(() => {
            let y = 0;
            const rows: React.ReactNode[] = [];
            req.strips.forEach((strip, si) => {
              for (let i = 0; i < strip.count; i++) {
                const top = y * SCALE;
                rows.push(
                  <div
                    key={`${si}-${i}`}
                    className="absolute left-0 flex items-center justify-center border-b border-border/60 text-xs font-medium"
                    style={{
                      top,
                      width: fabricWidth * SCALE,
                      height: strip.stripWidth * SCALE,
                      background: `color-mix(in oklab, ${FABRIC_COLORS[req.fabric as FabricKey]} 35%, white)`,
                    }}
                  >
                    {strip.pieces[0]?.w === fabricWidth
                      ? `Border strip ${strip.stripWidth.toFixed(2)}" × WOF`
                      : `Strip ${strip.stripWidth.toFixed(2)}" — cut into ${strip.pieces[0]?.w.toFixed(2)}" pieces`}
                  </div>,
                );
                y += strip.stripWidth;
              }
            });
            return (
              <div style={{ height: totalLen * SCALE, position: "relative", width: "100%" }}>
                {rows}
              </div>
            );
          })()}
        </div>
      </div>
      <div className="text-muted-foreground mt-2 text-xs">
        Total length down the bolt: {totalLen.toFixed(2)}" ({req.yards} yd rounded)
      </div>
    </div>
  );
}
