import type { FabricKey } from "./planner-store";
import type { CustomBlockDesign, CustomCell } from "./custom-block";
import { getPattern } from "./patterns";
import type { GridPiece } from "./grid-optimizer";
import { remapDesign } from "./x-marks-the-chain";

/**
 * Whirlwind Waltz — a two-block alternating set born in the Custom Block
 * Studio. Both blocks are 6×6 grids stored as ordinary custom-block designs,
 * so the shared renderer, unit tally and custom-block yardage branch apply.
 *
 * Block A (the "star") has four bent arms that spin around the centre in two
 * alternating fabrics, with corner squares in two more. Block B (the
 * "arrow") uses the same square layout but its eight HSTs flip so every arm
 * ends in an outward-pointing arrow. Each block is built as four 3×3
 * quadrants — one arm per quadrant — sewn row by row, then joined like a
 * four-patch: straight seams only, no Y-seams.
 *
 * Role letters inside the designs (A–I) are remapped to the quilter's real
 * fabrics by `whirlwindDesigns`, so nothing is hard-coded.
 */

const BG = "E";
type Corner = "BR" | "BL" | "TL" | "TR";
/** HST rotation that puts the coloured triangle's right angle in `corner`. */
const HST_ROT: Record<Corner, 0 | 90 | 180 | 270> = { BR: 0, BL: 90, TL: 180, TR: 270 };

function buildBlock(
  arm1: FabricKey,
  arm2: FabricKey,
  corner1: FabricKey,
  corner2: FabricKey,
  hsts: Record<string, [Corner, 1 | 2]>,
): CustomBlockDesign {
  const cells: Record<string, CustomCell> = {};
  const sq = (f: FabricKey): CustomCell => ({ kind: "square", rotation: 0, fabrics: [f] });
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) cells[`${r},${c}`] = sq(BG);
  for (const k of ["1,2", "2,1", "2,2", "3,3", "3,4", "4,3"]) cells[k] = sq(arm1);
  for (const k of ["1,3", "2,3", "2,4", "3,1", "3,2", "4,2"]) cells[k] = sq(arm2);
  cells["0,0"] = sq(corner1);
  cells["5,5"] = sq(corner1);
  cells["0,5"] = sq(corner2);
  cells["5,0"] = sq(corner2);
  for (const [k, [corner, arm]] of Object.entries(hsts)) {
    cells[k] = { kind: "hst", rotation: HST_ROT[corner], fabrics: [BG, arm === 1 ? arm1 : arm2] };
  }
  return { size: 6, cells };
}

/** Block A roles: A/B = spinning star arms, C/D = corner squares, E = background. */
export const WALTZ_BLOCK_A = buildBlock("A", "B", "C", "D", {
  "0,2": ["BL", 1], "0,3": ["BR", 2],
  "2,0": ["TR", 1], "2,5": ["TL", 2],
  "3,0": ["BR", 2], "3,5": ["BL", 1],
  "5,2": ["TL", 2], "5,3": ["TR", 1],
});

/** Block B roles: F/G = arrow arms, H/I = corner squares, E = background. */
export const WALTZ_BLOCK_B = buildBlock("F", "G", "H", "I", {
  "0,2": ["BR", 1], "0,3": ["BL", 2],
  "2,0": ["BR", 1], "2,5": ["BL", 2],
  "3,0": ["TR", 2], "3,5": ["TL", 1],
  "5,2": ["TR", 2], "5,3": ["TL", 1],
});

const ROLE_SECTION: Record<string, string> = {
  A: "starArms1",
  B: "starArms2",
  C: "starCorners1",
  D: "starCorners2",
  E: "background",
  F: "arrowArms1",
  G: "arrowArms2",
  H: "arrowCorners1",
  I: "arrowCorners2",
};

export function whirlwindDesigns(assignments?: Record<string, FabricKey | undefined>): {
  a: CustomBlockDesign;
  b: CustomBlockDesign;
} {
  const def = getPattern("whirlwind-waltz");
  const map: Partial<Record<FabricKey, FabricKey>> = {};
  for (const [letter, sectionId] of Object.entries(ROLE_SECTION)) {
    const section = def?.sections.find((sec) => sec.id === sectionId);
    map[letter as FabricKey] = (assignments?.[sectionId] ?? section?.defaultFabric ?? letter) as FabricKey;
  }
  return { a: remapDesign(WALTZ_BLOCK_A, map), b: remapDesign(WALTZ_BLOCK_B, map) };
}

