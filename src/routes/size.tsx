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

    // Diversify combo suggestions so the user sees a meaningful spread of
    // options — a smaller block, a similar-size block, and a larger block —
    // rather than 4 near-duplicates clustered around one size. We bucket by
    // block size relative to the user's current choice and pick the
    // best-scored option from each bucket.
    const diversifiedCombos: ComboSuggestion[] = [];
    if (comboSuggestions.length > 0) {
      const smaller = comboSuggestions.filter((c) => c.block < blockSizeNum);
      const larger = comboSuggestions.filter((c) => c.block > blockSizeNum);
      // Already sorted by score (closeness). Take a few from each side.
      const picks: ComboSuggestion[] = [];
      // Closest overall first.
      if (comboSuggestions[0]) picks.push(comboSuggestions[0]);
      // Then alternate: smallest-block option, largest-block option, then
      // additional close options to round out the list.
      const smallestBlock = [...smaller].sort((a, b) => a.block - b.block)[0];
      const largestBlock = [...larger].sort((a, b) => b.block - a.block)[0];
      if (smallestBlock) picks.push(smallestBlock);
      if (largestBlock) picks.push(largestBlock);
      // Fill remaining slots with next-closest options not already picked.
      for (const c of comboSuggestions) {
        if (picks.length >= 5) break;
        if (!picks.some((p) => p.block === c.block && p.border === c.border)) {
          picks.push(c);
        }
      }
      // De-dupe and re-sort by block size (ascending) so options read
      // smallest → largest, which is easier to scan.
      const seen = new Set<string>();
      for (const p of picks) {
        const key = `${p.block}-${p.border}`;
        if (!seen.has(key)) {
          seen.add(key);
          diversifiedCombos.push(p);
        }
      }
      diversifiedCombos.sort((a, b) => a.block - b.block);
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
      comboSuggestions: diversifiedCombos.slice(0, 5),
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
        <Field label="Desired finished quilt size">
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

        {/* Finished quilt size — actual size produced by the current block +
            border choices, with a visual layout preview, plus bullet
            suggestions for getting to the desired size when the math
            doesn't divide evenly (including a layout-altering combo option). */}
        {fit && (() => {
          const actualW = fit.blocksAcross * blockSizeNum + 2 * border;
          const actualH = fit.blocksDown * blockSizeNum + 2 * border;
          const matchesDesired = fit.perfect;
          const closestBorder = fit.borderSuggestions[0];
          const closestBlock = fit.blockSuggestions[0];
          const closestCombo = fit.comboSuggestions[0];
          return (
            <Field label="Finished quilt size">
              <div className="bg-card border-input rounded-xl border-2 p-4">
                {/* Visual quilt layout preview */}
                <div className="mb-4 flex justify-center">
                  <QuiltLayoutDiagram
                    quiltW={actualW}
                    quiltH={actualH}
                    blocksAcross={fit.blocksAcross}
                    blocksDown={fit.blocksDown}
                    border={border}
                  />
                </div>
                <p className="text-foreground text-sm leading-relaxed">
                  With a <strong>{blockSizeNum}&quot;</strong> block and{" "}
                  <strong>{border}&quot;</strong> border, your finished quilt will be{" "}
                  <strong>{actualW}&quot; × {actualH}&quot;</strong>{" "}
                  ({fit.blocksAcross} × {fit.blocksDown} ={" "}
                  {fit.total} blocks).
                </p>
                {matchesDesired ? (
                  <p className="text-foreground mt-2 text-sm leading-relaxed">
                    ✓ This matches your desired{" "}
                    <strong>{fit.quiltW}&quot; × {fit.quiltH}&quot;</strong> exactly.
                  </p>
                ) : (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="text-foreground text-sm font-semibold">
                      Options to get to desired finished quilt size{" "}
                      ({fit.quiltW}&quot; × {fit.quiltH}&quot;):
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                      <li className="text-muted-foreground">
                        <span className="text-foreground">
                          Keep your <strong>{blockSizeNum}&quot;</strong> block, change border to{" "}
                        </span>
                        {closestBorder ? (
                          <button
                            type="button"
                            onClick={() => applyBorder(closestBorder.border)}
                            className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                          >
                            {closestBorder.border}&quot;
                          </button>
                        ) : (
                          <span className="italic">
                            no border between 0&quot; and 10&quot; gives an exact fit with this block size.
                          </span>
                        )}
                        {closestBorder && (
                          <span className="text-muted-foreground">
                            {" "}({closestBorder.across} × {closestBorder.down} = {closestBorder.total} blocks)
                          </span>
                        )}
                      </li>
                      <li className="text-muted-foreground">
                        <span className="text-foreground">
                          Keep your <strong>{border}&quot;</strong> border, change block size to{" "}
                        </span>
                        {closestBlock ? (
                          <button
                            type="button"
                            onClick={() => setBlockSizeText(String(closestBlock.size))}
                            className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                          >
                            {closestBlock.size}&quot;
                          </button>
                        ) : (
                          <span className="italic">
                            no block between 2&quot; and 15&quot; divides evenly with this border.
                          </span>
                        )}
                        {closestBlock && (
                          <span className="text-muted-foreground">
                            {" "}({closestBlock.across} × {closestBlock.down} = {closestBlock.total} blocks)
                          </span>
                        )}
                      </li>
                      {closestCombo && (
                        <li className="text-muted-foreground">
                          <span className="text-foreground">
                            Adjust the <strong>block grid layout</strong> — use a{" "}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setBlockSizeText(String(closestCombo.block));
                              applyBorder(closestCombo.border);
                            }}
                            className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                          >
                            {closestCombo.block}&quot; block with a {closestCombo.border}&quot; border
                          </button>
                          <span className="text-muted-foreground">
                            {" "}(changes the layout to {closestCombo.across} × {closestCombo.down} ={" "}
                            {closestCombo.total} blocks for an exact fit).
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </Field>
          );
        })()}

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

/**
 * Tiny visual of the finished quilt: shows the border ring around the
 * block grid (blocksAcross × blocksDown), scaled to fit a max box while
 * preserving the real quilt aspect ratio. Helps users see at a glance
 * what their inputs will produce.
 */
function QuiltLayoutDiagram({
  quiltW,
  quiltH,
  blocksAcross,
  blocksDown,
  border,
}: {
  quiltW: number;
  quiltH: number;
  blocksAcross: number;
  blocksDown: number;
  border: number;
}) {
  const MAX = 180;
  if (quiltW <= 0 || quiltH <= 0) return null;
  const aspect = quiltW / quiltH;
  const w = aspect >= 1 ? MAX : Math.round(MAX * aspect);
  const h = aspect >= 1 ? Math.round(MAX / aspect) : MAX;
  const borderPxX = (border / quiltW) * w;
  const borderPxY = (border / quiltH) * h;
  const innerW = w - borderPxX * 2;
  const innerH = h - borderPxY * 2;
  const cellW = innerW / Math.max(1, blocksAcross);
  const cellH = innerH / Math.max(1, blocksDown);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="rounded-md shadow-sm"
        aria-label={`Quilt layout: ${blocksAcross} by ${blocksDown} blocks${border > 0 ? ` with ${border} inch border` : ""}`}
      >
        {/* Border ring */}
        {border > 0 && (
          <rect
            x={0}
            y={0}
            width={w}
            height={h}
            fill="oklch(0.85 0.05 250)"
          />
        )}
        {/* Inner block area background */}
        <rect
          x={borderPxX}
          y={borderPxY}
          width={innerW}
          height={innerH}
          fill="oklch(0.95 0.02 250)"
        />
        {/* Block grid lines */}
        {Array.from({ length: blocksAcross + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={borderPxX + i * cellW}
            y1={borderPxY}
            x2={borderPxX + i * cellW}
            y2={borderPxY + innerH}
            stroke="oklch(0.55 0.02 250)"
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: blocksDown + 1 }).map((_, j) => (
          <line
            key={`h-${j}`}
            x1={borderPxX}
            y1={borderPxY + j * cellH}
            x2={borderPxX + innerW}
            y2={borderPxY + j * cellH}
            stroke="oklch(0.55 0.02 250)"
            strokeWidth={1}
          />
        ))}
        {/* Outer outline */}
        <rect
          x={0.5}
          y={0.5}
          width={w - 1}
          height={h - 1}
          fill="none"
          stroke="oklch(0.4 0.02 250)"
          strokeWidth={1}
        />
      </svg>
      <p className="text-muted-foreground text-[11px]">
        {quiltW}&quot; × {quiltH}&quot; · {blocksAcross} × {blocksDown} blocks
        {border > 0 && <> · {border}&quot; border</>}
      </p>
    </div>
  );
}
