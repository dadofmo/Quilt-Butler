import type { FabricKey, PlannerState } from "./planner-store";
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
  cutSize: number, // each piece is cutSize x cutSize (square pieces in our patterns)
  count: number,
  fabricWidth: number,
): { stripWidth: number; stripCount: number } {
  const usable = fabricWidth - 0.5; // selvage allowance
  const perStrip = Math.max(1, Math.floor(usable / cutSize));
  const stripCount = Math.ceil(count / perStrip);
  return { stripWidth: cutSize, stripCount };
}

// Border length needed (down the bolt, cut as long strips across width-of-fabric and pieced)
function borderInches(quiltW: number, quiltH: number, borderW: number, fabricWidth: number) {
  if (borderW <= 0) return { stripWidth: 0, stripCount: 0, inches: 0 };
  // Two side strips at quiltH, two top/bottom at quiltW + 2*borderW
  const sides = 2 * quiltH;
  const topBot = 2 * (quiltW + 2 * borderW);
  const totalLength = sides + topBot;
  const usable = fabricWidth - 0.5;
  const stripsNeeded = Math.ceil(totalLength / usable);
  return { stripWidth: borderW + SEAM, stripCount: stripsNeeded, inches: stripsNeeded * (borderW + SEAM) };
}

interface CalcResult {
  fabrics: FabricRequirement[];
  unsupported?: boolean;
  notes?: string[];
}

export function calculateYardage(s: PlannerState): CalcResult {
  const pattern = getPattern(s.pattern);
  if (!pattern) return { fabrics: [] };
  if (!pattern.hasMath) return { fabrics: [], unsupported: true };

  // Build per-fabric piece lists, then convert to strips.
  const reqs: Record<FabricKey, FabricRequirement> = {
    A: blank("A"),
    B: blank("B"),
    C: blank("C"),
    D: blank("D"),
  };

  const innerW = s.quiltWidth - 2 * s.borderWidth;
  const innerH = s.quiltHeight - 2 * s.borderWidth;
  const blocksAcross = Math.max(1, Math.floor(innerW / s.blockSize));
  const blocksDown = Math.max(1, Math.floor(innerH / s.blockSize));
  const blockCount = blocksAcross * blocksDown;
  const notes: string[] = [
    `${blocksAcross} × ${blocksDown} = ${blockCount} blocks (${s.blockSize}" finished)`,
  ];

  if (s.pattern === "nine-patch") {
    // 9 squares per block. Patch finished size = blockSize/3, cut size = +0.5
    const patchFinished = s.blockSize / 3;
    const cut = patchFinished + SEAM;
    // Center & 4 corners = 5 of fabric "center"; 4 alternating = 4 of fabric "outer"
    const centerCount = 5 * blockCount;
    const outerCount = 4 * blockCount;
    const centerFab = s.assignments["center"] ?? "A";
    const outerFab = s.assignments["outer"] ?? "B";
    addSquares(reqs[centerFab], "Center & corner squares", centerCount, cut, s.fabricWidth);
    addSquares(reqs[outerFab], "Alternating squares", outerCount, cut, s.fabricWidth);
  } else if (s.pattern === "hst") {
    // Each block = 1 HST. Cut size for two HSTs from one square pair = finished + 7/8.
    // Simpler: each block needs 1 square of each fabric at (blockSize + 7/8) -> yields 2 HSTs (we use 1, waste 1).
    // To avoid waste, pair blocks: count squares of each = ceil(blockCount/2).
    const cut = s.blockSize + HST_EXTRA;
    const squaresEach = Math.ceil(blockCount / 2);
    const t1 = s.assignments["tri1"] ?? "A";
    const t2 = s.assignments["tri2"] ?? "B";
    addSquares(reqs[t1], "Triangle A squares", squaresEach, cut, s.fabricWidth);
    addSquares(reqs[t2], "Triangle B squares", squaresEach, cut, s.fabricWidth);
    notes.push(`Cut ${squaresEach} squares of each fabric at ${cut}". Pair, sew diagonal, yields 2 HSTs each.`);
  }

  // Border
  if (s.borderWidth > 0) {
    const borderFab = s.assignments["border"] ?? "C";
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

  // Convert to yards
  const out: FabricRequirement[] = (["A", "B", "C", "D"] as FabricKey[])
    .map((k) => reqs[k])
    .filter((r) => r.totalInches > 0)
    .map((r) => ({ ...r, yards: inchesToYards(r.totalInches, s.safetyBuffer) }));

  return { fabrics: out, notes };
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