type Unit = { row: number; col: number; cellsW: number; cellsH: number };
const u = (row: number, col: number, cellsW = 1): Unit => ({ row, col, cellsW, cellsH: 1 });

/** Plain construction units per quadrant, row by row (HSTs fill the gaps). */
export const WALTZ_QUADRANTS: Array<{ name: string; row: number; col: number; units: Unit[] }> = [
  { name: "Top-left", row: 0, col: 0, units: [u(0, 0), u(0, 1), u(1, 0, 2), u(1, 2), u(2, 1, 2)] },
  { name: "Top-right", row: 0, col: 3, units: [u(0, 4), u(0, 5), u(1, 3), u(1, 4, 2), u(2, 3, 2)] },
  { name: "Bottom-left", row: 3, col: 0, units: [u(3, 1, 2), u(4, 0, 2), u(4, 2), u(5, 0), u(5, 1)] },
  { name: "Bottom-right", row: 3, col: 3, units: [u(3, 3, 2), u(4, 3), u(4, 4, 2), u(5, 4), u(5, 5)] },
];

export function whirlwindPlainUnits(): Unit[] {
  return WALTZ_QUADRANTS.flatMap((q) => q.units);
}

/** Keep the quadrant bars whole even when the quilter assigns matching fabrics. */
export function whirlwindPlainPieces(design: CustomBlockDesign, blockSize: number, seam: number): GridPiece[] {
  const cell = blockSize / design.size;
  return whirlwindPlainUnits().flatMap(({ row, col, cellsW, cellsH }) => {
    const fabric = design.cells[`${row},${col}`]?.fabrics[0];
    if (!fabric) return [];
    return [{ fabric, cellsW, cellsH, cutW: cellsW * cell + seam, cutH: cellsH * cell + seam, count: 1 }];
  });
}

const CORNER_WORD: Record<number, string> = { 0: "bottom-right", 90: "bottom-left", 180: "top-left", 270: "top-right" };

/** Row-by-row quadrant recipe generated from the same design the previews draw. */
function quadrantRecipe(design: CustomBlockDesign, q: (typeof WALTZ_QUADRANTS)[number], cut: (n: number) => string, cellSize: number): string {
  const rows: string[] = [];
  for (let r = q.row; r < q.row + 3; r++) {
    const parts: string[] = [];
    for (let c = q.col; c < q.col + 3; ) {
      const unit = q.units.find((x) => x.row === r && x.col === c);
      const cell = design.cells[`${r},${c}`];
      if (unit) {
        const f = cell.fabrics[0];
        parts.push(unit.cellsW === 2
          ? `Fabric ${f} bar ${cut(2 * cellSize)}" × ${cut(cellSize)}"`
          : `Fabric ${f} square`);
        c += unit.cellsW;
      } else {
        parts.push(`HST (Fabric ${cell.fabrics[1]} triangle in the ${CORNER_WORD[cell.rotation]} corner)`);
        c += 1;
      }
    }
    rows.push(`row ${r - q.row + 1}: ${parts.join(", ")}`);
  }
  return `${q.name} quadrant — ${rows.join("; ")}.`;
}

export function whirlwindSewingNotes(blockSize: number, assignments: Record<string, FabricKey | undefined>, seam: number): string[] {
  const { a, b } = whirlwindDesigns(assignments);
  const cell = blockSize / 6;
  const cut = (finished: number) => (Math.round((finished + seam) * 100) / 100).toFixed(2);
  const recipe = (d: CustomBlockDesign) => WALTZ_QUADRANTS.map((q) => quadrantRecipe(d, q, cut, cell)).join(" ");
  return [
    `Both blocks share one 6×6 grid (${cell.toFixed(2)}" finished squares) and are built the same way: four 3×3 quadrants, each holding one arm. Trim every HST to ${cut(cell)}" before laying out.`,
    `Star block layout (left to right in each row): ${recipe(a)}`,
    `Arrow block layout (left to right in each row): ${recipe(b)} The squares match the star block; only the HSTs turn, so the arm tips point outward like arrows.`,
    `Block assembly (both blocks): use 1/4" seams. Sew each quadrant row left to right, keeping every bar whole, then join its three rows; each quadrant measures ${cut(3 * cell)}" square unfinished. Sew the two top quadrants together and the two bottom quadrants together, then join the halves with one long straight seam, nesting the centre seams so the four arms meet in a crisp point. No Y-seams or partial seams.`,
  ];
}
