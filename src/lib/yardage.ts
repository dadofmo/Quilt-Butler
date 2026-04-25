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

const SEAM = 0.5; // 1/4" seam allowance per side -> +0.5" total
const HST_EXTRA = 0.875; // extra for HST squares: finished + 7/8"
/**
 * Selvage allowance: real bolts are not perfectly the labeled width once you
 * trim selvages and account for crooked grain. We subtract 1.5" from the bolt
 * width when calculating how many pieces fit per strip — so a "44-inch" bolt
 * provides about 42.5" of usable fabric.
 */
const SELVAGE_TRIM = 1.5;

export const SEAM_ALLOWANCE_DESC =
  "1/4 inch seam allowance (0.25\" per side adds 0.5\" to cut size)";

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
      `To turn the squares into triangle blocks: stack one Fabric ${t1} square on top of one Fabric ${t2} square so the pretty (printed) sides face each other — the plain backs of the fabric should be facing out. On the back of the top square, use a pencil or fabric marker to draw a straight line from one corner to the opposite corner (a diagonal). Sew a seam 1/4" away from that line on BOTH sides of it (two parallel seams). Then cut along the drawn line with scissors or a rotary cutter — you'll get two pieces. Open each piece and press it flat with an iron (this is called "pressing open"). Each pair of squares makes 2 finished half-square triangle blocks, for ${blockCount} blocks total.`,
    );
  }

  // Border
  if (s.borderWidth > 0) {
    const borderFab = (s.assignments["border"] ?? "C") as FabricKey;
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
  return { fabrics: out, notes, materials };
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
