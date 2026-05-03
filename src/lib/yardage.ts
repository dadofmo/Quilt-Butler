import { ALL_FABRIC_KEYS, type FabricKey, type PlannerState } from "./planner-store";
import { getPattern } from "./patterns";

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
    // Patchwork mode: split block count across the user's chosen palette
    // (2–12 fabrics) using the per-cell mix from the preview grid.
    const mix = computePatchworkMix(s);
    if (mix) {
      const lines: string[] = [];
      for (const fab of ALL_FABRIC_KEYS) {
        const pct = mix[fab];
        if (!pct || pct <= 0) continue;
        const count = Math.ceil(blockCount * pct);
        addSquares(reqs[fab], `Squares (Fabric ${fab})`, count, cut, s.fabricWidth);
        lines.push(`Fabric ${fab}: ${count} squares (${Math.round(pct * 100)}% of layout)`);
      }
      notes.push(`Cut ${blockCount} squares total at ${cut}" (finished ${s.blockSize}" + 1/2" for seam allowance), split across your fabrics:`);
      lines.forEach((l) => notes.push(l));
    } else {
      const squareFab = (s.assignments["squares"] ?? "A") as FabricKey;
      addSquares(reqs[squareFab], "Squares", blockCount, cut, s.fabricWidth);
      notes.push(
        `Cut ${blockCount} squares of Fabric ${squareFab} at ${cut}" (finished ${s.blockSize}" + 1/2" for seam allowance).`,
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
  }

  // Border
  if (s.borderWidth > 0) {
    const borderDefault = (getPattern(s.pattern)?.sections.find((sec) => sec.id === "border")?.defaultFabric ?? "C") as FabricKey;
    const borderFab = (s.assignments["border"] ?? borderDefault) as FabricKey;
    const b = borderInches(s.quiltWidth - 2 * s.borderWidth, s.quiltHeight - 2 * s.borderWidth, s.borderWidth, s.fabricWidth);
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
    s.pattern === "rail-fence" ||
    s.pattern === "log-cabin" ||
    s.pattern === "ohio-star" ||
    s.pattern === "flying-geese" ||
    s.pattern === "disappearing-nine-patch" ||
    s.pattern === "squares-on-point" ||
    s.pattern === "plus-block" ||
    s.pattern === "churn-dash";
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

