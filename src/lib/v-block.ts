export type TemplatePoint = [number, number];

/** Offset each finished seam by 1/4 inch, then clip dog ears to the unit edges. */
export function vBlockTemplates(unit: number) {
  if (!(unit > 0)) throw new Error("A positive V-block size is required");
  const q = 0.25;
  const center: TemplatePoint[] = [[0, 0], [unit, 0], [unit / 2, unit]];
  const left: TemplatePoint[] = [[0, 0], [unit / 2, unit], [0, unit]];
  const right: TemplatePoint[] = [[unit, 0], [unit, unit], [unit / 2, unit]];
  const offset = (triangle: TemplatePoint[]) => {
    const lines = triangle.map(([x, y], i) => {
      const [nx, ny] = triangle[(i + 1) % triangle.length];
      const dx = nx - x, dy = ny - y, length = Math.hypot(dx, dy);
      return { a: dy / length, b: -dx / length, c: (dy * x - dx * y) / length + q };
    });
    let poly: TemplatePoint[] = lines.map((line, i) => {
      const previous = lines[(i + lines.length - 1) % lines.length];
      const det = previous.a * line.b - line.a * previous.b;
      return [(previous.c * line.b - line.c * previous.b) / det,
        (previous.a * line.c - line.a * previous.c) / det];
    });
    for (const [axis, boundary, direction] of [[0, -q, 1], [0, unit + q, -1], [1, -q, 1], [1, unit + q, -1]]) {
      const next: TemplatePoint[] = [];
      for (let i = 0; i < poly.length; i++) {
        const p = poly[i], r = poly[(i + 1) % poly.length];
        const insideP = direction * (p[axis] - boundary) >= -1e-10;
        const insideR = direction * (r[axis] - boundary) >= -1e-10;
        if (insideP) next.push(p);
        if (insideP !== insideR) {
          const t = (boundary - p[axis]) / (r[axis] - p[axis]);
          next.push([p[0] + t * (r[0] - p[0]), p[1] + t * (r[1] - p[1])]);
        }
      }
      poly = next;
    }
    return poly;
  };
  return [center, left, right].map((seam, i) => ({
    name: ["Background center", "Star point — left", "Star point — right"][i], seam, cut: offset(seam),
  }));
}