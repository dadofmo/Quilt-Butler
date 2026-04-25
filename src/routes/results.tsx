import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { PrintBlockLegend } from "@/components/PrintBlockLegend";
import { FABRIC_COLORS, FABRIC_LABELS, setPlanner, usePlanner, type FabricKey } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { calculateYardage, type FabricRequirement, type MaterialsRequirement } from "@/lib/yardage";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Yardage results — Quilt Fabric Planner" },
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
        <div className="space-y-6">
          <div className="bg-accent text-accent-foreground rounded-2xl border-2 border-primary/30 p-6 text-center">
            <div className="text-3xl">🧵</div>
            <h2 className="text-foreground mt-3 text-xl font-semibold">
              Yardage calculation for this pattern coming soon
            </h2>
            <p className="text-muted-foreground mt-2 text-base">
              Check back shortly — we're adding accurate math for {pattern.name} in a future update.
              In the meantime, here's what else you'll need regardless of pattern:
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 inline-flex rounded-xl px-5 py-3 text-base font-semibold"
            >
              Try another pattern
            </button>
          </div>
          {result.materials && (
            <Section title="Other materials you'll need">
              <MaterialsCard m={result.materials} />
            </Section>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Print-only block legend just under the title in the printed/PDF
              version so the quilter sees at a glance which fabric goes
              where (A = center & corners, B = alternating, C = border). */}
          <PrintBlockLegend
            pattern={planner.pattern!}
            assignments={planner.assignments}
            hasBorder={planner.borderWidth > 0}
            borderFabric={(planner.assignments.border ?? "C") as FabricKey}
          />

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
              {/* In print: keep Fabric A on page 1 with the summary, then
                  start a new page at Fabric B so B & C share page 2. */}
              {result.fabrics.map((f, i) => (
                <div
                  key={f.fabric}
                  className={i === 1 ? "print-page-break" : undefined}
                >
                  <CuttingDiagram req={f} fabricWidth={planner.fabricWidth} />
                </div>
              ))}
            </div>
          </Section>

          {result.materials && (
            <Section title="Other materials you'll need">
              <MaterialsCard m={result.materials} />
            </Section>
          )}

          {/* Force the shopping list onto its own page (page 3) when printed. */}
          <div className="print-page-break-before">
          <Section title="Shopping list">
            <div className="bg-card rounded-xl border-2 border-border p-5">
              <p className="text-muted-foreground mb-4 text-sm">
                Bring this to the fabric store. Write the fabric name on each line as you pick it
                — that way you'll know exactly which bolt is "Fabric A" when you start cutting.
              </p>
              <ul className="divide-y divide-border">
                {result.fabrics.map((f) => {
                  const name = planner.fabricNames[f.fabric] ?? "";
                  return (
                    <li key={f.fabric} className="py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="border-border inline-block h-6 w-6 rounded border"
                            style={{ background: FABRIC_COLORS[f.fabric] }}
                          />
                          <span className="text-foreground font-medium">
                            {FABRIC_LABELS[f.fabric]}
                          </span>
                        </div>
                        <span className="text-foreground text-lg font-semibold whitespace-nowrap">
                          {f.yards} yd
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2 pl-9">
                        <label
                          htmlFor={`name-${f.fabric}`}
                          className="text-muted-foreground shrink-0 text-sm"
                        >
                          Name:
                        </label>
                        {/* On screen: editable input. When printed: shows the
                            typed name, OR a blank underline to fill in by hand. */}
                        <input
                          id={`name-${f.fabric}`}
                          type="text"
                          value={name}
                          onChange={(e) =>
                            setPlanner({
                              fabricNames: {
                                ...planner.fabricNames,
                                [f.fabric]: e.target.value,
                              },
                            })
                          }
                          placeholder="e.g. Moda Bella – Bluebird"
                          className="no-print border-input bg-background placeholder:text-muted-foreground/60 focus-visible:ring-ring flex-1 border-b-2 px-1 py-1 text-sm focus-visible:outline-none focus-visible:ring-1"
                        />
                        {/* Print-only: shows the name if filled, otherwise a blank
                            underline the user can write on. */}
                        <span className="print-only flex-1 border-b border-foreground pb-0.5 text-sm">
                          {name || "\u00a0"}
                        </span>
                      </div>
                    </li>
                  );
                })}
                {result.materials && (
                  <>
                    <ShopMaterialLine label="Backing fabric" whatItIs="the fabric on the back of your quilt (what you see when you flip it over)" detail={`${result.materials.backing.widths} width${result.materials.backing.widths === 1 ? "" : "s"} × ${result.materials.backing.heightIn}" — pieces ${result.materials.backing.widthIn}" × ${result.materials.backing.heightIn}" (incl. ${result.materials.backing.overhang}" overhang each side)`} amount={`${result.materials.backing.yards} yd`} />
                    <ShopMaterialLine label="Batting" whatItIs="the fluffy middle layer that goes between the top and backing — gives the quilt its warmth and puffiness" detail={`${result.materials.batting.widthIn}" × ${result.materials.batting.heightIn}" — pre-cut: ${result.materials.batting.presetLabel}, or ${result.materials.batting.yards} yd off the roll`} amount={result.materials.batting.presetLabel.startsWith("Larger") ? `${result.materials.batting.yards} yd` : "1 pkg"} />
                    <ShopMaterialLine label="Binding fabric" whatItIs="the narrow strip that wraps around the raw edges of the quilt to finish them neatly" detail={`Cut ${result.materials.binding.stripCount} long strips, each ${result.materials.binding.stripWidthIn}" wide and as long as your fabric is wide (selvage to selvage). Sewn together they wrap the ${result.materials.binding.perimeterIn}" edge of your quilt (plus ~10" extra for corners and joining).`} amount={`${result.materials.binding.yards} yd`} />
                    <ShopMaterialLine
                      label="Piecing thread"
                      whatItIs="the thread your sewing machine uses to stitch the fabric pieces together"
                      detail="One spool of all-purpose thread in a neutral color (cream, grey, or white) — blends in with most fabrics."
                      amount="1 spool"
                    />
                    <ShopMaterialLine
                      label="Quilting thread"
                      whatItIs="the thread used for the decorative stitching that holds the three layers (top, batting, backing) together"
                      detail="One spool in the color of your choice — can match your fabric or be a contrasting accent."
                      amount="1 spool"
                    />
                  </>
                )}
              </ul>
              <div className="text-muted-foreground mt-3 text-sm">
                {planner.safetyBuffer ? "Includes 10% safety buffer on top fabrics." : "No safety buffer."} Rounded up to ¼ yard.
              </div>
            </div>
          </Section>
          </div>

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

function MaterialsCard({ m }: { m: MaterialsRequirement }) {
  return (
    <div className="bg-card overflow-hidden rounded-xl border-2 border-border">
      <table className="w-full text-base">
        <thead className="bg-muted/60">
          <tr className="text-left">
            <th className="px-4 py-3 font-semibold">Material</th>
            <th className="px-4 py-3 font-semibold">Details</th>
            <th className="px-4 py-3 text-right font-semibold">Buy</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-border align-top">
            <td className="px-4 py-3 font-semibold">Backing fabric</td>
            <td className="text-muted-foreground px-4 py-3 text-sm">
              Finished piece needed: <strong className="text-foreground">{m.backing.widthIn}" × {m.backing.heightIn}"</strong>
              {" "}({m.backing.overhang}" overhang on every side).
              {m.backing.widths > 1 && (
                <> Seam <strong className="text-foreground">{m.backing.widths} widths</strong> of fabric together (each {m.backing.heightIn}" long) to get enough width.</>
              )}
            </td>
            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{m.backing.yards} yd</td>
          </tr>
          <tr className="border-t border-border align-top">
            <td className="px-4 py-3 font-semibold">Batting</td>
            <td className="text-muted-foreground px-4 py-3 text-sm">
              Needs to be at least <strong className="text-foreground">{m.batting.widthIn}" × {m.batting.heightIn}"</strong>.
              {" "}Easiest: grab a pre-cut <strong className="text-foreground">{m.batting.presetLabel}</strong> package.
              {" "}Or buy <strong className="text-foreground">{m.batting.yards} yd</strong> off a wide roll (90"+ wide).
            </td>
            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">1 pkg</td>
          </tr>
          <tr className="border-t border-border align-top">
            <td className="px-4 py-3 font-semibold">Binding fabric</td>
            <td className="text-muted-foreground px-4 py-3 text-sm">
              Cut <strong className="text-foreground">{m.binding.stripCount} strips at {m.binding.stripWidthIn}" wide</strong> across the width of fabric. Sew end-to-end to wrap the {m.binding.perimeterIn}" perimeter (+ ~10" for joining/corners).
              {" "}You can use one of your top fabrics — but it'll need this much extra.
            </td>
            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">{m.binding.yards} yd</td>
          </tr>
          <tr className="border-t border-border align-top">
            <td className="px-4 py-3 font-semibold">Thread</td>
            <td className="text-muted-foreground px-4 py-3 text-sm">
              One spool of <strong className="text-foreground">neutral piecing thread</strong> (cream/grey) and one spool of <strong className="text-foreground">quilting thread</strong> in your color of choice.
            </td>
            <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">2 spools</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function ShopMaterialLine({ label, whatItIs, detail, amount }: { label: string; whatItIs?: string; detail: string; amount: string }) {
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-foreground font-medium">{label}</span>
          {whatItIs && (
            <span className="text-muted-foreground ml-2 text-xs italic">— {whatItIs}</span>
          )}
        </div>
        <span className="text-foreground text-lg font-semibold whitespace-nowrap">{amount}</span>
      </div>
      <div className="text-muted-foreground mt-1 text-sm">{detail}</div>
    </li>
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
    subCutWidth?: number; // inches per sub-piece
    subCutCount?: number; // squares actually cut from THIS strip
    perStripMax?: number; // max squares this strip could fit
    isBorder: boolean;
    stripIndex: number; // 1-based across all strips
  };
  const rows: Row[] = [];
  let y = 0;
  let stripIdx = 0;
  // Track totals per strip-group to know how many squares to cut from the LAST strip
  req.strips.forEach((strip) => {
    const piece = strip.pieces[0];
    const isBorder = piece?.w === fabricWidth;
    const usable = fabricWidth - 0.5;
    const perStripMax = piece && !isBorder ? Math.floor(usable / piece.w) : undefined;
    const totalNeeded = piece && !isBorder ? piece.count : 0;
    let cutSoFar = 0;
    for (let i = 0; i < strip.count; i++) {
      stripIdx += 1;
      const remaining = totalNeeded - cutSoFar;
      const thisStripCount =
        piece && !isBorder ? Math.min(perStripMax!, remaining) : undefined;
      if (thisStripCount !== undefined) cutSoFar += thisStripCount;
      rows.push({
        yIn: y,
        hIn: strip.stripWidth,
        subCutWidth: piece && !isBorder ? piece.w : undefined,
        subCutCount: thisStripCount,
        perStripMax,
        isBorder,
        stripIndex: stripIdx,
      });
      y += strip.stripWidth;
    }
  });

  // Total squares needed for this fabric (sum of non-border piece counts)
  const totalSquares = req.pieces
    .filter((p) => p.w !== fabricWidth)
    .reduce((sum, p) => sum + p.count, 0);

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
        {totalSquares > 0 && (() => {
          const sq = req.pieces.find((p) => p.w !== fabricWidth);
          const size = sq ? sq.w.toFixed(2) : "";
          return (
            <li>
              Sub-cut along the <span className="text-muted-foreground">dashed lines</span> to get
              {" "}
              <strong>
                {totalSquares} squares total
                {size && <> — each square {size}" × {size}"</>}
              </strong>{" "}
              from this fabric. The shaded area on the right of each strip is leftover (you can't fit another full square there).
            </li>
          );
        })()}
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
              {fabricWidth}" — full width of the fabric (selvage to selvage)
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
            const usedWidthIn =
              !r.isBorder && r.subCutWidth && r.subCutCount
                ? r.subCutCount * r.subCutWidth
                : fabricWidth;
            const usedW = usedWidthIn * SCALE;
            const wasteW = boltW - usedW;
            return (
              <g key={i}>
                {/* Used (cuttable) portion of the strip */}
                <rect
                  x={PAD_LEFT}
                  y={ry}
                  width={usedW}
                  height={rh}
                  fill={stripFill}
                  stroke={fabricColor}
                  strokeWidth={1}
                />
                {/* Leftover / waste portion */}
                {wasteW > 1 && (
                  <>
                    <rect
                      x={PAD_LEFT + usedW}
                      y={ry}
                      width={wasteW}
                      height={rh}
                      fill="var(--muted)"
                      stroke={fabricColor}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      opacity={0.7}
                    />
                    {wasteW > 28 && (
                      <text
                        x={PAD_LEFT + usedW + wasteW / 2}
                        y={ry + rh / 2 + 3}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px] italic"
                      >
                        leftover {(fabricWidth - usedWidthIn).toFixed(1)}"
                      </text>
                    )}
                  </>
                )}
                {/* Sub-cut dashed lines between squares */}
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

                {/* Strip label — anchored just to the right of the strip-number
                    badge so it never overlaps the number. We also shorten the
                    label when the used portion is narrow (e.g. last partial
                    strip) so it doesn't bleed into the leftover area. */}
                {(() => {
                  const labelAvailW = usedW - 30; // px available to the right of the badge
                  const fullLabel = r.isBorder
                    ? `Border ${r.hIn.toFixed(2)}" × ${fabricWidth}" (full fabric width)`
                    : `${r.hIn.toFixed(2)}" tall → cut ${r.subCutCount} square${r.subCutCount === 1 ? "" : "s"} every ${r.subCutWidth?.toFixed(2)}" (${r.subCutWidth?.toFixed(2)}" × ${r.subCutWidth?.toFixed(2)}")`;
                  const shortLabel = r.isBorder
                    ? `Border ${r.hIn.toFixed(2)}"`
                    : `cut ${r.subCutCount} @ ${r.subCutWidth?.toFixed(2)}"`;
                  // Roughly 5px per char at 10px font; pick the longest version that fits.
                  const label =
                    labelAvailW > fullLabel.length * 5
                      ? fullLabel
                      : labelAvailW > shortLabel.length * 5
                        ? shortLabel
                        : "";
                  if (!label) return null;
                  return (
                    <text
                      x={PAD_LEFT + 28}
                      y={ry + rh / 2 + 3}
                      textAnchor="start"
                      className="fill-foreground text-[10px] font-medium"
                    >
                      {label}
                    </text>
                  );
                })()}
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
