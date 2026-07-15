import { ALL_FABRIC_KEYS, type FabricKey, type PlannerState } from "./planner-store";
import { getPattern, getEffectiveBorderDefault } from "./patterns";

export interface FabricRequirement {
  fabric: FabricKey;
  pieces: { label: string; count: number; w: number; h: number }[];
  // Strips to cut from a fabric-width bolt
  strips: { stripWidth: number; count: number; pieces: { w: number; h: number; count: number }[] }[];
  totalInches: number; // length down the bolt
  yards: number; // rounded up to 0.25
}

/**
 * Single source of truth for describing a sub-cut piece's shape.
 *
 * Any UI surface (cutting diagram, shopping list, print legend, future
 * patterns) MUST use this helper instead of reimplementing the
 * square-vs-rectangle check, so a Rail-Fence-style mismatch can't recur.
 *
 * Pass a piece's cut width and height in inches.
 */
export function describePieceShape(w: number, h: number) {
  const isSquare = Math.abs(w - h) < 0.01;
  const noun = isSquare ? "square" : "rectangle";
  // For rectangles we show H × W (height first) because rails are typically
  // cut from a strip H tall, sub-cut every W along the bolt — matching how
  // the user actually cuts it.
  const sizeLabel = isSquare
    ? `${w.toFixed(2)}" × ${w.toFixed(2)}"`
    : `${h.toFixed(2)}" × ${w.toFixed(2)}"`;
  return {
    isSquare,
    noun,
    nounPlural: isSquare ? "squares" : "rectangles",
    sizeLabel,
  };
}

const SEAM = 0.5; // 1/4" seam allowance per side -> +0.5" total
const HST_EXTRA = 0.875; // extra for HST squares: finished + 7/8"
/**
 * Selvage allowance: real bolts are not perfectly the labeled width once you
 * trim selvages and account for crooked grain. We subtract 1.5" from the bolt
 * width when calculating how many pieces fit per strip — so a "44-inch" bolt
 * provides about 42.5" of usable fabric.
 *
 * EXPORTED so every UI surface (cutting diagram, leftover labels, copy text)
 * uses the same number. Reimplementing this constant locally caused a real
 * bug where the diagram drew 3 squares per strip while the calculator
 * allocated fabric for only 2 — leaving the quilter short.
 */
export const SELVAGE_TRIM = 1.5;

/** Usable bolt width after trimming selvage on both sides. */
export function usableFabricWidth(fabricWidth: number): number {
  return fabricWidth - SELVAGE_TRIM;
}

/** How many pieces of `cutSize` fit across a strip of usable fabric width. */
export function piecesPerStrip(cutSize: number, fabricWidth: number): number {
  return Math.max(1, Math.floor(usableFabricWidth(fabricWidth) / cutSize));
}

export const SEAM_ALLOWANCE_DESC =
  "1/4 inch seam allowance on every side (the strip of fabric hidden inside the seam when two pieces are sewn together — 0.25\" per side adds 0.5\" total to each cut)";

function roundUpQuarter(yards: number): number {
  return Math.ceil(yards * 4) / 4;
}

function inchesToYards(inches: number, buffer: boolean): number {
  const withBuffer = buffer ? inches * 1.1 : inches;
  return roundUpQuarter(withBuffer / 36);
}

// Pack same-width pieces into strips of fabricWidth.
// Returns rows needed (each row = 1 strip of stripWidth tall).
function packStrips(
  cutSize: number,
  count: number,
  fabricWidth: number,
): { stripWidth: number; stripCount: number } {
  const usable = fabricWidth - SELVAGE_TRIM;
  const perStrip = Math.max(1, Math.floor(usable / cutSize));
  const stripCount = Math.ceil(count / perStrip);
  return { stripWidth: cutSize, stripCount };
}

// Border length needed (down the bolt, cut as long strips across width-of-fabric and pieced)
function borderInches(quiltW: number, quiltH: number, borderW: number, fabricWidth: number) {
  if (borderW <= 0) return { stripWidth: 0, stripCount: 0, inches: 0 };
  const sides = 2 * quiltH;
  const topBot = 2 * (quiltW + 2 * borderW);
  const totalLength = sides + topBot;
  const usable = fabricWidth - SELVAGE_TRIM;
  const stripsNeeded = Math.ceil(totalLength / usable);
  return { stripWidth: borderW + SEAM, stripCount: stripsNeeded, inches: stripsNeeded * (borderW + SEAM) };
}

export interface MaterialsRequirement {
  backing: {
    widthIn: number;
    heightIn: number;
    widths: number;
    yards: number;
    overhang: number;
  };
  batting: {
    widthIn: number;
    heightIn: number;
    presetLabel: string;
    yards: number;
  };
  binding: {
    perimeterIn: number;
    stripWidthIn: number;
    stripCount: number;
    bindingLengthIn: number;
    yards: number;
  };
}

interface CalcResult {
  fabrics: FabricRequirement[];
  unsupported?: boolean;
  notes?: string[];
  /** Beginner-friendly glossary of techniques the sewing notes lean on.
   *  Rendered above the per-pattern notes so the same terms only need to
   *  be explained once. Each entry is { term, explanation }. */
  basics?: { term: string; explanation: string }[];
  materials?: MaterialsRequirement;
}

