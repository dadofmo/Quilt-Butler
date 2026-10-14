/** Reference coordinates: the central nine-patch occupies half the block. */
export type AlaskaRole = "light" | "dark" | "cross" | "peach" | "coral" | "diamond" | "edge";
export interface AlaskaPiece { role: AlaskaRole; points: [number, number][] }

export function alaskaGeometry(): AlaskaPiece[] {
  const pieces: AlaskaPiece[] = [];
  const polygon = (role: AlaskaRole, points: [number, number][]) => pieces.push({ role, points });
  // Peach is above the diagonal on the left, below it on the right.
  for (const [x, y, slash, peachTop] of [[0, 0, 0, 1], [9, 0, 1, 0], [0, 9, 1, 1], [9, 9, 0, 0]]) {
    polygon(peachTop ? "peach" : "coral", slash ? [[x, y], [x + 3, y], [x, y + 3]] : [[x, y], [x + 3, y], [x + 3, y + 3]]);
    polygon(peachTop ? "coral" : "peach", slash ? [[x + 3, y], [x + 3, y + 3], [x, y + 3]] : [[x, y], [x + 3, y + 3], [x, y + 3]]);
  }
  // Each outer side is two 3×3 split-triangle squares. Rotating the top side
  // clockwise reproduces the alternating peach/coral placement in the reference.
  for (let turn = 0; turn < 4; turn++) {
    const rotate = ([x, y]: [number, number]): [number, number] => {
      for (let i = 0; i < turn; i++) [x, y] = [12 - y, x];
      return [x, y];
    };
    const side: AlaskaPiece[] = [
      { role: "peach", points: [[3, 0], [6, 3], [3, 3]] },
      { role: "edge", points: [[3, 0], [6, 0], [4.5, 1.5]] },
      { role: "diamond", points: [[6, 0], [6, 3], [4.5, 1.5]] },
      { role: "coral", points: [[9, 0], [9, 3], [6, 3]] },
      { role: "edge", points: [[6, 0], [9, 0], [7.5, 1.5]] },
      { role: "diamond", points: [[6, 0], [7.5, 1.5], [6, 3]] },
    ];
    side.forEach(p => polygon(p.role, p.points.map(rotate)));
  }
  for (const [x, y] of [[5, 3], [3, 5], [7, 5], [5, 7]])
    polygon("cross", [[x, y], [x + 2, y], [x + 2, y + 2], [x, y + 2]]);
  for (const [x, y, slash, darkTop] of [[3, 3, 0, 1], [7, 3, 1, 1], [3, 7, 1, 0], [7, 7, 0, 0]]) {
    const upper: [number, number][] = slash ? [[x, y], [x + 2, y], [x, y + 2]] : [[x, y], [x + 2, y], [x + 2, y + 2]];
    const lower: [number, number][] = slash ? [[x + 2, y], [x + 2, y + 2], [x, y + 2]] : [[x, y], [x + 2, y + 2], [x, y + 2]];
    polygon(darkTop ? "dark" : "light", upper);
    polygon(darkTop ? "light" : "dark", lower);
  }
  polygon("light", [[5, 5], [7, 5], [6, 6]]);
  polygon("light", [[5, 7], [6, 6], [7, 7]]);
  polygon("dark", [[5, 5], [6, 6], [5, 7]]);
  polygon("dark", [[7, 5], [7, 7], [6, 6]]);
  return pieces;
}