/** Reference geometry in a three-cell square; HST corners name the right angle. */
export type ContraryWifeRole = "corners" | "squares" | "light" | "dark";
export const CONTRARY_WIFE_CELLS = [
  { row: 0, col: 0, role: "corners" },
  { row: 0, col: 1, darkCorner: "bottom-right" },
  { row: 0, col: 2, role: "squares" },
  { row: 1, col: 0, darkCorner: "bottom-right" },
  { row: 1, col: 1, role: "squares" },
  { row: 1, col: 2, darkCorner: "top-left" },
  { row: 2, col: 0, role: "squares" },
  { row: 2, col: 1, darkCorner: "top-left" },
  { row: 2, col: 2, role: "corners" },
] as const;

export function contraryWifePolygons(size: number) {
  const u = size / 3;
  return CONTRARY_WIFE_CELLS.flatMap(cell => {
    const x = cell.col * u, y = cell.row * u;
    const tl: [number, number] = [x, y], tr: [number, number] = [x + u, y];
    const bl: [number, number] = [x, y + u], br: [number, number] = [x + u, y + u];
    if ("role" in cell) return [{ role: cell.role as ContraryWifeRole, points: [tl, tr, br, bl] }];
    // Top and right cells use /; left and bottom use / as well in the reference.
    // All four seams run from top-right to bottom-left. The light/dark halves reverse.
    return cell.darkCorner === "bottom-right"
      ? [{ role: "light" as const, points: [tl, tr, bl] }, { role: "dark" as const, points: [tr, br, bl] }]
      : [{ role: "dark" as const, points: [tl, tr, bl] }, { role: "light" as const, points: [tr, br, bl] }];
  });
}