export function calculateYardage(s: PlannerState): CalcResult {
  const pattern = getPattern(s.pattern);
  if (!pattern) return { fabrics: [] };
  if (!pattern.hasMath) return { fabrics: [], unsupported: true, materials: calculateMaterials(s) };

  const reqs: Record<FabricKey, FabricRequirement> = ALL_FABRIC_KEYS.reduce(
    (acc, k) => {
      acc[k] = blank(k);
      return acc;
    },
    {} as Record<FabricKey, FabricRequirement>,
  );

  const isBearPaw = s.pattern === "bear-paw";
  const isNinePatch = s.pattern === "nine-patch";
  const isHst = s.pattern === "hst";
  const isSimpleSquares = s.pattern === "simple-squares";
  const isRailFence = s.pattern === "rail-fence";
  const isLogCabin = s.pattern === "log-cabin";
  const isOhioStar = s.pattern === "ohio-star";
  const isFlyingGeese = s.pattern === "flying-geese";
  const isD9P = s.pattern === "disappearing-nine-patch";
  const isSquaresOnPoint = s.pattern === "squares-on-point";
  const isPinwheel = s.pattern === "pinwheel";
  const isPlusBlock = s.pattern === "plus-block";
  const isChurnDash = s.pattern === "churn-dash";
  const isSawtoothStar = s.pattern === "sawtooth-star";
  const isFriendshipStar = s.pattern === "friendship-star";
  const isSnowball = s.pattern === "snowball-block";
  const isFourPatch = s.pattern === "four-patch";
  const isStreak = s.pattern === "streak-of-lightning";
  const isBowTie = s.pattern === "bow-tie";
  const isShoofly = s.pattern === "shoofly";
  const isJacobsLadder = s.pattern === "jacobs-ladder";
  const isAutumnTints = s.pattern === "autumn-tints";
  const isCardTrick = s.pattern === "card-trick";
  const isOhSusannah = s.pattern === "oh-susannah";
  const isTwinStar = s.pattern === "twin-star";
  const isStarAndCross = s.pattern === "star-and-cross";
  const isIdahoBeauty = s.pattern === "idaho-beauty";
  const isCheckerboard = s.pattern === "checkerboard";
  // Sashing is optional across all patterns that support it — a user-entered 0
  // means "no sashing" and the math collapses to plain blocks.
  const sashWidth = (isBearPaw || isNinePatch || isHst || isSimpleSquares || isRailFence || isLogCabin || isOhioStar || isFlyingGeese || isD9P || isSquaresOnPoint || isPinwheel || isPlusBlock || isChurnDash || isSawtoothStar || isFriendshipStar || isSnowball || isFourPatch || isStreak || isBowTie || isShoofly || isJacobsLadder || isAutumnTints || isCardTrick || isOhSusannah || isTwinStar || isStarAndCross || isIdahoBeauty || isCheckerboard)
    ? Math.max(0, s.sashingWidth || 0)
    : 0;
  const isSashed = sashWidth > 0;
  const innerW = s.quiltWidth - 2 * s.borderWidth;
  const innerH = s.quiltHeight - 2 * s.borderWidth;
  const blocksAcross = Math.max(1, Math.floor(innerW / s.blockSize));
  const blocksDown = Math.max(1, Math.floor(innerH / s.blockSize));
  const blockCount = blocksAcross * blocksDown;
  const notes: string[] = [
    `${blocksAcross} × ${blocksDown} = ${blockCount} blocks (${s.blockSize}" finished)`,
    `Cut sizes include a ${SEAM_ALLOWANCE_DESC}.`,
  ];

  // Beginner-friendly glossary. The per-pattern sewing notes below lean
  // on these terms so we only have to explain them once. Simple Squares has
  // no assembly notes, so we only attach the glossary to results when at
  // least one pattern-specific sewing step references it.
  const basics: { term: string; explanation: string }[] = [
    {
      term: "Right sides together (RST)",
      explanation:
        "\"Right sides together\" — abbreviated RST throughout these instructions — means laying two pieces of fabric so their printed (pretty) sides are touching each other. The plain backs of the fabric will be facing you on both the top and the bottom. This is how almost every quilting seam starts: you sew along the matched edge, then unfold so the two pieces lie flat side by side, printed sides up. Anytime you see \"RST\" later in this guide, it's shorthand for this same step.",
    },
    {
      term: '1/4" seam',
      explanation:
        "Sew a straight line of stitches exactly 1/4 inch from the edge you're joining. Most machines have a foot or a marked line to help you keep this consistent — it's the standard for every cut size in this plan.",
    },
    {
      term: "Lining up an edge",
      explanation:
        "When the steps say \"line up the right edge,\" match just those two edges exactly before sewing. The rest of the piece can hang off the side — only the edge you're sewing has to align. A pin or two through the matched edge keeps things from shifting.",
    },
    {
      term: "Unfold (or \"open it up\")",
      explanation:
        "After sewing two pieces right sides together (RST), lift the top piece and fold it back along the new seam so both pieces lie flat side by side, printed sides up. The seam becomes a hinge between them.",
    },
    {
      term: "Press the seam",
      explanation:
        "Set an iron on the seam and press straight down — don't slide back and forth. The little flap of fabric on the back is the \"seam allowance.\" In Log Cabin and Rail Fence, press it toward the most recently added piece (or toward the darker fabric) so the block stays flat as you add more.",
    },
  ];

  if (s.pattern === "simple-squares") {
    const cut = s.blockSize + SEAM;
    // Skip block-fabric yardage when sourcing from fat quarters — the FQ
    // planner handles the squares. Sashing/border math below still runs
    // because those come from yardage bolts.
    const fromFatQuarter = s.fabricSource === "fat-quarter";
    // Patchwork mode: split block count across the user's chosen palette
    // (2–12 fabrics) using the per-cell mix from the preview grid.
    const mix = computePatchworkMix(s);
    if (mix) {
      const lines: string[] = [];
      for (const fab of ALL_FABRIC_KEYS) {
        const pct = mix[fab];
        if (!pct || pct <= 0) continue;
        const count = Math.ceil(blockCount * pct);
        if (!fromFatQuarter) {
          addSquares(reqs[fab], `Squares (Fabric ${fab})`, count, cut, s.fabricWidth);
        }
        lines.push(`Fabric ${fab}: ${count} squares (${Math.round(pct * 100)}% of layout)`);
      }
      notes.push(`Cut ${blockCount} squares total at ${cut}" (finished ${s.blockSize}" + 1/2" for seam allowance), split across your fabrics:`);
      lines.forEach((l) => notes.push(l));
    } else {
      const squareFab = (s.assignments["squares"] ?? "A") as FabricKey;
      if (!fromFatQuarter) {
        addSquares(reqs[squareFab], "Squares", blockCount, cut, s.fabricWidth);
      }
      notes.push(
        `Cut ${blockCount} squares of Fabric ${squareFab} at ${cut}" (finished ${s.blockSize}" + 1/2" for seam allowance).`,
      );
    }


    // Optional sashing between blocks (Simple Squares).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "B") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Simple Squares Assembly Tip — full quilt: lay your squares out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the squares without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "nine-patch") {
    const patchFinished = s.blockSize / 3;
    const cut = patchFinished + SEAM;
    const centerCount = 5 * blockCount;
    const outerCount = 4 * blockCount;
    const centerFab = (s.assignments["center"] ?? "A") as FabricKey;
    const outerFab = (s.assignments["outer"] ?? "B") as FabricKey;
    addSquares(reqs[centerFab], "Center & corner squares", centerCount, cut, s.fabricWidth);
    addSquares(reqs[outerFab], "Alternating squares", outerCount, cut, s.fabricWidth);
    notes.push(
      `Each block uses 5 corner/center squares + 4 alternating squares (${cut}" cut size).`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${centerCount} squares of Fabric ${centerFab} (5 × ${blockCount}) and ${outerCount} squares of Fabric ${outerFab} (4 × ${blockCount}).`,
    );

    // Optional sashing between blocks only (no cornerstones for Nine Patch).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Nine Patch Assembly Tip — full quilt: STAGE 1 (block). Sew each 3×3 nine-patch by joining the 9 small squares into 3 rows of 3, then joining the rows. Press seams toward the darker fabric so they nest. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    } else {
      notes.push(
        `Nine Patch Assembly Tip: Sew each 3×3 nine-patch by joining the 9 small squares into 3 rows of 3, then joining the rows. Press seams toward the darker fabric so they nest. Then lay your blocks out in the ${blocksAcross} × ${blocksDown} grid and join row by row to form the quilt top.`,
      );
    }
  } else if (s.pattern === "hst") {
    const cut = s.blockSize + HST_EXTRA;
    const squaresEach = Math.ceil(blockCount / 2);
    const t1 = (s.assignments["tri1"] ?? "A") as FabricKey;
    const t2 = (s.assignments["tri2"] ?? "B") as FabricKey;
    addSquares(reqs[t1], "Triangle A squares", squaresEach, cut, s.fabricWidth);
    addSquares(reqs[t2], "Triangle B squares", squaresEach, cut, s.fabricWidth);
    notes.push(
      `Cut ${squaresEach} squares of Fabric ${t1} and ${squaresEach} squares of Fabric ${t2}, all at ${cut}" × ${cut}" (finished ${s.blockSize}" + 7/8" extra for the diagonal seam).`,
    );
    notes.push(
      `To turn the squares into triangle blocks: take one Fabric ${t1} square and one Fabric ${t2} square and place them right sides together (RST). On the back of the top square, use a pencil or fabric marker to draw a straight line from one corner to the opposite corner (a diagonal).`,
    );
    notes.push(
      `Sew a 1/4" seam down the LEFT side of that drawn line, then a second 1/4" seam down the RIGHT side. You'll end up with two parallel lines of stitching with the drawn line running between them.`,
    );
    notes.push(
      `Now cut along the drawn line in the middle (the line itself, not the stitches). You'll get two pieces, each with a Fabric ${t1} triangle and a Fabric ${t2} triangle already sewn together along the diagonal. Unfold each piece and press the seam toward the darker fabric. Each pair of squares makes 2 finished half-square triangle blocks, for ${blockCount} blocks total.`,
    );

    // Optional sashing between blocks only (no cornerstones for HST).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `HST Assembly Tip — full quilt: STAGE 1 (block). Make all ${blockCount} HST blocks following the cut-and-sew steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid, all rotated the same direction (or arranged to make your chosen secondary pattern). Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "pinwheel") {
    // Pinwheel = 2×2 grid of HST units per block. The HST cut size is based
    // on the HALF-block (each HST finishes at blockSize/2) plus 7/8" for
    // the diagonal seam.
    const halfFinished = s.blockSize / 2;
    const cut = halfFinished + HST_EXTRA;
    const hstUnits = blockCount * 4; // 4 HSTs per Pinwheel block
    const squaresEach = Math.ceil(hstUnits / 2); // 1 square pair → 2 HSTs
    const blades = (s.assignments["blades"] ?? "A") as FabricKey;
    const bg = (s.assignments["bg"] ?? "B") as FabricKey;
    addSquares(reqs[blades], "Blade squares", squaresEach, cut, s.fabricWidth);
    addSquares(reqs[bg], "Background squares", squaresEach, cut, s.fabricWidth);
    notes.push(
      `Each Pinwheel block = 4 Half Square Triangle units arranged in a 2×2 grid so the blades spin around the center. Across all ${blockCount} blocks: ${hstUnits} HST units total.`,
    );
    notes.push(
      `Cut ${squaresEach} squares of Fabric ${blades} (blades) and ${squaresEach} squares of Fabric ${bg} (background), all at ${cut}" × ${cut}" (each HST finishes at ${halfFinished.toFixed(2)}" — half the block size — plus 7/8" extra for the diagonal seam).`,
    );
    notes.push(
      `To make the HST units: take one Fabric ${blades} square and one Fabric ${bg} square and place them right sides together (RST). On the back of the top square, draw a straight diagonal line from one corner to the opposite corner.`,
    );
    notes.push(
      `Sew a 1/4" seam down the LEFT side of the drawn line, then a second 1/4" seam down the RIGHT side. Cut along the drawn line in the middle (the line itself, not the stitches). Each pair of squares yields 2 finished HST units. Press the seam toward the darker fabric.`,
    );
    notes.push(
      `Trim each finished HST unit to ${(halfFinished + SEAM).toFixed(2)}" square so it finishes at ${halfFinished.toFixed(2)}" once sewn into the block.`,
    );
    notes.push(
      `Pinwheel assembly: lay out 4 trimmed HST units in a 2×2 grid. Rotate each unit so the blade triangles all point the same rotational direction (clockwise) around the center. Sew the top pair together, sew the bottom pair together, then join the two rows. Press the final center seams open to reduce bulk where all 4 points meet — this helps the block lie flat.`,
    );

    // Optional sashing between blocks (Pinwheel).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Pinwheel Assembly Tip — full quilt: STAGE 1 (block). Make all ${blockCount} pinwheel blocks following the HST steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid, all rotated so the blades spin the same direction (clockwise). Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "rail-fence") {
    // Each block = 3 rails. Each rail finishes at (blockSize/3) tall × blockSize wide.
    // Cut size: (blockSize/3 + 0.5)" tall × (blockSize + 0.5)" long.
    // We cut full-fabric-width strips at the rail-cut height, then sub-cut
    // them into block-length rails — the most efficient way to piece rails.
    const railFinished = s.blockSize / 3;
    const railCutHeight = railFinished + SEAM;
    const railCutLength = s.blockSize + SEAM;
    const r1 = (s.assignments["rail1"] ?? "A") as FabricKey;
    const r2 = (s.assignments["rail2"] ?? "B") as FabricKey;
    const r3 = (s.assignments["rail3"] ?? "C") as FabricKey;
    // Group rails by fabric so two rails sharing a fabric share strips.
    const railFabrics: Record<FabricKey, number> = {} as Record<FabricKey, number>;
    for (const f of [r1, r2, r3] as FabricKey[]) {
      railFabrics[f] = (railFabrics[f] ?? 0) + blockCount;
    }
    // Skip rail yardage entirely when the user is sourcing block fabric from
    // a jelly roll — the precut planner handles rails. Sashing/border math
    // below still runs because those come from yardage bolts.
    const fromJellyRoll = s.fabricSource === "jelly-roll";
    if (!fromJellyRoll) {
      for (const fab of ALL_FABRIC_KEYS) {
        const railsNeeded = railFabrics[fab];
        if (!railsNeeded) continue;
        addRails(
          reqs[fab],
          `${railsNeeded} rails (Fabric ${fab})`,
          railsNeeded,
          railCutLength,
          railCutHeight,
          s.fabricWidth,
        );
      }
    }
    const railsPerStrip = Math.max(
      1,
      Math.floor((s.fabricWidth - SELVAGE_TRIM) / railCutLength),
    );
    notes.push(
      `Each block = 3 rails. Cut each rail at ${railCutHeight.toFixed(2)}" tall × ${railCutLength.toFixed(2)}" long (finished ${railFinished.toFixed(2)}" × ${s.blockSize}" + 1/2" for seam allowance).`,
    );
    notes.push(
      `Cutting strategy: cut full-width strips ${railCutHeight.toFixed(2)}" tall across the bolt, then sub-cut each strip into ${railsPerStrip} rails of ${railCutLength.toFixed(2)}" long.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${blockCount} rails of Fabric ${r1} (top), ${blockCount} of Fabric ${r2} (middle), ${blockCount} of Fabric ${r3} (bottom).`,
    );
    notes.push(
      `To sew one block: place the top rail and the middle rail right sides together (RST), lining up one long edge. Sew that edge with a 1/4" seam, then unfold and press the seam toward the middle rail. Now place the bottom rail on top of the middle rail RST, line up the long edge, sew, unfold, and press toward the bottom rail. You now have one finished block with three stripes.`,
    );
    notes.push(
      `Layout tip: rotate every other block 90° (alternating horizontal and vertical) when arranging — that's what gives Rail Fence its classic woven look.`,
    );

    // Optional sashing between blocks (Rail Fence).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Rail Fence Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} 3-rail blocks following the steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid, rotating every other block 90° for the woven look. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. Add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "log-cabin") {
    // Log Cabin construction (traditional spiral, light/dark diagonal split):
    //   centerFinished = blockSize / 4   (the small "hearth" square)
    //   logFinished    = blockSize / 8   (every log is the same width)
    //   3 rounds of 4 logs = 12 logs per block
    //   block size after 3 rounds = c + 6w = blockSize/4 + 3*blockSize/4 = blockSize ✓
    //
    // Logs go around in a spiral (right, top, left, bottom, then repeat).
    // They come in equal-length pairs — one DARK, one LIGHT — with length
    // stepping +logFinished between successive pairs:
    //   Dark  lengths (finished): c, c+w, c+2w, c+3w, c+4w, c+5w  (6 logs/block)
    //   Light lengths (finished): c+w, c+2w, c+3w, c+4w, c+5w, c+6w  (6 logs/block)
    // Two adjacent sides end up dark, the opposite two end up light — the
    // classic Log Cabin diagonal.
    const centerFinished = s.blockSize / 4;
    const logFinished = s.blockSize / 8;
    const ROUNDS = 3;
    const logCount = 4 * ROUNDS; // 12 logs per block
    const logCutWidth = logFinished + SEAM;
    const centerCut = centerFinished + SEAM;

    const centerFab = (s.assignments["center"] ?? "A") as FabricKey;
    const lightFab = (s.assignments["light"] ?? "B") as FabricKey;
    const darkFab = (s.assignments["dark"] ?? "C") as FabricKey;

    // 1 center square per block.
    addSquares(reqs[centerFab], "Center 'hearth' squares", blockCount, centerCut, s.fabricWidth);

    // Build the per-fabric list of log lengths (finished). Steps i = 0..5 for
    // dark, 1..6 for light — equivalent to "stepCount" logs per fabric.
    const stepCount = 2 * ROUNDS; // 6 logs per fabric per block
    type Bucket = { lenCut: number; lenFinished: number; count: number };
    const bucketize = (offsetW: number): Bucket[] => {
      const buckets: Bucket[] = [];
      for (let i = 0; i < stepCount; i++) {
        const lenFinished = centerFinished + (i + offsetW) * logFinished;
        const lenCut = lenFinished + SEAM;
        buckets.push({ lenFinished, lenCut, count: blockCount });
      }
      return buckets;
    };
    // Dark starts at c (offset 0), Light starts at c+w (offset 1).
    const fabricLogs: Partial<Record<FabricKey, Bucket[]>> = {};
    const addToFabric = (fab: FabricKey, more: Bucket[]) => {
      const existing = fabricLogs[fab] ?? [];
      // Merge by length (in case dark & light share a fabric, or center === log).
      for (const b of more) {
        const hit = existing.find((e) => Math.abs(e.lenCut - b.lenCut) < 0.001);
        if (hit) hit.count += b.count;
        else existing.push({ ...b });
      }
      fabricLogs[fab] = existing;
    };
    addToFabric(darkFab, bucketize(0));
    addToFabric(lightFab, bucketize(1));

    // For each fabric, sort buckets longest → shortest (helps cutters work
    // through the strip in a predictable order) and add as rectangular cuts.
    for (const fab of ALL_FABRIC_KEYS) {
      const buckets = fabricLogs[fab];
      if (!buckets || buckets.length === 0) continue;
      buckets.sort((a, b) => b.lenCut - a.lenCut);
      for (const bk of buckets) {
        addRails(
          reqs[fab],
          `${bk.count} logs at ${bk.lenCut.toFixed(2)}"`,
          bk.count,
          bk.lenCut,
          logCutWidth,
          s.fabricWidth,
        );
      }
    }

    notes.push(
      `Each block = 1 center square (${centerCut.toFixed(2)}" cut, finished ${centerFinished.toFixed(2)}") + ${logCount} logs (${logCutWidth.toFixed(2)}" tall, lengths ${(centerFinished + SEAM).toFixed(2)}"–${(centerFinished + 6 * logFinished + SEAM).toFixed(2)}").`,
    );
    notes.push(
      `Cutting strategy: cut full-width strips ${logCutWidth.toFixed(2)}" tall and sub-cut into logs at each length your shopping list shows. Cut the center squares from a separate ${centerCut.toFixed(2)}"-tall strip.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${blockCount} centers (Fabric ${centerFab}), ${6 * blockCount} dark logs (Fabric ${darkFab}), ${6 * blockCount} light logs (Fabric ${lightFab}).`,
    );
    notes.push(
      `How to sew one block (the spiral): place the center "hearth" square in front of you, printed side up. Pick up log 1 (dark, ${centerCut.toFixed(2)}" long — the same length as the center). Lay it directly over the center square right sides together (RST), with both right-hand edges lined up exactly. The log will completely cover the center because they're the same length — that's expected; you'll unfold it after sewing. Sew a 1/4" seam along that lined-up right edge only. Unfold the log to the right so it lies flat next to the center (printed sides up). Press the seam toward the new log.`,
    );
    notes.push(
      `Rotate the whole piece a quarter-turn counter-clockwise so what was the top edge is now the right edge. Pick up log 2 (dark, ${(centerFinished + logFinished + SEAM).toFixed(2)}" long — slightly longer because it now needs to span the center plus the first log). Lay it RST along the new right edge, line up that edge, sew a 1/4" seam, unfold, and press toward log 2. Repeat with log 3 (light, ${(centerFinished + logFinished + SEAM).toFixed(2)}") and log 4 (light, ${(centerFinished + 2 * logFinished + SEAM).toFixed(2)}"), each time rotating a quarter-turn first. That's one round of the spiral done. Do two more rounds (8 more logs) the same way to finish the block — always rotate, then add the next log along the current right edge.`,
    );
    notes.push(
      `Color-placement tip: keep the dark logs on the SAME two adjacent sides every round (e.g. top + right) and the light logs on the OTHER two sides (bottom + left). That's what creates the iconic diagonal split — half the finished block looks dark, the other half looks light.`,
    );
    notes.push(
      `Layout tip: arranging the finished blocks so all the dark corners point the same direction creates classic Log Cabin layouts called "Straight Furrows" or "Sunshine and Shadow." Try a few orientations on the floor (or a bed) before sewing the blocks together.`,
    );

    // Optional sashing between blocks only (no cornerstones for Log Cabin).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "D") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Log Cabin Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} Log Cabin blocks following the spiral steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid, all rotated the same direction (or arranged into a Straight Furrows / Sunshine and Shadow layout). Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "ohio-star") {
    // Ohio Star construction:
    //   Each block = a 3×3 grid of "units", where unitFinished = blockSize / 3.
    //     - 4 corner units: plain background squares (cut = unitFinished + 0.5")
    //     - 4 edge units:   pieced quarter-square triangles (QSTs) — each has
    //                       2 star triangles on one diagonal + 2 background
    //                       triangles on the other, forming the 8 star points.
    //     - 1 center unit:  plain center square (cut = unitFinished + 0.5")
    //
    // QST construction (standard quilting technique):
    //   To make 4 QST units per block, pair 2 star squares with 2 background
    //   squares — both cut at unitFinished + 1.25" (the "quarter-square trim",
    //   1.25" extra to absorb the bias-cut diagonals on both axes).
    //   Pair RST → draw diagonal → sew 1/4" each side → cut on line → 2 HSTs.
    //   Two HSTs paired with seams nesting opposite → draw the OTHER diagonal
    //   → sew 1/4" each side → cut → 2 QSTs.
    //   Net per block: 2 star + 2 bg "QST squares" yield 4 finished QST units. ✓
    const unitFinished = s.blockSize / 3;
    const plainCut = unitFinished + SEAM;       // corner & center squares
    const qstCut = unitFinished + 1.25;          // bigger square for QST trim

    const starFab = (s.assignments["star"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;
    const centerFab = (s.assignments["center"] ?? "D") as FabricKey;

    // Per-block piece counts:
    const qstStarSquaresPerBlock = 2;
    const qstBgSquaresPerBlock = 2;
    const cornerBgPerBlock = 4;
    const centerPerBlock = 1;

    addSquares(
      reqs[starFab],
      "QST squares (star fabric)",
      qstStarSquaresPerBlock * blockCount,
      qstCut,
      s.fabricWidth,
    );
    addSquares(
      reqs[bgFab],
      "QST squares (background)",
      qstBgSquaresPerBlock * blockCount,
      qstCut,
      s.fabricWidth,
    );
    addSquares(
      reqs[bgFab],
      "Corner squares (background)",
      cornerBgPerBlock * blockCount,
      plainCut,
      s.fabricWidth,
    );
    addSquares(
      reqs[centerFab],
      "Center squares",
      centerPerBlock * blockCount,
      plainCut,
      s.fabricWidth,
    );

    notes.push(
      `Each block = 3×3 grid of units, finished ${unitFinished.toFixed(2)}" each. 4 corners + 1 center are plain squares; 4 edge units are pieced quarter-square triangles (QSTs) that form the 8 star points.`,
    );
    notes.push(
      `Per block, cut: 2 star squares + 2 background squares at ${qstCut.toFixed(2)}" (these become the 4 QST units), 4 background squares at ${plainCut.toFixed(2)}" (corners), and 1 center square at ${plainCut.toFixed(2)}". The QST squares are cut larger to absorb the diagonal bias trim.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${qstStarSquaresPerBlock * blockCount} star QST squares (Fabric ${starFab}), ${qstBgSquaresPerBlock * blockCount} background QST squares + ${cornerBgPerBlock * blockCount} background corners (Fabric ${bgFab}), and ${centerPerBlock * blockCount} center squares (Fabric ${centerFab}).`,
    );
    notes.push(
      `How to make ONE QST unit (you'll repeat this 4 times per block): take one star QST square and one background QST square (both ${qstCut.toFixed(2)}"), place them right sides together (RST), and on the back of the lighter square draw a diagonal line corner-to-corner. Sew a 1/4" seam down the LEFT side of the line, then a second 1/4" seam down the RIGHT side. Cut along the drawn line — you now have 2 half-square triangle (HST) units.`,
    );
    notes.push(
      `Press both HSTs open (seam toward the darker fabric). Now stack the 2 HSTs RST so the star triangle of one sits on the background triangle of the other, and the seams "nest" together (run them under your finger — when they lock into each other you've got it). On the back of the top HST, draw a NEW diagonal line — this one runs perpendicular to the first seam (corner-to-corner across the seam, not along it). Sew 1/4" each side of this new line, cut on the drawn line, unfold, and press. You now have 2 finished QST units, each showing 4 little triangles meeting in the middle: 2 star triangles forming a "bowtie" along one diagonal and 2 background triangles along the other. Trim each QST to ${(unitFinished + SEAM).toFixed(2)}" square.`,
    );
    notes.push(
      `Assemble the block as a 3×3 grid: row 1 = background corner, QST (star points up), background corner. Row 2 = QST (star points left), center square, QST (star points right). Row 3 = background corner, QST (star points down), background corner. Sew each row across, press, then sew the 3 rows together — the 8 star points should meet cleanly at the center square.`,
    );

    // Optional sashing between blocks only (no cornerstones for Ohio Star).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Ohio Star Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} Ohio Star blocks following the QST + 3×3 steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the stars without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }

  } else if (s.pattern === "flying-geese") {
    // Flying Geese construction (No-Waste 4-at-a-Time method):
    //   Each "goose" finishes 2:1 — twice as wide as it is tall. We stack
    //   2 geese vertically per block, so:
    //     gooseFinishedW = blockSize           (full block width)
    //     gooseFinishedH = blockSize / 2       (half the block height)
    //   That gives 2 geese per block.
    //
    // The No-Waste method makes 4 finished geese units from:
    //     1 LARGE goose square at (gooseFinishedW + 1.25")
    //     4 SMALL sky squares  at (gooseFinishedH + 0.875")
    //   Pair the 4 small sky squares to opposite corners of the large square,
    //   draw diagonals, sew 1/4" each side, cut, press → 4 finished geese.
    //   This is the standard beginner-friendly method and wastes no fabric.
    //
    // Per block we need 2 geese, so 2 blocks share 1 large square set:
    //   geeseSetsPerBlock = 0.5 → ceil(2 * blockCount / 4) large squares
    //   smallSkyPerBlock  = 4 small squares per LARGE square (also pooled).
    const gooseFinishedW = s.blockSize;
    const gooseFinishedH = s.blockSize / 2;
    const largeCut = gooseFinishedW + 1.25;
    const smallCut = gooseFinishedH + 0.875;

    const gooseFab = (s.assignments["goose"] ?? "A") as FabricKey;
    const skyFab = (s.assignments["sky"] ?? "B") as FabricKey;

    // 2 geese per block. Each large square yields 4 finished geese.
    const totalGeese = 2 * blockCount;
    const largeSquaresNeeded = Math.ceil(totalGeese / 4);
    // 4 small sky squares per large square (one per corner).
    const smallSquaresNeeded = largeSquaresNeeded * 4;

    addSquares(
      reqs[gooseFab],
      "Large goose squares",
      largeSquaresNeeded,
      largeCut,
      s.fabricWidth,
    );
    addSquares(
      reqs[skyFab],
      "Small sky squares",
      smallSquaresNeeded,
      smallCut,
      s.fabricWidth,
    );

    notes.push(
      `Each block = 2 geese stacked vertically. Each goose finishes ${gooseFinishedW}" wide × ${gooseFinishedH}" tall (the classic 2:1 ratio).`,
    );
    notes.push(
      `We use the "No-Waste 4-at-a-Time" method: 1 large goose square + 4 small sky squares yields 4 finished geese with zero waste. Across all ${blockCount} blocks you need ${totalGeese} geese, so cut ${largeSquaresNeeded} large goose squares (Fabric ${gooseFab}) at ${largeCut.toFixed(2)}" and ${smallSquaresNeeded} small sky squares (Fabric ${skyFab}) at ${smallCut.toFixed(2)}".`,
    );
    notes.push(
      `How to make 4 geese from one set: lay the LARGE goose square on the table printed side up. Take 2 small sky squares and place them in OPPOSITE corners of the large square, right sides together (RST) — they'll overlap a little in the middle. On the back of each small square, draw a diagonal line from corner to corner so the two drawn lines form one continuous line across the large square. Sew a 1/4" seam down the LEFT side of the line and a second 1/4" seam down the RIGHT side, then cut along the drawn line. You now have 2 heart-shaped pieces.`,
    );
    notes.push(
      `Press each heart open (seam toward the small sky triangles). Take the remaining 2 small sky squares and place one in the empty corner of each heart, RST. Draw a diagonal from the inner corner of the small square out to the point. Sew 1/4" each side of the line, cut along the line, press open. You now have 4 finished geese units, each ${(gooseFinishedW + SEAM).toFixed(2)}" × ${(gooseFinishedH + SEAM).toFixed(2)}" (unfinished cut size).`,
    );
    notes.push(
      `Assemble each block: stack 2 geese on top of each other with all the points facing the SAME direction (traditionally up). Sew the bottom edge of the top goose to the top edge of the bottom goose RST with a 1/4" seam, press toward the bottom goose. Do this for all ${blockCount} blocks.`,
    );
    notes.push(
      `Layout tip: arrange every block with the geese all flying the same direction for the classic "flock" look, OR alternate rows pointing up/down for a chevron pattern. Try a few orientations on the floor before sewing the rows together.`,
    );

    // Optional sashing between blocks only (no cornerstones for Flying Geese).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Flying Geese Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} blocks following the no-waste geese steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid with all geese flying the same direction (or your chosen layout). Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "disappearing-nine-patch") {
    // Disappearing Nine Patch construction:
    //   Sew a standard 3×3 nine-patch, then slice it in half horizontally
    //   AND vertically (2 extra seams). Rotate each of the 4 quarter-blocks
    //   180° and sew back together → a pinwheel/chain block from 2 fabrics.
    //
    // KEY MATH: the 2 extra seams shrink the finished block by 1" total
    // (1/2" per new cut — 1/4" seam allowance on each side). To make the
    // user's chosen blockSize the FINAL finished size, we start with a
    // 9-patch whose patches finish at (blockSize + 1) / 3 — so the original
    // 9-patch finishes at blockSize + 1, then loses 1" to the new seams.
    //
    // Per starting block: 5 center/corner squares + 4 alternating squares
    // (identical piece counts to a regular Nine Patch).
    const finalBlock = s.blockSize;
    const startingBlock = finalBlock + 1; // before the slice-and-rotate
    const patchFinished = startingBlock / 3;
    const cut = patchFinished + SEAM;
    const centerCount = 5 * blockCount;
    const outerCount = 4 * blockCount;
    const centerFab = (s.assignments["center"] ?? "A") as FabricKey;
    const outerFab = (s.assignments["outer"] ?? "B") as FabricKey;
    addSquares(reqs[centerFab], "Center & corner squares", centerCount, cut, s.fabricWidth);
    addSquares(reqs[outerFab], "Alternating squares", outerCount, cut, s.fabricWidth);

    notes.push(
      `Each finished Disappearing Nine Patch block is ${finalBlock}" — but you start by sewing a slightly LARGER ${startingBlock}" nine-patch (each small square finishes at ${patchFinished.toFixed(2)}", cut at ${cut.toFixed(2)}"). The two extra seams from slicing the block in half horizontally and vertically eat up exactly 1" total, leaving the final block at ${finalBlock}".`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${centerCount} squares of Fabric ${centerFab} (5 × ${blockCount}, the corner+center squares of each starting nine-patch) and ${outerCount} squares of Fabric ${outerFab} (4 × ${blockCount}, the alternating squares).`,
    );
    notes.push(
      `Step 1 — Sew the nine-patch: arrange 9 squares in a 3×3 grid for each block, with Fabric ${centerFab} in the 4 corners + center and Fabric ${outerFab} in the 4 alternating positions (a checkerboard). Sew each row of 3 squares together with a 1/4" seam, then sew the 3 rows together. Press all seams toward the darker fabric. You should have a flat ${startingBlock}"-finished nine-patch block.`,
    );
    notes.push(
      `Step 2 — Slice it: lay the nine-patch flat on a cutting mat. Find the exact horizontal midpoint and cut straight across with a rotary cutter — right through the middle row of squares. Then find the exact vertical midpoint and cut straight down through the middle column. You'll end up with 4 quarter-blocks, each containing pieces of both fabrics. Don't worry about cutting "through" the middle squares — that's the whole point of the technique.`,
    );
    notes.push(
      `Step 3 — Rotate & rearrange: rotate each of the 4 quarter-blocks 180° (a half-turn). The original CORNER squares of the nine-patch (Fabric ${centerFab}) now meet in the MIDDLE of the new block, forming a chain. The original CENTER square gets split across all 4 quarters and ends up at the new corners. Sew the 4 quarter-blocks back together — top two RST first, bottom two RST, then join the two halves — with 1/4" seams. Press the seams open or to one side. Your finished D9P block is now ${finalBlock}".`,
    );
    notes.push(
      `Layout tip: D9P blocks look great in a straight grid (the chains line up across the whole quilt) OR rotated so every other block is turned 90° for a more scattered look. Try both on the floor before sewing the rows together.`,
    );

    // Optional sashing between blocks only.
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Disappearing Nine Patch Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} D9P blocks following the slice-and-rotate steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "squares-on-point") {
    // Squares on Point construction (classic "square-in-a-square" unit):
    //   The on-point square's POINTS touch the midpoints of each block edge,
    //   so its diagonal = blockSize. Side = blockSize / √2.
    //   Center on-point square cut size = (blockSize / √2) + 0.5"
    //     (finished side + 1/2" seam allowance, like any straight-edge cut).
    //   Corner triangles: 2 squares cut at (blockSize / 2) + 0.875" per block,
    //     each cut once on the diagonal → 4 triangles per block (one per
    //     corner). The +7/8" matches the standard HST formula since two of
    //     the triangle's edges become diagonal-cut and need extra room.
    //
    // Per block: 1 on-point center square + 2 corner squares (yielding 4
    // corner triangles).
    const SQRT2 = Math.SQRT2;
    const centerCut = s.blockSize / SQRT2 + SEAM;
    const cornerCut = s.blockSize / 2 + HST_EXTRA;

    const sqFab = (s.assignments["square"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;

    const centerCount = blockCount;       // 1 on-point square per block
    const cornerSqCount = 2 * blockCount; // 2 corner squares per block (→ 4 triangles)

    addSquares(reqs[sqFab], "On-point center squares", centerCount, centerCut, s.fabricWidth);
    addSquares(reqs[bgFab], "Corner-triangle squares", cornerSqCount, cornerCut, s.fabricWidth);

    notes.push(
      `Each block = 1 on-point square (cut ${centerCut.toFixed(2)}") framed by 4 background corner triangles. The on-point square's points touch the midpoints of each block edge, so its finished side = ${(s.blockSize / SQRT2).toFixed(2)}".`,
    );
    notes.push(
      `For the 4 corner triangles, cut 2 background squares at ${cornerCut.toFixed(2)}" per block — each square gets cut once on the diagonal to make 2 triangles. The +7/8" extra matches the standard half-square-triangle formula because two of each triangle's edges end up on the bias.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${centerCount} on-point squares (Fabric ${sqFab}) and ${cornerSqCount} corner-triangle squares (Fabric ${bgFab}, which yield ${4 * blockCount} triangles).`,
    );
    notes.push(
      `How to sew ONE block (square-in-a-square): take the 2 corner-triangle squares for this block and cut each one once corner-to-corner on the diagonal — you'll have 4 right triangles. Lay the on-point center square in front of you printed side up, oriented as a regular square (not yet rotated).`,
    );
    notes.push(
      `Take one corner triangle and place it on the TOP edge of the center square right sides together (RST), with the triangle's long edge (the diagonal cut you just made) lined up exactly along the top edge of the center square. The triangle's point will sit centered above the square. Sew a 1/4" seam along that lined-up edge, then unfold the triangle up and away. Press the seam toward the triangle.`,
    );
    notes.push(
      `Repeat with a second triangle on the BOTTOM edge of the center square (RST, long edge lined up with the bottom edge, sew, unfold, press). Now do the LEFT and RIGHT edges the same way. After all 4 triangles are attached and pressed, the center square will appear rotated 45° inside a larger square. Trim the block to ${(s.blockSize + SEAM).toFixed(2)}" — the corner triangles are cut slightly oversized on purpose so you have room to true up the block.`,
    );
    notes.push(
      `Layout tip: Squares on Point looks great as a straight grid (every diamond facing the same way) or alternating with plain background squares for a "diamonds floating in a sky" effect. Try a few layouts before sewing the rows together.`,
    );

    // Optional sashing between blocks only.
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Squares on Point Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} square-in-a-square blocks following the steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the diamonds without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "plus-block") {
    // Plus Block construction:
    //   3×3 grid of equal squares. Center column + center row = the "+" (5
    //   squares), the 4 corners = background. Same cut math as Nine Patch:
    //     unitFinished = blockSize / 3
    //     cut = unitFinished + 0.5"
    //   Per block: 5 plus squares + 4 background corner squares.
    const unitFinished = s.blockSize / 3;
    const cut = unitFinished + SEAM;
    const plusCount = 5 * blockCount;
    const bgCount = 4 * blockCount;
    const plusFab = (s.assignments["plus"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;
    addSquares(reqs[plusFab], "Plus squares", plusCount, cut, s.fabricWidth);
    addSquares(reqs[bgFab], "Background corner squares", bgCount, cut, s.fabricWidth);

    notes.push(
      `Each block = 3×3 grid of ${unitFinished.toFixed(2)}"-finished squares (cut at ${cut.toFixed(2)}"). The center square + the 4 squares directly above, below, left, and right of it form the "+" — that's 5 plus squares per block. The 4 corner squares are background.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${plusCount} squares of Fabric ${plusFab} (5 × ${blockCount}, the "+") and ${bgCount} squares of Fabric ${bgFab} (4 × ${blockCount}, the corners).`,
    );
    notes.push(
      `How to sew ONE block (3 rows of 3 squares): lay out the 9 squares for one block in front of you in a 3×3 grid — Row 1: background corner, plus, background corner. Row 2: plus, plus (center), plus. Row 3: background corner, plus, background corner. The 5 plus squares should form a clear "+" with the 4 background squares in the corners.`,
    );
    notes.push(
      `Sew Row 1 first: place the background corner and the plus square right sides together (RST), line up the right edge, sew a 1/4" seam. Unfold and press the seam toward the darker fabric. Now place the second background corner on the right side of the plus square RST, line up the right edge, sew, unfold, press. You now have one row of 3 squares. Repeat for Row 2 and Row 3.`,
    );
    notes.push(
      `Now sew the 3 rows together: place Row 1 on top of Row 2 RST, lining up the bottom edge of Row 1 with the top edge of Row 2 — make sure the vertical seams between squares match up exactly (a pin through each seam intersection helps). Sew a 1/4" seam across the whole edge, unfold, and press. Add Row 3 to the bottom of Row 2 the same way. The "+" should now read clearly across the finished block.`,
    );
    notes.push(
      `Layout tip: Plus Blocks look striking sewn edge-to-edge in a straight grid (every "+" facing the same direction) so the plus shapes float on a sea of background. For a more scattered look, try mixing in a few blocks where the plus and background fabrics are swapped.`,
    );

    // Optional sashing between blocks (Plus Block).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Plus Block Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} plus blocks following the 3×3 grid steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "churn-dash") {
    // Churn Dash construction:
    //   3×3 grid. unitFinished = blockSize / 3.
    //   - Center square: 1 per block, cut (unit + 0.5)" square.
    //   - 4 corner HST units: 4 starting squares of dark + 4 of bg per block,
    //     cut (unit + 0.875)" — each square pair yields 2 HSTs, so we need
    //     4 pairs per block to make 4 corner units (which actually yields 8
    //     HSTs — half are spares, OR pair efficiently across blocks). To
    //     match the spec literally we cut 4 dark + 4 bg starting squares per
    //     block (one pair per HST → 2 HSTs, only 1 used → wasteful but the
    //     spec calls for it). We use the standard efficient approach: 2
    //     dark + 2 bg starting squares per block (each pair yields 2 HSTs,
    //     so 2 pairs = 4 HSTs = the 4 corners).
    //   - 4 side bar units per block. Each bar = 1 dark rectangle + 1 bg
    //     rectangle, finished (unit/2) × unit. Cut = (unit/2 + 0.5)" tall ×
    //     (unit + 0.5)" long. Per block: 4 dark + 4 bg bar rectangles.
    const unitFinished = s.blockSize / 3;
    const centerCut = unitFinished + SEAM;
    const hstCut = unitFinished + HST_EXTRA;
    const barCutLong = unitFinished + SEAM;
    const barCutShort = unitFinished / 2 + SEAM;

    const centerFab = (s.assignments["center"] ?? "A") as FabricKey;
    const cornerFab = (s.assignments["corners"] ?? "A") as FabricKey;
    const barFab = (s.assignments["bars"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;

    // Counts per block: center 1, HST starting squares 2 dark + 2 bg
    // (each pair → 2 HSTs, 2 pairs → 4 corners), bar rectangles 4 dark + 4 bg.
    const centerCount = blockCount;
    const hstSquaresEach = 2 * blockCount;
    const barRectEach = 4 * blockCount;

    addSquares(reqs[centerFab], "Center squares", centerCount, centerCut, s.fabricWidth);
    addSquares(reqs[cornerFab], "HST corner starting squares (dark)", hstSquaresEach, hstCut, s.fabricWidth);
    addSquares(reqs[bgFab], "HST corner starting squares (background)", hstSquaresEach, hstCut, s.fabricWidth);
    addRails(reqs[barFab], "Side bar rectangles (dark)", barRectEach, barCutLong, barCutShort, s.fabricWidth);
    addRails(reqs[bgFab], "Side bar rectangles (background)", barRectEach, barCutLong, barCutShort, s.fabricWidth);

    notes.push(
      `Each block uses 1 center square (${centerCut.toFixed(2)}" × ${centerCut.toFixed(2)}"), 4 HST corner units (starting squares ${hstCut.toFixed(2)}" × ${hstCut.toFixed(2)}"), and 4 side bar units — each made of 1 dark + 1 background rectangle cut ${barCutShort.toFixed(2)}" × ${barCutLong.toFixed(2)}".`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${centerCount} center squares of Fabric ${centerFab}; ${hstSquaresEach} starting squares each of Fabric ${cornerFab} (corners) and Fabric ${bgFab} (background) for the HSTs (each pair yields 2 HST units → 4 corners per block); ${barRectEach} dark side-bar rectangles of Fabric ${barFab} and ${barRectEach} background rectangles of Fabric ${bgFab}.`,
    );
    notes.push(
      `To make the HST corners: pair one Fabric ${cornerFab} square with one Fabric ${bgFab} square right sides together (RST). On the back of the top square, draw a diagonal from corner to corner. Sew a 1/4" seam down each side of the line, then cut on the line. Each pair yields 2 HST units. Press toward the darker fabric and trim each unit to ${(unitFinished + SEAM).toFixed(2)}" square.`,
    );
    notes.push(
      `To make the side bars: pair one dark and one background rectangle right sides together along their long edge. Sew a 1/4" seam, unfold, and press toward the darker fabric. Each finished bar should measure ${(unitFinished + SEAM).toFixed(2)}" square (unfinished). Rotate the bars so the dark half always sits on the OUTSIDE of the block — that's what creates the spinning churn-dash handle effect.`,
    );
    notes.push(
      `Block assembly: lay out the 9 units in a 3×3 grid — corner HST, top bar, corner HST across the top row; left bar, center square, right bar in the middle; corner HST, bottom bar, corner HST on the bottom. Make sure all dark pieces face the OUTSIDE of the block. Sew each row, then sew the rows together. Press seams in opposite directions on alternating rows so they nest at intersections.`,
    );

    // Optional sashing between blocks (Churn Dash).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Churn Dash Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} Churn Dash blocks following the 3×3 unit steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the blocks without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "bear-paw") {
    // Traditional Bear Paw construction (4 paw units + center sq + sashing).
    //
    // Base measurements for finished block size B:
    //   sashing finished width  s = B / 8         (rounded to 1/8")
    //   small unit finished     u = (B - s) / 6   (rounded to 1/16")
    //
    // Cut sizes (all add 0.5" total seam allowance to finished):
    //   pad         = (2u) + 0.5"             (one per paw, 4 per block)
    //   bg corner   = u + 0.5"                (one per paw, 4 per block)
    //   sashing rect= (s + 0.5") × (3u + 0.5")(4 per block)
    //   center      = s + 0.5"                (1 per block, claw fabric)
    //   HST start   = u + 0.875"              (16 claw + 16 bg per block)
    const roundTo = (v: number, step: number) => Math.round(v / step) * step;
    const sFinished = roundTo(s.blockSize / 8, 0.125);
    const uFinished = roundTo((s.blockSize - sFinished) / 6, 0.0625);

    const padCut = 2 * uFinished + SEAM;
    const cornerCut = uFinished + SEAM;
    const hstCut = uFinished + HST_EXTRA;
    const sashShort = sFinished + SEAM;
    const sashLong = 3 * uFinished + SEAM;
    const centerCut = sFinished + SEAM;

    const padFab = (s.assignments["pad"] ?? "A") as FabricKey;
    const clawFab = (s.assignments["claws"] ?? "B") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "C") as FabricKey;

    const padCount = 4 * blockCount;
    const hstClawCount = 16 * blockCount;
    const centerCount = blockCount;
    const hstBgCount = 16 * blockCount;
    const cornerCount = 4 * blockCount;
    const sashCount = 4 * blockCount;

    addSquares(reqs[padFab], "Paw pad squares", padCount, padCut, s.fabricWidth);
    addSquares(reqs[clawFab], "Claw HST starting squares", hstClawCount, hstCut, s.fabricWidth);
    addSquares(reqs[clawFab], "Center squares", centerCount, centerCut, s.fabricWidth);
    addSquares(reqs[bgFab], "Background HST starting squares", hstBgCount, hstCut, s.fabricWidth);
    addSquares(reqs[bgFab], "Background corner squares", cornerCount, cornerCut, s.fabricWidth);
    addRails(reqs[bgFab], "Sashing rectangles", sashCount, sashLong, sashShort, s.fabricWidth);

    notes.push(
      `Each block contains 4 paw units, each with 1 large pad, 4 HST claw units, and 1 background corner square, plus 4 sashing rectangles and 1 center square. Small unit u = ${uFinished.toFixed(4)}" finished, sashing s = ${sFinished.toFixed(3)}" finished.`,
    );
    notes.push(
      `Each block uses: 4 pad squares at ${padCut.toFixed(2)}" × ${padCut.toFixed(2)}", 16 claw HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}", 1 center square at ${centerCut.toFixed(2)}" × ${centerCut.toFixed(2)}", 16 background HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}", 4 background corner squares at ${cornerCut.toFixed(2)}" × ${cornerCut.toFixed(2)}", and 4 sashing rectangles at ${sashShort.toFixed(2)}" × ${sashLong.toFixed(2)}".`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${padCount} pad squares (Fabric ${padFab}); ${hstClawCount} claw HST starting squares + ${centerCount} center squares (Fabric ${clawFab}); ${hstBgCount} background HST starting squares + ${cornerCount} background corner squares + ${sashCount} sashing rectangles (Fabric ${bgFab}).`,
    );
    notes.push(
      `HST construction: pair one Fabric ${clawFab} starting square with one Fabric ${bgFab} starting square right sides together (RST). Draw a diagonal corner-to-corner on the back of the lighter square. Sew a scant 1/4" each side of the line, cut on the line, press toward the claw fabric, and trim each unit to ${(uFinished + SEAM).toFixed(4)}" square (finished ${uFinished.toFixed(4)}"). Each pair yields 2 HST units.`,
    );
    // Combined assembly tip — block construction AND quilt-top setting in one
    // tip box so the quilter sees the whole story end-to-end.
    // (Filled in below after sashing variables are computed.)
    // Sashing between blocks + interior cornerstones — only when sashing > 0.
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const cornerFabKey = (s.assignments["cornerstone"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      const cornerCutSize = sashWidth + SEAM;
      const totalCorners = Math.max(0, blocksAcross - 1) * Math.max(0, blocksDown - 1);
      if (totalCorners > 0) {
        addSquares(reqs[cornerFabKey], "Cornerstone squares", totalCorners, cornerCutSize, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the quilt perimeter.`,
      );
      notes.push(
        `Cornerstone squares: cut ${totalCorners} squares at ${cornerCutSize.toFixed(2)}" × ${cornerCutSize.toFixed(2)}" (Fabric ${cornerFabKey}) — placed only at the interior sashing intersections ((${Math.max(0, blocksAcross - 1)}) × (${Math.max(0, blocksDown - 1)}) grid).`,
      );
      notes.push(
        `Bear Paw Assembly Tip — full quilt: STAGE 1 (block). Build all four paw units first. For each paw: sew two HST units side by side, orienting each HST so the background triangle sits in the outer corner and the claw triangle is tucked against the pad side — this makes the claws appear to fan outward — and attach to the side of your pad square that faces the block center. Sew two more HST units in a column the same way — background triangle at the outer end, claw triangle against the pad — then cap the outer end with your background corner square and attach to the other inner-facing side of your pad. Press seams toward the pad. Then arrange the four paws so the pad in each paw sits against the center, with the small sashing rectangles between paws and the center square in the middle; sew into three rows then join the rows. STAGE 2 (quilt top). After finishing all your Bear Paw blocks, lay them out in your ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing between blocks within each row, place cornerstone squares only where horizontal and vertical sashing cross inside the quilt, then sew horizontal sashing rows between the block rows. The outside edge stays block-to-border unless you add a separate border.`,
      );
    } else {
      notes.push(
        `Bear Paw Assembly Tip — full quilt: STAGE 1 (block). Build all four paw units first. For each paw: sew two HST units side by side, orienting each HST so the background triangle sits in the outer corner and the claw triangle is tucked against the pad side, and attach to the side of your pad square that faces the block center. Sew two more HST units in a column the same way, then cap the outer end with your background corner square and attach to the other inner-facing side of your pad. Press seams toward the pad. Arrange the four paws around the center square with the small in-block sashing rectangles between paws; sew into three rows then join the rows. STAGE 2 (quilt top). Lay out all ${blockCount} blocks on the floor in your ${blocksAcross} × ${blocksDown} grid with NO sashing between them. Sew the blocks into rows, then sew the rows together — pressing seams in opposite directions on alternating rows so they nest. The border is added last.`,
      );
    }
  } else if (s.pattern === "irish-chain") {
    // Single Irish Chain: alternating chain blocks (3×3 9-patch with 5
    // contrasting corner+center squares + 4 background squares) and plain
    // background blocks of the same finished size, arranged in a checkerboard.
    // The corner cell (0,0) is a chain block — that gives ceil(N/2) chain
    // blocks and floor(N/2) plain blocks across the whole quilt.
    const total = blockCount;
    const chainBlocks = Math.ceil(total / 2);
    const plainBlocks = Math.floor(total / 2);
    const smallFinished = s.blockSize / 3;
    const smallCut = smallFinished + SEAM;
    const plainCut = s.blockSize + SEAM;

    const bgFab = (s.assignments["background"] ?? "A") as FabricKey;
    const chainFab = (s.assignments["chain"] ?? "B") as FabricKey;

    const chainSmallCount = 5 * chainBlocks;
    const bgSmallCount = 4 * chainBlocks;

    addSquares(
      reqs[chainFab],
      "Chain (contrasting) small squares",
      chainSmallCount,
      smallCut,
      s.fabricWidth,
    );
    if (bgSmallCount > 0) {
      addSquares(
        reqs[bgFab],
        "Background small squares (inside chain blocks)",
        bgSmallCount,
        smallCut,
        s.fabricWidth,
      );
    }
    if (plainBlocks > 0) {
      addSquares(
        reqs[bgFab],
        "Plain background blocks",
        plainBlocks,
        plainCut,
        s.fabricWidth,
      );
    }

    notes.push(
      `Each ${s.blockSize}" finished block is one of two types: a CHAIN block (3×3 grid with 5 contrasting corner+center squares + 4 background squares between them) or a PLAIN background block (one solid square). They alternate in a checkerboard so the contrasting squares connect into long diagonal chains across the quilt.`,
    );
    notes.push(
      `${blocksAcross} × ${blocksDown} = ${total} blocks total: ${chainBlocks} chain blocks (corner cell is a chain block) and ${plainBlocks} plain background blocks.`,
    );
    notes.push(
      `Cut sizes: small squares (chain blocks) at ${smallCut.toFixed(2)}" × ${smallCut.toFixed(2)}" (finished ${smallFinished.toFixed(2)}" + 1/2" seam allowance); plain blocks at ${plainCut.toFixed(2)}" × ${plainCut.toFixed(2)}" (finished ${s.blockSize}" + 1/2" seam allowance).`,
    );
    notes.push(
      `Across all chain blocks: ${chainSmallCount} small squares of Fabric ${chainFab} (5 × ${chainBlocks}, the corner+center "chain" squares) and ${bgSmallCount} small squares of Fabric ${bgFab} (4 × ${chainBlocks}, the alternating squares). Plus ${plainBlocks} plain blocks of Fabric ${bgFab} at ${plainCut.toFixed(2)}".`,
    );
    notes.push(
      `Strip-pieced shortcut (faster than cutting individual squares): instead of cutting all the small squares one at a time, cut full-width strips ${smallCut.toFixed(2)}" tall and sew them into "strip sets" of three strips each. Type 1 strip set = chain-background-chain (CBC). Type 2 strip set = background-chain-background (BCB). Sub-cut each finished strip set every ${smallCut.toFixed(2)}" across — each cut yields one pre-sewn 3-square row. Build each chain block by sewing together 2 CBC rows + 1 BCB row (CBC / BCB / CBC).`,
    );
    notes.push(
      `How to sew ONE chain block: stack 2 CBC rows + 1 BCB row in the order CBC – BCB – CBC. Place the top CBC row on top of the BCB row right sides together (RST), lining up the bottom edge of the first row with the top edge of the second — the vertical seams between squares should match exactly (a pin through each seam intersection helps). Sew a 1/4" seam across, unfold, and press the seam toward the BCB row. Add the third CBC row to the bottom the same way. The 5 contrasting squares should now sit in the 4 corners + center, with the 4 background squares in the alternating positions.`,
    );
    notes.push(
      `Quilt assembly: lay all the blocks out in your ${blocksAcross} × ${blocksDown} grid, alternating chain block, plain block, chain block, plain block, … so the corner is a chain block. Sew each row of blocks together with 1/4" seams (press seam allowances toward the plain blocks so they don't show through), then sew the rows together. The contrasting corner squares of adjacent chain blocks will meet at the row seams and form long diagonal chains running across the entire quilt — that's the Irish Chain.`,
    );
  } else if (s.pattern === "sawtooth-star") {
    // Sawtooth Star: 4×4 grid of equal units (u = blockSize / 4).
    //   - 1 large star center square: 2u × 2u finished, cut (2u + 0.5)".
    //   - 4 background corner squares: u × u finished, cut (u + 0.5)".
    //   - 8 HST units forming the star points. Standard HST math: cut starting
    //     squares at (u + 0.875)", pair one star + one bg → 2 HSTs per pair.
    //     Per spec: 8 star + 8 bg starting squares per block (pooled across
    //     blocks for cutting efficiency).
    const u = s.blockSize / 4;
    const centerCut = 2 * u + SEAM;
    const cornerCut = u + SEAM;
    const hstCut = u + HST_EXTRA;

    const starFab = (s.assignments["star"] ?? "A") as FabricKey;
    // Center square can be the same as the star points (traditional 2-color
    // look) or a different fabric for a contrasting center. Falls back to the
    // star fabric so older sessions without a `center` assignment stay
    // identical to the previous output.
    const centerFab = (s.assignments["center"] ?? starFab) as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;

    const centerCount = blockCount;
    const cornerCount = 4 * blockCount;
    const hstStarCount = 8 * blockCount;
    const hstBgCount = 8 * blockCount;

    addSquares(reqs[centerFab], "Star center squares", centerCount, centerCut, s.fabricWidth);
    addSquares(reqs[starFab], "HST starting squares (star points)", hstStarCount, hstCut, s.fabricWidth);
    addSquares(reqs[bgFab], "Background corner squares", cornerCount, cornerCut, s.fabricWidth);
    addSquares(reqs[bgFab], "HST starting squares (background)", hstBgCount, hstCut, s.fabricWidth);

    notes.push(
      `Each block uses a 4×4 grid where each small unit = ${u.toFixed(2)}" finished.`,
    );
    const centerNote = centerFab === starFab
      ? `Each block uses: 1 center square at ${centerCut.toFixed(2)}" × ${centerCut.toFixed(2)}" (star fabric), 8 HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (star fabric), 4 corner squares at ${cornerCut.toFixed(2)}" × ${cornerCut.toFixed(2)}" (background), and 8 HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (background).`
      : `Each block uses: 1 center square at ${centerCut.toFixed(2)}" × ${centerCut.toFixed(2)}" (Fabric ${centerFab} — center), 8 HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (Fabric ${starFab} — star points), 4 corner squares at ${cornerCut.toFixed(2)}" × ${cornerCut.toFixed(2)}" (Fabric ${bgFab} — background), and 8 HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (Fabric ${bgFab} — background).`;
    notes.push(centerNote);
    const totalsNote = centerFab === starFab
      ? `Across all ${blockCount} blocks: ${centerCount} center squares and ${hstStarCount} HST starting squares of Fabric ${starFab} (star); ${cornerCount} corner squares and ${hstBgCount} HST starting squares of Fabric ${bgFab} (background).`
      : `Across all ${blockCount} blocks: ${centerCount} center squares of Fabric ${centerFab} (center); ${hstStarCount} HST starting squares of Fabric ${starFab} (star points); ${cornerCount} corner squares and ${hstBgCount} HST starting squares of Fabric ${bgFab} (background).`;
    notes.push(totalsNote);
    notes.push(
      `HST construction: pair one star starting square with one background starting square right sides together. Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units. Press open and trim each unit to ${(u + SEAM).toFixed(3)}" square (finished ${u.toFixed(2)}"). Each block needs 8 HST units — 4 pairs yield exactly 8.`,
    );
    notes.push(
      `Sawtooth Star Assembly Tip: Make all your HST units first. Pair each star starting square with a background starting square, draw the diagonal on the lighter fabric, sew 1/4" on each side of the line, cut apart, press open, and trim to ${(u + SEAM).toFixed(3)}" square. Each pair yields 2 HSTs so you need 4 pairs per block yielding exactly 8 units. Then lay out your 4×4 grid — large center square, 8 HST units with star triangles all pointing inward, 4 background corner squares. Sew into four rows of four units then join the rows. Press seams in alternating directions so they nest at the intersections for a perfectly flat block.`,
    );

    // Optional sashing between blocks (Sawtooth Star).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Sawtooth Star Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} Sawtooth Star blocks following the 4×4 grid steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the stars without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "friendship-star") {
    // Friendship Star: 3×3 grid of equal units (u = blockSize / 3).
    //   - 1 center square per block: cut (u + 0.5)" (center fabric)
    //   - 4 background corner squares per block: cut (u + 0.5)"
    //   - 4 HST units per block (the 4 star points). Standard HST math:
    //     cut starting squares at (u + 0.875)" — 4 star + 4 bg per block,
    //     pair RST and yield 8 HSTs (exactly enough; we only need 4 per
    //     block but each pair yields 2 HSTs so 4 pairs per block = 8 HSTs;
    //     we use the "extra" by trimming both halves so the math stays
    //     simple and the per-piece counts match the spec: 4 star + 4 bg
    //     starting squares per block).
    const u = s.blockSize / 3;
    const centerCut = u + SEAM;
    const cornerCut = u + SEAM;
    const hstCut = u + HST_EXTRA;

    const centerFab = (s.assignments["center"] ?? "A") as FabricKey;
    const pointsFab = (s.assignments["points"] ?? "B") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "C") as FabricKey;

    const centerCount = blockCount;
    const cornerCount = 4 * blockCount;
    const hstPointsCount = 4 * blockCount;
    const hstBgCount = 4 * blockCount;

    addSquares(reqs[centerFab], "Center squares", centerCount, centerCut, s.fabricWidth);
    addSquares(reqs[pointsFab], "HST starting squares (star points)", hstPointsCount, hstCut, s.fabricWidth);
    addSquares(reqs[bgFab], "Background corner squares", cornerCount, cornerCut, s.fabricWidth);
    addSquares(reqs[bgFab], "HST starting squares (background)", hstBgCount, hstCut, s.fabricWidth);

    notes.push(
      `Each block uses a 3×3 grid where each small unit = ${u.toFixed(2)}" finished.`,
    );
    notes.push(
      `Each block uses: 1 center square at ${centerCut.toFixed(2)}" × ${centerCut.toFixed(2)}", 4 star point HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}", 4 corner squares at ${cornerCut.toFixed(2)}" × ${cornerCut.toFixed(2)}", and 4 background HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}".`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${centerCount} center squares of Fabric ${centerFab}, ${hstPointsCount} HST starting squares of Fabric ${pointsFab} (star points), ${cornerCount} corner squares and ${hstBgCount} HST starting squares of Fabric ${bgFab} (background).`,
    );
    notes.push(
      `HST construction: pair one star points starting square with one background starting square right sides together. Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units. Press open and trim each unit to ${(u + SEAM).toFixed(3)}" square (finished ${u.toFixed(2)}"). Each block needs 4 HST units — 2 pairs yield exactly 4.`,
    );
    notes.push(
      `Friendship Star Assembly Tip: Make your 4 HST units first by pairing star points and background squares — draw the diagonal on the lighter fabric, sew 1/4" on each side of the line, cut apart, press open, and trim to ${(u + SEAM).toFixed(3)}" square. Lay out your 3×3 grid before sewing — corner squares, HST units with star points facing inward toward the center, and your center square in the middle. Sew into three rows then join. Try a bold accent fabric for just the center square to make your star pop even more.`,
    );

    // Optional sashing between blocks (Friendship Star).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "D") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
      notes.push(
        `Friendship Star Assembly Tip — full quilt: STAGE 1 (block). Sew all ${blockCount} Friendship Star blocks following the 3×3 grid steps above. STAGE 2 (quilt top). Lay your blocks out in the ${blocksAcross} × ${blocksDown} grid. Sew vertical sashing strips between blocks within each row, then sew horizontal sashing rows between the finished block rows. This separates the stars without adding a sashing frame around the outside edge; add the outer border last if you're using one.`,
      );
    }
  } else if (s.pattern === "snowball-block") {
    // Snowball Block: each block is one large square with 4 small corner
    // accent squares stitched-and-flipped onto the corners. Two fabrics
    // alternate roles every other block in a checkerboard to create the
    // diamond pattern at the seams.
    const corner = Math.max(0, s.cornerAccentSize || 0);
    const mainCut = s.blockSize + SEAM;
    const cornerCut = corner + SEAM;
    const fabA = (s.assignments["mainA"] ?? "A") as FabricKey;
    const fabB = (s.assignments["mainB"] ?? "B") as FabricKey;

    // Walk the real grid so odd totals split exactly (not a flat 50/50).
    let evenBlocks = 0;
    let oddBlocks = 0;
    for (let r = 0; r < blocksDown; r++) {
      for (let c = 0; c < blocksAcross; c++) {
        if ((r + c) % 2 === 0) evenBlocks++;
        else oddBlocks++;
      }
    }

    // Fabric A:  evenBlocks main squares + oddBlocks × 4 corner squares.
    // Fabric B:  oddBlocks  main squares + evenBlocks × 4 corner squares.
    const aMain = evenBlocks;
    const aCorner = oddBlocks * 4;
    const bMain = oddBlocks;
    const bCorner = evenBlocks * 4;

    if (aMain > 0) addSquares(reqs[fabA], "Fabric A main squares", aMain, mainCut, s.fabricWidth);
    if (corner > 0 && aCorner > 0) addSquares(reqs[fabA], "Fabric A corner accent squares", aCorner, cornerCut, s.fabricWidth);
    if (bMain > 0) addSquares(reqs[fabB], "Fabric B main squares", bMain, mainCut, s.fabricWidth);
    if (corner > 0 && bCorner > 0) addSquares(reqs[fabB], "Fabric B corner accent squares", bCorner, cornerCut, s.fabricWidth);

    notes.push(
      `Cut sizes include 1/4" seam allowance.`,
    );
    notes.push(
      `Each block uses 1 main square at ${mainCut.toFixed(2)}" × ${mainCut.toFixed(2)}" and 4 corner accent squares at ${cornerCut.toFixed(2)}" × ${cornerCut.toFixed(2)}" — fabrics swap which role they play every other block.`,
    );
    notes.push(
      `Corner construction: place one corner accent square right sides together on a corner of the main square. Sew diagonally corner to corner. Trim 1/4" beyond the stitch line. Press open to reveal the clipped corner. Repeat on all four corners.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${aMain} main squares and ${aCorner} corner squares of Fabric ${fabA}; ${bMain} main squares and ${bCorner} corner squares of Fabric ${fabB}.`,
    );

    // Optional sashing between blocks (Snowball Block).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }

    notes.push(
      `Snowball Block Assembly Tip: Sew all four corner accent squares onto each main square before joining blocks together — work in batches, since you'll have two block types (A-main and B-main) alternating. Lay out your full quilt grid before sewing rows so you can confirm the alternating pattern looks right — it should create a checkerboard of diamonds at the seams between blocks.`,
    );
  } else if (s.pattern === "four-patch") {
    // Four Patch: the simplest block in quilting — 2×2 grid of equal squares.
    // Each position can take its own fabric. We pool the per-position
    // assignments by fabric letter so two positions sharing a fabric share
    // one labeled pile of squares.
    const u = s.blockSize / 2;
    const cut = u + SEAM;
    const POSITIONS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;
    const POSITION_LABELS: Record<typeof POSITIONS[number], string> = {
      topLeft: "top-left",
      topRight: "top-right",
      bottomLeft: "bottom-left",
      bottomRight: "bottom-right",
    };
    const FALLBACK: Record<typeof POSITIONS[number], FabricKey> = {
      topLeft: "A",
      topRight: "B",
      bottomLeft: "D",
      bottomRight: "C",
    };
    const fabricPositions: Partial<Record<FabricKey, string[]>> = {};
    for (const pos of POSITIONS) {
      const fab = (s.assignments[pos] ?? FALLBACK[pos]) as FabricKey;
      (fabricPositions[fab] ??= []).push(POSITION_LABELS[pos]);
    }
    for (const fab of ALL_FABRIC_KEYS) {
      const posList = fabricPositions[fab];
      if (!posList || posList.length === 0) continue;
      const count = posList.length * blockCount;
      const labelJoin = posList.length === 1
        ? `${posList[0]} squares`
        : `${posList.join(" & ")} squares`;
      addSquares(reqs[fab], labelJoin, count, cut, s.fabricWidth);
    }

    notes.push(
      `Each block uses 4 equal squares at ${cut.toFixed(2)}" × ${cut.toFixed(2)}" — one per position.`,
    );
    const breakdownParts: string[] = [];
    for (const fab of ALL_FABRIC_KEYS) {
      const posList = fabricPositions[fab];
      if (!posList || posList.length === 0) continue;
      const count = posList.length * blockCount;
      breakdownParts.push(`${count} squares of Fabric ${fab} for ${posList.join(" & ")}`);
    }
    notes.push(
      `Across all ${blockCount} blocks: ${breakdownParts.join(", ")}.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }

    notes.push(
      `Four Patch Assembly Tip: This is one of the simplest blocks in all of quilting — perfect for a very first project. Sew your top-left and top-right squares together to make the top row. Sew your bottom-left and bottom-right squares together to make the bottom row. Press the seam on each row in opposite directions, then join the two rows — the seams will nest together perfectly at the center for a flat block.`,
    );
  } else if (s.pattern === "streak-of-lightning") {
    // Streak of Lightning: 2×2 grid of HSTs, all facing the SAME direction.
    // One pair of starting squares (1 stripe + 1 background) sewn on the
    // diagonal yields 2 HST units that already share the same direction.
    // Each block needs 4 same-direction HSTs → 2 pairs → 2 stripe starting
    // squares + 2 background starting squares per block.
    const u = s.blockSize / 2;
    const cut = u + HST_EXTRA;
    const stripeFab = (s.assignments["stripe"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "B") as FabricKey;
    // Pool by fabric letter so two roles sharing a fabric share one labeled pile.
    const counts: Partial<Record<FabricKey, { stripe: number; bg: number }>> = {};
    const perBlockStripe = 2;
    const perBlockBg = 2;
    counts[stripeFab] = { stripe: (counts[stripeFab]?.stripe ?? 0) + blockCount * perBlockStripe, bg: counts[stripeFab]?.bg ?? 0 };
    counts[bgFab] = { stripe: counts[bgFab]?.stripe ?? 0, bg: (counts[bgFab]?.bg ?? 0) + blockCount * perBlockBg };
    for (const fab of ALL_FABRIC_KEYS) {
      const c = counts[fab];
      if (!c) continue;
      const total = c.stripe + c.bg;
      if (total <= 0) continue;
      const roles: string[] = [];
      if (c.stripe > 0) roles.push("stripe");
      if (c.bg > 0) roles.push("background");
      const label = `${roles.join(" & ")} starting squares`;
      addSquares(reqs[fab], label.charAt(0).toUpperCase() + label.slice(1), total, cut, s.fabricWidth);
    }

    notes.push(
      `Each block = 4 Half Square Triangle units, all facing the same direction. Across all ${blockCount} blocks: ${blockCount * 4} HST units total.`,
    );
    notes.push(
      `Each block uses 2 stripe starting squares and 2 background starting squares, each at ${cut.toFixed(2)}" × ${cut.toFixed(2)}" (finished ${u.toFixed(2)}" + 7/8" extra for the diagonal seam).`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${blockCount * perBlockStripe} starting squares of Fabric ${stripeFab} (stripe) and ${blockCount * perBlockBg} starting squares of Fabric ${bgFab} (background)${stripeFab === bgFab ? ` — pooled into ${blockCount * (perBlockStripe + perBlockBg)} squares of Fabric ${stripeFab} total` : ""}.`,
    );
    notes.push(
      `HST construction: pair one Fabric ${stripeFab} starting square with one Fabric ${bgFab} starting square right sides together (RST). Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line — this yields 2 HST units, and because both came from the same diagonal cut they already face the same direction. Press open and trim each unit to ${(u + SEAM).toFixed(2)}" square.`,
    );
    notes.push(
      `Important: when laying out your block, make sure all four HST units face the SAME direction — orient them so the stripe fabric runs consistently from one corner to the opposite corner across the whole block.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "D") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge. Heads up: sashing will interrupt the continuous zigzag effect at every seam — skip sashing for an uninterrupted lightning streak.`,
      );
    }

    notes.push(
      `Streak of Lightning Assembly Tip: Keep your HST units oriented consistently as you sew — every diagonal in every block should run the same direction. Before joining blocks into rows, lay out your full quilt top on the floor or a design wall and double check the zigzag lines connect cleanly from block to block. For the most striking continuous effect, skip sashing between blocks so the diagonals flow uninterrupted across the whole quilt.`,
    );
  } else if (s.pattern === "bow-tie") {
    // Bow Tie: 2×2 grid of plain main squares + 1 small on-point center
    // "knot" square per block. Fabric A fills the TL+BR diagonal (2 mains),
    // Fabric B fills the TR+BL diagonal (2 mains), Fabric C (knot) is one
    // small square per block appliquéd on-point over the center seam
    // intersection. Pool by fabric letter so sharing a fabric collapses
    // into a single labeled pile of squares.
    const u = s.blockSize / 2;
    const mainCut = u + SEAM;
    // Knot finished diagonal = blockSize / 2 so the on-point diamond's four
    // corners land at the midpoint of each inner patch edge — exactly at the
    // center seam intersection (this is the geometry the reference shows).
    // Cut size = diagonal / √2 (the square's side) + seam allowance, then
    // rounded UP to the nearest 1/8" so rotary-cutting marks are usable.
    const knotDiag = s.blockSize / 2;
    const knotSide = knotDiag / Math.SQRT2;
    const knotCut = Math.ceil((knotSide + SEAM) * 8) / 8;
    const fabA = (s.assignments["mainA"] ?? "A") as FabricKey;
    const fabB = (s.assignments["mainB"] ?? "B") as FabricKey;
    const fabK = (s.assignments["knot"] ?? "D") as FabricKey;

    // Pool main squares by fabric letter (handles A=B or A=knot sharing).
    const mainCounts: Partial<Record<FabricKey, { roles: string[]; count: number }>> = {};
    const addMain = (fab: FabricKey, role: string, perBlock: number) => {
      const entry = (mainCounts[fab] ??= { roles: [], count: 0 });
      entry.roles.push(role);
      entry.count += perBlock * blockCount;
    };
    addMain(fabA, "TL+BR diagonal", 2);
    addMain(fabB, "TR+BL diagonal", 2);
    for (const fab of ALL_FABRIC_KEYS) {
      const entry = mainCounts[fab];
      if (!entry || entry.count <= 0) continue;
      const label = `Main squares (${entry.roles.join(" & ")})`;
      addSquares(reqs[fab], label, entry.count, mainCut, s.fabricWidth);
    }
    // Knot squares — separate bucket because of the different cut size,
    // even if the user picks the same fabric letter as a main.
    addSquares(reqs[fabK], "Knot squares (center, sewn on-point)", blockCount, knotCut, s.fabricWidth);

    notes.push(
      `Each block uses 4 main squares at ${mainCut.toFixed(2)}" × ${mainCut.toFixed(2)}" — two of Fabric ${fabA} on the top-left + bottom-right diagonal, two of Fabric ${fabB} on the top-right + bottom-left diagonal — plus 1 knot square at ${knotCut.toFixed(2)}" × ${knotCut.toFixed(2)}" (Fabric ${fabK}) sewn on-point over the center seam intersection.`,
    );
    const breakdown: string[] = [];
    for (const fab of ALL_FABRIC_KEYS) {
      const entry = mainCounts[fab];
      if (!entry || entry.count <= 0) continue;
      breakdown.push(`${entry.count} main squares of Fabric ${fab}`);
    }
    breakdown.push(`${blockCount} knot squares of Fabric ${fabK}`);
    notes.push(
      `Across all ${blockCount} blocks: ${breakdown.join(", ")}.`,
    );
    notes.push(
      `Cutting the knot: cut each Fabric ${fabK} square at ${knotCut.toFixed(2)}" × ${knotCut.toFixed(2)}". When you place it on the block you'll rotate it 45° so it sits as an on-point diamond — its finished diagonal will be about ${knotDiag.toFixed(2)}" across, with the four corners touching the center seam intersection.`,
    );
    notes.push(
      `Assembly: STAGE 1 — sew each block as a 4-patch. Join the TL Fabric ${fabA} square to the TR Fabric ${fabB} square to make the top row; join the BL Fabric ${fabB} square to the BR Fabric ${fabA} square to make the bottom row; press seams in opposite directions and join the two rows. STAGE 2 — center one Fabric ${fabK} knot square on-point over the seam intersection (one corner pointing up, one down, one left, one right). Either turn the raw edges under 1/4" and hand- or machine-appliqué it down, or use fusible web for raw-edge appliqué. The four main squares stay full and uncut — the knot is purely on top.`,
    );

    // Optional sashing between blocks (Bow Tie).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "shoofly") {
    // Shoofly: classic 2-fabric 3×3 grid block.
    //   - Fabric A (background): 4 plain side squares per block + background
    //     halves of the 4 corner HST units.
    //   - Fabric B (accent): 1 center square per block + accent halves of
    //     the 4 corner HST units.
    // HST construction (2 pairs per block → 4 HSTs, no waste): pair one
    // bg-starting square + one accent-starting square RST, draw diagonal,
    // sew 1/4" both sides of the line, cut apart → 2 HSTs. Each block needs
    // 4 HSTs → 2 pairs → 2 bg-starting + 2 accent-starting squares per block.
    //
    // `alternateBlocks` (Step 2 toggle, gated by supportsAlternate on the
    // pattern) swaps which fabric plays which role on every other block —
    // even cells keep the primary orientation, odd cells flip. When an odd
    // block count means one side has one extra, that extra block uses the
    // primary orientation (matches how Snowball resolves odd totals).
    const u = s.blockSize / 3;
    const plainCut = u + SEAM;
    const hstCut = u + HST_EXTRA;
    const bgFab = (s.assignments["bg"] ?? "A") as FabricKey;
    const accentFab = (s.assignments["accent"] ?? "B") as FabricKey;

    // Walk the real grid so odd totals split exactly.
    let evenBlocks = 0;
    let oddBlocks = 0;
    for (let r = 0; r < blocksDown; r++) {
      for (let c = 0; c < blocksAcross; c++) {
        if ((r + c) % 2 === 0) evenBlocks++;
        else oddBlocks++;
      }
    }
    const alt = !!s.alternateBlocks;
    // Primary-orientation blocks use bgFab as background, accentFab as accent.
    // Flipped blocks (only when alt is on) use accentFab as background, bgFab as accent.
    const primaryBlocks = alt ? evenBlocks : blockCount;
    const flippedBlocks = alt ? oddBlocks : 0;

    // Per-block piece counts (per role):
    //   background role: 4 plain side squares + 2 HST starting squares
    //   accent role:     1 center square      + 2 HST starting squares
    const bgPlainPrimary = 4 * primaryBlocks;
    const bgHstPrimary = 2 * primaryBlocks;
    const acCenterPrimary = 1 * primaryBlocks;
    const acHstPrimary = 2 * primaryBlocks;

    const bgPlainFlipped = 4 * flippedBlocks; // uses accentFab
    const bgHstFlipped = 2 * flippedBlocks;   // uses accentFab
    const acCenterFlipped = 1 * flippedBlocks; // uses bgFab
    const acHstFlipped = 2 * flippedBlocks;   // uses bgFab

    // Pool by fabric letter so if the user picks A === B (unlikely but valid),
    // one labeled pile appears instead of two of the same fabric.
    // Fabric bgFab totals (as background on primary + as accent on flipped):
    const bgFab_plain = bgPlainPrimary;
    const bgFab_hst = bgHstPrimary + acHstFlipped;
    const bgFab_center = acCenterFlipped;
    // Fabric accentFab totals (as accent on primary + as background on flipped):
    const acFab_center = acCenterPrimary;
    const acFab_hst = acHstPrimary + bgHstFlipped;
    const acFab_plain = bgPlainFlipped;

    if (bgFab === accentFab) {
      // Same fabric plays every role — pool everything into one bucket.
      const plain = bgFab_plain + acFab_plain;
      const center = bgFab_center + acFab_center;
      const hst = bgFab_hst + acFab_hst;
      if (plain > 0) addSquares(reqs[bgFab], "Side squares", plain, plainCut, s.fabricWidth);
      if (center > 0) addSquares(reqs[bgFab], "Center squares", center, plainCut, s.fabricWidth);
      if (hst > 0) addSquares(reqs[bgFab], "HST starting squares (corners)", hst, hstCut, s.fabricWidth);
    } else {
      if (bgFab_plain > 0) addSquares(reqs[bgFab], "Side squares (background role)", bgFab_plain, plainCut, s.fabricWidth);
      if (bgFab_center > 0) addSquares(reqs[bgFab], "Center squares (accent role on flipped blocks)", bgFab_center, plainCut, s.fabricWidth);
      if (bgFab_hst > 0) addSquares(reqs[bgFab], "HST starting squares (corners)", bgFab_hst, hstCut, s.fabricWidth);
      if (acFab_center > 0) addSquares(reqs[accentFab], "Center squares (accent role)", acFab_center, plainCut, s.fabricWidth);
      if (acFab_plain > 0) addSquares(reqs[accentFab], "Side squares (background role on flipped blocks)", acFab_plain, plainCut, s.fabricWidth);
      if (acFab_hst > 0) addSquares(reqs[accentFab], "HST starting squares (corners)", acFab_hst, hstCut, s.fabricWidth);
    }

    notes.push(
      `Each block is a 3×3 grid where each small unit = ${u.toFixed(2)}" finished. Cut sizes: plain squares at ${plainCut.toFixed(2)}" × ${plainCut.toFixed(2)}", HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (finished + 7/8" for the diagonal seam).`,
    );
    if (alt) {
      notes.push(
        `Alternate blocks is ON: ${evenBlocks} blocks use Fabric ${bgFab} as background + Fabric ${accentFab} as accent, and ${oddBlocks} blocks swap those roles — creating a checkerboard across the finished quilt.`,
      );
    } else {
      notes.push(
        `Across all ${blockCount} blocks: Fabric ${bgFab} = ${4 * blockCount} side squares + ${2 * blockCount} HST starting squares; Fabric ${accentFab} = ${blockCount} center squares + ${2 * blockCount} HST starting squares.`,
      );
    }
    notes.push(
      `HST construction: pair one Fabric ${bgFab} HST starting square with one Fabric ${accentFab} HST starting square right sides together (RST). Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units. Press open and trim each unit to ${(u + SEAM).toFixed(3)}" square (finished ${u.toFixed(2)}"). Each block needs 4 corner HSTs — 2 pairs yield exactly 4.`,
    );
    notes.push(
      `Shoofly Assembly Tip: Orient each corner HST so the accent triangle points INWARD toward the center square — when the block is finished you should see the 4 accent triangles + the center accent square form a loose diamond/cross shape in the middle. Lay out the 3×3 grid before sewing (accent corners inward, background sides, center accent), then sew into 3 rows and join the rows.${alt ? " Because Alternate blocks is on, sew both orientations in matching batches, then arrange them in a checkerboard across the quilt." : ""}`,
    );

    // Optional sashing between blocks (Shoofly).
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "jacobs-ladder") {
    // Jacob's Ladder: classic 3×3 nine-patch of nine sub-blocks —
    //   5 four-patches at (0,0),(0,2),(1,1),(2,0),(2,2) + 4 HSTs at
    //   (0,1),(1,0),(1,2),(2,1). Sub-block = 2u × 2u where u = blockSize/6.
    //
    // Per block:
    //   Fabric A (dark FP squares):        10 small squares @ (u + 0.5)"
    //   Fabric B (light FP + HST bg):      10 small squares @ (u + 0.5)"
    //                                       + 2 HST starting squares @ (2u + 0.875)"
    //   Fabric C (ladder HST accent):      2 HST starting squares @ (2u + 0.875)"
    // 2 pairs (C-start + B-start) yield 4 HST units — exactly the 4 needed.
    //
    // `alternateBlocks` only rotates blocks 90° in the layout preview; piece
    // counts and cut sizes are identical whether it's on or off.
    const u = s.blockSize / 6;
    const smallCut = u + SEAM;
    const hstCut = 2 * u + HST_EXTRA;
    const darkFab = (s.assignments["dark"] ?? "A") as FabricKey;
    const lightFab = (s.assignments["light"] ?? "B") as FabricKey;
    const ladderFab = (s.assignments["ladder"] ?? "D") as FabricKey;

    const darkSmallCount = 10 * blockCount;
    const lightSmallCount = 10 * blockCount;
    const lightHstCount = 2 * blockCount;
    const ladderHstCount = 2 * blockCount;

    addSquares(reqs[darkFab], "Four-patch dark squares", darkSmallCount, smallCut, s.fabricWidth);
    addSquares(reqs[lightFab], "Four-patch light squares", lightSmallCount, smallCut, s.fabricWidth);
    addSquares(reqs[lightFab], "HST starting squares (background)", lightHstCount, hstCut, s.fabricWidth);
    addSquares(reqs[ladderFab], "HST starting squares (ladder accent)", ladderHstCount, hstCut, s.fabricWidth);

    notes.push(
      `Each block is a 3×3 arrangement of nine 2u × 2u sub-blocks (u = ${u.toFixed(3)}" finished, 6u = ${s.blockSize}" finished block): FIVE four-patches at the four corners + the center, and FOUR half-square-triangle units on the edges. Each four-patch = 2 dark squares + 2 light squares alternating. Each HST = one large ladder-accent triangle + one background triangle sharing a diagonal.`,
    );
    notes.push(
      `Each block uses: 10 dark small squares (Fabric ${darkFab}) at ${smallCut.toFixed(2)}" × ${smallCut.toFixed(2)}", 10 light small squares (Fabric ${lightFab}) at ${smallCut.toFixed(2)}" × ${smallCut.toFixed(2)}", 2 background HST starting squares (Fabric ${lightFab}) at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}", and 2 ladder-accent HST starting squares (Fabric ${ladderFab}) at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}".`,
    );
    notes.push(
      `Across all ${blockCount} blocks: Fabric ${darkFab} = ${darkSmallCount} small squares. Fabric ${lightFab} = ${lightSmallCount} small squares + ${lightHstCount} HST starting squares. Fabric ${ladderFab} = ${ladderHstCount} HST starting squares.`,
    );
    notes.push(
      `HST construction: pair one Fabric ${lightFab} HST starting square with one Fabric ${ladderFab} HST starting square right sides together (RST). Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units. Press open and trim each unit to ${(2 * u + SEAM).toFixed(3)}" square (finished ${(2 * u).toFixed(3)}"). Each block needs 4 HSTs — 2 pairs yield exactly 4.`,
    );
    notes.push(
      `Four-patch construction: for each of the 5 four-patches in every block, sew 2 dark squares and 2 light squares into a 2×2 grid, alternating dark/light on the diagonal so dark ends up in opposite corners of the four-patch. Press seams toward the darker fabric so they nest.`,
    );
    notes.push(
      `Jacob's Ladder Assembly Tip: build all ${5 * blockCount} four-patches and all ${4 * blockCount} HST units first. Then lay each block out in a 3×3 arrangement — four-patches at the four corners + the center, HSTs on the four edges. Rotate each HST so its ladder-accent triangle sits on the block's corner-to-corner diagonal side (all 4 HSTs oriented the same way). Sew each block into 3 rows of 3 sub-blocks, then join the rows. Once every block is finished, arrange them in your ${blocksAcross} × ${blocksDown} grid on the floor — for the classic diamond secondary pattern, rotate every other block 90° in a checkerboard so the ladder diagonals from neighboring blocks meet up and form the on-point diamonds. Sew the blocks into rows, then join the rows.`,
    );

    // Optional sashing between blocks (Jacob's Ladder). Note that the classic
    // effect only reads with 0" sashing so the ladders connect — we still
    // support user-chosen sashing but the tip above already recommends 0".
    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "C") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Note: sashing separates the blocks and will interrupt the diagonal ladder effect — the classic look uses 0" sashing.`,
      );
    }
  } else if (s.pattern === "autumn-tints") {
    // Autumn Tints: 4×4 grid of 16 equal plain squares per block.
    //   Per block:
    //     Fabric A (dominant): 8 squares — two solid 2×2 groups (TL + BR corners)
    //     Fabric B (background): 4 squares
    //     Fabric C (accent 1): 2 squares
    //     Fabric D (accent 2): 2 squares
    // Every square is (blockSize/4) finished, cut at (blockSize/4 + 0.5)".
    // Piece pooling by fabric letter — matches four-patch behavior — so
    // two roles sharing a fabric share one labeled pile.
    const u = s.blockSize / 4;
    const cut = u + SEAM;
    const domFab = (s.assignments["dominant"] ?? "A") as FabricKey;
    const bgFab = (s.assignments["background"] ?? "B") as FabricKey;
    const acc1Fab = (s.assignments["accent1"] ?? "C") as FabricKey;
    const acc2Fab = (s.assignments["accent2"] ?? "D") as FabricKey;
    const perRole: Array<[FabricKey, string, number]> = [
      [domFab, "dominant", 8],
      [bgFab, "background", 4],
      [acc1Fab, "first accent", 2],
      [acc2Fab, "second accent", 2],
    ];
    const pooled: Partial<Record<FabricKey, { roles: string[]; count: number }>> = {};
    for (const [fab, role, per] of perRole) {
      const entry = (pooled[fab] ??= { roles: [], count: 0 });
      entry.roles.push(role);
      entry.count += per * blockCount;
    }
    for (const fab of ALL_FABRIC_KEYS) {
      const entry = pooled[fab];
      if (!entry || entry.count <= 0) continue;
      const label = `${entry.roles.join(" & ")} squares`;
      addSquares(reqs[fab], label.charAt(0).toUpperCase() + label.slice(1), entry.count, cut, s.fabricWidth);
    }

    notes.push(
      `Each block is a 4×4 grid of 16 equal squares — every square finishes at ${u.toFixed(2)}" and is cut at ${cut.toFixed(2)}" × ${cut.toFixed(2)}". No triangles, no diagonals.`,
    );
    const breakdown = perRole.map(
      ([fab, role, per]) => `${per * blockCount} ${role} squares of Fabric ${fab}`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${breakdown.join(", ")}. Fabric ${domFab} forms two solid 2×2 corner groups (top-left + bottom-right) in every block.`,
    );
    notes.push(
      `Autumn Tints Assembly Tip: for each block, arrange 16 squares in the 4×4 grid shown in the diagram — Fabric ${domFab} in a solid 2×2 at the top-left and again at the bottom-right, Fabric ${bgFab} in 4 squares, Fabric ${acc1Fab} in 2 squares, and Fabric ${acc2Fab} in 2 squares (see diagram for exact placement — the block has 180° rotational symmetry). Sew each row of 4 squares together with a scant 1/4" seam, pressing seams in alternating directions row by row so they nest. Then join the 4 rows. When laying out the finished quilt, keep every block in the same orientation — the rotational symmetry of the block itself creates the diagonal chain of Fabric ${domFab} corners that runs across the whole quilt.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Note: sashing separates the blocks and will interrupt the diagonal chain effect — the classic look uses 0" sashing.`,
      );
    }
  } else if (s.pattern === "card-trick") {
    // Card Trick: 3×3 grid (u = blockSize / 3). Per block:
    //   4 corner HSTs (one per card + background) — 1 HST unit needed per
    //     card, one starter pair (u+0.875) yields 2 HSTs (use 1, waste 1).
    //     → 1 HST starter of each card fabric + 4 HST starters of bg.
    //   4 edge QST units (4-triangle): each cell needs 1 bg quarter + 3 card
    //     quarters (2 from the card that lies "on top" in that cell, 1 from
    //     its neighbor). Convention: 1 QST starter (u+1.25) per needed
    //     quarter, discard excess.
    //     → 4 bg QST starters + 3 QST starters per card across the edges
    //       (2 in its "double" cell + 1 in its neighbor's cell).
    //   1 center QST unit: 4 quarters, one per card.
    //     → 1 QST starter per card.
    //   Per-card QST total: 3 (edges) + 1 (center) = 4 QST starters.
    const u = s.blockSize / 3;
    const hstCut = u + HST_EXTRA;
    const qstCut = u + 1.25;

    const cA = (s.assignments["cardA"] ?? "A") as FabricKey;
    const cB = (s.assignments["cardB"] ?? "B") as FabricKey;
    const cC = (s.assignments["cardC"] ?? "C") as FabricKey;
    const cD = (s.assignments["cardD"] ?? "D") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "E") as FabricKey;
    const cardFabs: FabricKey[] = [cA, cB, cC, cD];
    const cardLabels = ["A", "B", "C", "D"];

    addSquares(reqs[bgFab], "HST starting squares (background corners)", 4 * blockCount, hstCut, s.fabricWidth);
    addSquares(reqs[bgFab], "QST starting squares (edge backgrounds)", 4 * blockCount, qstCut, s.fabricWidth);
    cardFabs.forEach((fab, i) => {
      addSquares(reqs[fab], `HST starting squares (Card ${cardLabels[i]} corner)`, blockCount, hstCut, s.fabricWidth);
      addSquares(reqs[fab], `QST starting squares (Card ${cardLabels[i]} — 3 edge + 1 center)`, 4 * blockCount, qstCut, s.fabricWidth);
    });

    notes.push(
      `Each block is a 3×3 grid where each cell = ${u.toFixed(2)}" finished. The four corners are HSTs (background + one card), the four edge cells are 4-triangle QST units (1 background quarter + 3 card quarters — the card that lies "on top" in that cell contributes 2, its neighbor 1), and the center cell is a 4-triangle QST where all four cards meet.`,
    );
    notes.push(
      `Per block, cut: 4 background HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (Fabric ${bgFab}), 4 background QST starting squares at ${qstCut.toFixed(2)}" × ${qstCut.toFixed(2)}" (Fabric ${bgFab}), and for EACH card 1 HST starting square at ${hstCut.toFixed(3)}" + 4 QST starting squares at ${qstCut.toFixed(2)}" (cards A=${cA}, B=${cB}, C=${cC}, D=${cD}). QST squares are cut larger to absorb the diagonal bias trim on both axes.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: ${4 * blockCount} background HST squares and ${4 * blockCount} background QST squares (Fabric ${bgFab}); for each card, ${blockCount} HST square + ${4 * blockCount} QST squares (Fabrics ${cA}, ${cB}, ${cC}, ${cD}).`,
    );
    notes.push(
      `HST construction (corner units): pair one card HST starting square with one background HST starting square RST. Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units — use one for this corner and set the extra aside (or use it in another project). Trim each unit to ${(u + SEAM).toFixed(3)}" square. Repeat for each of the 4 corners so every card fabric has its own HST corner.`,
    );
    notes.push(
      `QST construction (edge + center units): cut each QST starting square at ${qstCut.toFixed(2)}", then slice each square across BOTH diagonals — you'll get 4 quarter-triangles per starting square. For each of the 4 edge cells, combine 1 background quarter (on the outside edge) with 3 card quarters: 2 from the card that lies "on top" in that cell and 1 from its neighboring card. For the 1 center cell, combine 1 quarter from EACH of the four cards so all four card fabrics meet at the block's center point. Sew the quarters into square units, trimming to ${(u + SEAM).toFixed(3)}" finished.`,
    );
    notes.push(
      `Card Trick Assembly Tip: build the 9 units first (4 HST corners + 5 QST units — 4 edges and 1 center), then arrange them in the 3×3 grid so each 'card' diamond is centered on one of the four internal grid intersections. The Top Left Card occupies the top-left quadrant, the Top Right Card the top-right, the Bottom Right Card the bottom-right, and the Bottom Left Card the bottom-left — all four cards meet at the exact center of the block. Sew each row of 3 units together with a scant 1/4" seam, then join the 3 rows. Keep every block in the same orientation across the quilt so the four card colors line up consistently.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "F") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "oh-susannah") {
    // Oh Susannah: 4×4 grid, u = blockSize/4. Per block:
    //   Fabric A (dominant): 4 plain squares (outer ring) + 2 HST starter
    //                        squares (2 pairs → 4 HST units, one per center cell)
    //   Fabric B (secondary): 4 plain squares (outer ring) — no HSTs
    //   Fabric C (background): 4 plain squares (block corners) + 2 HST starter
    //                          squares (paired with A to form the 4 center HSTs)
    // Every plain square finishes at u"; HST starter squares are u+0.875".
    const u = s.blockSize / 4;
    const plainCut = u + SEAM;
    const hstCut = u + HST_EXTRA;
    const domFab = (s.assignments["dominant"] ?? "A") as FabricKey;
    const secFab = (s.assignments["secondary"] ?? "B") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "C") as FabricKey;

    const domPlain = 4 * blockCount;
    const domHst = 2 * blockCount;
    const secPlain = 4 * blockCount;
    const bgPlain = 4 * blockCount;
    const bgHst = 2 * blockCount;

    // Pool per fabric letter so shared letters (e.g. A === C) collapse to one
    // pile, matching how the other multi-role patterns handle pooling.
    type Bucket = { plain: number; hst: number };
    const buckets: Partial<Record<FabricKey, Bucket>> = {};
    const add = (fab: FabricKey, plain: number, hst: number) => {
      const b = (buckets[fab] ??= { plain: 0, hst: 0 });
      b.plain += plain; b.hst += hst;
    };
    add(domFab, domPlain, domHst);
    add(secFab, secPlain, 0);
    add(bgFab, bgPlain, bgHst);
    for (const fab of ALL_FABRIC_KEYS) {
      const b = buckets[fab];
      if (!b) continue;
      if (b.plain > 0) addSquares(reqs[fab], "Plain squares", b.plain, plainCut, s.fabricWidth);
      if (b.hst > 0) addSquares(reqs[fab], "HST starting squares (center 2×2)", b.hst, hstCut, s.fabricWidth);
    }

    notes.push(
      `Each block is a 4×4 grid where each cell finishes at ${u.toFixed(2)}". The 12 outer-ring cells are plain squares; the center 2×2 is 4 Half Square Triangle units. Plain squares cut at ${plainCut.toFixed(2)}" × ${plainCut.toFixed(2)}"; HST starting squares cut at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" (finished + 7/8" for the diagonal seam).`,
    );
    notes.push(
      `Across all ${blockCount} blocks: Fabric ${domFab} = ${domPlain} plain squares + ${domHst} HST starting squares; Fabric ${secFab} = ${secPlain} plain squares; Fabric ${bgFab} = ${bgPlain} plain squares (block corners) + ${bgHst} HST starting squares.`,
    );
    notes.push(
      `HST construction (center 2×2): pair one Fabric ${domFab} HST starting square with one Fabric ${bgFab} HST starting square right sides together (RST). Draw a diagonal line corner to corner on the lighter square. Sew a scant 1/4" on each side of the line. Cut apart on the line to yield 2 HST units. Press open and trim each unit to ${(u + SEAM).toFixed(3)}" square (finished ${u.toFixed(2)}"). Each block needs 4 center HSTs — 2 pairs yield exactly 4.`,
    );
    notes.push(
      `Oh Susannah Assembly Tip: lay out each block in the 4×4 grid — Fabric ${bgFab} in the 4 outer corners, Fabric ${domFab} in the 4 "cross-arm" positions at (top-mid-left), (mid-left-top?), etc. and Fabric ${secFab} in the OTHER 4 outer-ring cells. Rotate each center HST so the Fabric ${domFab} triangle sits at the OUTER corner of its cell and the Fabric ${bgFab} triangle points toward the block CENTER — the 4 background triangles will meet to form a diamond in the middle. Sew each row of 4 units together with a scant 1/4" seam, pressing seams in alternating directions row by row so they nest. Then join the 4 rows. Keep every block in the same orientation across the quilt so the center diamonds line up cleanly.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "D") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "twin-star") {
    // Twin Star: 3×3 grid, u = blockSize/3. Per block:
    //   Fabric C (bg): 5 plain squares (4 corners + center) ONLY — never
    //                  appears inside any edge unit.
    //   Fabric A (large star): 2 HST starter squares (cut on ONE diagonal only
    //                          → 4 half-triangles, one per edge cell).
    //   Fabric B (small point): 1 QST starter (4 quarter-triangles, one per
    //                           edge cell).
    //   Fabric D (second point): 1 QST starter (4 quarter-triangles, one per
    //                            edge cell) — a fully distinct fabric from bg.
    // Plain cut u+SEAM; HST cut u+0.875; QST cut u+1.25.
    const u = s.blockSize / 3;
    const plainCut = u + SEAM;
    const hstCut = u + HST_EXTRA;
    const qstCut = u + 1.25;
    const starFab = (s.assignments["star"] ?? "A") as FabricKey;
    const pointFab = (s.assignments["point"] ?? "B") as FabricKey;
    const point2Fab = (s.assignments["point2"] ?? "D") as FabricKey;
    const bgFab = (s.assignments["bg"] ?? "C") as FabricKey;

    // Pool by fabric letter so shared letters collapse.
    type Bucket = { plain: number; hst: number; qst: number };
    const buckets: Partial<Record<FabricKey, Bucket>> = {};
    const add = (fab: FabricKey, plain: number, hst: number, qst: number) => {
      const b = (buckets[fab] ??= { plain: 0, hst: 0, qst: 0 });
      b.plain += plain; b.hst += hst; b.qst += qst;
    };
    add(bgFab, 5 * blockCount, 0, 0);
    add(starFab, 0, 2 * blockCount, 0);
    add(pointFab, 0, 0, 1 * blockCount);
    add(point2Fab, 0, 0, 1 * blockCount);
    for (const fab of ALL_FABRIC_KEYS) {
      const b = buckets[fab];
      if (!b) continue;
      if (b.plain > 0) addSquares(reqs[fab], "Plain squares (background corners + center)", b.plain, plainCut, s.fabricWidth);
      if (b.hst > 0) addSquares(reqs[fab], "HST starting squares (large star triangles)", b.hst, hstCut, s.fabricWidth);
      if (b.qst > 0) addSquares(reqs[fab], "QST starting squares (small triangles)", b.qst, qstCut, s.fabricWidth);
    }

    notes.push(
      `Each block is a 3×3 grid where each cell finishes at ${u.toFixed(2)}". The 4 corners and center cell are plain background squares (Fabric ${bgFab}); the 4 edge cells are 3-triangle units (1 large Fabric ${starFab} triangle + 1 small Fabric ${pointFab} triangle + 1 small Fabric ${point2Fab} triangle) rotated 90° around the block. Fabric ${bgFab} never appears inside an edge unit.`,
    );
    notes.push(
      `Per block, cut: 5 background plain squares at ${plainCut.toFixed(2)}" × ${plainCut.toFixed(2)}" (Fabric ${bgFab}); 2 HST starting squares at ${hstCut.toFixed(3)}" × ${hstCut.toFixed(3)}" of Fabric ${starFab}; 1 QST starting square at ${qstCut.toFixed(2)}" × ${qstCut.toFixed(2)}" of Fabric ${pointFab}; and 1 QST starting square at ${qstCut.toFixed(2)}" × ${qstCut.toFixed(2)}" of Fabric ${point2Fab}.`,
    );
    notes.push(
      `Across all ${blockCount} blocks: Fabric ${bgFab} = ${5 * blockCount} plain squares; Fabric ${starFab} = ${2 * blockCount} HST starting squares; Fabric ${pointFab} = ${blockCount} QST starting squares; Fabric ${point2Fab} = ${blockCount} QST starting squares.`,
    );
    notes.push(
      `HST construction (large star triangles): cut each Fabric ${starFab} HST starting square once corner-to-corner on the diagonal to yield 2 large half-triangles. Each starter square produces 2 large star triangles; each block needs 4, so 2 starter squares per block.`,
    );
    notes.push(
      `QST construction (small triangles): cut each QST starting square across BOTH diagonals to yield 4 quarter-triangles per square. Each block needs 4 small Fabric ${pointFab} quarters (one per edge cell) and 4 small Fabric ${point2Fab} quarters (one per edge cell) — so 1 QST square of each fabric per block covers it exactly.`,
    );
    notes.push(
      `Twin Star Assembly Tip: build each edge cell by sewing the small Fabric ${pointFab} + Fabric ${point2Fab} quarter-triangles together along their short edges into a triangle unit, then sew that unit onto the large Fabric ${starFab} half-triangle along the cell's diagonal. Trim to ${(u + SEAM).toFixed(3)}" square. Rotate the 4 edge units 90° around the block (top-center → middle-right → bottom-center → middle-left) so all 4 large Fabric ${starFab} triangles spin the same direction — this is what makes the two nested stars appear. Sew each row of 3 units together with a scant 1/4" seam, then join the 3 rows. Keep every block in the same orientation across the quilt so the stars line up consistently.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "star-and-cross") {
    // Star & Cross: 5×5 unit grid, u = blockSize/5. Rectangles + squares only.
    // Per block:
    //   Fabric A (bg):     4 large 2u×u rectangles (top/bottom of each corner
    //                      unit) + 4 small u×u squares (outer-diagonal square
    //                      of each corner unit).
    //   Fabric B (accent): 4 small u×u squares (inner square of each corner
    //                      unit, always next to the cross).
    //   Fabric C (cross):  4 large 2u×u rectangles (top/bottom/left/right arms).
    //                      The vertical arms are cut u×2u — same 2u×u piece
    //                      shape, just rotated when assembling.
    //   Fabric D (center): 1 small u×u square.
    const u = s.blockSize / 5;
    const sqCut = u + SEAM;
    const rectLong = 2 * u + SEAM;
    const rectShort = u + SEAM;

    const bgFab = (s.assignments["bg"] ?? "A") as FabricKey;
    const accFab = (s.assignments["accent"] ?? "B") as FabricKey;
    const crossFab = (s.assignments["cross"] ?? "C") as FabricKey;
    const centerFab = (s.assignments["center"] ?? "D") as FabricKey;

    // Pool by fabric letter so shared letters collapse into one pile per shape.
    type Bucket = { squares: number; rects: number };
    const buckets: Partial<Record<FabricKey, Bucket>> = {};
    const add = (fab: FabricKey, squares: number, rects: number) => {
      const b = (buckets[fab] ??= { squares: 0, rects: 0 });
      b.squares += squares;
      b.rects += rects;
    };
    add(bgFab, 4 * blockCount, 4 * blockCount);
    add(accFab, 4 * blockCount, 0);
    add(crossFab, 0, 4 * blockCount);
    add(centerFab, 1 * blockCount, 0);
    for (const fab of ALL_FABRIC_KEYS) {
      const b = buckets[fab];
      if (!b) continue;
      if (b.squares > 0) {
        addSquares(reqs[fab], `Small squares (${u.toFixed(2)}" finished)`, b.squares, sqCut, s.fabricWidth);
      }
      if (b.rects > 0) {
        addRails(reqs[fab], `Rectangles (${(2 * u).toFixed(2)}" × ${u.toFixed(2)}" finished)`, b.rects, rectLong, rectShort, s.fabricWidth);
      }
    }

    notes.push(
      `Each block is a 5×5 unit grid where each unit finishes at ${u.toFixed(2)}". The block uses only rectangles and squares — no triangles. Per block cut: 4 background rectangles at ${rectLong.toFixed(2)}" × ${rectShort.toFixed(2)}" (Fabric ${bgFab}); 4 background squares at ${sqCut.toFixed(2)}" × ${sqCut.toFixed(2)}" (Fabric ${bgFab}); 4 accent squares at ${sqCut.toFixed(2)}" × ${sqCut.toFixed(2)}" (Fabric ${accFab}); 4 cross-arm rectangles at ${rectLong.toFixed(2)}" × ${rectShort.toFixed(2)}" (Fabric ${crossFab}); 1 center square at ${sqCut.toFixed(2)}" × ${sqCut.toFixed(2)}" (Fabric ${centerFab}).`,
    );
    notes.push(
      `Across all ${blockCount} blocks: Fabric ${bgFab} = ${4 * blockCount} rectangles + ${4 * blockCount} squares; Fabric ${accFab} = ${4 * blockCount} squares; Fabric ${crossFab} = ${4 * blockCount} rectangles; Fabric ${centerFab} = ${blockCount} squares.`,
    );
    notes.push(
      `Star & Cross Assembly Tip: build each block as 5 rows of pieces, top to bottom. Row 1: background rect | cross rect (rotated so the ${(2 * u).toFixed(2)}" edge is vertical, i.e. cut u×2u — or sew the two matching short-arm halves together) | background rect. Row 2: background sq | accent sq | cross rect (vertical) | accent sq | background sq. Row 3: cross rect (horizontal) | cross rect (horizontal — the two center squares of the middle row are the two horizontal arms) | center sq | cross rect (horizontal) | cross rect (horizontal). Row 4 mirrors row 2 vertically. Row 5 mirrors row 1. In practice the easiest construction is a 3×3 macro layout: 4 corner units (each = 1 rect + 2 squares), 4 arm rects, and 1 center square — assemble each corner unit first, then join corners + arms + center as a 3×3 grid. The accent square in every corner unit must sit adjacent to the cross (nearest the center of the block).`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "E") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  } else if (s.pattern === "idaho-beauty") {
    // Idaho Beauty: 3×3 core surrounded by a half-width outer ring.
    // In finished sizes: core = blockSize / 4, outer ring = core / 2.
    // Per block:
    //   Fabric A: 4 small outer-corner squares, 4 core diamond-base squares,
    //     and 12 half-width rectangles (4 plain outer middles + 8 goose bases).
    //   Fabric B: 32 small corner squares (16 for diamonds + 16 for geese).
    //   Fabric C: 5 plain core squares in the X pattern.
    const core = s.blockSize / 4;
    const ring = core / 2;
    const coreCut = core + SEAM;
    const ringCut = ring + SEAM;
    const ringRectLong = core + SEAM;
    const ringRectShort = ring + SEAM;

    const bgFab = (s.assignments["bg"] ?? "A") as FabricKey;
    const accFab = (s.assignments["accent"] ?? "B") as FabricKey;
    const solidFab = (s.assignments["solid"] ?? "C") as FabricKey;

    // Pool by fabric letter so shared letters collapse into one pile per
    // shape/size bucket.
    type Bucket = {
      coreSquares: number; // (core + SEAM) squares
      ringSquares: number; // (ring + SEAM) squares
      ringRects: number;   // (core + SEAM) × (ring + SEAM) rectangles
    };
    const buckets: Partial<Record<FabricKey, Bucket>> = {};
    const add = (fab: FabricKey, coreSq: number, ringSq: number, ringRect: number) => {
      const b = (buckets[fab] ??= { coreSquares: 0, ringSquares: 0, ringRects: 0 });
      b.coreSquares += coreSq;
      b.ringSquares += ringSq;
      b.ringRects += ringRect;
    };
    // Fabric A: 4 diamond bases, 4 small true-corner squares, 12 half-width rectangles.
    add(bgFab, 4 * blockCount, 4 * blockCount, 12 * blockCount);
    // Fabric B: 16 diamond corner squares + 16 goose corner squares.
    add(accFab, 0, 32 * blockCount, 0);
    // Fabric C: 5 core squares only — never used in any triangle.
    add(solidFab, 5 * blockCount, 0, 0);

    for (const fab of ALL_FABRIC_KEYS) {
      const b = buckets[fab];
      if (!b) continue;
      if (b.coreSquares > 0) {
        addSquares(reqs[fab], `Core squares (${core.toFixed(2)}" finished)`, b.coreSquares, coreCut, s.fabricWidth);
      }
      if (b.ringSquares > 0) {
        addSquares(reqs[fab], `Small outer-ring/corner squares (${ring.toFixed(2)}" finished)`, b.ringSquares, ringCut, s.fabricWidth);
      }
      if (b.ringRects > 0) {
        addRails(reqs[fab], `Half-width outer-ring rectangles (${core.toFixed(2)}" × ${ring.toFixed(2)}" finished)`, b.ringRects, ringRectLong, ringRectShort, s.fabricWidth);
      }
    }

    notes.push(
      `Each Idaho Beauty block is a 3×3 core surrounded by a half-width outer ring. The 3×3 core cells finish at ${core.toFixed(2)}"; the outside ring finishes at ${ring.toFixed(2)}" wide. Per block cut: 4 Fabric ${bgFab} core diamond-base squares + 5 Fabric ${solidFab} solid core squares at ${coreCut.toFixed(2)}" × ${coreCut.toFixed(2)}"; 4 Fabric ${bgFab} small corner squares at ${ringCut.toFixed(2)}" × ${ringCut.toFixed(2)}"; 12 Fabric ${bgFab} half-width rectangles at ${ringRectLong.toFixed(2)}" × ${ringRectShort.toFixed(2)}"; and 32 Fabric ${accFab} small corner squares at ${ringCut.toFixed(2)}" × ${ringCut.toFixed(2)}" for the diamond and goose triangles.`,
    );
    notes.push(
      `Fabric ${solidFab} only appears as plain, uncut core squares — never inside a triangle. The outside ring is intentionally half the width of the core cells, matching the reference block proportions.`,
    );
    notes.push(
      `Diamond units (4 per block): use the stitch-and-flip corner method. Place a Fabric ${accFab} ${ringCut.toFixed(2)}" corner square RST on a corner of a Fabric ${bgFab} ${coreCut.toFixed(2)}" base square. Draw a diagonal on the small square from the outer corner to the inner corner. Sew on the line, trim the outer corner ~1/4" beyond the seam, press the small triangle open. Repeat on all 4 corners — Fabric ${bgFab} becomes the on-point diamond and Fabric ${accFab} fills the 4 corner triangles. Trim to ${coreCut.toFixed(2)}" square if needed.`,
    );
    notes.push(
      `Outer-ring geese units (8 per block, 2 per side): start with one Fabric ${bgFab} ${ringRectLong.toFixed(2)}" × ${ringRectShort.toFixed(2)}" rectangle and two Fabric ${accFab} ${ringCut.toFixed(2)}" corner squares. Stitch-and-flip one accent square onto each end so the Fabric ${bgFab} triangle points inward toward the block center and the Fabric ${accFab} triangles stay in the outside corners. Rotate these half-width units around the block just like the reference image.`,
    );
    notes.push(
      `Idaho Beauty Assembly Tip: build a half-width outer ring around the 3×3 core. Top and bottom rows are: small Fabric ${bgFab} square | goose | Fabric ${bgFab} rectangle | goose | small Fabric ${bgFab} square. The 3×3 core is: ${solidFab} | diamond | ${solidFab}; diamond | ${solidFab} | diamond; ${solidFab} | diamond | ${solidFab}. The left and right ring sides are goose | Fabric ${bgFab} rectangle | goose, with every Fabric ${bgFab} goose triangle pointing inward.`,
    );

    if (sashWidth > 0) {
      const sashFab = (s.assignments["sashing"] ?? "D") as FabricKey;
      const sashCutW = sashWidth + SEAM;
      const sashCutL = s.blockSize + SEAM;
      const vSash = Math.max(0, blocksAcross - 1) * blocksDown;
      const hSash = Math.max(0, blocksDown - 1) * blocksAcross;
      const totalSash = vSash + hSash;
      if (totalSash > 0) {
        addRails(reqs[sashFab], "Sashing strips between blocks", totalSash, sashCutL, sashCutW, s.fabricWidth);
      }
      notes.push(
        `Sashing between blocks: cut ${totalSash} strips at ${sashCutW.toFixed(2)}" × ${sashCutL.toFixed(2)}" (Fabric ${sashFab}) — ${vSash} vertical (${Math.max(0, blocksAcross - 1)} × ${blocksDown}) and ${hSash} horizontal (${Math.max(0, blocksDown - 1)} × ${blocksAcross}). Strips run only between blocks — not around the outer edge.`,
      );
    }
  }





  // Border
  if (s.borderWidth > 0) {
    // Sashing runs only BETWEEN blocks (not around the outer perimeter), so the
    // inner finished dimensions add (blocks - 1) sashing strips, not (blocks + 1).
    const finishedInnerW = isSashed
      ? blocksAcross * s.blockSize + Math.max(0, blocksAcross - 1) * sashWidth
      : s.quiltWidth - 2 * s.borderWidth;
    const finishedInnerH = isSashed
      ? blocksDown * s.blockSize + Math.max(0, blocksDown - 1) * sashWidth
      : s.quiltHeight - 2 * s.borderWidth;
    const patDef = getPattern(s.pattern);
    const borderDefault = patDef
      ? getEffectiveBorderDefault(patDef, isSashed, s.pattern === "bear-paw" && isSashed)
      : ("C" as FabricKey);
    const borderFab = (s.assignments["border"] ?? borderDefault) as FabricKey;
    const b = borderInches(finishedInnerW, finishedInnerH, s.borderWidth, s.fabricWidth);
    if (b.stripCount > 0) {
      reqs[borderFab].strips.push({
        stripWidth: b.stripWidth,
        count: b.stripCount,
        pieces: [{ w: s.fabricWidth, h: b.stripWidth, count: b.stripCount }],
      });
      reqs[borderFab].pieces.push({
        label: "Border strips",
        count: b.stripCount,
        w: s.fabricWidth,
        h: b.stripWidth,
      });
      reqs[borderFab].totalInches += b.inches;
    }
  }

  const out: FabricRequirement[] = ALL_FABRIC_KEYS
    .map((k) => reqs[k])
    .filter((r) => r.totalInches > 0)
    .map((r) => ({ ...r, yards: inchesToYards(r.totalInches, s.safetyBuffer) }));

  const materials = calculateMaterials(s);
  // Only attach the basics glossary to patterns that actually have sewing
  // steps in the notes. Simple Squares is "join squares edge to edge" — the
  // glossary would be overkill there.
  const showBasics =
    s.pattern === "hst" ||
    s.pattern === "nine-patch" ||
    s.pattern === "rail-fence" ||
    s.pattern === "log-cabin" ||
    s.pattern === "ohio-star" ||
    s.pattern === "flying-geese" ||
    s.pattern === "disappearing-nine-patch" ||
    s.pattern === "squares-on-point" ||
    s.pattern === "pinwheel" ||
    s.pattern === "plus-block" ||
    s.pattern === "churn-dash" ||
    s.pattern === "bear-paw" ||
    s.pattern === "irish-chain" ||
    s.pattern === "sawtooth-star" ||
    s.pattern === "friendship-star" ||
    s.pattern === "snowball-block" ||
    s.pattern === "four-patch" ||
    s.pattern === "streak-of-lightning" ||
    s.pattern === "bow-tie" ||
    s.pattern === "shoofly" ||
    s.pattern === "jacobs-ladder" ||
    s.pattern === "autumn-tints" ||
    s.pattern === "card-trick" ||
    s.pattern === "oh-susannah" ||
    s.pattern === "twin-star" ||
    s.pattern === "star-and-cross" ||
    s.pattern === "idaho-beauty";
  return { fabrics: out, notes, basics: showBasics ? basics : undefined, materials };
}

const BATTING_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "Craft (36\" × 45\")", w: 36, h: 45 },
  { label: "Crib (45\" × 60\")", w: 45, h: 60 },
  { label: "Throw (60\" × 60\")", w: 60, h: 60 },
  { label: "Twin (72\" × 90\")", w: 72, h: 90 },
  { label: "Full (81\" × 96\")", w: 81, h: 96 },
  { label: "Queen (90\" × 108\")", w: 90, h: 108 },
  { label: "King (120\" × 120\")", w: 120, h: 120 },
];

export function calculateMaterials(s: PlannerState): MaterialsRequirement {
  const overhang = 4;
  const backW = s.quiltWidth + overhang * 2;
  const backH = s.quiltHeight + overhang * 2;

  const usableBackWidth = s.fabricWidth - SELVAGE_TRIM;
  const widths = Math.max(1, Math.ceil(backW / usableBackWidth));
  const backingInches = widths * backH;
  const backingYards = roundUpQuarter(backingInches / 36);

  const fits = BATTING_PRESETS.find((p) => p.w >= backW && p.h >= backH);
  const battingPreset = fits ? fits.label : "Larger than King — buy by the yard";
  const battingYards = roundUpQuarter(backH / 36);

  const stripWidthIn = 2.5;
  const perimeter = 2 * (s.quiltWidth + s.quiltHeight) + 10;
  const usableBinding = s.fabricWidth - SELVAGE_TRIM;
  const stripCount = Math.ceil(perimeter / usableBinding);
  const bindingInches = stripCount * stripWidthIn;
  const bindingYards = roundUpQuarter(bindingInches / 36);

  return {
    backing: {
      widthIn: backW,
      heightIn: backH,
      widths,
      yards: backingYards,
      overhang,
    },
    batting: {
      widthIn: backW,
      heightIn: backH,
      presetLabel: battingPreset,
      yards: battingYards,
    },
    binding: {
      perimeterIn: 2 * (s.quiltWidth + s.quiltHeight),
      stripWidthIn,
      stripCount,
      bindingLengthIn: Math.round(stripCount * usableBinding),
      yards: bindingYards,
    },
  };
}

/**
 * Returns a fabric-mix percentage map for patchwork (Simple Squares) mode,
 * based on the per-cell preview grid the user designed. Returns null if
 * patchwork mode isn't relevant (e.g. user kept the default empty grid AND
 * only one fabric is being used).
 */
function computePatchworkMix(s: PlannerState): Record<FabricKey, number> | null {
  const count = Math.max(2, Math.min(12, s.patchworkFabricCount || 0));
  if (!count || count < 2) return null;
  const palette = ALL_FABRIC_KEYS.slice(0, count);
  // Recreate the same grid shape PatchworkPreview uses - the real block
  // layout (blocks across by blocks down) given block size and border width.
  const innerW = Math.max(0, s.quiltWidth - 2 * s.borderWidth);
  const innerH = Math.max(0, s.quiltHeight - 2 * s.borderWidth);
  const safeBlock = Math.max(0.0001, s.blockSize);
  const cols = Math.max(1, Math.floor(innerW / safeBlock));
  const rows = Math.max(1, Math.floor(innerH / safeBlock));

  const counts: Partial<Record<FabricKey, number>> = {};
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const fab =
        s.patchworkGrid[key] && palette.includes(s.patchworkGrid[key])
          ? s.patchworkGrid[key]
          : palette[(r + c) % palette.length];
      counts[fab] = (counts[fab] ?? 0) + 1;
      total += 1;
    }
  }
  if (total === 0) return null;
  const out = {} as Record<FabricKey, number>;
  for (const k of ALL_FABRIC_KEYS) out[k] = (counts[k] ?? 0) / total;
  return out;
}

