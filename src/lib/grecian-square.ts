/** Grecian Square reference: a 3×3 nine-patch. Four corner HSTs (dark/corner, dark toward the
 * block centre), four side units of two half-width bars (dark bar outside, light bar inside),
 * and one whole centre square. Reference white lines are seams, not fabric. */
export type GrecianSquareRole = "dark" | "light" | "centre" | "corners";
type Point = [number, number];
/** Corner cells name the corner where the corner-fabric triangle sits (always the block's outside corner). */
export const GRECIAN_SQUARE_CORNERS = [
  { row: 0, col: 0, outer: "top-left" },
  { row: 0, col: 2, outer: "top-right" },
  { row: 2, col: 0, outer: "bottom-left" },
  { row: 2, col: 2, outer: "bottom-right" },
] as const;
/** Side cells name the block edge the dark bar touches. */
export const GRECIAN_SQUARE_SIDES = [
  { row: 0, col: 1, outside: "top" },
  { row: 1, col: 0, outside: "left" },
  { row: 1, col: 2, outside: "right" },
  { row: 2, col: 1, outside: "bottom" },
] as const;
export function grecianSquarePolygons(size: number): { role: GrecianSquareRole; points: Point[] }[] {
  const u = size / 3, h = u / 2, out: { role: GrecianSquareRole; points: Point[] }[] = [];
  for (const c of GRECIAN_SQUARE_CORNERS) {
    const x = c.col * u, y = c.row * u;
    const tl: Point = [x, y], tr: Point = [x + u, y], br: Point = [x + u, y + u], bl: Point = [x, y + u];
    const t: Record<typeof c.outer, [Point[], Point[]]> = {
      "top-left": [[tl, tr, bl], [tr, br, bl]],
      "top-right": [[tl, tr, br], [tl, br, bl]],
      "bottom-left": [[tl, br, bl], [tl, tr, br]],
      "bottom-right": [[tr, br, bl], [tl, tr, bl]],
    };
    out.push({ role: "corners", points: t[c.outer][0] }, { role: "dark", points: t[c.outer][1] });
  }
  const rect = (x: number, y: number, w: number, hh: number): Point[] => [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]];
  for (const s of GRECIAN_SQUARE_SIDES) {
    const x = s.col * u, y = s.row * u;
    const [dark, light] = s.outside === "top" ? [rect(x, y, u, h), rect(x, y + h, u, h)]
      : s.outside === "bottom" ? [rect(x, y + h, u, h), rect(x, y, u, h)]
      : s.outside === "left" ? [rect(x, y, h, u), rect(x + h, y, h, u)]
      : [rect(x + h, y, h, u), rect(x, y, h, u)];
    out.push({ role: "dark", points: dark }, { role: "light", points: light });
  }
  out.push({ role: "centre", points: rect(u, u, u, u) });
  return out;
}
export function grecianSquareDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Grecian Square requires a positive block size");
  const unit = block / 3;
  return {
    unit, unitTrim: unit + .5, barWidth: unit / 2 + .5, barLength: unit + .5,
    hstStarter: Math.ceil((unit + 1) * 8 - 1e-9) / 8, blockTrim: block + .5,
  };
}
/** Per block: HSTs made two at a time (2 pairs -> 4 HSTs). */
export const GRECIAN_SQUARE_COUNTS = { darkStarters: 2, cornerStarters: 2, darkBars: 4, lightBars: 4, centre: 1 } as const;
