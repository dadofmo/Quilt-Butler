import type { FabricKey } from "./planner-store";
import type { CustomBlockDesign, CustomCell } from "./custom-block";
import { getPattern } from "./patterns";
import type { GridPiece } from "./grid-optimizer";

/**
 * X Marks the Chain — a two-block alternating set born in the Custom Block
 * Studio. Both blocks are stored as ordinary custom-block designs so the
 * shared renderer (blockPolys / CustomBlockShapes), the grid-cutting
 * optimizer and the custom-block yardage branch all apply unchanged.
 *
 * Block A (the "X") is a 4×4 grid: a 2×2 plain centre square, and in each
 * corner quadrant three half-square triangles whose accent halves meet to
 * form a diamond arm of the X. The inner tip of each diamond tucks behind
 * the centre square — exactly the reference look.
 *
 * Block B (the "chain") is a 6×6 grid of plain squares: a 2×2 centre, four
 * accent squares on the inner diagonals, four corner squares, and background
 * everywhere else. Cuts preserve four corner four-patches and five whole
 * macro squares, keeping assembly symmetric with straight seams.
 *
 * Role fabrics inside the designs are ALWAYS the letters A–F below; they are
 * remapped to the quilter's real fabric choices (via the pattern's sections)
 * by `xChainDesigns` before rendering or tallying, so nothing is hard-coded.
 */

/** Block A roles: A = centre square, B = X diamond arms, C = background. */
export const X_CHAIN_BLOCK_A: CustomBlockDesign = {
  size: 4,
  cells: {
    // Centre 2×2 square
    "1,1": { kind: "square", rotation: 0, fabrics: ["A"] },
    "1,2": { kind: "square", rotation: 0, fabrics: ["A"] },
    "2,1": { kind: "square", rotation: 0, fabrics: ["A"] },
    "2,2": { kind: "square", rotation: 0, fabrics: ["A"] },
    // Top-left quadrant: diamond arm points down-right toward the centre.
    "0,0": { kind: "hst", rotation: 0, fabrics: ["C", "B"] },
    "0,1": { kind: "hst", rotation: 90, fabrics: ["C", "B"] },
    "1,0": { kind: "hst", rotation: 270, fabrics: ["C", "B"] },
    // Top-right quadrant
    "0,2": { kind: "hst", rotation: 0, fabrics: ["C", "B"] },
    "0,3": { kind: "hst", rotation: 90, fabrics: ["C", "B"] },
    "1,3": { kind: "hst", rotation: 180, fabrics: ["C", "B"] },
    // Bottom-left quadrant
    "2,0": { kind: "hst", rotation: 0, fabrics: ["C", "B"] },
    "3,0": { kind: "hst", rotation: 270, fabrics: ["C", "B"] },
    "3,1": { kind: "hst", rotation: 180, fabrics: ["C", "B"] },
    // Bottom-right quadrant
    "2,3": { kind: "hst", rotation: 90, fabrics: ["C", "B"] },
    "3,2": { kind: "hst", rotation: 270, fabrics: ["C", "B"] },
    "3,3": { kind: "hst", rotation: 180, fabrics: ["C", "B"] },
  },
};

/** Block B roles: C = background, D = centre, E = accent squares, F = corners. */
export const X_CHAIN_BLOCK_B: CustomBlockDesign = (() => {
  const cells: Record<string, CustomCell> = {};
  const sq = (f: FabricKey): CustomCell => ({ kind: "square", rotation: 0, fabrics: [f] });
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      cells[`${r},${c}`] = sq("C");
    }
  }
  // 2×2 centre
  for (const k of ["2,2", "2,3", "3,2", "3,3"]) cells[k] = sq("D");
  // Four accent squares on the inner diagonals
  for (const k of ["1,1", "1,4", "4,1", "4,4"]) cells[k] = sq("E");
  // Four corner squares
  for (const k of ["0,0", "0,5", "5,0", "5,5"]) cells[k] = sq("F");
  return { size: 6, cells };
})();

/** Section id for each role letter used inside the two designs. */
const ROLE_SECTION: Record<string, string> = {
  A: "center",
  B: "points",
  C: "background",
  D: "chainCenter",
  E: "chainAccent",
  F: "chainCorners",
};

/** Replace the role letters in a design with real fabric keys. */
export function remapDesign(
  design: CustomBlockDesign,
  map: Partial<Record<FabricKey, FabricKey>>,
): CustomBlockDesign {
  const cells: Record<string, CustomCell> = {};
  for (const [k, cell] of Object.entries(design.cells)) {
    cells[k] = { ...cell, fabrics: cell.fabrics.map((f) => map[f] ?? f) };
  }
  return { ...design, cells };
}

/**
 * The two blocks with the quilter's fabric assignments applied. Missing
 * assignments fall back to the pattern's section defaults (the single source
 * of truth in src/lib/patterns.ts), so previews never hard-code colours.
 */
