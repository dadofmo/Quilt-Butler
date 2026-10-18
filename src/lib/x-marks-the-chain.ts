import type { FabricKey } from "./planner-store";
import type { CustomBlockDesign, CustomCell } from "./custom-block";
import { getPattern } from "./patterns";

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
 * everywhere else. The grid optimizer merges the background runs into
 * continuous strips, so no matching fabric is ever pieced back together.
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
    "2,3": { kind: "hst", rotation: 270, fabrics: ["C", "B"] },
    "3,2": { kind: "hst", rotation: 90, fabrics: ["C", "B"] },
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
