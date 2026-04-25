import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { SIZE_PRESETS, setPlanner, usePlanner } from "@/lib/planner-store";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/size")({
  head: () => ({
    meta: [
      { title: "Quilt size — Quilt Fabric Planner" },
      { name: "description", content: "Set your finished quilt size, fabric width, block size and border." },
    ],
  }),
  component: SizeStep,
});

function SizeStep() {
  const planner = usePlanner();
  const navigate = useNavigate();

  const [preset, setPreset] = useState(planner.sizePreset);
  const [w, setW] = useState(planner.quiltWidth);
  const [h, setH] = useState(planner.quiltHeight);
  const [fabricWidth, setFabricWidth] = useState<44 | 60>(planner.fabricWidth);
  // Block size is now a free-text decimal — store as string while typing so
  // the user can type "4." or "4.5" without us coercing to NaN/0 mid-keystroke.
  const [blockSizeText, setBlockSizeText] = useState(String(planner.blockSize));
  const [borderPreset, setBorderPreset] = useState<string>(
    [0, 2, 3, 4, 5].includes(planner.borderWidth) ? String(planner.borderWidth) : "custom",
  );
  const [borderCustom, setBorderCustom] = useState(planner.borderWidth);

  if (!planner.pattern) {
    return (
      <StepShell step={2} title="Pick a pattern first" backTo="/">
        <Link to="/" className="text-primary underline">Go back to patterns</Link>
      </StepShell>
    );
  }

  const onPreset = (key: string) => {
    setPreset(key);
    if (key !== "custom") {
      const p = SIZE_PRESETS[key];
      setW(p.w);
      setH(p.h);
    }
  };

  // ----- Block-size validation -----
  // We don't hard-block the user — quilters often plan to trim or add a filler
  // strip to absorb the leftover. We surface a clear warning instead.
  const blockSizeNum = Number(blockSizeText);
  const blockSizeValid = blockSizeText.trim() !== "" && !isNaN(blockSizeNum) && blockSizeNum > 0;
  const border = borderPreset === "custom" ? Number(borderCustom) || 0 : Number(borderPreset);

  const fit = useMemo(() => {
    if (!blockSizeValid) return null;
    const quiltW = Number(w) || 0;
    const quiltH = Number(h) || 0;
    const innerW = quiltW - 2 * border;
    const innerH = quiltH - 2 * border;
    if (innerW <= 0 || innerH <= 0) return null;
    const acrossExact = innerW / blockSizeNum;
    const downExact = innerH / blockSizeNum;
    const blocksAcross = Math.floor(acrossExact);
    const blocksDown = Math.floor(downExact);
    const remW = +(innerW - blocksAcross * blockSizeNum).toFixed(2);
    const remH = +(innerH - blocksDown * blockSizeNum).toFixed(2);
    const perfect = remW === 0 && remH === 0;

    // ----- Block-size suggestions: keep CURRENT border, find block sizes that
    // divide both inner dimensions evenly.
    const blockSuggestions: number[] = [];
    if (!perfect) {
      const candidates = [3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8, 9, 10, 12];
      for (const c of candidates) {
        if (c === blockSizeNum) continue;
        const aw = innerW / c;
        const ah = innerH / c;
        if (Math.abs(aw - Math.round(aw)) < 0.001 && Math.abs(ah - Math.round(ah)) < 0.001) {
          blockSuggestions.push(c);
        }
      }
    }

    // ----- Border suggestions: keep CURRENT block size, find a border width
    // that makes the inner area divide evenly. We look for a border B such
    // that (quiltW - 2B) and (quiltH - 2B) are both integer multiples of the
    // block size. Search 0–10" in 0.25" steps.
    type BorderSuggestion = { border: number; across: number; down: number; total: number };
    const borderSuggestions: BorderSuggestion[] = [];
    if (!perfect) {
      const seen = new Set<number>();
      for (let b2 = 0; b2 <= 40; b2++) {
        const b = b2 / 4; // 0, 0.25, 0.5, ... 10
        if (b === border) continue;
        const iw = quiltW - 2 * b;
        const ih = quiltH - 2 * b;
        if (iw <= 0 || ih <= 0) continue;
        const aw = iw / blockSizeNum;
        const ah = ih / blockSizeNum;
        if (
          Math.abs(aw - Math.round(aw)) < 0.001 &&
          Math.abs(ah - Math.round(ah)) < 0.001 &&
          Math.round(aw) >= 1 &&
          Math.round(ah) >= 1
        ) {
          if (seen.has(b)) continue;
          seen.add(b);
          borderSuggestions.push({
            border: b,
            across: Math.round(aw),
            down: Math.round(ah),
            total: Math.round(aw) * Math.round(ah),
          });
        }
      }
      // Sort by closeness to current border so the suggestions feel like small tweaks.
      borderSuggestions.sort((a, b) => Math.abs(a.border - border) - Math.abs(b.border - border));
    }

    return {
      perfect,
      blocksAcross,
      blocksDown,
      total: blocksAcross * blocksDown,
      remW,
      remH,
      innerW,
      innerH,
      blockSuggestions: blockSuggestions.slice(0, 4),
      borderSuggestions: borderSuggestions.slice(0, 3),
    };
  }, [blockSizeValid, blockSizeNum, w, h, border]);

  const next = () => {
    if (!blockSizeValid) return;
    setPlanner({
      sizePreset: preset,
      quiltWidth: Number(w) || 0,
      quiltHeight: Number(h) || 0,
      fabricWidth,
      blockSize: blockSizeNum,
      borderWidth: border,
    });
    navigate({ to: "/fabrics" });
  };

  return (
    <StepShell step={2} title="Quilt size & basics" subtitle="A few quick details so we can do the math." backTo="/">
      <div className="space-y-6">
        <Field label="Finished quilt size">
          <Select value={preset} onChange={(e) => onPreset(e.target.value)}>
            {Object.entries(SIZE_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          {preset === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberInput label="Width (in)" value={w} onChange={setW} />
              <NumberInput label="Height (in)" value={h} onChange={setH} />
            </div>
          )}
        </Field>

        <Field label="Fabric width (your bolt)">
          <Select value={String(fabricWidth)} onChange={(e) => setFabricWidth(Number(e.target.value) as 44 | 60)}>
            <option value="44">44 inches</option>
            <option value="60">60 inches</option>
          </Select>
        </Field>

        <Field label="Block size (finished, in inches)">
          <input
            type="text"
            inputMode="decimal"
            value={blockSizeText}
            onChange={(e) => setBlockSizeText(e.target.value)}
            placeholder="e.g. 4.5"
            aria-invalid={!blockSizeValid}
            className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
          />
          <p className="text-muted-foreground mt-2 text-xs leading-snug">
            Enter any size — common sizes include 4&quot;, 6&quot;, 8&quot;, 10&quot;, 12&quot; but any size works.
          </p>
          {blockSizeText.trim() !== "" && !blockSizeValid && (
            <p className="text-destructive mt-2 text-sm font-medium">
              Please enter a positive number (e.g. 3.75, 4, 6, 8.5).
            </p>
          )}
        </Field>

        <Field label="Border width">
          <Select value={borderPreset} onChange={(e) => setBorderPreset(e.target.value)}>
            <option value="0">None</option>
            <option value="2">2 inches</option>
            <option value="3">3 inches</option>
            <option value="4">4 inches</option>
            <option value="5">5 inches</option>
            <option value="custom">Custom</option>
          </Select>
          {borderPreset === "custom" && (
            <div className="mt-3">
              <NumberInput label="Border (in)" value={borderCustom} onChange={setBorderCustom} />
            </div>
          )}
        </Field>

        {/* Fit feedback — perfect-fit confirmation OR uneven-divide warning. */}
        {fit && (
          fit.perfect ? (
            <div
              className="rounded-xl border-2 border-primary/40 bg-accent/60 p-4"
              role="status"
            >
              <div className="text-accent-foreground text-sm font-semibold uppercase tracking-wide">
                ✓ Perfect fit
              </div>
              <p className="text-foreground mt-1 text-sm leading-relaxed">
                A {blockSizeNum}&quot; block divides evenly into your{" "}
                <strong>{fit.innerW}&quot; × {fit.innerH}&quot;</strong> inner area —
                your quilt will have <strong>{fit.blocksAcross} blocks wide</strong> by{" "}
                <strong>{fit.blocksDown} blocks tall</strong> for{" "}
                <strong>{fit.total} total blocks</strong>.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4"
              role="alert"
            >
              <div className="text-destructive text-sm font-semibold uppercase tracking-wide">
                ⚠ Doesn&apos;t divide evenly
              </div>
              <p className="text-foreground mt-1 text-sm leading-relaxed">
                A {blockSizeNum}&quot; block fits{" "}
                <strong>{fit.blocksAcross} across × {fit.blocksDown} down</strong>{" "}
                inside your {fit.innerW}&quot; × {fit.innerH}&quot; inner area, leaving{" "}
                <strong>{fit.remW}&quot; left/right</strong> and{" "}
                <strong>{fit.remH}&quot; top/bottom</strong>. You can continue —
                you&apos;ll need to trim the extra or add a filler strip to absorb it.
              </p>
              {(fit.borderSuggestions.length > 0 || fit.blockSuggestions.length > 0) && (
                <div className="mt-3 space-y-2 border-t border-destructive/20 pt-3">
                  <p className="text-foreground text-xs font-semibold">
                    To fill the full {fit.innerW}&quot; × {fit.innerH}&quot; inner area perfectly, try one of these:
                  </p>
                  {fit.borderSuggestions.length > 0 && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">Keep your {blockSizeNum}&quot; block, change border to:</span>{" "}
                      {fit.borderSuggestions.map((b, i) => (
                        <button
                          key={b.border}
                          type="button"
                          onClick={() => {
                            const presetVals = ["0", "2", "3", "4", "5"];
                            const asStr = String(b.border);
                            if (presetVals.includes(asStr)) {
                              setBorderPreset(asStr);
                            } else {
                              setBorderPreset("custom");
                              setBorderCustom(b.border);
                            }
                          }}
                          className="text-primary mx-0.5 underline underline-offset-2 hover:opacity-80"
                        >
                          {b.border}&quot; ({b.across}×{b.down}={b.total} blocks)
                          {i < fit.borderSuggestions.length - 1 ? "," : ""}
                        </button>
                      ))}
                    </p>
                  )}
                  {fit.blockSuggestions.length > 0 && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">Keep your {border}&quot; border, change block to:</span>{" "}
                      {fit.blockSuggestions.map((s, i) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setBlockSizeText(String(s))}
                          className="text-primary mx-0.5 underline underline-offset-2 hover:opacity-80"
                        >
                          {s}&quot;{i < fit.blockSuggestions.length - 1 ? "," : ""}
                        </button>
                      ))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        )}

        <button
          onClick={next}
          disabled={!blockSizeValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-foreground mb-2 block text-base font-semibold">{label}</label>
      {children}
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
    />
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-1 block text-sm">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step="0.25"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
      />
    </label>
  );
}
