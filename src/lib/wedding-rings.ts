/** Wedding Rings reference: five rows, nine whole squares, sixteen HSTs. */
export type WeddingRole = "ring" | "field" | "accent";
export type WeddingCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
type Pt = [number, number];
type Cell = { kind: "square"; role: WeddingRole } | { kind: "hst"; partner: "field" | "accent"; ringCorner: WeddingCorner };
const S = (role: WeddingRole): Cell => ({ kind: "square", role });
const H = (partner: "field" | "accent", ringCorner: WeddingCorner): Cell => ({ kind: "hst", partner, ringCorner });
export const WEDDING_ROWS: readonly (readonly Cell[])[] = [
  [H("accent", "top-left"), H("field", "bottom-right"), S("ring"), H("field", "bottom-left"), H("accent", "top-right")],
  [H("field", "bottom-right"), H("accent", "top-left"), S("field"), H("accent", "top-right"), H("field", "bottom-left")],
  [S("ring"), S("field"), S("ring"), S("field"), S("ring")],
  [H("field", "top-right"), H("accent", "bottom-left"), S("field"), H("accent", "bottom-right"), H("field", "top-left")],
  [H("accent", "bottom-left"), H("field", "top-right"), S("ring"), H("field", "top-left"), H("accent", "bottom-right")],
];
export function weddingCounts() {
  const cells = WEDDING_ROWS.flat();
  return {
    ringSquares: cells.filter(c => c.kind === "square" && c.role === "ring").length,
    fieldSquares: cells.filter(c => c.kind === "square" && c.role === "field").length,
    fieldHst: cells.filter(c => c.kind === "hst" && c.partner === "field").length,
    accentHst: cells.filter(c => c.kind === "hst" && c.partner === "accent").length,
  };
}
export function weddingPolygons(size: number): { role: WeddingRole; points: Pt[] }[] {
  const u = size / 5;
  return WEDDING_ROWS.flatMap((row, r) => row.flatMap((cell, c) => {
    const x = c * u, y = r * u;
    const tl: Pt = [x, y], tr: Pt = [x + u, y], br: Pt = [x + u, y + u], bl: Pt = [x, y + u];
    if (cell.kind === "square") return [{ role: cell.role, points: [tl, tr, br, bl] }];
    const triangles: Record<WeddingCorner, [Pt[], Pt[]]> = {
      "top-left": [[tl, tr, bl], [tr, br, bl]],
      "top-right": [[tl, tr, br], [tl, br, bl]],
      "bottom-left": [[tl, br, bl], [tl, tr, br]],
      "bottom-right": [[tr, br, bl], [tl, tr, bl]],
    };
    const [ring, partner] = triangles[cell.ringCorner];
    return [{ role: "ring" as WeddingRole, points: ring }, { role: cell.partner, points: partner }];
  }));
}