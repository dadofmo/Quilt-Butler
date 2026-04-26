import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { PrintBlockLegend } from "@/components/PrintBlockLegend";
import { FABRIC_COLORS, FABRIC_LABELS, setPlanner, usePlanner, type FabricKey } from "@/lib/planner-store";
import { fabricBackgroundStyle } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";
import { calculateYardage, describePieceShape, piecesPerStrip, usableFabricWidth, type FabricRequirement, type MaterialsRequirement } from "@/lib/yardage";
import { Printer } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Yardage results — QuiltButler" },
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

  // Compute the ACTUAL finished size from the same math the calculator uses,
  // so the header (and the size-mismatch note) always match what the quilter
  // will end up with — never just the originally-desired size.
  const innerW = planner.quiltWidth - 2 * planner.borderWidth;
  const innerH = planner.quiltHeight - 2 * planner.borderWidth;
  const blocksAcross = Math.max(1, Math.floor(innerW / planner.blockSize));
  const blocksDown = Math.max(1, Math.floor(innerH / planner.blockSize));
  const actualW = blocksAcross * planner.blockSize + 2 * planner.borderWidth;
  const actualH = blocksDown * planner.blockSize + 2 * planner.borderWidth;
  const sizeMismatch =
    actualW !== planner.quiltWidth || actualH !== planner.quiltHeight;

  return (
    <StepShell
      step={4}
      title="Your quilt plan"
      subtitle={`${pattern.name} • ${actualW}" × ${actualH}" finished`}
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
            borderFabric={(planner.assignments.border ?? pattern?.sections.find((s) => s.id === "border")?.defaultFabric ?? "C") as FabricKey}
            photos={planner.fabricPhotos}
          />

          {sizeMismatch && (
            <div className="bg-accent/60 text-foreground rounded-xl border-2 border-primary/40 p-4 text-sm leading-relaxed">
              <strong>Heads up:</strong> your finished quilt will be{" "}
              <strong>{actualW}" × {actualH}"</strong> with a {planner.blockSize}" block and{" "}
              {planner.borderWidth}" border — not the {planner.quiltWidth}" ×{" "}
              {planner.quiltHeight}" you originally chose. All the math below is for the actual{" "}
              {actualW}" × {actualH}" size.{" "}
              <Link to="/size" className="text-primary font-semibold underline">
                Return to Step 2 to adjust →
              </Link>
            </div>
          )}

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
                      <td className="px-4 py-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="border-border inline-block h-9 w-9 rounded border"
                            style={fabricBackgroundStyle(f.fabric, planner.fabricPhotos)}
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

            {/* Safety buffer toggle — sits next to the numbers it actually
                affects so users can flip it and watch yardage update. */}
            <div className="no-print bg-card mt-3 flex items-center justify-between gap-4 rounded-xl border-2 border-border p-4">
              <div className="min-w-0">
                <div className="text-foreground text-base font-semibold">
                  10% safety buffer {planner.safetyBuffer ? "(included above)" : "(off)"}
                </div>
                <div className="text-muted-foreground text-sm">
                  Toggle to add 10% extra fabric for shrinkage & mistakes — yardage above updates.
                </div>
              </div>
              <Toggle
                on={planner.safetyBuffer}
                onChange={(v) => setPlanner({ safetyBuffer: v })}
              />
            </div>

            {/* Cost estimator now lives in the Shopping list section below,
                where the user can enter a price for each individual line item
                (fabrics, backing, batting, binding, threads) and see a
                grand total. */}
            {result.basics && result.basics.length > 0 && (
              <div className="border-border bg-muted/40 mt-4 rounded-md border p-4">
                <div className="text-foreground text-sm font-semibold">
                  Quilting basics — read this once
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  The sewing steps below use these terms. They're the same for
                  every pattern, so once you've got these you can follow any of
                  the per-step instructions.
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  {result.basics.map((b) => (
                    <div key={b.term}>
                      <dt className="text-foreground font-medium">{b.term}</dt>
                      <dd className="text-muted-foreground mt-0.5">
                        {b.explanation}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
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
                  <CuttingDiagram req={f} fabricWidth={planner.fabricWidth} pattern={planner.pattern} photo={planner.fabricPhotos[f.fabric]} />
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
            <ShoppingList
              fabrics={result.fabrics}
              materials={result.materials}
              fabricNames={planner.fabricNames}
              fabricPhotos={planner.fabricPhotos}
              itemPrices={planner.itemPrices}
              safetyBuffer={planner.safetyBuffer}
              onName={(fabric, value) =>
                setPlanner({
                  fabricNames: { ...planner.fabricNames, [fabric]: value },
                })
              }
              onPrice={(id, value) =>
                setPlanner({
                  itemPrices: { ...planner.itemPrices, [id]: value },
                })
              }
            />
          </Section>
          </div>

          <div className="no-print space-y-2">
            <button
              onClick={() => window.print()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
            >
              <Printer className="h-5 w-5" /> Print / Save as PDF
            </button>
            <p className="text-muted-foreground text-center text-xs leading-snug">
              Tip: take this plan to the fabric store. On a phone, screenshot this page;
              on a computer, click <strong>Print → Save as PDF</strong> so you have it offline.
            </p>
          </div>
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

/**
 * One row in the Shopping list. Shows the item, its quantity (yards/spools/etc),
 * a price input, and a computed subtotal. Price input is hidden in print —
 * the printed version shows a blank "$ ____" line so users can fill it in by hand.
 */
function ShoppingLineRow({
  id,
  label,
  whatItIs,
  detail,
  qty,
  unit,
  swatch,
  price,
  onPrice,
  children,
}: {
  id: string;
  label: React.ReactNode;
  whatItIs?: string;
  detail?: React.ReactNode;
  qty: number;
  unit: string;
  swatch?: React.ReactNode;
  price: string;
  onPrice: (v: string) => void;
  children?: React.ReactNode;
}) {
  const priceNum = Number(price);
  const valid = price.trim() !== "" && !isNaN(priceNum) && priceNum > 0;
  const subtotal = valid ? qty * priceNum : 0;
  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {swatch}
          <div className="min-w-0">
            <span className="text-foreground font-medium">{label}</span>
            {whatItIs && (
              <span className="text-muted-foreground ml-2 text-xs italic">— {whatItIs}</span>
            )}
            {detail && (
              <div className="text-muted-foreground mt-1 text-sm">{detail}</div>
            )}
          </div>
        </div>
        <span className="text-foreground text-lg font-semibold whitespace-nowrap">
          {qty} {unit}
        </span>
      </div>
      {children}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 pl-9">
        <div className="flex items-center gap-2">
          <label htmlFor={`price-${id}`} className="text-muted-foreground text-sm">
            Price / {unit}:
          </label>
          {/* Editable on screen */}
          <span className="no-print flex items-center gap-1">
            <span className="text-muted-foreground text-sm">$</span>
            <input
              id={`price-${id}`}
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => onPrice(e.target.value)}
              placeholder="0.00"
              className="border-input bg-background placeholder:text-muted-foreground/60 focus-visible:ring-ring w-20 rounded border-2 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1"
            />
          </span>
          {/* Printed version: shows entered value or blank line */}
          <span className="print-only border-b border-foreground pb-0.5 text-sm" style={{ minWidth: "4rem" }}>
            {valid ? `$${priceNum.toFixed(2)}` : "\u00a0"}
          </span>
        </div>
        <div className="text-foreground text-sm font-semibold whitespace-nowrap">
          Subtotal: {valid ? `$${subtotal.toFixed(2)}` : "—"}
        </div>
      </div>
    </li>
  );
}

/**
 * Full shopping list with per-line price inputs and a grand total.
 */
function ShoppingList({
  fabrics,
  materials,
  fabricNames,
  fabricPhotos,
  itemPrices,
  safetyBuffer,
  onName,
  onPrice,
}: {
  fabrics: FabricRequirement[];
  materials?: MaterialsRequirement;
  fabricNames: Partial<Record<FabricKey, string>>;
  fabricPhotos: Partial<Record<FabricKey, string>>;
  itemPrices: Record<string, string>;
  safetyBuffer: boolean;
  onName: (fabric: FabricKey, value: string) => void;
  onPrice: (id: string, value: string) => void;
}) {
  // Build the unified list of shopping lines with quantities + units so we
  // can both render rows AND compute the grand total in one place.
  type Line = {
    id: string;
    qty: number;
    unit: string;
  };
  const lines: Line[] = [];
  for (const f of fabrics) lines.push({ id: `fabric-${f.fabric}`, qty: f.yards, unit: "yd" });
  if (materials) {
    lines.push({ id: "backing", qty: materials.backing.yards, unit: "yd" });
    const battingIsPkg = !materials.batting.presetLabel.startsWith("Larger");
    lines.push({
      id: "batting",
      qty: battingIsPkg ? 1 : materials.batting.yards,
      unit: battingIsPkg ? "pkg" : "yd",
    });
    lines.push({ id: "binding", qty: materials.binding.yards, unit: "yd" });
    lines.push({ id: "piecing-thread", qty: 1, unit: "spool" });
    lines.push({ id: "quilting-thread", qty: 1, unit: "spool" });
  }

  const grandTotal = lines.reduce((sum, line) => {
    const raw = itemPrices[line.id];
    if (!raw) return sum;
    const p = Number(raw);
    if (isNaN(p) || p <= 0) return sum;
    return sum + line.qty * p;
  }, 0);
  const anyPriced = lines.some((l) => {
    const raw = itemPrices[l.id];
    if (!raw) return false;
    const p = Number(raw);
    return !isNaN(p) && p > 0;
  });

  return (
    <div className="bg-card rounded-xl border-2 border-border p-5">
      <p className="text-muted-foreground mb-4 text-sm">
        Bring this to the fabric store. Write the fabric name on each line as you pick it
        — that way you'll know exactly which bolt is "Fabric A" when you start cutting.
        Enter a price per yard / package / spool to get a running total at the bottom.
      </p>
      <ul className="divide-y divide-border">
        {fabrics.map((f) => {
          const name = fabricNames[f.fabric] ?? "";
          const id = `fabric-${f.fabric}`;
          return (
            <ShoppingLineRow
              key={f.fabric}
              id={id}
              label={fabricPhotos[f.fabric] ? `Fabric ${f.fabric}` : FABRIC_LABELS[f.fabric]}
              qty={f.yards}
              unit="yd"
              price={itemPrices[id] ?? ""}
              onPrice={(v) => onPrice(id, v)}
              swatch={
                <span
                  className="border-border inline-block h-10 w-10 shrink-0 rounded border"
                  style={fabricBackgroundStyle(f.fabric, fabricPhotos)}
                />
              }
            >
              <div className="mt-2 flex items-baseline gap-2 pl-9">
                <label
                  htmlFor={`name-${f.fabric}`}
                  className="text-muted-foreground shrink-0 text-sm"
                >
                  Name:
                </label>
                <input
                  id={`name-${f.fabric}`}
                  type="text"
                  value={name}
                  onChange={(e) => onName(f.fabric, e.target.value)}
                  placeholder="e.g. Moda Bella – Bluebird"
                  className="no-print border-input bg-background placeholder:text-muted-foreground/60 focus-visible:ring-ring flex-1 border-b-2 px-1 py-1 text-sm focus-visible:outline-none focus-visible:ring-1"
                />
                <span className="print-only flex-1 border-b border-foreground pb-0.5 text-sm">
                  {name || "\u00a0"}
                </span>
              </div>
            </ShoppingLineRow>
          );
        })}
        {materials && (
          <>
            <ShoppingLineRow
              id="backing"
              label="Backing fabric"
              whatItIs="the fabric on the back of your quilt (what you see when you flip it over)"
              detail={`${materials.backing.widths} width${materials.backing.widths === 1 ? "" : "s"} × ${materials.backing.heightIn}" — pieces ${materials.backing.widthIn}" × ${materials.backing.heightIn}" (incl. ${materials.backing.overhang}" overhang each side)`}
              qty={materials.backing.yards}
              unit="yd"
              price={itemPrices["backing"] ?? ""}
              onPrice={(v) => onPrice("backing", v)}
            />
            <ShoppingLineRow
              id="batting"
              label="Batting"
              whatItIs="the fluffy middle layer that goes between the top and backing — gives the quilt its warmth and puffiness"
              detail={`${materials.batting.widthIn}" × ${materials.batting.heightIn}" — pre-cut: ${materials.batting.presetLabel}, or ${materials.batting.yards} yd off the roll`}
              qty={materials.batting.presetLabel.startsWith("Larger") ? materials.batting.yards : 1}
              unit={materials.batting.presetLabel.startsWith("Larger") ? "yd" : "pkg"}
              price={itemPrices["batting"] ?? ""}
              onPrice={(v) => onPrice("batting", v)}
            />
            <ShoppingLineRow
              id="binding"
              label="Binding fabric"
              whatItIs="the narrow strip that wraps around the raw edges of the quilt to finish them neatly"
              detail={`Cut ${materials.binding.stripCount} strips at ${materials.binding.stripWidthIn}" wide. Sewn together they wrap the ${materials.binding.perimeterIn}" edge of your quilt (plus ~10" extra for corners and joining).`}
              qty={materials.binding.yards}
              unit="yd"
              price={itemPrices["binding"] ?? ""}
              onPrice={(v) => onPrice("binding", v)}
            />
            <ShoppingLineRow
              id="piecing-thread"
              label="Piecing thread"
              whatItIs="the thread your sewing machine uses to stitch the fabric pieces together"
              detail="One spool of all-purpose thread in a neutral color (cream, grey, or white) — blends in with most fabrics."
              qty={1}
              unit="spool"
              price={itemPrices["piecing-thread"] ?? ""}
              onPrice={(v) => onPrice("piecing-thread", v)}
            />
            <ShoppingLineRow
              id="quilting-thread"
              label="Quilting thread"
              whatItIs="the thread used for the decorative stitching that holds the three layers (top, batting, backing) together"
              detail="One spool in the color of your choice — can match your fabric or be a contrasting accent."
              qty={1}
              unit="spool"
              price={itemPrices["quilting-thread"] ?? ""}
              onPrice={(v) => onPrice("quilting-thread", v)}
            />
          </>
        )}
      </ul>
      <div className="text-muted-foreground mt-3 text-sm">
        {safetyBuffer ? "Includes 10% safety buffer on top fabrics." : "No safety buffer."} Rounded up to ¼ yard.
      </div>

      {/* Grand total — always visible, prominent */}
      <div className="border-primary mt-5 rounded-xl border-2 bg-primary/5 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-foreground text-base font-semibold">
            Total estimated cost
          </span>
          <span className="text-primary text-2xl font-bold">
            {anyPriced ? `≈ $${grandTotal.toFixed(2)}` : "Enter prices above"}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Adds up every line above where you've entered a price. Lines without a price
          are skipped, so the total only reflects what you've filled in.
        </p>
      </div>
    </div>
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


function CuttingDiagram({ req, fabricWidth, pattern, photo }: { req: FabricRequirement; fabricWidth: number; pattern: import("@/lib/planner-store").PatternId | null; photo?: string }) {
  const SCALE = 9; // 1 inch = 9px
  const PAD_TOP = 28; // room for WOF arrow
  const PAD_LEFT = 96; // room for selvage label + per-strip height label
  const PAD_RIGHT = 16;
  const PAD_BOTTOM = 18;

  const totalLen = req.strips.reduce((acc, s) => acc + s.stripWidth * s.count, 0);
  const boltW = fabricWidth * SCALE;
  const boltH = totalLen * SCALE;
  const svgW = PAD_LEFT + boltW + PAD_RIGHT;
  const svgH = PAD_TOP + boltH + PAD_BOTTOM;

  const fabricColor = FABRIC_COLORS[req.fabric as FabricKey];
  // Cutting diagram strips always use the lightened solid color (better
  // contrast for the dashed sub-cut lines and labels) — even when the user
  // has uploaded a photo for the fabric. The photo is only shown in the
  // header swatch above so the quilter can still recognize the fabric.
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
    // Use the same selvage allowance as yardage.ts so the diagram never
    // draws more sub-cuts per strip than the calculator allocated fabric for.
    const perStripMax = piece && !isBorder ? piecesPerStrip(piece.w, fabricWidth) : undefined;
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

  // Total sub-cut pieces needed for this fabric (sum of non-border piece counts).
  // These may be squares (Simple Squares, 9-Patch, HST) or rectangles (Rail
  // Fence rails, future Flying Geese / Brick / Bargello, etc.). Shape
  // detection is delegated to describePieceShape so every UI surface stays
  // in sync with the yardage layer.
  const subCutPieces = req.pieces.filter((p) => p.w !== fabricWidth);
  const totalSquares = subCutPieces.reduce((sum, p) => sum + p.count, 0);
  const firstSubCut = subCutPieces[0];
  const shape = firstSubCut
    ? describePieceShape(firstSubCut.w, firstSubCut.h)
    : describePieceShape(0, 0);
  const pieceNoun = shape.noun;
  const pieceNounPlural = shape.nounPlural;

  return (
    <div className="bg-card rounded-xl border-2 border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="border-border inline-block h-10 w-10 rounded border"
            style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: fabricColor }}
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
          Lay your <strong>{req.yards} yd</strong> of fabric flat, with the <strong>selvages</strong> (the tightly-woven, sometimes-printed side edges) on the left & right.
        </li>
        <li>
          <strong className="text-destructive">Trim off both selvages first.</strong> They're stiffer than the rest of the fabric, often have factory dots or text on them, and will pucker your seams if sewn into a block. Slice about <strong>0.75" off each side</strong> with your rotary cutter so you're working with clean, usable fabric edge-to-edge. <span className="text-muted-foreground">(That's why the diagram shows {usableFabricWidth(fabricWidth).toFixed(1)}" usable across a {fabricWidth}" bolt — the math already accounts for this trim.)</span>
        </li>
        <li>
          Cut <strong>horizontal strips</strong> across the full <strong>{usableFabricWidth(fabricWidth).toFixed(1)}" usable width</strong> at the heights shown in the diagram.
        </li>
        {totalSquares > 0 && (() => {
          const sq = firstSubCut;
          const sizeLabel = sq ? shape.sizeLabel : "";
          return (
            <li>
              Sub-cut along the <span className="text-muted-foreground">dashed lines</span> to get
              {" "}
              <strong>
                {totalSquares} {totalSquares === 1 ? pieceNoun : pieceNounPlural} total
                {sizeLabel && <> — each {pieceNoun} {sizeLabel}</>}
              </strong>{" "}
              from this fabric. <strong>Always start your first sub-cut from the trimmed edge</strong> (not the original selvage edge). The shaded area on the far right of each strip is leftover (you can't fit another full {pieceNoun} there).
            </li>
          );
        })()}
      </ol>
      {pattern === "hst" && totalSquares > 0 && (
        <p className="text-foreground mb-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
          <strong>Note:</strong> after cutting your squares, see the assembly instructions above to learn how to turn each pair of squares into two finished triangle blocks.
        </p>
      )}
      <p className="text-muted-foreground mb-4 text-xs italic">
        New to quilting? The <strong>selvage</strong> is the factory-finished side edge of the bolt — usually slightly thicker, sometimes with the manufacturer's name or color dots printed on it. It doesn't behave like the rest of the fabric and is never used in a quilt block. In the diagram below, the two thin grey strips on the far left and far right of every row are the selvage — they're shown so you can see exactly what gets trimmed away before any sub-cuts.
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
              {usableFabricWidth(fabricWidth).toFixed(1)}" usable width ({fabricWidth}" bolt minus ~0.75" selvage on each side)
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

          {/* Selvage labels — sit at the very edge of the bolt area, outside
              the per-strip height labels in the gutter. */}
          <text
            x={PAD_LEFT - 84}
            y={PAD_TOP + boltH / 2}
            textAnchor="middle"
            transform={`rotate(-90 ${PAD_LEFT - 84} ${PAD_TOP + boltH / 2})`}
            className="fill-muted-foreground text-[10px]"
          >
            selvage — trim off (~0.75")
          </text>
          <text
            x={PAD_LEFT + boltW + 8}
            y={PAD_TOP + boltH / 2}
            textAnchor="middle"
            transform={`rotate(90 ${PAD_LEFT + boltW + 8} ${PAD_TOP + boltH / 2})`}
            className="fill-muted-foreground text-[10px]"
          >
            selvage — trim off (~0.75")
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
            const usableW = usableFabricWidth(fabricWidth);
            const usedWidthIn =
              !r.isBorder && r.subCutWidth && r.subCutCount
                ? r.subCutCount * r.subCutWidth
                : usableW;
            const usedW = usedWidthIn * SCALE;
            // Leftover lives WITHIN the usable width (selvages aren't cuttable
            // fabric — they're already excluded from piecesPerStrip math). The
            // ~0.75" selvage on each edge is rendered as separate shaded zones
            // outside the cuttable region so the leftover number always ties
            // back to the usable width arrow at the top of the diagram.
            const leftoverIn = Math.max(0, usableW - usedWidthIn);
            const leftoverW = leftoverIn * SCALE;
            const selvageInPx = ((fabricWidth - usableW) / 2) * SCALE;
            const cuttableX = PAD_LEFT + selvageInPx;
            return (
              <g key={i}>
                {/* Left selvage zone (not cuttable) */}
                {selvageInPx > 0.5 && (
                  <rect
                    x={PAD_LEFT}
                    y={ry}
                    width={selvageInPx}
                    height={rh}
                    fill="var(--muted)"
                    stroke={fabricColor}
                    strokeWidth={0.5}
                    opacity={0.45}
                  />
                )}
                {/* Used (cuttable) portion of the strip */}
                <rect
                  x={cuttableX}
                  y={ry}
                  width={usedW}
                  height={rh}
                  fill={stripFill}
                  stroke={fabricColor}
                  strokeWidth={1}
                />
                {/* Leftover / waste portion (within usable width) */}
                {leftoverW > 1 && (
                  <>
                    <rect
                      x={cuttableX + usedW}
                      y={ry}
                      width={leftoverW}
                      height={rh}
                      fill="var(--muted)"
                      stroke={fabricColor}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      opacity={0.7}
                    />
                    {leftoverW > 28 && (
                      <text
                        x={cuttableX + usedW + leftoverW / 2}
                        y={ry + rh / 2 + 3}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[9px] italic"
                      >
                        leftover {leftoverIn.toFixed(1)}"
                      </text>
                    )}
                  </>
                )}
                {/* Right selvage zone (not cuttable) */}
                {selvageInPx > 0.5 && (
                  <rect
                    x={PAD_LEFT + boltW - selvageInPx}
                    y={ry}
                    width={selvageInPx}
                    height={rh}
                    fill="var(--muted)"
                    stroke={fabricColor}
                    strokeWidth={0.5}
                    opacity={0.45}
                  />
                )}
                {/* Sub-cut dashed lines between squares */}
                {!r.isBorder && r.subCutWidth && r.subCutCount
                  ? Array.from({ length: r.subCutCount - 1 }).map((_, k) => {
                      const x = cuttableX + (k + 1) * r.subCutWidth! * SCALE;
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


                {/* Per-strip height label, sitting in the left padding gutter
                    so it ALWAYS appears (even on narrow partial strips where
                    the in-strip label would be truncated). This guarantees
                    every row visually communicates "this strip is N inches
                    tall" — no row ever just says "cut 3 @ 11.00" with no
                    height context. */}
                <text
                  x={PAD_LEFT - 6}
                  y={ry + rh / 2 + 3}
                  textAnchor="end"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {r.hIn.toFixed(2)}" tall
                </text>

                {/* Strip number badge — sits at the start of the cuttable
                    area (just inside the left selvage) so it doesn't visually
                    overlap the non-cuttable selvage zone. */}
                <circle cx={cuttableX + 12} cy={ry + rh / 2} r={9} fill="var(--card)" stroke={fabricColor} strokeWidth={1.2} />
                <text
                  x={cuttableX + 12}
                  y={ry + rh / 2 + 3}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {r.stripIndex}
                </text>

                {/* In-strip label — describes the sub-cut action. Height is
                    already shown in the left gutter, so this label focuses on
                    "what to cut from this strip" and degrades gracefully on
                    narrow strips without ever losing critical info. */}
                {(() => {
                  const labelAvailW = usedW - 30; // px available to the right of the badge
                  const fullLabel = r.isBorder
                    ? `Border strip — ${fabricWidth}" wide (full fabric width), no sub-cuts`
                    : `sub-cut ${r.subCutCount} ${r.subCutCount === 1 ? pieceNoun : pieceNounPlural} every ${r.subCutWidth?.toFixed(2)}" → finished piece ${r.hIn.toFixed(2)}" × ${r.subCutWidth?.toFixed(2)}"`;
                  const midLabel = r.isBorder
                    ? `Border — full ${fabricWidth}" width`
                    : `sub-cut ${r.subCutCount} every ${r.subCutWidth?.toFixed(2)}" (${r.hIn.toFixed(2)}" × ${r.subCutWidth?.toFixed(2)}")`;
                  const shortLabel = r.isBorder
                    ? `Border (full width)`
                    : `sub-cut ${r.subCutCount} @ ${r.subCutWidth?.toFixed(2)}"`;
                  // Roughly 5px per char at 10px font; pick the longest version that fits.
                  const label =
                    labelAvailW > fullLabel.length * 5
                      ? fullLabel
                      : labelAvailW > midLabel.length * 5
                        ? midLabel
                        : labelAvailW > shortLabel.length * 5
                          ? shortLabel
                          : "";
                  if (!label) return null;
                  return (
                    <text
                      x={cuttableX + 28}
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
        Total fabric needed down the bolt: <strong className="text-foreground">{totalLen.toFixed(2)}"</strong> ({req.yards} yd rounded up).{totalSquares > 0 ? " Dashed lines = sub-cuts inside each strip." : ""}
      </div>
    </div>
  );
}
