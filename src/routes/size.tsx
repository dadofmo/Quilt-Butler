import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { SIZE_PRESETS, setPlanner, usePlanner } from "@/lib/planner-store";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/size")({
  head: () => ({
    meta: [
      { title: "Quilt size — QuiltButler" },
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
  // Fabric width is free-form (in inches) so users can enter whatever their bolt is —
  // 42, 44, 54, 58, 60, 108 (wide-back), etc. Stored as text while typing so partial
  // values like "44." don't coerce to NaN mid-keystroke.
  const [fabricWidthText, setFabricWidthText] = useState(String(planner.fabricWidth));
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

    const isInt = (x: number) => Math.abs(x - Math.round(x)) < 0.001;

    // ----- Block-size suggestions: keep CURRENT border, find block sizes that
    // divide both inner dimensions evenly. Search 2.0–15.0 in 0.25" steps so
    // we always find something useful (not just from a tiny preset list).
    type BlockSuggestion = { size: number; across: number; down: number; total: number };
    const blockSuggestions: BlockSuggestion[] = [];
    if (!perfect) {
      for (let s4 = 8; s4 <= 60; s4++) {
        const s = s4 / 4; // 2.0 .. 15.0
        if (Math.abs(s - blockSizeNum) < 0.001) continue;
        const aw = innerW / s;
        const ah = innerH / s;
        if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
          blockSuggestions.push({
            size: s,
            across: Math.round(aw),
            down: Math.round(ah),
            total: Math.round(aw) * Math.round(ah),
          });
        }
      }
      // Closest to current block size first.
      blockSuggestions.sort((a, b) => Math.abs(a.size - blockSizeNum) - Math.abs(b.size - blockSizeNum));
    }

    // ----- Border suggestions: keep CURRENT block size, find a border width
    // that makes BOTH inner dimensions multiples of the block. Search 0–10"
    // in 0.25" steps. May come up empty for some quilt sizes.
    type BorderSuggestion = { border: number; across: number; down: number; total: number };
    const borderSuggestions: BorderSuggestion[] = [];
    if (!perfect) {
      for (let b2 = 0; b2 <= 40; b2++) {
        const b = b2 / 4;
        if (Math.abs(b - border) < 0.001) continue;
        const iw = quiltW - 2 * b;
        const ih = quiltH - 2 * b;
        if (iw <= 0 || ih <= 0) continue;
        const aw = iw / blockSizeNum;
        const ah = ih / blockSizeNum;
        if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
          borderSuggestions.push({
            border: b,
            across: Math.round(aw),
            down: Math.round(ah),
            total: Math.round(aw) * Math.round(ah),
          });
        }
      }
      borderSuggestions.sort((a, b) => Math.abs(a.border - border) - Math.abs(b.border - border));
    }

    // ----- Combo suggestions: when single-variable changes don't yield enough
    // (or when the user's combo is unusual), find (block, border) pairs that
    // both fit. Score by "closeness to user's current choices" so suggestions
    // feel like small adjustments instead of starting from scratch.
    type ComboSuggestion = {
      block: number;
      border: number;
      across: number;
      down: number;
      total: number;
      score: number;
    };
    const comboSuggestions: ComboSuggestion[] = [];
    if (!perfect) {
      for (let b2 = 0; b2 <= 40; b2++) {
        const bd = b2 / 4;
        const iw = quiltW - 2 * bd;
        const ih = quiltH - 2 * bd;
        if (iw <= 0 || ih <= 0) continue;
        for (let s4 = 8; s4 <= 60; s4++) {
          const s = s4 / 4;
          const aw = iw / s;
          const ah = ih / s;
          if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
            // Skip pairs already covered by single-variable lists.
            const sameBlock = Math.abs(s - blockSizeNum) < 0.001;
            const sameBorder = Math.abs(bd - border) < 0.001;
            if (sameBlock || sameBorder) continue;
            // Weight block changes a bit more than border changes — quilters
            // are usually more attached to their block size than border width.
            const score =
              Math.abs(s - blockSizeNum) * 1.5 + Math.abs(bd - border) * 1.0;
            comboSuggestions.push({
              block: s,
              border: bd,
              across: Math.round(aw),
              down: Math.round(ah),
              total: Math.round(aw) * Math.round(ah),
              score,
            });
          }
        }
      }
      comboSuggestions.sort((a, b) => a.score - b.score);
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
      quiltW,
      quiltH,
      blockSuggestions: blockSuggestions.slice(0, 4),
      borderSuggestions: borderSuggestions.slice(0, 3),
      comboSuggestions: comboSuggestions.slice(0, 3),
    };
  }, [blockSizeValid, blockSizeNum, w, h, border]);

  const applyBorder = (b: number) => {
    const presetVals = ["0", "2", "3", "4", "5"];
    const asStr = String(b);
    if (presetVals.includes(asStr)) {
      setBorderPreset(asStr);
    } else {
      setBorderPreset("custom");
      setBorderCustom(b);
    }
  };

  const fabricWidthNum = Number(fabricWidthText);
  const fabricWidthValid =
    fabricWidthText.trim() !== "" && !isNaN(fabricWidthNum) && fabricWidthNum > 0;

  const next = () => {
    if (!blockSizeValid || !fabricWidthValid) return;
    setPlanner({
      sizePreset: preset,
      quiltWidth: Number(w) || 0,
      quiltHeight: Number(h) || 0,
      fabricWidth: fabricWidthNum,
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

        <Field label="Fabric width (your bolt, in inches)">
          <input
            type="text"
            inputMode="decimal"
            value={fabricWidthText}
            onChange={(e) => setFabricWidthText(e.target.value)}
            placeholder="e.g. 44"
            aria-invalid={!fabricWidthValid}
            className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
          />
          <p className="text-muted-foreground mt-2 text-xs leading-snug">
            Enter your bolt&apos;s width <strong>in inches</strong> — measure selvage to
            selvage. Common widths: 42&quot;, 44&quot;, 54&quot;, 58&quot;, 60&quot;, or
            108&quot; for wide-back fabric. All cutting math will use this value.
          </p>
          {fabricWidthText.trim() !== "" && !fabricWidthValid && (
            <p className="text-destructive mt-2 text-sm font-medium">
              Please enter a positive number of inches (e.g. 44, 54, 60).
            </p>
          )}
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
              {(fit.borderSuggestions.length > 0 ||
                fit.blockSuggestions.length > 0 ||
                fit.comboSuggestions.length > 0) && (
                <div className="mt-3 space-y-2 border-t border-destructive/20 pt-3">
                  <p className="text-foreground text-xs font-semibold">
                    To fill the full {fit.innerW}&quot; × {fit.innerH}&quot; inner area perfectly, try one of these:
                  </p>
                  {fit.borderSuggestions.length > 0 ? (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">
                        Keep your {blockSizeNum}&quot; block, change border to:
                      </span>{" "}
                      {fit.borderSuggestions.map((b, i) => (
                        <button
                          key={b.border}
                          type="button"
                          onClick={() => applyBorder(b.border)}
                          className="text-primary mx-0.5 underline underline-offset-2 hover:opacity-80"
                        >
                          {b.border}&quot; ({b.across}×{b.down}={b.total} blocks)
                          {i < fit.borderSuggestions.length - 1 ? "," : ""}
                        </button>
                      ))}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">
                        Keep your {blockSizeNum}&quot; block, change border to:
                      </span>{" "}
                      <span className="italic">no border between 0&quot; and 10&quot; gives a perfect fit with this block size.</span>
                    </p>
                  )}
                  {fit.blockSuggestions.length > 0 ? (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">
                        Keep your {border}&quot; border, change block to:
                      </span>{" "}
                      {fit.blockSuggestions.map((s, i) => (
                        <button
                          key={s.size}
                          type="button"
                          onClick={() => setBlockSizeText(String(s.size))}
                          className="text-primary mx-0.5 underline underline-offset-2 hover:opacity-80"
                        >
                          {s.size}&quot; ({s.across}×{s.down}={s.total} blocks)
                          {i < fit.blockSuggestions.length - 1 ? "," : ""}
                        </button>
                      ))}
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">
                        Keep your {border}&quot; border, change block to:
                      </span>{" "}
                      <span className="italic">no block between 2&quot; and 15&quot; divides evenly into {fit.innerW}&quot; × {fit.innerH}&quot;.</span>
                    </p>
                  )}
                  {fit.comboSuggestions.length > 0 && (
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      <span className="text-foreground font-medium">
                        Or change both at once:
                      </span>{" "}
                      {fit.comboSuggestions.map((c, i) => (
                        <button
                          key={`${c.block}-${c.border}`}
                          type="button"
                          onClick={() => {
                            setBlockSizeText(String(c.block));
                            applyBorder(c.border);
                          }}
                          className="text-primary mx-0.5 underline underline-offset-2 hover:opacity-80"
                        >
                          {c.block}&quot; block + {c.border}&quot; border ({c.across}×{c.down}={c.total} blocks)
                          {i < fit.comboSuggestions.length - 1 ? "," : ""}
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
          disabled={!blockSizeValid || !fabricWidthValid}
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
