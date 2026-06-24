import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";
import { PatchworkPreview, PatchworkPreviewHint } from "@/components/PatchworkPreview";
import {
  ALL_FABRIC_KEYS,
  setPlanner,
  usePlanner,
  type FabricKey,
} from "@/lib/planner-store";
import { fabricBackgroundStyle } from "@/lib/fabric-fill";
import { FabricSwatchOption } from "@/components/FabricSwatchOption";
import { getPattern, fabricsForPattern, getEffectiveBorderDefault } from "@/lib/patterns";

export default function FabricsStep() {
  return (
    <>
      <Helmet>
        <title>Assign Your Fabrics — QuiltButler Quilt Planner</title>
        <meta name="description" content="Choose your fabrics for each part of your quilt block and see your full quilt come to life visually before calculating your yardage." />
        <link rel="canonical" href="https://quiltbutler.com/fabrics" />
        <meta property="og:title" content="Assign Your Fabrics — QuiltButler Quilt Planner" />
        <meta property="og:description" content="Choose your fabrics for each part of your quilt block and see your full quilt come to life visually before calculating your yardage." />
        <meta property="og:url" content="https://quiltbutler.com/fabrics" />
      </Helmet>
      <FabricsStepInner />
    </>
  );
}

function FabricsStepInner() {
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
  const isBearPawPattern = pattern.id === "bear-paw";
  const isNinePatchPattern = pattern.id === "nine-patch";
  const isHstPattern = pattern.id === "hst";
  const isSimpleSquaresPattern = pattern.id === "simple-squares";
  const isRailFencePattern = pattern.id === "rail-fence";
  const isLogCabinPattern = pattern.id === "log-cabin";
  const isOhioStarPattern = pattern.id === "ohio-star";
  const isFlyingGeesePattern = pattern.id === "flying-geese";
  const isD9PPattern = pattern.id === "disappearing-nine-patch";
  const isSquaresOnPointPattern = pattern.id === "squares-on-point";
  const isPinwheelPattern = pattern.id === "pinwheel";
  const isPlusBlockPattern = pattern.id === "plus-block";
  const isChurnDashPattern = pattern.id === "churn-dash";
  const isSawtoothStarPattern = pattern.id === "sawtooth-star";
  const isFriendshipStarPattern = pattern.id === "friendship-star";
  const isSnowballPattern = pattern.id === "snowball-block";
  const isFourPatchPattern = pattern.id === "four-patch";
  const isStreakPattern = pattern.id === "streak-of-lightning";
  const hasSashing = (isBearPawPattern || isNinePatchPattern || isHstPattern || isSimpleSquaresPattern || isRailFencePattern || isLogCabinPattern || isOhioStarPattern || isFlyingGeesePattern || isD9PPattern || isSquaresOnPointPattern || isPinwheelPattern || isPlusBlockPattern || isChurnDashPattern || isSawtoothStarPattern || isFriendshipStarPattern || isSnowballPattern || isFourPatchPattern || isStreakPattern) && (planner.sashingWidth || 0) > 0;
  const hasCornerstonesSection = isBearPawPattern && hasSashing;
  const sections = pattern.sections.filter((s) => {
    if (s.id === "border") return hasBorder;
    if (s.id === "sashing") return hasSashing;
    if (s.id === "cornerstone") return hasCornerstonesSection;
    return true;
  });
  const availableFabrics = fabricsForPattern(pattern, hasBorder);
  // Fabrics actually used INSIDE the block (excluding the border, and also
  // excluding sashing/cornerstone sections when those aren't active) — used to
  // figure out which letter is the "next unused" one for an accent border.
  const ALL_ORDER: FabricKey[] = ["A","B","C","D","E","F","G","H","I","J","K","L"];
  const blockOnlyFabrics = ALL_ORDER.filter((f) =>
    pattern.sections.some((s) => {
      if (s.id === "border") return false;
      if (s.id === "sashing" && !hasSashing) return false;
      if (s.id === "cornerstone" && !hasCornerstonesSection) return false;
      return s.defaultFabric === f;
    }),
  );

  const update = (sectionId: string, fab: FabricKey) => {
    setPlanner({ assignments: { ...planner.assignments, [sectionId]: fab } });
  };

  const setFabricPhoto = (key: FabricKey, dataUrl: string | null) => {
    const next = { ...planner.fabricPhotos };
    if (dataUrl) next[key] = dataUrl;
    else delete next[key];
    setPlanner({ fabricPhotos: next });
  };

  const handlePhotoUpload = (key: FabricKey, file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setFabricPhoto(key, result);
    };
    reader.readAsDataURL(file);
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
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex flex-wrap gap-1.5">
                {palette.map((f) => (
                  <span
                    key={f}
                    className="border-border inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
                  >
                    <span
                      className="h-3 w-3 rounded-sm border border-border/60"
                      style={fabricBackgroundStyle(f, planner.fabricPhotos)}
                    />
                    {f}
                  </span>
                ))}
              </div>
              <PatchworkPreviewHint
                fabricCount={planner.patchworkFabricCount}
                quiltWidth={planner.quiltWidth}
                quiltHeight={planner.quiltHeight}
                blockSize={planner.blockSize}
                borderWidth={planner.borderWidth}
              />
            </div>
          </div>

          {(() => {
            const borderDefault = getEffectiveBorderDefault(pattern, hasSashing, false);
            const borderFabric = (planner.assignments["border"] ?? borderDefault) as FabricKey;
            const sashingDefault = (pattern.sections.find((s) => s.id === "sashing")?.defaultFabric ?? "B") as FabricKey;
            const sashingFabric = (planner.assignments["sashing"] ?? sashingDefault) as FabricKey;
            return (
              <PatchworkPreview
                fabricCount={planner.patchworkFabricCount}
                quiltWidth={planner.quiltWidth}
                quiltHeight={planner.quiltHeight}
                blockSize={planner.blockSize}
                borderWidth={planner.borderWidth}
                grid={planner.patchworkGrid}
                onChange={(g) => setPlanner({ patchworkGrid: g })}
                photos={planner.fabricPhotos}
                borderFabric={hasBorder ? borderFabric : undefined}
                sashingWidth={hasSashing ? planner.sashingWidth : 0}
                sashingFabric={hasSashing ? sashingFabric : undefined}
              />
            );
          })()}
        </div>
      )}

      {/* Block-vs-quilt visual (kept for non-patchwork patterns). */}
      {!isPatchwork && (
        <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
          {(() => {
            const isBearPaw = pattern.id === "bear-paw";
            const isNinePatch = pattern.id === "nine-patch";
            const isHst = pattern.id === "hst";
            const isRailFence = pattern.id === "rail-fence";
            const isLogCabin = pattern.id === "log-cabin";
            const isOhioStar = pattern.id === "ohio-star";
            const isFlyingGeese = pattern.id === "flying-geese";
            const isD9P = pattern.id === "disappearing-nine-patch";
            const isSquaresOnPoint = pattern.id === "squares-on-point";
            const isPinwheel = pattern.id === "pinwheel";
            const isPlusBlock = pattern.id === "plus-block";
            const isChurnDash = pattern.id === "churn-dash";
            const isSawtoothStar = pattern.id === "sawtooth-star";
            const isFriendshipStar = pattern.id === "friendship-star";
            const isSnowball = pattern.id === "snowball-block";
            const isFourPatch = pattern.id === "four-patch";
            const isStreak = pattern.id === "streak-of-lightning";
            const isSashed = isBearPaw || isNinePatch || isHst || isRailFence || isLogCabin || isOhioStar || isFlyingGeese || isD9P || isSquaresOnPoint || isPinwheel || isPlusBlock || isChurnDash || isSawtoothStar || isFriendshipStar || isSnowball || isFourPatch || isStreak;
            const sashing = isSashed ? Math.max(0, planner.sashingWidth || 0) : 0;
            const innerW = planner.quiltWidth - 2 * planner.borderWidth;
            const innerH = planner.quiltHeight - 2 * planner.borderWidth;
            const blocksAcross = Math.max(1, Math.floor(innerW / planner.blockSize));
            const blocksDown = Math.max(1, Math.floor(innerH / planner.blockSize));
            const hasCornerstones = isBearPaw && sashing > 0;
            const borderDefault = getEffectiveBorderDefault(pattern, sashing > 0 && isSashed, hasCornerstones);
            const borderFabric = (planner.assignments["border"] ?? borderDefault) as FabricKey;
            const sashingDefault = (pattern.sections.find((s) => s.id === "sashing")?.defaultFabric ?? "C") as FabricKey;
            const cornerstoneDefault = (pattern.sections.find((s) => s.id === "cornerstone")?.defaultFabric ?? "E") as FabricKey;
            const sashingFabric = (planner.assignments["sashing"] ?? sashingDefault) as FabricKey;
            const cornerstoneFabric = (planner.assignments["cornerstone"] ?? cornerstoneDefault) as FabricKey;
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
                  sashingWidth={sashing}
                  sashingFabric={sashingFabric}
                  cornerstoneFabric={hasCornerstones ? cornerstoneFabric : undefined}
                  photos={planner.fabricPhotos}
                />
                <p className="text-muted-foreground mt-4 text-center text-xs leading-relaxed">
                  You&apos;re designing <strong>one block</strong>. That block will be sewn{" "}
                  <strong>{blocksAcross * blocksDown} times</strong> and arranged in a{" "}
                  {blocksAcross} × {blocksDown} grid to make your finished quilt.
                  {hasBorder && " The border wraps around the outside."}
                  {isSashed && sashing > 0 && (
                    <> Each block is separated by <strong>{sashing}&quot; sashing</strong>{hasCornerstones ? " with cornerstone squares at the intersections" : ""}.</>
                  )}
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
            // Border uses the dynamic effective default (see getEffectiveBorderDefault)
            // so the selected swatch always matches the "Your full quilt" preview.
            const sectionDefault =
              s.id === "border"
                ? getEffectiveBorderDefault(pattern, hasSashing, hasCornerstonesSection)
                : s.defaultFabric;
            const current = (planner.assignments[s.id] ?? sectionDefault) as FabricKey;
            // For patchwork patterns, only show border + sashing pickers here
            // (the squares section is driven by the tap-to-cycle preview above).
            if (isPatchwork && s.id !== "border" && s.id !== "sashing") return null;
            // Border & sashing choices = every fabric used in the BLOCK, plus
            // one extra "accent" option (the next unused letter) for a unique
            // accent. For Simple Squares the block fabrics are the user's
            // patchwork palette; for other patterns it's the pattern's fabrics.
            const isBorder = s.id === "border";
            const isSashingSection = s.id === "sashing";
            const blockFabrics = isPatchwork ? palette : blockOnlyFabrics;
            const nextAccent = ALL_FABRIC_KEYS.find((f) => !blockFabrics.includes(f));
            const choices = (isBorder || isSashingSection)
              ? (nextAccent ? [...blockFabrics, nextAccent] : blockFabrics)
              : blockOnlyFabrics;
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
                    <FabricSwatchOption
                      key={f}
                      fabricKey={f}
                      selected={current === f}
                      photo={planner.fabricPhotos[f]}
                      onSelect={() => update(s.id, f)}
                      onUpload={(file) => handlePhotoUpload(f, file)}
                      onClear={() => setFabricPhoto(f, null)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          <button
            onClick={() => navigate("/results")}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
          >
            See your quilt plan →
          </button>
        </div>
    </StepShell>
  );
}