export function xChainDesigns(assignments?: Record<string, FabricKey | undefined>): {
  a: CustomBlockDesign;
  b: CustomBlockDesign;
} {
  const def = getPattern("x-marks-the-chain");
  const role = (letter: FabricKey): FabricKey => {
    const sectionId = ROLE_SECTION[letter];
    const section = def?.sections.find((sec) => sec.id === sectionId);
    return (assignments?.[sectionId] ?? section?.defaultFabric ?? letter) as FabricKey;
  };
  const map: Partial<Record<FabricKey, FabricKey>> = {
    A: role("A"),
    B: role("B"),
    C: role("C"),
    D: role("D"),
    E: role("E"),
    F: role("F"),
  };
  return { a: remapDesign(X_CHAIN_BLOCK_A, map), b: remapDesign(X_CHAIN_BLOCK_B, map) };
}

/** Whole plain units used by the straight-seam assembly (grid coordinates). */
export function xChainPlainUnits(gridSize: number): Array<{
  row: number; col: number; cellsW: number; cellsH: number;
}> {
  if (gridSize === 4) return [{ row: 1, col: 1, cellsW: 2, cellsH: 2 }];
  const units = [[2, 2], [0, 2], [2, 0], [2, 4], [4, 2]].map(([row, col]) =>
    ({ row, col, cellsW: 2, cellsH: 2 }));
  for (const row of [0, 4]) for (const col of [0, 4]) {
    for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) {
      units.push({ row: row + dr, col: col + dc, cellsW: 1, cellsH: 1 });
    }
  }
  return units;
}

/** Keep construction units even when the quilter assigns matching fabrics. */
export function xChainPlainPieces(design: CustomBlockDesign, blockSize: number, seam: number): GridPiece[] {
  const unit = blockSize / design.size;
  return xChainPlainUnits(design.size).flatMap(({ row, col, cellsW, cellsH }) => {
    const fabric = design.cells[`${row},${col}`]?.fabrics[0];
    if (!fabric) return [];
    return [{ fabric, cellsW, cellsH, cutW: cellsW * unit + seam,
      cutH: cellsH * unit + seam, count: 1 }];
  });
}

/** Directions use the same role resolution and units as previews and cuts. */
export function xChainSewingNotes(blockSize: number, assignments: Record<string, FabricKey | undefined>, seam: number): string[] {
  const { a, b } = xChainDesigns(assignments);
  const center = a.cells["1,1"].fabrics[0];
  const points = a.cells["0,0"].fabrics[1];
  const background = b.cells["0,1"].fabrics[0];
  const chainCenter = b.cells["2,2"].fabrics[0];
  const chainAccent = b.cells["1,1"].fabrics[0];
  const chainCorners = b.cells["0,0"].fabrics[0];
  const xUnit = blockSize / 4;
  const chainUnit = blockSize / 6;
  const cut = (finished: number) => (Math.round((finished + seam) * 100) / 100).toFixed(2);
  return [
    `Block A orientation: lay out the 12 trimmed HSTs around the uncut Fabric ${center} centre square. Using the right-angle corner of the Fabric ${points} triangle: top row (left to right) — bottom-right, bottom-left, bottom-right, bottom-left; left side (top to bottom) — top-right, bottom-right; right side (top to bottom) — top-left, bottom-left; bottom row (left to right) — top-right, top-left, top-right, top-left. All four diamond arms must match after a quarter turn; check the bottom-right arm before sewing.`,
    `Block A assembly: use 1/4" seams. Join the two left-side HSTs vertically and the two right-side HSTs vertically; each pair measures ${cut(xUnit)}" × ${cut(2 * xUnit)}" unfinished. Sew these pairs to opposite sides of the uncut ${cut(2 * xUnit)}" Fabric ${center} centre square. Sew the four top HSTs into one row and the four bottom HSTs into one row, each ${cut(blockSize)}" × ${cut(xUnit)}" unfinished. Add the top and bottom rows with full straight seams; do not split the centre square. Press bulky joins open and keep 1/4" beyond the diamond points.`,
    `Block B cutting per block: one Fabric ${chainCenter} centre square and four Fabric ${background} edge squares at ${cut(2 * chainUnit)}"; four Fabric ${chainCorners} corner squares, four Fabric ${chainAccent} accent squares and eight Fabric ${background} squares at ${cut(chainUnit)}". These use a separate ${chainUnit.toFixed(2)}" finished grid, not Block A's ${xUnit.toFixed(2)}" grid. Keep the five large squares whole, even when fabric choices match.`,
    `Block B assembly: make four corner four-patches with 1/4" seams. Each has a Fabric ${chainCorners} square at the block's outside corner, a Fabric ${chainAccent} square diagonally inward and two Fabric ${background} squares in the remaining positions. Sew pairs, then join the pairs; each four-patch measures ${cut(2 * chainUnit)}" unfinished. Arrange a 3×3 layout: corner four-patch / whole background square / corner four-patch; whole background square / whole centre square / whole background square; corner four-patch / whole background square / corner four-patch. Sew the three units in each band, then join the three bands, pressing adjacent seams in opposite directions to nest. No Y-seams or partial seams.`,
  ];
}
