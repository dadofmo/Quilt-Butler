/** Kansas Star is one square-in-a-square in two intrinsic checkerboard colorways. */
export type KansasColorway = "A" | "B";
export type KansasRole = "navy" | "ochre" | "sage";
export type KansasPoint = [number, number];

export function kansasColorway(row: number, col: number): KansasColorway {
  return (row + col) % 2 === 0 ? "A" : "B";
}

export function kansasCounts(rows: number, cols: number) {
  const total = rows * cols;
  const a = Math.ceil(total / 2), b = Math.floor(total / 2);
  return { a, b, navyCenters: a, ochreCenters: b, ochreTriangles: 4 * a, sageTriangles: 4 * b };
}

export function kansasDimensions(block: number) {
  if (!(block > 0)) throw new Error("Kansas Star requires a positive block size");
  return {
    centerFinished: block / Math.SQRT2,
    centerCut: block / Math.SQRT2 + 0.5,
    // Rounded UP to an eighth: conservative conventional half-square blanks,
    // cut once diagonally, with excess trimmed after all four straight seams.
    triangleStarter: Math.ceil((block / 2 + 0.875 - 1e-10) * 8) / 8,
    unfinished: block + 0.5,
  };
}

export function kansasGeometry(size: number, colorway: KansasColorway = "A"): { role: KansasRole; points: KansasPoint[] }[] {
  const h = size / 2;
  const center = colorway === "A" ? "navy" : "ochre";
  const corners = colorway === "A" ? "ochre" : "sage";
  return [
    { role: center, points: [[h, 0], [size, h], [h, size], [0, h]] },
    { role: corners, points: [[0, 0], [h, 0], [0, h]] },
    { role: corners, points: [[h, 0], [size, 0], [size, h]] },
    { role: corners, points: [[size, h], [size, size], [h, size]] },
    { role: corners, points: [[0, h], [h, size], [0, size]] },
  ];
}