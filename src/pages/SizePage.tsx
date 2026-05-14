import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { SIZE_PRESETS, setPlanner, usePlanner } from "@/lib/planner-store";
import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";

export default function SizeStep() {
  return (
    <>
      <Helmet>
        <title>Plan Your Quilt Size — QuiltButler</title>
        <meta name="description" content="Enter your quilt dimensions and block size to get a personalized fabric plan including yardage, cutting diagrams and total project cost." />
        <link rel="canonical" href="https://quiltbutler.com/size" />
        <meta property="og:title" content="Plan Your Quilt Size — QuiltButler" />
        <meta property="og:description" content="Enter your quilt dimensions and block size to get a personalized fabric plan including yardage, cutting diagrams and total project cost." />
        <meta property="og:url" content="https://quiltbutler.com/size" />
      </Helmet>
      <SizeStepInner />
    </>
  );
}

function SizeStepInner() {
  const planner = usePlanner();
  const navigate = useNavigate();

  const [preset, setPreset] = useState(planner.sizePreset);
  const [w, setW] = useState(planner.quiltWidth);
  const [h, setH] = useState(planner.quiltHeight);
  // Fabric width is free-form (in inches) so users can enter whatever their bolt is —
  // 42, 44, 54, 58, 60, 108 (wide-back), etc. Stored as text while typing so partial
  // values like "44." don't coerce to NaN mid-keystroke.
  // Initial values come from the planner store, but a stored 0 means "not yet
  // set" — show an empty input so the user enters their own value rather than
  // seeing a prepopulated default.
  const [fabricWidthText, setFabricWidthText] = useState(
    planner.fabricWidth ? String(planner.fabricWidth) : "",
  );
  // Block size is now a free-text decimal — store as string while typing so
  // the user can type "4." or "4.5" without us coercing to NaN/0 mid-keystroke.
  const [blockSizeText, setBlockSizeText] = useState(
    planner.blockSize ? String(planner.blockSize) : "",
  );
  // Border width is free-form text (in inches) so quilters can enter any width
  // — 0, 2.5, 4.5, etc. Blank by default so nothing is prepopulated.
  const [borderText, setBorderText] = useState(
    planner.borderWidth ? String(planner.borderWidth) : "",
  );
  const isBearPaw = planner.pattern === "bear-paw";
  const [sashingText, setSashingText] = useState(
    planner.sashingWidth ? String(planner.sashingWidth) : "2",
  );

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
  const borderNum = Number(borderText);
  const borderValid = borderText.trim() !== "" && !isNaN(borderNum) && borderNum >= 0;
  const border = borderValid ? borderNum : 0;
  const sashingNum = Number(sashingText);
  const sashingValid =
    !isBearPaw ||
    (sashingText.trim() !== "" && !isNaN(sashingNum) && sashingNum > 0);
  const sashing = isBearPaw && sashingValid ? sashingNum : 0;

  const fit = useMemo(() => {
    if (!blockSizeValid) return null;
    if (isBearPaw && !sashingValid) return null;
    const quiltW = Number(w) || 0;
    const quiltH = Number(h) || 0;
    const innerW = quiltW - 2 * border;
    const innerH = quiltH - 2 * border;
    if (innerW <= 0 || innerH <= 0) return null;
    // Bear Paw uses FULL-PERIMETER sashing: cols*block + (cols+1)*sashing = innerW
    // → cols = (innerW - sashing) / (block + sashing). Sashing=0 reduces to innerW/block.
    const effInnerW = innerW - sashing;
    const effInnerH = innerH - sashing;
    const effBlock = blockSizeNum + sashing;
    const acrossExact = effInnerW / effBlock;
    const downExact = effInnerH / effBlock;
    const blocksAcross = Math.floor(acrossExact);
    const blocksDown = Math.floor(downExact);
    const perimSashCount = sashing > 0 ? 1 : 0;
    const usedW = blocksAcross * blockSizeNum + (blocksAcross + perimSashCount) * sashing;
    const usedH = blocksDown * blockSizeNum + (blocksDown + perimSashCount) * sashing;
    const remW = +(innerW - usedW).toFixed(2);
    const remH = +(innerH - usedH).toFixed(2);
    const perfect = remW === 0 && remH === 0;

    const isInt = (x: number) => Math.abs(x - Math.round(x)) < 0.001;

    // Hard cap on suggestions so we never recommend a quilt with more than
    // ~100 blocks — even mathematically perfect, 200+ tiny squares would
    // take months to sew and is not a beginner-friendly suggestion.
    const MAX_BLOCKS = 100;

    const fitsCols = (block: number, b: number) => {
      const iw = quiltW - 2 * b - sashing;
      const ih = quiltH - 2 * b - sashing;
      const eb = block + sashing;
      const aw = iw / eb;
      const ah = ih / eb;
      return { aw, ah };
    };

    type BlockSuggestion = { size: number; across: number; down: number; total: number };
    const blockSuggestions: BlockSuggestion[] = [];
    if (!perfect) {
      for (let s4 = 8; s4 <= 60; s4++) {
        const s = s4 / 4;
        if (Math.abs(s - blockSizeNum) < 0.001) continue;
        const { aw, ah } = fitsCols(s, border);
        if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
          const total = Math.round(aw) * Math.round(ah);
          if (total > MAX_BLOCKS) continue;
          blockSuggestions.push({ size: s, across: Math.round(aw), down: Math.round(ah), total });
        }
      }
      blockSuggestions.sort((a, b) => Math.abs(a.size - blockSizeNum) - Math.abs(b.size - blockSizeNum));
    }

    type BorderSuggestion = { border: number; across: number; down: number; total: number };
    const borderSuggestions: BorderSuggestion[] = [];
    if (!perfect) {
      for (let b2 = 0; b2 <= 40; b2++) {
        const b = b2 / 4;
        if (Math.abs(b - border) < 0.001) continue;
        if (quiltW - 2 * b <= 0 || quiltH - 2 * b <= 0) continue;
        const { aw, ah } = fitsCols(blockSizeNum, b);
        if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
          const total = Math.round(aw) * Math.round(ah);
          if (total > MAX_BLOCKS) continue;
          borderSuggestions.push({ border: b, across: Math.round(aw), down: Math.round(ah), total });
        }
      }
      borderSuggestions.sort((a, b) => Math.abs(a.border - border) - Math.abs(b.border - border));
    }

    type ComboSuggestion = {
      block: number; border: number; across: number; down: number; total: number; score: number;
    };
    const MIN_BLOCK = 4;
    const MAX_COMBO_OPTIONS = 10;
    const comboSuggestions: ComboSuggestion[] = [];
    if (!perfect) {
      for (let b2 = 0; b2 <= 40; b2++) {
        const bd = b2 / 4;
        if (quiltW - 2 * bd <= 0 || quiltH - 2 * bd <= 0) continue;
        for (let s4 = MIN_BLOCK * 4; s4 <= 60; s4++) {
          const s = s4 / 4;
          const { aw, ah } = fitsCols(s, bd);
          if (isInt(aw) && isInt(ah) && Math.round(aw) >= 1 && Math.round(ah) >= 1) {
            const total = Math.round(aw) * Math.round(ah);
            if (total > MAX_BLOCKS) continue;
            const score = Math.abs(s - blockSizeNum) * 1.5 + Math.abs(bd - border) * 1.0;
            comboSuggestions.push({ block: s, border: bd, across: Math.round(aw), down: Math.round(ah), total, score });
          }
        }
      }
      comboSuggestions.sort((a, b) => a.score - b.score);
    }

    const diversifiedCombos: ComboSuggestion[] = comboSuggestions
      .slice(0, MAX_COMBO_OPTIONS)
      .sort((a, b) => a.block - b.block);

    // ----- Irish Chain symmetry suggestions -----
    // Irish Chain alternates chain/plain blocks in a checkerboard. For chain
    // blocks to land in all four corners (and chains to run edge-to-edge on
    // every side), BOTH blocksAcross and blocksDown must be ODD. When the
    // user's current layout has an even dimension we surface a separate
    // amber warning with odd×odd block+border combos, sorted by closeness
    // to their original desired finished size — so they get bump-down,
    // bump-up, AND border-adjusted options in one list.
    const isIrishChain = planner.pattern === "irish-chain";
    const irishAsymmetric =
      isIrishChain && (blocksAcross % 2 === 0 || blocksDown % 2 === 0);
    type IrishSuggestion = {
      block: number;
      border: number;
      across: number;
      down: number;
      total: number;
      finishedW: number;
      finishedH: number;
      areaDelta: number; // finished area - desired area
    };
    const irishSuggestions: IrishSuggestion[] = [];
    if (irishAsymmetric) {
      const desiredArea = quiltW * quiltH;
      const seen = new Set<string>();
      for (let b2 = 0; b2 <= 40; b2++) {
        const bd = b2 / 4;
        if (quiltW - 2 * bd <= 0 || quiltH - 2 * bd <= 0) continue;
        for (let s4 = MIN_BLOCK * 4; s4 <= 60; s4++) {
          const s = s4 / 4;
          const { aw, ah } = fitsCols(s, bd);
          if (!isInt(aw) || !isInt(ah)) continue;
          const acrossR = Math.round(aw);
          const downR = Math.round(ah);
          if (acrossR < 3 || downR < 3) continue;
          if (acrossR % 2 === 0 || downR % 2 === 0) continue;
          const total = acrossR * downR;
          if (total > MAX_BLOCKS) continue;
          const finishedW = acrossR * s + 2 * bd;
          const finishedH = downR * s + 2 * bd;
          const areaDelta = finishedW * finishedH - desiredArea;
          const key = `${acrossR}x${downR}`;
          if (seen.has(key)) continue;
          seen.add(key);
          irishSuggestions.push({
            block: s,
            border: bd,
            across: acrossR,
            down: downR,
            total,
            finishedW,
            finishedH,
            areaDelta,
          });
        }
      }
      // Sort by absolute area distance from desired size — closest matches first.
      irishSuggestions.sort((a, b) => Math.abs(a.areaDelta) - Math.abs(b.areaDelta));
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
      comboSuggestions: diversifiedCombos,
      irishAsymmetric,
      irishSuggestions: irishSuggestions.slice(0, 4),
    };
  }, [blockSizeValid, blockSizeNum, w, h, border, sashing, isBearPaw, sashingValid, planner.pattern]);

  const applyBorder = (b: number) => {
    setBorderText(String(b));
  };

  const fabricWidthNum = Number(fabricWidthText);
  const fabricWidthValid =
    fabricWidthText.trim() !== "" && !isNaN(fabricWidthNum) && fabricWidthNum > 0;

  const next = () => {
    if (!blockSizeValid || !fabricWidthValid || !borderValid) return;
    if (isBearPaw && !sashingValid) return;
    setPlanner({
      sizePreset: preset,
      quiltWidth: Number(w) || 0,
      quiltHeight: Number(h) || 0,
      fabricWidth: fabricWidthNum,
      blockSize: blockSizeNum,
      borderWidth: border,
      sashingWidth: isBearPaw ? sashingNum : planner.sashingWidth,
    });
    navigate("/fabrics");
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
            selvage. Common quilting widths: <strong>42&quot; or 44&quot;</strong>. For
            backing fabric on large quilts: <strong>108&quot;</strong>. All cutting math will use this value.
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

        <Field label="Border width (in inches)">
          <input
            type="text"
            inputMode="decimal"
            value={borderText}
            onChange={(e) => setBorderText(e.target.value)}
            placeholder="e.g. 3 (or 0 for no border)"
            aria-invalid={!borderValid}
            className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
          />
          <p className="text-muted-foreground mt-2 text-xs leading-snug">
            Enter any width — common borders are 2&quot;, 2.5&quot;, 3&quot;, 4&quot;, 4.5&quot;, 5&quot;.
            Use <strong>0</strong> for no border.
          </p>
          {borderText.trim() !== "" && !borderValid && (
            <p className="text-destructive mt-2 text-sm font-medium">
              Please enter 0 or a positive number (e.g. 0, 2.5, 4, 4.5).
            </p>
          )}
        </Field>

        {isBearPaw && (
          <Field label="Sashing between blocks (in inches)">
            <input
              type="text"
              inputMode="decimal"
              value={sashingText}
              onChange={(e) => setSashingText(e.target.value)}
              placeholder="e.g. 2"
              aria-invalid={!sashingValid}
              className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
            />
            <p className="text-muted-foreground mt-2 text-xs leading-snug">
              Sashing separates each Bear Paw block — common widths are 1.5&quot;, 2&quot;, 2.5&quot;, or 3&quot;.
            </p>
            {!sashingValid && (
              <p className="text-destructive mt-2 text-sm font-medium">
                Please enter a positive number (Bear Paw always uses sashing).
              </p>
            )}
          </Field>
        )}

        {/* Finished quilt size — actual size produced by the current block +
            border choices, with a visual layout preview, plus bullet
            suggestions for getting to the desired size when the math
            doesn't divide evenly (including a layout-altering combo option). */}
        {fit && (() => {
          const perimSashAdj = sashing > 0 ? 1 : 0;
          const actualW = fit.blocksAcross * blockSizeNum + (fit.blocksAcross + perimSashAdj) * sashing + 2 * border;
          const actualH = fit.blocksDown * blockSizeNum + (fit.blocksDown + perimSashAdj) * sashing + 2 * border;
          const matchesDesired = fit.perfect;
          const comboOptions = fit.comboSuggestions;
          return (
            <Field label="Finished quilt size">
              <div className="bg-card border-input rounded-xl border-2 p-4">
                <div className="mb-4 flex justify-center">
                  <QuiltLayoutDiagram
                    quiltW={actualW}
                    quiltH={actualH}
                    blocksAcross={fit.blocksAcross}
                    blocksDown={fit.blocksDown}
                    border={border}
                    sashing={sashing}
                  />
                </div>
                {(() => {
                  const desiredArea = fit.quiltW * fit.quiltH;
                  const actualArea = actualW * actualH;
                  let sizeNote: React.ReactNode = null;
                  if (!matchesDesired) {
                    const isSmaller =
                      actualW < fit.quiltW || actualH < fit.quiltH
                        ? actualArea <= desiredArea
                        : false;
                    const isLarger =
                      actualW > fit.quiltW || actualH > fit.quiltH
                        ? actualArea >= desiredArea
                        : false;
                    // Fallback when one dimension is bigger and the other smaller —
                    // compare total area to decide which word fits best.
                    const direction = isSmaller
                      ? "smaller"
                      : isLarger
                        ? "larger"
                        : actualArea < desiredArea
                          ? "smaller"
                          : "larger";
                    sizeNote = (
                      <>
                        {" "}— that&apos;s <strong>{direction}</strong> than your
                        desired{" "}
                        <strong>
                          {fit.quiltW}&quot; × {fit.quiltH}&quot;
                        </strong>
                        .
                      </>
                    );
                  }
                  return (
                    <p className="text-foreground text-sm leading-relaxed">
                      With a <strong>{blockSizeNum}&quot;</strong> block and{" "}
                      <strong>{border}&quot;</strong> border, your finished quilt will be{" "}
                      <strong>{actualW}&quot; × {actualH}&quot;</strong>{" "}
                      ({fit.blocksAcross} × {fit.blocksDown} ={" "}
                      {fit.total} blocks){sizeNote}
                      {matchesDesired ? "." : ""}
                    </p>
                  );
                })()}
                {matchesDesired ? (
                  <p className="text-foreground mt-2 text-sm leading-relaxed">
                    ✓ This matches your desired{" "}
                    <strong>{fit.quiltW}&quot; × {fit.quiltH}&quot;</strong> exactly.
                  </p>
                ) : (
                  <div className="mt-3 rounded-lg border-2 border-amber-500/60 bg-amber-50 p-3 dark:bg-amber-950/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                      />
                      <p className="text-foreground text-sm font-semibold">
                        Heads up — your finished size doesn&apos;t match your
                        desired size. Here are options to get to{" "}
                        {fit.quiltW}&quot; × {fit.quiltH}&quot;:
                      </p>
                    </div>
                    {comboOptions.length > 0 ? (
                      <>
                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                          These block size + border combinations give an exact{" "}
                          <strong className="text-foreground">
                            {fit.quiltW}&quot; × {fit.quiltH}&quot;
                          </strong>{" "}
                          finish. Tap any option to apply it:
                        </p>
                        <ul className="mt-2 list-none space-y-1.5 pl-0 text-sm leading-relaxed">
                          {comboOptions.map((c, i) => (
                            <li key={`${c.block}-${c.border}`} className="text-muted-foreground">
                              <span className="text-foreground font-semibold">
                                Option {i + 1}:{" "}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockSizeText(String(c.block));
                                  applyBorder(c.border);
                                }}
                                className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                              >
                                {c.block}&quot; block with a {c.border}&quot; border
                              </button>
                              <span className="text-muted-foreground">
                                {" "}({c.across} × {c.down} = {c.total} blocks)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-sm italic leading-relaxed">
                        No reasonable block size + border combinations give an
                        exact fit at this quilt size. Try adjusting your desired
                        quilt size slightly.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Field>
          );
        })()}

        <button
          onClick={next}
          disabled={!blockSizeValid || !fabricWidthValid || !borderValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
        >
          Assign fabrics →
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
  sashing = 0,
}: {
  quiltW: number;
  quiltH: number;
  blocksAcross: number;
  blocksDown: number;
  border: number;
  sashing?: number;
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
  const sashPxX = sashing > 0 ? (sashing / quiltW) * w : 0;
  const sashPxY = sashing > 0 ? (sashing / quiltH) * h : 0;
  // Full-perimeter sashing: (cols+1) sashing strips horizontally, (rows+1) vertically.
  const perim = sashing > 0 ? 1 : 0;
  const cellW = (innerW - (blocksAcross + perim) * sashPxX) / Math.max(1, blocksAcross);
  const cellH = (innerH - (blocksDown + perim) * sashPxY) / Math.max(1, blocksDown);

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
        {/* Inner area: fill with sashing color so gaps between blocks (and the
            outer perimeter sashing) show through */}
        <rect
          x={borderPxX}
          y={borderPxY}
          width={innerW}
          height={innerH}
          fill={sashing > 0 ? "oklch(0.88 0.04 90)" : "oklch(0.95 0.02 250)"}
        />
        {/* Block tiles — offset by one sashing strip when there is perimeter sashing */}
        {Array.from({ length: blocksDown }).map((_, j) =>
          Array.from({ length: blocksAcross }).map((_, i) => (
            <rect
              key={`b-${i}-${j}`}
              x={borderPxX + perim * sashPxX + i * (cellW + sashPxX)}
              y={borderPxY + perim * sashPxY + j * (cellH + sashPxY)}
              width={cellW}
              height={cellH}
              fill="oklch(0.95 0.02 250)"
              stroke="oklch(0.55 0.02 250)"
              strokeWidth={1}
            />
          )),
        )}
        {/* Cornerstones at every sashing intersection — including outer corners */}
        {sashing > 0 &&
          Array.from({ length: blocksAcross + 1 }).map((_, ci) =>
            Array.from({ length: blocksDown + 1 }).map((_, cj) => (
              <rect
                key={`cs-${ci}-${cj}`}
                x={borderPxX + ci * (cellW + sashPxX)}
                y={borderPxY + cj * (cellH + sashPxY)}
                width={sashPxX}
                height={sashPxY}
                fill="oklch(0.7 0.12 30)"
              />
            )),
          )}
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