function blank(fabric: FabricKey): FabricRequirement {
  return { fabric, pieces: [], strips: [], totalInches: 0, yards: 0 };
}

/**
 * Add a batch of square sub-cut pieces (w === h) to a fabric requirement.
 *
 * INVARIANT: width === height. The cutting diagram detects squares vs.
 * rectangles by comparing piece.w and piece.h, so callers MUST NOT use this
 * for rectangular pieces. Use addRails (or addRectangles) instead.
 */
function addSquares(
  req: FabricRequirement,
  label: string,
  count: number,
  cutSize: number,
  fabricWidth: number,
) {
  const { stripWidth, stripCount } = packStrips(cutSize, count, fabricWidth);
  req.pieces.push({ label, count, w: cutSize, h: cutSize });
  req.strips.push({
    stripWidth,
    count: stripCount,
    pieces: [{ w: cutSize, h: cutSize, count }],
  });
  req.totalInches += stripCount * cutSize;
}

/**
 * Pack rectangular sub-cut pieces (cutLength × cutHeight) cut from full-width
 * strips. Each fabric-width strip is cutHeight tall and yields
 * floor(usable / cutLength) pieces. We need ceil(count / perStrip) such
 * strips, contributing stripCount × cutHeight inches down the bolt.
 *
 * INVARIANT: width !== height. For square sub-cuts, use addSquares so the
 * cutting diagram and shopping list correctly label the shape.
 *
 * Used by Rail Fence (rails) and any future pattern with rectangular cuts
 * (e.g. Flying Geese, Brick, Bargello strips).
 */
