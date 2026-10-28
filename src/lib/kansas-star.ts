/**
 * Kansas Star: ONE block is a 3×3 grid of square-in-a-square units in two
 * colorways laid out checkerboard-style inside the block (A at the four
 * corners and the centre, B on the four edges). Every quilt block is the
 * same 3×3 block; the checkerboard never continues across block boundaries.
 */
export type KansasColorway = "A" | "B";
export type KansasRole = "navy" | "ochre" | "sage";
export type KansasPoint = [number, number];

export const KANSAS_UNITS_PER_SIDE = 3;
export const KANSAS_A_UNITS = 5;
export const KANSAS_B_UNITS = 4;

/** Colorway of the unit at (row, col) inside one block. */
export function kansasColorway(row: number, col: number): KansasColorway {
  return (row + col) % 2 === 0 ? "A" : "B";
}

/** Unit and piece counts for a quilt of `blocks` identical 3×3 blocks. */
export function kansasCounts(blocks: number) {
  const a = KANSAS_A_UNITS * blocks, b = KANSAS_B_UNITS * blocks;
  return { blocks, a, b, navyCenters: a, ochreCenters: b, ochreTriangles: 4 * a, sageTriangles: 4 * b };
}

export function kansasDimensions(block: number) {
  if (!(block > 0)) throw new Error("Kansas Star requires a positive block size");
  const unit = block / KANSAS_UNITS_PER_SIDE;
  return {
    unit,
    unitUnfinished: unit + 0.5,
    centerFinished: unit / Math.SQRT2,
    centerCut: unit / Math.SQRT2 + 0.5,
    // Rounded UP to an eighth: conservative half-square blanks cut once
    // diagonally, with excess trimmed after all four straight seams.
    triangleStarter: Math.ceil((unit / 2 + 0.875 - 1e-10) * 8) / 8,
    unfinished: block + 0.5,
  };
}

/** One square-in-a-square unit of side `size` with its origin at (x, y). */
export function kansasUnitGeometry(size: number, colorway: KansasColorway, x = 0, y = 0): { role: KansasRole; colorway: KansasColorway; points: KansasPoint[] }[] {
  const h = size / 2;
  const center: KansasRole = colorway === "A" ? "navy" : "ochre";
  const corners: KansasRole = colorway === "A" ? "ochre" : "sage";
  const p = (px: number, py: number): KansasPoint => [x + px, y + py];
  return [
    { role: center, colorway, points: [p(h, 0), p(size, h), p(h, size), p(0, h)] },
    { role: corners, colorway, points: [p(0, 0), p(h, 0), p(0, h)] },
    { role: corners, colorway, points: [p(h, 0), p(size, 0), p(size, h)] },
    { role: corners, colorway, points: [p(size, h), p(size, size), p(h, size)] },
    { role: corners, colorway, points: [p(0, h), p(h, size), p(0, size)] },
  ];
}

/** The whole 3×3 Kansas Star block of side `size`. */
export function kansasGeometry(size: number) {
  const u = size / KANSAS_UNITS_PER_SIDE;
  const pieces: ReturnType<typeof kansasUnitGeometry> = [];
  for (let r = 0; r < KANSAS_UNITS_PER_SIDE; r++)
    for (let c = 0; c < KANSAS_UNITS_PER_SIDE; c++)
      pieces.push(...kansasUnitGeometry(u, kansasColorway(r, c), c * u, r * u));
  return pieces;
}
