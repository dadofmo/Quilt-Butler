import { useNavigate, Link } from "react-router-dom";
import { BlockLayoutPicker } from "@/components/BlockLayoutPicker";
import { Helmet } from "react-helmet-async";
import { StepShell } from "@/components/StepShell";
import { AffiliateShopCard } from "@/components/AffiliateShopCard";
import { QuiltLayoutPreview } from "@/components/QuiltLayoutPreview";
import { PatchworkPreview, PatchworkPreviewHint } from "@/components/PatchworkPreview";
import {
  ALL_FABRIC_KEYS,
  setPlanner,
  usePlanner,
  type BlockLayout,
  type FabricKey,
} from "@/lib/planner-store";
import { fabricBackgroundStyle } from "@/lib/fabric-fill";
import { FabricSwatchOption } from "@/components/FabricSwatchOption";
import { distinctRotations, fabricsUsed, isFullyRotationSymmetric } from "@/lib/custom-block";
import { getPattern, fabricsForPattern, getEffectiveBorderDefault, patternHasSashingSection } from "@/lib/patterns";

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

  if (pattern.id === "custom-block" && !planner.customBlock) {
    return (
      <StepShell step={3} title="Design your block first" backTo="/">
        <Link to="/design" className="text-primary underline">
          Open the block editor
        </Link>
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
  const isBowTiePattern = pattern.id === "bow-tie";
  const isCustomPattern = pattern.id === "custom-block";
  const customFabrics = fabricsUsed(planner.customBlock);
  const hasSashing = patternHasSashingSection(pattern) && (planner.sashingWidth || 0) > 0;
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

      <AffiliateShopCard />


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
            const isSashed = patternHasSashingSection(pattern);
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
                  alternateBlocks={planner.alternateBlocks}
                  blockLayout={planner.blockLayout}
                  customBlock={planner.customBlock}
                  customBlockB={planner.customBlockB}
                  useBlockB={planner.useBlockB}
                  customSwapPair={planner.customSwapPair}
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

                {/* A/B "alternate blocks" toggle — opt-in per pattern via
                    supportsAlternate. Lives here (not on the size step) so the
                    full-quilt preview above updates live as the user toggles.
                    Whatever is selected here is what the yardage, cutting list
                    and sewing steps use on the results page. */}
                {isCustomPattern && (
                  <CustomVariationControls
                    fabrics={customFabrics}
                    swapPair={planner.customSwapPair}
                    alternate={!!planner.alternateBlocks}
                    useBlockB={!!planner.useBlockB}
                    hasBlockB={!!planner.customBlockB}
                  />
                )}

                {pattern.supportsAlternate && !isCustomPattern && (
                  <label
                    className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
                      planner.alternateBlocks
                        ? "border-primary bg-primary/5"
                        : "bg-card border-input"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!planner.alternateBlocks}
                      onChange={(e) => setPlanner({ alternateBlocks: e.target.checked })}
                      className="mt-1 h-5 w-5 shrink-0 accent-current"
                    />
                    <div>
                      <div className="text-base font-medium">
                        {pattern.id === "cabin-in-the-cotton"
                          ? "Use the same block everywhere (one outer-ring fabric)"
                          : pattern.id === "squares-on-point"
                            ? "Reverse the fabrics on every other block"
                            : "Swap fabrics on every other block"}
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs leading-snug">
                        {pattern.id === "cabin-in-the-cotton" ? (
                          <>
                            By default the outer ring alternates between Fabric
                            D and Fabric E block to block for a checkerboard
                            border. Turn this on to design{" "}
                            <strong>one block</strong> and repeat it across the
                            whole quilt — every block gets the Fabric D outer
                            ring and Fabric E drops off your shopping list.
                            The preview above updates instantly, and your
                            cutting list, yardage and sewing steps follow
                            whatever you leave selected.
                          </>
                        ) : pattern.id === "squares-on-point" ? (
                          <>
                            When on, every other block is the reverse of its
                            neighbours: one block has a Fabric A diamond on
                            Fabric B corners, the next has a Fabric B diamond on
                            Fabric A corners. The reversal alternates{" "}
                            <strong>both</strong> side-to-side across each row
                            and up-and-down each column, so no two touching
                            blocks match. Watch the full-quilt preview above
                            change as you toggle — your cutting list, yardage
                            and sewing steps follow whatever you leave selected.
                          </>
                        ) : (
                          <>
                            When on, Fabric A and Fabric B trade roles on
                            alternating blocks for a checkerboard effect. The
                            preview above updates instantly, and your cutting
                            list, yardage and sewing steps follow whatever you
                            leave selected.
                          </>
                        )}
                      </p>
                    </div>
                  </label>
                )}

                {/* Block-setting picker — opt-in per pattern via `layouts`.
                    Rotation only: piece counts, cutting list and yardage are
                    untouched, so patterns whose secondary design relies on a
                    fixed tiling simply never declare `layouts`. */}
                {isCustomPattern && !isFullyRotationSymmetric(planner.customBlock) && (
                  <BlockLayoutPicker
                    pattern={pattern.id}
                    assignments={planner.assignments}
                    photos={planner.fabricPhotos}
                    options={customLayoutOptions(distinctRotations(planner.customBlock).length)}
                    value={planner.blockLayout}
                    onChange={(next) => setPlanner({ blockLayout: next })}
                    customBlock={planner.customBlock}
                    customBlockB={planner.customBlockB}
                    useBlockB={planner.useBlockB}
                    customSwapPair={planner.customSwapPair}
                  />
                )}

                {!isCustomPattern && pattern.layouts && pattern.layouts.length > 0 && (
                  <BlockLayoutPicker
                    pattern={pattern.id}
                    assignments={planner.assignments}
                    photos={planner.fabricPhotos}
                    options={["straight", ...pattern.layouts]}
                    value={planner.blockLayout}
                    onChange={(next) => setPlanner({ blockLayout: next })}
                  />
                )}
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
            // Custom blocks get their block fabrics in the editor — only the
            // sashing and border are assigned here.
            if (isCustomPattern && s.id !== "border" && s.id !== "sashing") return null;
            // Cabin in the Cotton with "same block everywhere" on: the second
            // outer-ring fabric is unused, so don't ask for it.
            if (
              pattern.id === "cabin-in-the-cotton" &&
              planner.alternateBlocks &&
              s.id === "round3Odd"
            )
              return null;
            // Border & sashing choices = every fabric used in the BLOCK, plus
            // one extra "accent" option (the next unused letter) for a unique
            // accent. For Simple Squares the block fabrics are the user's
            // patchwork palette; for other patterns it's the pattern's fabrics.
            const isBorder = s.id === "border";
            const isSashingSection = s.id === "sashing";
            const blockFabrics = isPatchwork
              ? palette
              : isCustomPattern
                ? customFabrics
                : blockOnlyFabrics;
            const nextAccent = ALL_FABRIC_KEYS.find((f) => !blockFabrics.includes(f));
            const choices = (isBorder || isSashingSection)
              ? (nextAccent ? [...blockFabrics, nextAccent] : blockFabrics)
              : isCustomPattern
                ? customFabrics
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


/** Layout settings offered for a custom block, based on how many of its four
 *  quarter turns actually look different. */
function customLayoutOptions(distinct: number): BlockLayout[] {
  if (distinct <= 1) return ["straight"];
  if (distinct === 2) return ["straight", "alternating"];
  return ["straight", "alternating", "barn-raising", "herringbone"];
}

/**
 * Variation controls for a user-designed block: alternate a second block, and
 * / or swap a pair of fabrics on every other block. Both are checkerboard
 * alternations, so no two touching blocks match.
 */
function CustomVariationControls({
  fabrics,
  swapPair,
  alternate,
  useBlockB,
  hasBlockB,
}: {
  fabrics: FabricKey[];
  swapPair: [FabricKey, FabricKey] | null;
  alternate: boolean;
  useBlockB: boolean;
  hasBlockB: boolean;
}) {
  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl border-2 border-input bg-card p-4">
        <div className="text-base font-medium">Vary your blocks</div>
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          A quilt of identical blocks is only one option. Alternate a second
          block, swap two fabrics on every other block, or turn your blocks as
          you sew the rows — every choice below flows through to your cutting
          list and yardage.
        </p>

        <label className="mt-3 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={useBlockB && hasBlockB}
            disabled={!hasBlockB}
            onChange={(e) => setPlanner({ useBlockB: e.target.checked })}
            className="mt-1 h-5 w-5 shrink-0 accent-current disabled:opacity-40"
          />
          <span>
            <span className="block text-sm font-medium">
              Alternate Block A and Block B
            </span>
            <span className="text-muted-foreground block text-xs leading-snug">
              {hasBlockB ? (
                <>
                  Your two blocks alternate like a checkerboard.{" "}
                  <Link to="/design" className="text-primary underline">
                    Edit your blocks
                  </Link>
                  .
                </>
              ) : (
                <>
                  You haven&apos;t drawn a Block B yet —{" "}
                  <Link to="/design" className="text-primary underline">
                    add one in the block editor
                  </Link>
                  .
                </>
              )}
            </span>
          </span>
        </label>

        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={alternate && !!swapPair}
            disabled={fabrics.length < 2}
            onChange={(e) =>
              setPlanner({
                alternateBlocks: e.target.checked,
                customSwapPair:
                  e.target.checked && !swapPair
                    ? [fabrics[0], fabrics[1]]
                    : swapPair,
              })
            }
            className="mt-1 h-5 w-5 shrink-0 accent-current disabled:opacity-40"
          />
          <span>
            <span className="block text-sm font-medium">
              Swap two fabrics on every other block
            </span>
            <span className="text-muted-foreground block text-xs leading-snug">
              Pick a pair and they trade places on alternating blocks — the same
              block, sewn in reversed colours.
            </span>
          </span>
        </label>

        {alternate && fabrics.length >= 2 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pl-8">
            {[0, 1].map((slot) => (
              <select
                key={slot}
                value={(swapPair?.[slot] ?? fabrics[slot]) as string}
                onChange={(e) => {
                  const next: [FabricKey, FabricKey] = [
                    (swapPair?.[0] ?? fabrics[0]) as FabricKey,
                    (swapPair?.[1] ?? fabrics[1]) as FabricKey,
                  ];
                  next[slot] = e.target.value as FabricKey;
                  setPlanner({ customSwapPair: next });
                }}
                className="border-input bg-background rounded-md border-2 px-2 py-1 text-sm"
                aria-label={slot === 0 ? "First fabric to swap" : "Second fabric to swap"}
              >
                {fabrics.map((f) => (
                  <option key={f} value={f}>
                    Fabric {f}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/design"
        className="text-primary block text-center text-sm font-semibold underline underline-offset-2"
      >
        Edit your block design
      </Link>
    </div>
  );
}