function addRails(
  req: FabricRequirement,
  label: string,
  count: number,
  cutLength: number,
  cutHeight: number,
  fabricWidth: number,
) {
  if (Math.abs(cutLength - cutHeight) < 0.01) {
    // A square slipped in via addRails. Forward to addSquares so downstream
    // diagrams keep their "square" wording correct.
    addSquares(req, label, count, cutLength, fabricWidth);
    return;
  }
  const usable = fabricWidth - SELVAGE_TRIM;
  const perStrip = Math.max(1, Math.floor(usable / cutLength));
  const stripCount = Math.ceil(count / perStrip);
  req.pieces.push({ label, count, w: cutLength, h: cutHeight });
  req.strips.push({
    stripWidth: cutHeight,
    count: stripCount,
    pieces: [{ w: cutLength, h: cutHeight, count }],
  });
  req.totalInches += stripCount * cutHeight;
}

// ============================================================================
// PRECUT (jelly roll) PLANNER — pilot for Rail Fence only.
//
// This is a SEPARATE code path from calculateYardage(). It runs alongside the
// yardage calculator: yardage handles border/sashing/backing/batting/binding,
// while this function tells the user how many jelly-roll strips they need
// for the rail blocks themselves.
//
// Jelly roll strip = 2.5" × ~42" usable (industry standard). Each strip yields
// floor(42 / railCutLength) rails. Rail Fence at 6" finished blocks gives
// railCutLength = 6.5", railsPerStrip = floor(42/6.5) = 6.
// ============================================================================

