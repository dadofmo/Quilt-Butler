export type ChurnRole = "corners" | "bg" | "bars" | "center";
export type ChurnPoint = [number, number];

export function churnDimensions(blockSize: number) {
  const unit = blockSize / 3;
  return { unit, square: unit + 0.5, hst: unit + 0.875, barLength: unit + 0.5, barWidth: unit / 2 + 0.5 };
}

/** Finished fabric regions; the reference's white seams are not fabric. */
export function churnPolygons(size: number): { role: ChurnRole; points: ChurnPoint[] }[] {
  const u = size / 3;
  const pieces: { role: ChurnRole; points: ChurnPoint[] }[] = [];
  for (const [gx, gy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) {
    const ox = gx === 0 ? 0 : size;
    const oy = gy === 0 ? 0 : size;
    const ix = gx === 0 ? u : 2 * u;
    const iy = gy === 0 ? u : 2 * u;
    pieces.push({ role: "bg", points: [[ox, oy], [ox, iy], [ix, oy]] });
    pieces.push({ role: "corners", points: [[ix, iy], [ox, iy], [ix, oy]] });
  }
  const rect = (role: ChurnRole, x: number, y: number, w: number, h: number) =>
    pieces.push({ role, points: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]] });
  rect("bg", u, 0, u, u / 2);
  rect("bars", u, u / 2, u, u / 2);
  rect("bars", u, 2 * u, u, u / 2);
  rect("bg", u, 2.5 * u, u, u / 2);
  rect("bg", 0, u, u / 2, u);
  rect("bars", u / 2, u, u / 2, u);
  rect("bars", 2 * u, u, u / 2, u);
  rect("bg", 2.5 * u, u, u / 2, u);
  rect("center", u, u, u, u);
  return pieces;
}