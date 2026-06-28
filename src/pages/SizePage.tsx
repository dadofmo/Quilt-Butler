import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { SIZE_PRESETS, setPlanner, usePlanner } from "@/lib/planner-store";
import { useState, useMemo, useEffect } from "react";
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
  const isNinePatch = planner.pattern === "nine-patch";
  const isHst = planner.pattern === "hst";
  const isSimpleSquares = planner.pattern === "simple-squares";
  const isRailFence = planner.pattern === "rail-fence";
  const isLogCabin = planner.pattern === "log-cabin";
  const isOhioStar = planner.pattern === "ohio-star";
  const isFlyingGeese = planner.pattern === "flying-geese";
  const isD9P = planner.pattern === "disappearing-nine-patch";
  const isSquaresOnPoint = planner.pattern === "squares-on-point";
  const isPinwheel = planner.pattern === "pinwheel";
  const isPlusBlock = planner.pattern === "plus-block";
  const isChurnDash = planner.pattern === "churn-dash";
  const isSawtoothStar = planner.pattern === "sawtooth-star";
  const isFriendshipStar = planner.pattern === "friendship-star";
  const isSnowball = planner.pattern === "snowball-block";
  const isFourPatch = planner.pattern === "four-patch";
  const isStreak = planner.pattern === "streak-of-lightning";
  const isBowTie = planner.pattern === "bow-tie";
  const isSashed = isBearPaw || isNinePatch || isHst || isSimpleSquares || isRailFence || isLogCabin || isOhioStar || isFlyingGeese || isD9P || isSquaresOnPoint || isPinwheel || isPlusBlock || isChurnDash || isSawtoothStar || isFriendshipStar || isSnowball || isFourPatch || isStreak || isBowTie;
  const [sashingText, setSashingText] = useState(
    // Preserve 0 explicitly (Nine Patch may legitimately use no sashing).
    typeof planner.sashingWidth === "number" && !isNaN(planner.sashingWidth)
      ? String(planner.sashingWidth)
      : "2",
  );
  const [cornerAccentText, setCornerAccentText] = useState(
    planner.cornerAccentSize ? String(planner.cornerAccentSize) : "",
  );
  // Jelly-roll precut mode — currently only Rail Fence supports it. In jelly-
  // roll mode the block-fabric input ("Fabric width" bolt) is replaced with
  // a strip-count input, and block size is locked to 6" (3 strips × 2" fin.).
  const jellyRollEligible = isRailFence;
  const fatQuarterEligible = isSimpleSquares;
  const precutEligible = jellyRollEligible || fatQuarterEligible;
  const [fabricSource, setFabricSource] = useState<"yardage" | "jelly-roll" | "fat-quarter">(
    precutEligible ? planner.fabricSource : "yardage",
  );
  const [stripCountText, setStripCountText] = useState(
    planner.jellyRollStripCount ? String(planner.jellyRollStripCount) : "40",
  );
  const [fqWidthText, setFqWidthText] = useState(
    planner.fatQuarterWidth ? String(planner.fatQuarterWidth) : "18",
  );
  const [fqHeightText, setFqHeightText] = useState(
    planner.fatQuarterHeight ? String(planner.fatQuarterHeight) : "21",
  );
  const [fqTrimText, setFqTrimText] = useState(
    typeof planner.fatQuarterTrimMargin === "number" && !isNaN(planner.fatQuarterTrimMargin)
      ? String(planner.fatQuarterTrimMargin)
      : "0.5",
  );
  const [fqCountText, setFqCountText] = useState(
    planner.fatQuarterCount ? String(planner.fatQuarterCount) : "20",
  );
  const [showFqTrimHelp, setShowFqTrimHelp] = useState(false);
  const isJellyRoll = jellyRollEligible && fabricSource === "jelly-roll";
  const isFatQuarter = fatQuarterEligible && fabricSource === "fat-quarter";

  // In jelly-roll mode, lock block size to 6" so the live preview and the
  // downstream fit/grid math stay consistent with what the user will sew.
  useEffect(() => {
    if (isJellyRoll && blockSizeText !== "6") setBlockSizeText("6");
  }, [isJellyRoll, blockSizeText]);




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
  // Both Bear Paw and Nine Patch allow 0 (no sashing) — math collapses to a
  // straight block-on-block layout when sashing is 0.
  const sashingValid =
    !isSashed ||
    (sashingText.trim() !== "" && !isNaN(sashingNum) && sashingNum >= 0);
  const sashing = isSashed && sashingValid ? sashingNum : 0;
  const cornerAccentNum = Number(cornerAccentText);
  const cornerAccentValid =
    !isSnowball ||
    (cornerAccentText.trim() !== "" &&
      !isNaN(cornerAccentNum) &&
      cornerAccentNum > 0 &&
      (!blockSizeValid || cornerAccentNum < blockSizeNum));

  const fit = useMemo(() => {
    if (!blockSizeValid) return null;
    if (isSashed && !sashingValid) return null;
    const quiltW = Number(w) || 0;
    const quiltH = Number(h) || 0;
    const innerW = quiltW - 2 * border;
    const innerH = quiltH - 2 * border;
    if (innerW <= 0 || innerH <= 0) return null;
    // Keep the block grid driven by the chosen block size + border, then add
    // optional sashing BETWEEN blocks. That means changing sashing from 0 → 2
    // keeps the same block count and makes the quilt larger, which matches the
    // quilting workflow and the field label.
    const denom = blockSizeNum + sashing;
    const blocksAcross = Math.max(1, Math.floor((innerW + sashing) / denom));
    const blocksDown = Math.max(1, Math.floor((innerH + sashing) / denom));
    const sashCols = Math.max(0, blocksAcross - 1);
    const sashRows = Math.max(0, blocksDown - 1);
    const usedW = blocksAcross * blockSizeNum + sashCols * sashing;
    const usedH = blocksDown * blockSizeNum + sashRows * sashing;
    const remW = +(innerW - usedW).toFixed(2);
    const remH = +(innerH - usedH).toFixed(2);
    const perfect = remW === 0 && remH === 0;

    const isInt = (x: number) => Math.abs(x - Math.round(x)) < 0.001;

    // Hard cap on suggestions so we never recommend a quilt with more than
    // ~100 blocks — even mathematically perfect, 200+ tiny squares would
    // take months to sew and is not a beginner-friendly suggestion.
    const MAX_BLOCKS = 100;

    const fitsCols = (block: number, b: number) => {
      const iw = quiltW - 2 * b + sashing;
      const ih = quiltH - 2 * b + sashing;
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
      block: number; border: number; sashing: number; across: number; down: number; total: number; score: number;
    };
    const MIN_BLOCK = 4;
    const MAX_COMBO_OPTIONS = 10;
    const comboSuggestions: ComboSuggestion[] = [];
    if (!perfect && !isJellyRoll) {
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
            comboSuggestions.push({ block: s, border: bd, sashing, across: Math.round(aw), down: Math.round(ah), total, score });
          }
        }
      }
      comboSuggestions.sort((a, b) => a.score - b.score);
    }

    // Jelly-roll mode: block is locked to 6". Vary border AND sashing to find
    // combinations that hit the desired finished size exactly.
    if (!perfect && isJellyRoll) {
      const lockedBlock = 6;
      const seen = new Set<string>();
      for (let b2 = 0; b2 <= 32; b2++) {
        const bd = b2 / 4;
        if (quiltW - 2 * bd <= 0 || quiltH - 2 * bd <= 0) continue;
        for (let sh2 = 0; sh2 <= 16; sh2++) {
          const sh = sh2 / 4;
          const iw = quiltW - 2 * bd + sh;
          const ih = quiltH - 2 * bd + sh;
          const eb = lockedBlock + sh;
          const aw = iw / eb;
          const ah = ih / eb;
          if (!isInt(aw) || !isInt(ah)) continue;
          const acrossR = Math.round(aw);
          const downR = Math.round(ah);
          if (acrossR < 1 || downR < 1) continue;
          const total = acrossR * downR;
          if (total > MAX_BLOCKS) continue;
          const key = `${bd}-${sh}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const score = Math.abs(bd - border) * 1.0 + Math.abs(sh - sashing) * 0.5;
          comboSuggestions.push({ block: lockedBlock, border: bd, sashing: sh, across: acrossR, down: downR, total, score });
        }
      }
      comboSuggestions.sort((a, b) => a.score - b.score);
    }

    const diversifiedCombos: ComboSuggestion[] = isJellyRoll
      ? comboSuggestions.slice(0, MAX_COMBO_OPTIONS).sort((a, b) => a.border - b.border || a.sashing - b.sashing)
      : comboSuggestions
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
  }, [blockSizeValid, blockSizeNum, w, h, border, sashing, isSashed, sashingValid, planner.pattern, isJellyRoll]);

  const applyBorder = (b: number) => {
    setBorderText(String(b));
  };

  const fabricWidthNum = Number(fabricWidthText);
  const fabricWidthValid =
    fabricWidthText.trim() !== "" && !isNaN(fabricWidthNum) && fabricWidthNum > 0;

  const stripCountNum = Number(stripCountText);
  const stripCountValid =
    !isJellyRoll ||
    (stripCountText.trim() !== "" && !isNaN(stripCountNum) && stripCountNum > 0);

  const fqWidthNum = Number(fqWidthText);
  const fqHeightNum = Number(fqHeightText);
  const fqTrimNum = Number(fqTrimText);
  const fqCountNum = Number(fqCountText);
  const fqWidthValid = !isFatQuarter || (fqWidthText.trim() !== "" && !isNaN(fqWidthNum) && fqWidthNum > 0);
  const fqHeightValid = !isFatQuarter || (fqHeightText.trim() !== "" && !isNaN(fqHeightNum) && fqHeightNum > 0);
  const fqTrimValid = !isFatQuarter || (
    fqTrimText.trim() !== "" && !isNaN(fqTrimNum) && fqTrimNum >= 0 && fqTrimNum <= 2 &&
    (!fqWidthValid || fqTrimNum * 2 < fqWidthNum) &&
    (!fqHeightValid || fqTrimNum * 2 < fqHeightNum)
  );
  const fqCountValid = !isFatQuarter || (fqCountText.trim() !== "" && !isNaN(fqCountNum) && fqCountNum > 0);

  const next = () => {
    // In precut modes the bolt-width field is hidden; we still need a
    // fabric width for border/sashing/backing/binding math, so default to 44".
    const effectiveFabricWidth = (isJellyRoll || isFatQuarter)
      ? (fabricWidthValid ? fabricWidthNum : 44)
      : fabricWidthNum;
    if (!blockSizeValid || !borderValid) return;
    if (!isJellyRoll && !isFatQuarter && !fabricWidthValid) return;
    if (isJellyRoll && !stripCountValid) return;
    if (isFatQuarter && (!fqWidthValid || !fqHeightValid || !fqTrimValid || !fqCountValid)) return;
    if (isSashed && !sashingValid) return;
    if (isSnowball && !cornerAccentValid) return;
    setPlanner({
      sizePreset: preset,
      quiltWidth: Number(w) || 0,
      quiltHeight: Number(h) || 0,
      fabricWidth: effectiveFabricWidth,
      blockSize: isJellyRoll ? 6 : blockSizeNum,
      borderWidth: border,
      sashingWidth: isSashed ? sashingNum : planner.sashingWidth,
      cornerAccentSize: isSnowball ? cornerAccentNum : planner.cornerAccentSize,
      fabricSource: isJellyRoll ? "jelly-roll" : isFatQuarter ? "fat-quarter" : "yardage",
      jellyRollStripCount: isJellyRoll ? stripCountNum : planner.jellyRollStripCount,
      fatQuarterWidth: isFatQuarter ? fqWidthNum : planner.fatQuarterWidth,
      fatQuarterHeight: isFatQuarter ? fqHeightNum : planner.fatQuarterHeight,
      fatQuarterTrimMargin: isFatQuarter ? fqTrimNum : planner.fatQuarterTrimMargin,
      fatQuarterCount: isFatQuarter ? fqCountNum : planner.fatQuarterCount,
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

        {/* Fabric source: yardage vs jelly roll. Only shown for patterns that
            support jelly roll (currently Rail Fence only). */}
        {jellyRollEligible && (
        <Field label="What fabric are you using?">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFabricSource("yardage")}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                fabricSource === "yardage"
                  ? "border-primary bg-primary/5"
                  : "border-input bg-card hover:bg-muted/40"
              }`}
            >
              <div className="text-foreground text-base font-semibold">Yardage from a bolt</div>
              <div className="text-muted-foreground text-xs mt-0.5">Cut from a flat bolt of fabric (the classic way).</div>
            </button>
            <button
              type="button"
              onClick={() => setFabricSource("jelly-roll")}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                fabricSource === "jelly-roll"
                  ? "border-primary bg-primary/5"
                  : "border-input bg-card hover:bg-muted/40"
              }`}
            >
              <div className="text-foreground text-base font-semibold">Jelly roll</div>
              <div className="text-muted-foreground text-xs mt-0.5">
                Pre-cut 2.5" strips, already bundled — fastest way to start a Rail Fence quilt.
              </div>
            </button>
          </div>
        </Field>
        )}


        {!isJellyRoll && (
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
        )}

        {isJellyRoll && (
          <Field label="How many strips are in your jelly roll?">
            <input
              type="text"
              inputMode="numeric"
              value={stripCountText}
              onChange={(e) => setStripCountText(e.target.value)}
              placeholder="e.g. 40"
              aria-invalid={!stripCountValid}
              className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
            />
            <p className="text-muted-foreground mt-2 text-xs leading-snug">
              Most jelly rolls have <strong>40 strips</strong> (each 2.5&quot; × ~42&quot;). Check the label on yours — some designers package 20 or 42. Backing, batting, binding, sashing, and any border are still bought as regular yardage.
            </p>
            {!stripCountValid && (
              <p className="text-destructive mt-2 text-sm font-medium">
                Please enter a positive number of strips.
              </p>
            )}
          </Field>
        )}

        {!isJellyRoll && (
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
        )}

        {isJellyRoll && (
          <div className="bg-accent/50 border-primary/30 rounded-xl border-2 p-4 text-sm leading-relaxed">
            <div className="text-foreground font-semibold">Block size: 6&quot; (locked)</div>
            <p className="text-muted-foreground mt-1 text-xs">
              In jelly-roll mode the block size is fixed at 6&quot; finished — each block stacks 3 of your 2.5&quot; strips (finishing 2&quot; each). This is what makes a jelly roll a perfect Rail Fence match.
            </p>
          </div>
        )}


        {isSnowball && (
          <Field label="Corner accent size (in inches)">
            <input
              type="text"
              inputMode="decimal"
              value={cornerAccentText}
              onChange={(e) => setCornerAccentText(e.target.value)}
              placeholder="e.g. 3"
              aria-invalid={!cornerAccentValid}
              className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
            />
            <p className="text-muted-foreground mt-2 text-xs leading-snug">
              How big the corner triangles are — smaller creates a more rounded
              look, larger creates a sharper diamond look. A common choice is
              about 1/3 of your block size.
            </p>
            {cornerAccentText.trim() !== "" && !cornerAccentValid && (
              <p className="text-destructive mt-2 text-sm font-medium">
                Please enter a positive number smaller than your block size.
              </p>
            )}
          </Field>
        )}

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

        {isSashed && (
          <Field label="Sashing between blocks (in inches) — optional">
            <input
              type="text"
              inputMode="decimal"
              value={sashingText}
              onChange={(e) => setSashingText(e.target.value)}
              placeholder="e.g. 0 or 2"
              aria-invalid={!sashingValid}
              className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
            />
            <p className="text-muted-foreground mt-2 text-xs leading-snug">
              {isNinePatch
                ? "Sashing separates each Nine Patch block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                : isHst
                  ? "Sashing separates each Half Square Triangle block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                  : isSimpleSquares
                    ? "Sashing separates each square — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                    : isRailFence
                      ? "Sashing separates each Rail Fence block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                      : isLogCabin
                        ? "Sashing separates each Log Cabin block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                        : isOhioStar
                          ? "Sashing separates each Ohio Star block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                          : isFlyingGeese
                            ? "Sashing separates each Flying Geese block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                            : isD9P
                              ? "Sashing separates each Disappearing Nine Patch block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                              : isSquaresOnPoint
                                ? "Sashing separates each Squares on Point block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                : isPinwheel
                                  ? "Sashing separates each Pinwheel block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                    : isPlusBlock
                                      ? "Sashing separates each Plus Block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                      : isChurnDash
                                        ? "Sashing separates each Churn Dash block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                        : isSawtoothStar
                                          ? "Sashing separates each Sawtooth Star block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                          : isFriendshipStar
                                            ? "Sashing separates each Friendship Star block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                              : isSnowball
                                                ? "Sashing separates each Snowball Block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                                : isFourPatch
                                                  ? "Sashing separates each Four Patch block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."
                                                  : isStreak
                                                    ? "Sashing separates each Streak of Lightning block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 to keep the continuous zigzag effect (recommended)."
                                                    : "Sashing separates each Bear Paw block — common widths are 1.5\", 2\", 2.5\", or 3\". Use 0 for no sashing."}
            </p>
            {!sashingValid && (
              <p className="text-destructive mt-2 text-sm font-medium">
                Please enter 0 or a positive number.
              </p>
            )}
          </Field>
        )}

        {/* Finished quilt size — actual size produced by the current block +
            border choices, with a visual layout preview, plus bullet
            suggestions for getting to the desired size when the math
            doesn't divide evenly (including a layout-altering combo option). */}
        {fit && (() => {
          const sashCols = Math.max(0, fit.blocksAcross - 1);
          const sashRows = Math.max(0, fit.blocksDown - 1);
          const actualW = fit.blocksAcross * blockSizeNum + sashCols * sashing + 2 * border;
          const actualH = fit.blocksDown * blockSizeNum + sashRows * sashing + 2 * border;
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
                    showCornerstones={isBearPaw && sashing > 0}
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
                      With {isJellyRoll ? (
                        <>a <strong>6&quot;</strong> jelly-roll block, </>
                      ) : (
                        <>a <strong>{blockSizeNum}&quot;</strong> block, </>
                      )}
                      <strong>{border}&quot;</strong> border
                      {sashing > 0 && <> and <strong>{sashing}&quot;</strong> sashing</>}, your finished quilt will be{" "}
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
                          {isJellyRoll
                            ? <>These border + sashing combinations (with the locked 6&quot; jelly-roll block) give an exact{" "}</>
                            : <>These block size + border{sashing > 0 ? " + sashing" : ""} combinations give an exact{" "}</>}
                          <strong className="text-foreground">
                            {fit.quiltW}&quot; × {fit.quiltH}&quot;
                          </strong>{" "}
                          finish. Tap any option to apply it:
                        </p>
                        <ul className="mt-2 list-none space-y-1.5 pl-0 text-sm leading-relaxed">
                          {comboOptions.map((c, i) => (
                            <li key={`${c.block}-${c.border}-${c.sashing}`} className="text-muted-foreground">
                              <span className="text-foreground font-semibold">
                                Option {i + 1}:{" "}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockSizeText(String(c.block));
                                  applyBorder(c.border);
                                  if (isJellyRoll || sashing > 0 || c.sashing > 0) {
                                    setSashingText(String(c.sashing));
                                  }
                                }}
                                className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                              >
                                {isJellyRoll
                                  ? <>{c.border}&quot; border and {c.sashing}&quot; sashing</>
                                  : <>{c.block}&quot; block with a {c.border}&quot; border{sashing > 0 ? ` and ${sashing}" sashing` : ""}</>}
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
                {fit.irishAsymmetric && (
                  <div className="mt-3 rounded-lg border-2 border-amber-500/60 bg-amber-50 p-3 dark:bg-amber-950/30">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-foreground text-sm font-semibold">
                          Heads up — Irish Chain looks most balanced when both block counts are odd.
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                          Your current{" "}
                          <strong className="text-foreground">
                            {fit.blocksAcross} × {fit.blocksDown}
                          </strong>{" "}
                          layout puts chain blocks in only two corners, so the
                          quilt won&apos;t read as symmetric. The options below
                          give you an odd × odd grid (chains in all four corners,
                          edge to edge) — sorted by closeness to your desired{" "}
                          <strong className="text-foreground">
                            {fit.quiltW}&quot; × {fit.quiltH}&quot;
                          </strong>
                          . Tap any option to apply it:
                        </p>
                      </div>
                    </div>
                    {fit.irishSuggestions.length > 0 ? (
                      <ul className="mt-2 list-none space-y-1.5 pl-0 text-sm leading-relaxed">
                        {fit.irishSuggestions.map((s, i) => {
                          const dW = s.finishedW - fit.quiltW;
                          const dH = s.finishedH - fit.quiltH;
                          const exact = dW === 0 && dH === 0;
                          const delta = exact
                            ? "exact match to your desired size"
                            : `${dW >= 0 ? "+" : ""}${dW}\" wide, ${dH >= 0 ? "+" : ""}${dH}\" tall vs your goal`;
                          return (
                            <li key={`${s.block}-${s.border}-${s.across}-${s.down}`} className="text-muted-foreground">
                              <span className="text-foreground font-semibold">
                                Option {i + 1}:{" "}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setBlockSizeText(String(s.block));
                                  applyBorder(s.border);
                                }}
                                className="text-primary font-semibold underline underline-offset-2 hover:opacity-80"
                              >
                                {s.across} × {s.down} blocks · {s.block}&quot; block · {s.border}&quot; border
                              </button>
                              <span className="text-muted-foreground">
                                {" "}→ {s.finishedW}&quot; × {s.finishedH}&quot; ({exact ? delta : delta})
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground mt-2 text-sm italic leading-relaxed">
                        No odd × odd combinations fit at this quilt size — try
                        nudging your desired width or height by a couple of inches.
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
          disabled={!blockSizeValid || !borderValid || (!isJellyRoll && !fabricWidthValid) || (isJellyRoll && !stripCountValid) || (isSashed && !sashingValid) || (isSnowball && !cornerAccentValid)}
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
  showCornerstones = true,
}: {
  quiltW: number;
  quiltH: number;
  blocksAcross: number;
  blocksDown: number;
  border: number;
  sashing?: number;
  showCornerstones?: boolean;
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
  const sashCols = Math.max(0, blocksAcross - 1);
  const sashRows = Math.max(0, blocksDown - 1);
  const cellW = (innerW - sashCols * sashPxX) / Math.max(1, blocksAcross);
  const cellH = (innerH - sashRows * sashPxY) / Math.max(1, blocksDown);

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
        {/* Inner area: fill with sashing color so the gaps between blocks show through */}
        <rect
          x={borderPxX}
          y={borderPxY}
          width={innerW}
          height={innerH}
          fill={sashing > 0 ? "oklch(0.88 0.04 90)" : "oklch(0.95 0.02 250)"}
        />
        {/* Block tiles with optional interior sashing gaps */}
        {Array.from({ length: blocksDown }).map((_, j) =>
          Array.from({ length: blocksAcross }).map((_, i) => (
            <rect
              key={`b-${i}-${j}`}
              x={borderPxX + i * (cellW + sashPxX)}
              y={borderPxY + j * (cellH + sashPxY)}
              width={cellW}
              height={cellH}
              fill="oklch(0.95 0.02 250)"
              stroke="oklch(0.55 0.02 250)"
              strokeWidth={1}
            />
          )),
        )}
        {/* Cornerstones only at interior sashing intersections */}
        {sashing > 0 && showCornerstones &&
          Array.from({ length: Math.max(0, blocksAcross - 1) }).map((_, ci) =>
            Array.from({ length: Math.max(0, blocksDown - 1) }).map((_, cj) => (
              <rect
                key={`cs-${ci}-${cj}`}
                x={borderPxX + (ci + 1) * cellW + ci * sashPxX}
                y={borderPxY + (cj + 1) * cellH + cj * sashPxY}
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