/** Usable length of a single jelly-roll strip after trimming the bound short
 *  edge. Industry standard is 44" raw width; we conservatively assume 42"
 *  usable to match real-world precuts. */
export const JELLY_ROLL_USABLE_LENGTH = 42;
/** Standard jelly-roll strip width. */
export const JELLY_ROLL_STRIP_WIDTH = 2.5;

export interface PrecutFabricLine {
  fabric: FabricKey;
  /** Block-fabric roles this letter is used for (e.g. ["Top rail", "Middle rail"]). */
  roles: string[];
  /** Number of finished pieces (rails) needed across the whole quilt. */
  piecesNeeded: number;
  /** How many of THIS fabric's jelly-roll strips are needed. */
  stripsNeeded: number;
  /** How many finished pieces fit per strip. */
  piecesPerStrip: number;
  /** Cut length of each piece, inches. */
  cutLengthIn: number;
  /** Cut height of each piece, inches (matches strip width for jelly rolls). */
  cutHeightIn: number;
}

export interface PrecutPlan {
  /** Pattern the plan was built for. */
  pattern: "rail-fence";
  /** Block-fabric requirements grouped by fabric letter. */
  fabrics: PrecutFabricLine[];
  /** Total jelly-roll strips consumed across all block fabrics. */
  totalStripsNeeded: number;
  /** How many strips the user said are in their jelly roll. */
  stripsAvailable: number;
  /** True if totalStripsNeeded <= stripsAvailable. */
  feasible: boolean;
  /** Human-readable feasibility / next-step note. */
  feasibilityMessage: string;
  /** Cutting/sewing notes for the precut path. */
  notes: string[];
}

