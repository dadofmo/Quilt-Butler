/** Album 5 Patch: a three-rail square set on point, not bias-cut strips. */
export type AlbumRole = "dark" | "light" | "bars";
export type AlbumPoint = [number, number];
export interface AlbumPiece { role: AlbumRole; points: AlbumPoint[] }

export function albumFivePatchGeometry(): AlbumPiece[] {
  const pieces: AlbumPiece[] = [];
  const add = (role: AlbumRole, points: AlbumPoint[]) => pieces.push({ role, points });
  // A 10-unit draft: the centre diamond spans 8 units; corners are 2-unit HSTs.
  for (let i = 0; i < 3; i++) {
    const a = 4 * i / 3, b = 4 * (i + 1) / 3;
    add(i === 1 ? "light" : "dark", [[1 + a, 5 + a], [5 + a, 1 + a], [5 + b, 1 + b], [1 + b, 5 + b]]);
  }
  for (let turn = 0; turn < 4; turn++) {
    const rotate = ([x, y]: AlbumPoint): AlbumPoint => {
      for (let i = 0; i < turn; i++) [x, y] = [10 - y, x];
      return [x, y];
    };
    const p = (role: AlbumRole, points: AlbumPoint[]) => add(role, points.map(rotate));
    p("bars", [[0, 4], [4, 0], [5, 1], [1, 5]]);
    p("light", [[0, 0], [2, 0], [0, 2]]);
    p("dark", [[2, 0], [2, 2], [0, 2]]);
    p("light", [[2, 0], [4, 0], [2, 2]]);
    p("light", [[0, 2], [2, 2], [0, 4]]);
    // One setting triangle at each midpoint (not four duplicated pairs).
    p("light", [[4, 0], [6, 0], [5, 1]]);
  }
  return pieces;
}

const upEighth = (n: number) => Math.ceil((n - 1e-10) * 8) / 8;
export function albumFivePatchDimensions(block: number) {
  if (!(block > 0)) throw new Error("A positive Album 5 Patch size is required");
  const corner = block / 5;
  const panel = 2 * corner * Math.SQRT2;
  const bar = corner / Math.SQRT2;
  return {
    corner, panel, rail: panel / 3, bar,
    railBlankLength: upEighth(panel + 0.5), railBlankWidth: upEighth(panel / 3 + 0.5),
    barBlankLength: upEighth(panel + 0.5), barBlankWidth: upEighth(bar + 0.5),
    hstBlank: upEighth(corner + 1), // oversized two-at-a-time HSTs
    cornerTriangleBlank: upEighth(corner + 0.875),
    capBlank: upEighth(bar + 0.875),
  };
}

/** Offset a counter-clockwise finished polygon by a true 1/4 inch. */
function seamOffset(seam: AlbumPoint[]): AlbumPoint[] {
  const lines = seam.map(([x, y], i) => {
    const [nx, ny] = seam[(i + 1) % seam.length];
    const dx = nx - x, dy = ny - y, length = Math.hypot(dx, dy);
    return { a: dy / length, b: -dx / length, c: (dy * x - dx * y) / length + 0.25 };
  });
  return lines.map((line, i) => {
    const previous = lines[(i + lines.length - 1) % lines.length];
    const det = previous.a * line.b - line.a * previous.b;
    return [(previous.c * line.b - line.c * previous.b) / det,
      (previous.a * line.c - line.a * previous.c) / det];
  });
}

export function albumFivePatchTemplates(block: number) {
  const d = albumFivePatchDimensions(block);
  const rectangle = (w: number, h: number): AlbumPoint[] => [[0, 0], [w, 0], [w, h], [0, h]];
  const triangle = (leg: number): AlbumPoint[] => [[0, 0], [leg, 0], [0, leg]];
  return [
    { name: "Centre rail — cut 2 dark, 1 light", seam: rectangle(d.panel, d.rail) },
    { name: "Accent bar — cut 4", seam: rectangle(d.panel, d.bar) },
    { name: "Corner HST — trim 4 sewn units", seam: rectangle(d.corner, d.corner) },
    { name: "Pieced corner triangle — trim 4 sewn units", seam: triangle(2 * d.corner) },
    { name: "Extended corner triangle — trim 2 sewn units", seam: triangle(3 * d.corner) },
    { name: "Bar-end setting triangle — cut 4", seam: triangle(d.bar) },
  ].map(t => ({ ...t, cut: seamOffset(t.seam) }));
}