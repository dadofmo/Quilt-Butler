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
          <div className="no-print bg-card flex items-center justify-between gap-4 rounded-xl border-2 border-border p-4">
            <div className="min-w-0">
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
    <div className="flex items-center gap-3">
      <span className={`text-sm font-semibold ${on ? "text-muted-foreground" : "text-foreground"}`}>
        Off
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Toggle 10% safety buffer"
        onClick={() => onChange(!on)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors ${
          on ? "border-primary bg-primary" : "border-border bg-card"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
      <span className={`text-sm font-semibold ${on ? "text-foreground" : "text-muted-foreground"}`}>
        On
      </span>
    </div>
  );
}

function CuttingDiagram({ req, fabricWidth }: { req: FabricRequirement; fabricWidth: number }) {
  const SCALE = 9; // 1 inch = 9px
  const PAD_TOP = 28; // room for WOF arrow
  const PAD_LEFT = 56; // room for selvage label
  const PAD_RIGHT = 16;
  const PAD_BOTTOM = 18;

  const totalLen = req.strips.reduce((acc, s) => acc + s.stripWidth * s.count, 0);
  const boltW = fabricWidth * SCALE;
  const boltH = totalLen * SCALE;
  const svgW = PAD_LEFT + boltW + PAD_RIGHT;
  const svgH = PAD_TOP + boltH + PAD_BOTTOM;

  const fabricColor = FABRIC_COLORS[req.fabric as FabricKey];
  const stripFill = `color-mix(in oklab, ${fabricColor} 30%, white)`;

  // Build strip layout
  type Row = {
    yIn: number; // top in inches
    hIn: number; // height in inches
    label: string;
    subCutWidth?: number; // inches per sub-piece
    subCutCount?: number; // pieces per strip
    isBorder: boolean;
    stripIndex: number; // 1-based across all strips
  };
  const rows: Row[] = [];
  let y = 0;
  let stripIdx = 0;
  req.strips.forEach((strip) => {
    const piece = strip.pieces[0];
    const isBorder = piece?.w === fabricWidth;
    const usable = fabricWidth - 0.5;
    const subCount = piece && !isBorder ? Math.floor(usable / piece.w) : undefined;
    for (let i = 0; i < strip.count; i++) {
      stripIdx += 1;
      rows.push({
        yIn: y,
        hIn: strip.stripWidth,
        label: isBorder
          ? `Border strip — ${strip.stripWidth.toFixed(2)}" × full width`
          : `Strip ${strip.stripWidth.toFixed(2)}" tall`,
        subCutWidth: piece && !isBorder ? piece.w : undefined,
        subCutCount: subCount,
        isBorder,
        stripIndex: stripIdx,
      });
      y += strip.stripWidth;
    }
  });

  return (
    <div className="bg-card rounded-xl border-2 border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="border-border inline-block h-5 w-5 rounded border"
            style={{ background: fabricColor }}
          />
          <span className="text-foreground font-semibold">Fabric {req.fabric} cutting plan</span>
        </div>
        <span className="text-muted-foreground text-sm">
          {req.yards} yd from {fabricWidth}" bolt
        </span>
      </div>

      {/* How-to legend */}
      <ol className="text-foreground mb-2 list-decimal space-y-1 pl-5 text-sm">
        <li>
          Lay your <strong>{req.yards} yd</strong> of fabric flat, with the <strong>finished edges</strong> on the left & right.
        </li>
        <li>
          Cut <strong>horizontal strips</strong> across the full {fabricWidth}" width at the heights shown.
        </li>
        {rows.some((r) => !r.isBorder) && (
          <li>
            Then sub-cut each strip along the <span className="text-muted-foreground">dashed lines</span> into the squares you need.
          </li>
        )}
      </ol>
      <p className="text-muted-foreground mb-4 text-xs italic">
        Tip: the "finished edges" (also called the <em>selvage</em>) are the tightly-woven side edges of the fabric that don't fray.
      </p>

      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} className="block">
          {/* WOF arrow */}
          <g>
            <line
              x1={PAD_LEFT}
              y1={14}
              x2={PAD_LEFT + boltW}
              y2={14}
              stroke="currentColor"
              className="text-muted-foreground"
              strokeWidth={1.2}
              markerStart="url(#arrL)"
              markerEnd="url(#arrR)"
            />
            <text
              x={PAD_LEFT + boltW / 2}
              y={10}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px] font-medium"
            >
              {fabricWidth}" width of fabric (WOF)
            </text>
          </g>

          <defs>
            <marker id="arrL" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M10,0 L0,5 L10,10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
            </marker>
            <marker id="arrR" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground" />
            </marker>
          </defs>

          {/* Selvage labels */}
          <text
            x={PAD_LEFT - 8}
            y={PAD_TOP + boltH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${PAD_LEFT - 8} ${PAD_TOP + boltH / 2})`}
            className="fill-muted-foreground text-[10px]"
          >
            finished edge
          </text>
          <text
            x={PAD_LEFT + boltW + 8}
            y={PAD_TOP + boltH / 2}
            textAnchor="middle"
            transform={`rotate(90 ${PAD_LEFT + boltW + 8} ${PAD_TOP + boltH / 2})`}
            className="fill-muted-foreground text-[10px]"
          >
            finished edge
          </text>

          {/* Bolt outline */}
          <rect
            x={PAD_LEFT}
            y={PAD_TOP}
            width={boltW}
            height={boltH}
            fill="var(--muted)"
            stroke="var(--border)"
            strokeWidth={1.5}
            rx={4}
          />

          {/* Strips */}
          {rows.map((r, i) => {
            const ry = PAD_TOP + r.yIn * SCALE;
            const rh = r.hIn * SCALE;
            return (
              <g key={i}>
                <rect
                  x={PAD_LEFT}
                  y={ry}
                  width={boltW}
                  height={rh}
                  fill={stripFill}
                  stroke={fabricColor}
                  strokeWidth={1}
                />
                {/* Sub-cut dashed lines (skip the rightmost edge) */}
                {!r.isBorder && r.subCutWidth && r.subCutCount
                  ? Array.from({ length: r.subCutCount - 1 }).map((_, k) => {
                      const x = PAD_LEFT + (k + 1) * r.subCutWidth! * SCALE;
                      return (
                        <line
                          key={k}
                          x1={x}
                          y1={ry + 2}
                          x2={x}
                          y2={ry + rh - 2}
                          stroke={fabricColor}
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          opacity={0.8}
                        />
                      );
                    })
                  : null}

                {/* Strip number badge */}
                <circle cx={PAD_LEFT + 12} cy={ry + rh / 2} r={9} fill="var(--card)" stroke={fabricColor} strokeWidth={1.2} />
                <text
                  x={PAD_LEFT + 12}
                  y={ry + rh / 2 + 3}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {r.stripIndex}
                </text>

                {/* Strip label */}
                <text
                  x={PAD_LEFT + boltW / 2}
                  y={ry + rh / 2 + 3}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-medium"
                >
                  {r.isBorder
                    ? `Border ${r.hIn.toFixed(2)}" × ${fabricWidth}" WOF`
                    : `${r.hIn.toFixed(2)}" tall → ${r.subCutCount} pieces of ${r.subCutWidth?.toFixed(2)}"`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="text-muted-foreground mt-3 text-xs">
        Total fabric needed down the bolt: <strong className="text-foreground">{totalLen.toFixed(2)}"</strong> ({req.yards} yd rounded up). Dashed lines = sub-cuts inside each strip.
      </div>
    </div>
  );
}