/**
 * Returns null when the planner isn't in precut mode (or pattern isn't
 * supported yet). Callers should fall through to the yardage flow.
 */
export function computePrecutPlan(s: PlannerState): PrecutPlan | null {
  if (s.fabricSource !== "jelly-roll") return null;
  if (s.pattern !== "rail-fence") return null;

  // Rail Fence at jelly-roll: block size is locked to 6" finished (3 strips
  // × 2" finished). If for any reason the stored block size differs, we
  // honor 6" here so the math stays self-consistent.
  const blockSize = 6;
  const railCutLength = blockSize + SEAM; // 6.5"
  const railCutHeight = JELLY_ROLL_STRIP_WIDTH; // 2.5" — already includes seam
  const railsPerStrip = Math.max(
    1,
    Math.floor(JELLY_ROLL_USABLE_LENGTH / railCutLength),
  );

  const innerW = s.quiltWidth - 2 * s.borderWidth;
  const innerH = s.quiltHeight - 2 * s.borderWidth;
  const blocksAcross = Math.max(1, Math.floor(innerW / blockSize));
  const blocksDown = Math.max(1, Math.floor(innerH / blockSize));
  const blockCount = blocksAcross * blocksDown;

  const r1 = (s.assignments["rail1"] ?? "A") as FabricKey;
  const r2 = (s.assignments["rail2"] ?? "B") as FabricKey;
  const r3 = (s.assignments["rail3"] ?? "C") as FabricKey;
  const roleByRail: Record<string, string> = {
    rail1: "Top rail",
    rail2: "Middle rail",
    rail3: "Bottom rail",
  };
  const rolesByFabric: Partial<Record<FabricKey, string[]>> = {};
  const piecesByFabric: Partial<Record<FabricKey, number>> = {};
  for (const [slot, fab] of [["rail1", r1], ["rail2", r2], ["rail3", r3]] as const) {
    rolesByFabric[fab] = [...(rolesByFabric[fab] ?? []), roleByRail[slot]];
    piecesByFabric[fab] = (piecesByFabric[fab] ?? 0) + blockCount;
  }

  const fabrics: PrecutFabricLine[] = ALL_FABRIC_KEYS
    .filter((f) => (piecesByFabric[f] ?? 0) > 0)
    .map((f) => {
      const piecesNeeded = piecesByFabric[f]!;
      const stripsNeeded = Math.ceil(piecesNeeded / railsPerStrip);
      return {
        fabric: f,
        roles: rolesByFabric[f]!,
        piecesNeeded,
        stripsNeeded,
        piecesPerStrip: railsPerStrip,
        cutLengthIn: railCutLength,
        cutHeightIn: railCutHeight,
      };
    });

  const totalStripsNeeded = fabrics.reduce((sum, l) => sum + l.stripsNeeded, 0);
  const stripsAvailable = Math.max(1, s.jellyRollStripCount || 40);
  const feasible = totalStripsNeeded <= stripsAvailable;
  const feasibilityMessage = feasible
    ? `One jelly roll is plenty — you'll use ${totalStripsNeeded} of its ${stripsAvailable} strips for the blocks (${stripsAvailable - totalStripsNeeded} strips left over).`
    : `One jelly roll isn't enough — you need ${totalStripsNeeded} strips but only have ${stripsAvailable}. Either buy a second jelly roll, or reduce the quilt size on Step 2 until the strip count fits.`;

  const notes: string[] = [
    `Quilt grid: ${blocksAcross} × ${blocksDown} = ${blockCount} Rail Fence blocks at 6" finished (block size is locked at 6" in jelly-roll mode because each block stacks 3 of your 2.5" strips into a 6" square).`,
    `Each block uses 3 rails — one of Fabric ${r1} on top, one of Fabric ${r2} in the middle, one of Fabric ${r3} on the bottom.`,
    `From each 2.5" × ~42" jelly-roll strip you'll sub-cut ${railsPerStrip} rails at ${railCutLength.toFixed(2)}" long (finished 6" × 2"). Leftover at the end of each strip: ${(JELLY_ROLL_USABLE_LENGTH - railsPerStrip * railCutLength).toFixed(2)}".`,
    `Across all ${blockCount} blocks you need ${blockCount} rails of each role. After grouping by fabric letter, that totals ${totalStripsNeeded} jelly-roll strips for the blocks.`,
    `Sewing: place the top rail and middle rail right sides together along one long edge, sew with a 1/4" seam, unfold and press toward the middle. Repeat for the bottom rail. Rotate every other block 90° when laying out the quilt for the classic woven look.`,
  ];

  return {
    pattern: "rail-fence",
    fabrics,
    totalStripsNeeded,
    stripsAvailable,
    feasible,
    feasibilityMessage,
    notes,
  };
}


