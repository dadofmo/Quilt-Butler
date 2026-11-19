/** Dakota Gold reference: a 5×5 block with three continuous cross bars,
 * four plain inner squares and twelve HSTs. The white construction-reference
 * lines are guides, never fabric. Colour placements are mapped cell by cell:
 * four dark/pale, four dark/teal and four pale/teal HSTs form the reference's
 * continuous two-colour diagonal beams beside the inner squares. */
export type DakotaGoldRole = "cross" | "dark" | "teal" | "pale" | "squares";
export type DakotaGoldPair = "dark-pale" | "dark-teal" | "pale-teal";
export type DakotaGoldCorner = "top-left" | "top-right" | "bottom-right" | "bottom-left";
export type DakotaGoldPoint = [number, number];

export type DakotaGoldCell =
  | { row: number; col: number; kind: "cross" }
  | { row: number; col: number; kind: "square"; role: "squares" }
  | { row: number; col: number; kind: "hst"; pair: DakotaGoldPair; firstCorner: DakotaGoldCorner };

const X = { kind: "cross" as const };
const Q = { kind: "square" as const, role: "squares" as const };
const H = (pair: DakotaGoldPair, firstCorner: DakotaGoldCorner) => ({ kind: "hst" as const, pair, firstCorner });

const MAP = [
  [H("pale-teal", "top-right"), H("dark-pale", "top-right"), X, H("dark-teal", "top-left"), H("pale-teal", "bottom-right")],
  [H("dark-teal", "bottom-left"), Q, X, Q, H("dark-pale", "bottom-right")],
  [X, X, X, X, X],
  [H("dark-pale", "top-left"), Q, X, Q, H("dark-teal", "top-right")],
  [H("pale-teal", "top-left"), H("dark-teal", "bottom-right"), X, H("dark-pale", "bottom-left"), H("pale-teal", "bottom-left")],
] as const;

export const DAKOTA_GOLD_CELLS: readonly DakotaGoldCell[] = MAP.flatMap((row, r) =>
  row.map((cell, c) => ({ row: r, col: c, ...cell }) as DakotaGoldCell),
);

export const DAKOTA_GOLD_PAIR_ROLES: Record<DakotaGoldPair, readonly [Exclude<DakotaGoldRole, "cross" | "squares">, Exclude<DakotaGoldRole, "cross" | "squares">]> = {
  "dark-pale": ["dark", "pale"],
  "dark-teal": ["dark", "teal"],
  "pale-teal": ["pale", "teal"],
};

export const DAKOTA_GOLD_COUNTS = {
  hstUnits: 12,
  darkPaleHsts: 4,
  darkTealHsts: 4,
  paleTealHsts: 4,
  plainSquares: 4,
  verticalBars: 2,
  horizontalBars: 1,
} as const;

export interface DakotaGoldPiece {
  role: DakotaGoldRole;
  points: DakotaGoldPoint[];
  part: "hst" | "square" | "top-bar" | "centre-bar" | "bottom-bar";
  row?: number;
  col?: number;
  pair?: DakotaGoldPair;
  corner?: DakotaGoldCorner;
}

const OPPOSITE: Record<DakotaGoldCorner, DakotaGoldCorner> = {
  "top-left": "bottom-right",
  "top-right": "bottom-left",
  "bottom-right": "top-left",
  "bottom-left": "top-right",
};

/** Canonical flush geometry shared by picker, planner, results and print. */
export function dakotaGoldPieces(size: number): DakotaGoldPiece[] {
  if (!Number.isFinite(size) || size <= 0) throw new Error("Dakota Gold requires a positive preview size");
  const u = size / 5;
  const rect = (x: number, y: number, w: number, h: number): DakotaGoldPoint[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const pieces: DakotaGoldPiece[] = [
    { role: "cross", part: "top-bar", points: rect(2 * u, 0, u, 2 * u) },
    { role: "cross", part: "centre-bar", points: rect(0, 2 * u, size, u) },
    { role: "cross", part: "bottom-bar", points: rect(2 * u, 3 * u, u, 2 * u) },
  ];
  for (const cell of DAKOTA_GOLD_CELLS) {
    if (cell.kind === "cross") continue;
    const x = cell.col * u, y = cell.row * u;
    const tl: DakotaGoldPoint = [x, y], tr: DakotaGoldPoint = [x + u, y];
    const br: DakotaGoldPoint = [x + u, y + u], bl: DakotaGoldPoint = [x, y + u];
    if (cell.kind === "square") {
      pieces.push({ role: "squares", part: "square", row: cell.row, col: cell.col, points: [tl, tr, br, bl] });
      continue;
    }
    const triangles: Record<DakotaGoldCorner, DakotaGoldPoint[]> = {
      "top-left": [tl, tr, bl],
      "top-right": [tl, tr, br],
      "bottom-right": [tr, br, bl],
      "bottom-left": [tl, br, bl],
    };
    const [first, second] = DAKOTA_GOLD_PAIR_ROLES[cell.pair];
    const secondCorner = OPPOSITE[cell.firstCorner];
    pieces.push(
      { role: first, part: "hst", row: cell.row, col: cell.col, pair: cell.pair, corner: cell.firstCorner, points: triangles[cell.firstCorner] },
      { role: second, part: "hst", row: cell.row, col: cell.col, pair: cell.pair, corner: secondCorner, points: triangles[secondCorner] },
    );
  }
  return pieces;
}

const upEighth = (value: number) => Math.ceil(value * 8 - 1e-9) / 8;

/** Exact final cuts and conservative, trimmable two-at-a-time HST starters. */
export function dakotaGoldDimensions(block: number) {
  if (!Number.isFinite(block) || block <= 0) throw new Error("Dakota Gold requires a positive block size");
  const unit = block / 5;
  return {
    unit,
    square: unit + 0.5,
    hstStarter: upEighth(unit + 0.875),
    barWidth: unit + 0.5,
    verticalBarLength: 2 * unit + 0.5,
    horizontalBarLength: block + 0.5,
    blockTrim: block + 0.5,
  };
}

/** Pool pairs across the whole quilt; four HSTs of each pairing per block make complete pairs. */
export function dakotaGoldPairCounts(blockCount: number) {
  if (!Number.isInteger(blockCount) || blockCount < 0) throw new Error("Dakota Gold requires a non-negative whole block count");
  const darkPale = Math.ceil(DAKOTA_GOLD_COUNTS.darkPaleHsts * blockCount / 2);
  const darkTeal = Math.ceil(DAKOTA_GOLD_COUNTS.darkTealHsts * blockCount / 2);
  const paleTeal = Math.ceil(DAKOTA_GOLD_COUNTS.paleTealHsts * blockCount / 2);
  return {
    darkPale,
    darkTeal,
    paleTeal,
    darkPaleMade: 2 * darkPale,
    darkTealMade: 2 * darkTeal,
    paleTealMade: 2 * paleTeal,
    darkPaleSpares: 2 * darkPale - DAKOTA_GOLD_COUNTS.darkPaleHsts * blockCount,
    darkTealSpares: 2 * darkTeal - DAKOTA_GOLD_COUNTS.darkTealHsts * blockCount,
  };
}
