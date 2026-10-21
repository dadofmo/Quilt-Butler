/**
 * Brick Work (also Roman Cross / Chicago Pavement): an on-point block of
 * four continuous 1×3 "brick" bars, eight accent squares and a background
 * centre bar, squared up with setting and corner triangles.
 *
 * Geometry is drafted in the on-point frame (u, v) in units of the small
 * square's side w, with the block being the diamond |u| + |v| ≤ 4. The
 * mapping x = (u − v)/8 + ½, y = (u + v)/8 + ½ turns it into the unit block
 * square, so w = B / (4√2) and every 45° seam is a straight line.
 */
export type BrickWorkRole = "bars" | "squares" | "background";
export type BrickWorkPoint = [number, number];
export interface BrickWorkPiece { role: BrickWorkRole; kind: "bar" | "square" | "setting" | "corner"; points: BrickWorkPoint[] }

const rect = (u0: number, v0: number, u1: number, v1: number): BrickWorkPoint[] => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
const toBlock = ([u, v]: BrickWorkPoint): BrickWorkPoint => [(u - v) / 8 + 0.5, (u + v) / 8 + 0.5];

/** Pieces in the unit block square (0..1). */
export function brickWorkGeometry(): BrickWorkPiece[] {
  const raw: BrickWorkPiece[] = [
    // Centre 3×3: continuous background bar flanked by two background squares
    // and four inner accent squares.
    { role: "background", kind: "bar", points: rect(-0.5, -1.5, 0.5, 1.5) },
    { role: "background", kind: "square", points: rect(-1.5, -0.5, -0.5, 0.5) },
    { role: "background", kind: "square", points: rect(0.5, -0.5, 1.5, 0.5) },
  ];
  for (let turn = 0; turn < 4; turn++) {
    const rot = (p: BrickWorkPoint): BrickWorkPoint => {
      let [u, v] = p;
      for (let i = 0; i < turn; i++) [u, v] = [-v, u];
      return [u, v];
    };
    const add = (role: BrickWorkRole, kind: BrickWorkPiece["kind"], pts: BrickWorkPoint[]) => raw.push({ role, kind, points: pts.map(rot) });
    add("squares", "square", rect(0.5, -1.5, 1.5, -0.5)); // inner accent
    add("bars", "bar", rect(-1.5, -2.5, 1.5, -1.5)); // brick bar
    add("squares", "square", rect(-0.5, -3.5, 0.5, -2.5)); // outer tip
    add("background", "setting", [[0.5, -3.5], [1.5, -2.5], [0.5, -2.5]]);
    add("background", "setting", [[-0.5, -3.5], [-0.5, -2.5], [-1.5, -2.5]]);
    add("background", "setting", [[1.5, -2.5], [2.5, -1.5], [1.5, -1.5]]);
    add("background", "corner", [[-0.5, -3.5], [0, -4], [0.5, -3.5]]);
  }
  return raw.map(p => ({ ...p, points: p.points.map(toBlock) }));
}

const upEighth = (n: number) => Math.ceil((n - 1e-10) * 8) / 8;

/** Finished and rotary-cut sizes for a block of finished side `block`. */
export function brickWorkDimensions(block: number) {
  if (!(block > 0) || !Number.isFinite(block)) throw new Error("A positive Brick Work block size is required");
  const unit = block / (4 * Math.SQRT2); // finished small-square side
  return {
    unit,
    squareExact: unit + 0.5,
    squareBlank: upEighth(unit + 0.5),
    barExactLength: 3 * unit + 0.5,
    barBlankLength: upEighth(3 * unit + 0.5),
    /** Setting triangles: quarter-square cut, long side on the block edge. */
    settingBlank: upEighth(block / 4 + 1.25),
    /** Corner triangles: half-square cut, legs on the block edges. */
    cornerBlank: upEighth(block / 8 + 0.875),
  };
}