// ============================================================================
// FAT QUARTER PLANNER — pilot for Simple Squares only.
//
// Returns null when the planner isn't in fat-quarter mode (or the pattern
// isn't supported). The card on ResultsPage tells the user how many fat
// quarters of each fabric they need and how many squares they'll yield.
// ============================================================================

export interface FatQuarterFabricLine {
  fabric: FabricKey;
  /** Total finished squares needed of this fabric, across the whole quilt. */
  squaresNeeded: number;
  /** How many fat quarters of THIS fabric are needed. */
  fqNeeded: number;
  /** How many squares fit per fat quarter at the chosen trim margin. */
  squaresPerFq: number;
}

export interface FatQuarterPlan {
  pattern: "simple-squares";
  /** Cut size of each square (finished + 0.5" seam). */
  squareCutSizeIn: number;
  /** Raw FQ size as entered by the user. */
  rawWidthIn: number;
  rawHeightIn: number;
  /** Trim margin per side. */
  trimMarginIn: number;
  /** Usable dimensions after subtracting 2× trim margin. */
  usableWidthIn: number;
  usableHeightIn: number;
  /** Max squares cuttable from one FQ at the chosen square size. */
  squaresPerFq: number;
  /** Grid breakdown: how many squares across / down per FQ. */
  squaresAcross: number;
  squaresDown: number;
  fabrics: FatQuarterFabricLine[];
  totalFqNeeded: number;
  fqAvailable: number;
  feasible: boolean;
  feasibilityMessage: string;
  notes: string[];
}

export function computeFatQuarterPlan(s: PlannerState): FatQuarterPlan | null {
  if (s.fabricSource !== "fat-quarter") return null;
  if (s.pattern !== "simple-squares") return null;

  const cut = s.blockSize + SEAM;
  const trim = Math.max(0, s.fatQuarterTrimMargin ?? 0.5);
  const usableW = Math.max(0, (s.fatQuarterWidth || 18) - 2 * trim);
  const usableH = Math.max(0, (s.fatQuarterHeight || 21) - 2 * trim);
  // Try both FQ orientations and pick the one that yields more squares.
  const grid1 = { across: Math.floor(usableW / cut), down: Math.floor(usableH / cut) };
  const grid2 = { across: Math.floor(usableH / cut), down: Math.floor(usableW / cut) };
  const yield1 = grid1.across * grid1.down;
  const yield2 = grid2.across * grid2.down;
  const best = yield2 > yield1 ? grid2 : grid1;
  const squaresPerFq = Math.max(0, best.across * best.down);

  const sashWidth = Math.max(0, s.sashingWidth || 0);
  const sashAdd = sashWidth;
  const innerW = s.quiltWidth - 2 * s.borderWidth;
  const innerH = s.quiltHeight - 2 * s.borderWidth;
  const blocksAcross = Math.max(1, Math.floor((innerW + sashAdd) / (s.blockSize + sashAdd)));
  const blocksDown = Math.max(1, Math.floor((innerH + sashAdd) / (s.blockSize + sashAdd)));
  const blockCount = blocksAcross * blocksDown;

  // Per-fabric square allocation: mirrors the simple-squares yardage path.
  const mix = computePatchworkMix(s);
  const squaresByFabric: Partial<Record<FabricKey, number>> = {};
  if (mix) {
    for (const fab of ALL_FABRIC_KEYS) {
      const pct = mix[fab];
      if (!pct || pct <= 0) continue;
      squaresByFabric[fab] = Math.ceil(blockCount * pct);
    }
  } else {
    const squareFab = (s.assignments["squares"] ?? "A") as FabricKey;
    squaresByFabric[squareFab] = blockCount;
  }

  const fabrics: FatQuarterFabricLine[] = ALL_FABRIC_KEYS
    .filter((f) => (squaresByFabric[f] ?? 0) > 0)
    .map((f) => {
      const squaresNeeded = squaresByFabric[f]!;
      const fqNeeded = squaresPerFq > 0 ? Math.ceil(squaresNeeded / squaresPerFq) : Infinity;
      return { fabric: f, squaresNeeded, fqNeeded, squaresPerFq };
    });

  const totalFqNeeded = fabrics.reduce((sum, l) => sum + (isFinite(l.fqNeeded) ? l.fqNeeded : 0), 0);
  const fqAvailable = Math.max(1, s.fatQuarterCount || 20);
  const feasible = squaresPerFq > 0 && totalFqNeeded <= fqAvailable;
  const feasibilityMessage = squaresPerFq <= 0
    ? `Your block size (${s.blockSize}") is too big for a ${s.fatQuarterWidth}" × ${s.fatQuarterHeight}" fat quarter after trimming ${trim}" off each side. Try a smaller block size, a smaller trim margin, or larger fat quarters.`
    : feasible
      ? `Your bundle is plenty — you'll use ${totalFqNeeded} of your ${fqAvailable} fat quarters for the blocks (${fqAvailable - totalFqNeeded} left over).`
      : `Your bundle isn't enough — you need ${totalFqNeeded} fat quarters but only have ${fqAvailable}. Either buy more, reduce the quilt size, or pick a smaller block size to fit more squares per FQ.`;

  const notes: string[] = [
    `Quilt grid: ${blocksAcross} × ${blocksDown} = ${blockCount} squares at ${s.blockSize}" finished.`,
    `From each ${s.fatQuarterWidth}" × ${s.fatQuarterHeight}" fat quarter, trim ${trim}" off all 4 sides for a clean ${usableW.toFixed(2)}" × ${usableH.toFixed(2)}" usable rectangle, then sub-cut a ${best.across} × ${best.down} grid of ${cut}" squares = ${squaresPerFq} squares per FQ.`,
    `Cutting tip: lay your fat quarter flat, square up one corner with your ruler, then make parallel cuts every ${cut}" until you've got your row of squares.`,
    `Backing, batting, binding, sashing, and any border are still bought as regular yardage — see those sections below.`,
  ];

  return {
    pattern: "simple-squares",
    squareCutSizeIn: cut,
    rawWidthIn: s.fatQuarterWidth || 18,
    rawHeightIn: s.fatQuarterHeight || 21,
    trimMarginIn: trim,
    usableWidthIn: usableW,
    usableHeightIn: usableH,
    squaresPerFq,
    squaresAcross: best.across,
    squaresDown: best.down,
    fabrics,
    totalFqNeeded,
    fqAvailable,
    feasible,
    feasibilityMessage,
    notes,
  };
}



