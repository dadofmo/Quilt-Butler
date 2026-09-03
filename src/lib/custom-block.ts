import type { FabricKey } from "./planner-store";

/**
 * "Design Your Own Block" data model.
 *
 * A custom block is an N×N grid of cells (N = 2..8). Each cell holds one
 * pieced UNIT. Everything here is pure data + geometry — no React, no yardage.
 * The yardage engine (src/lib/yardage.ts) consumes `unitTally()` and routes
 * every count through the shared addSquares helper, exactly like the built-in
 * patterns do.
 */

export const MIN_GRID = 2;
export const MAX_GRID = 8;

/** The unit types a user can place. */
export type UnitKind = "square" | "hst" | "qst" | "cornered" | "onpoint" | "hrt" | "split";

/** Quarter-turn rotation, clockwise, in degrees. */
export type Rotation = 0 | 90 | 180 | 270;

export interface CustomCell {
  kind: UnitKind;
  rotation: Rotation;
  /**
   * Fabric per region, in the unit's canonical (unrotated) region order:
   *   square   → [whole]
   *   hst      → [triangle 1, triangle 2]
   *   qst      → [top, right, bottom, left]
   *   cornered → [main square, corner triangles]
   *   onpoint  → [diamond, background corners]
   *   hrt      → [triangle 1, triangle 2]  (covers 2 cells)
   *   split    → [first half, second half]
   */
  fabrics: FabricKey[];
  /**
   * Only used by "cornered": which corners carry a triangle, in canonical
   * order [top-left, top-right, bottom-right, bottom-left]. Missing = all four.
   */
  corners?: boolean[];
}

export interface CustomBlockDesign {
  /** Grid is always square: `size` × `size` cells. */
  size: number;
  /** Cells keyed "row,col" — one unit per cell. */
  cells: Record<string, CustomCell>;
}

export const REGION_COUNT: Record<UnitKind, number> = {
  square: 1,
  hst: 2,
  qst: 4,
  cornered: 2,
  onpoint: 2,
  hrt: 2,
  split: 2,
};

export const UNIT_LABEL: Record<UnitKind, string> = {
  square: "Plain square",
  hst: "Two triangles",
  qst: "Four triangles",
  cornered: "Snipped corners",
  onpoint: "Square on point",
  hrt: "Long triangles",
  split: "Split in half",
};

/** Plain-English explanation shown under each palette button. */
export const UNIT_HELP: Record<UnitKind, string> = {
  square: "One whole square of a single fabric. The simplest piece there is.",
  hst: "A square cut corner to corner so two fabrics meet on the diagonal. Quilters call this an HST.",
  qst: "A square split into four triangles that meet in the middle — the classic hourglass piece.",
  cornered:
    "A square with a small triangle across one or more corners, like a Snowball block. Tap the corners below to turn them on and off.",
  onpoint:
    "A square turned 45° so it sits like a diamond, with background triangles filling the four corners.",
  hrt: "A stretched diagonal across two side-by-side cells — a slant you cannot make from single squares.",
  split:
    "A square split straight across the middle into two halves — for stripes, bars and rails.",
};

/** Region names shown in the editor's fabric list, in canonical order. */
export const REGION_LABELS: Record<UnitKind, string[]> = {
  square: ["Square"],
  hst: ["Triangle 1", "Triangle 2"],
  qst: ["Top", "Right", "Bottom", "Left"],
  cornered: ["Main square", "Corner triangles"],
  onpoint: ["Diamond in the middle", "Background corners"],
  hrt: ["Triangle 1", "Triangle 2"],
  split: ["First half", "Second half"],
};

/** How many visually distinct rotations a unit type has. */
export const ROTATION_STEPS: Record<UnitKind, number> = {
  square: 1,
  hst: 4,
  qst: 4,
  cornered: 4,
  onpoint: 1,
  hrt: 4,
  split: 4,
};

/** Canonical corner flags for a "Snipped corners" unit. */
export const cornerFlags = (cell: CustomCell): boolean[] =>
  cell.corners && cell.corners.length === 4 ? cell.corners : [true, true, true, true];


export const key = (r: number, c: number) => `${r},${c}`;

export function parseKey(k: string): [number, number] {
  const [r, c] = k.split(",").map(Number);
  return [r, c];
}

/**
 * Every grid cell a unit anchored at (r,c) occupies. All units are one cell
 * except "Long triangles" (hrt), which spans two: side by side at 0°/180°,
 * stacked at 90°/270°.
 */
export function cellsCovered(r: number, c: number, cell: CustomCell): Array<[number, number]> {
  if (cell.kind === "hrt") {
    return cell.rotation === 90 || cell.rotation === 270
      ? [[r, c], [r + 1, c]]
      : [[r, c], [r, c + 1]];
  }
  return [[r, c]];
}


/**
 * Map of "row,col" → anchor key for every occupied cell. Cells absent from
 * this map are empty.
 */
export function occupancy(design: CustomBlockDesign): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, cell] of Object.entries(design.cells)) {
    const [r, c] = parseKey(k);
    for (const [rr, cc] of cellsCovered(r, c, cell)) out[key(rr, cc)] = k;
  }
  return out;
}

/** True when a unit of this kind/rotation fits at (r,c) without collisions. */
export function canPlace(
  design: CustomBlockDesign,
  r: number,
  c: number,
  kind: UnitKind,
  rotation: Rotation,
  ignoreAnchor?: string,
): boolean {
  const probe: CustomCell = { kind, rotation, fabrics: [] };
  const occ = occupancy(design);
  for (const [rr, cc] of cellsCovered(r, c, probe)) {
    if (rr < 0 || cc < 0 || rr >= design.size || cc >= design.size) return false;
    const owner = occ[key(rr, cc)];
    if (owner && owner !== ignoreAnchor) return false;
  }
  return true;
}

/** A blank design: no units placed yet — the grid starts empty and the
 * editor won't let the quilter continue until every cell is filled. */
export function emptyDesign(size: number, _fabric: FabricKey = "A"): CustomBlockDesign {
  return { size, cells: {} };
}

/**
 * Resize a design, keeping any units that still fit inside the new grid.
 * Cells that don't fit a kept unit stay empty so the quilter can fill them.
 */
export function resizeDesign(design: CustomBlockDesign, size: number): CustomBlockDesign {
  const next = emptyDesign(size, "A");
  for (const [k, cell] of Object.entries(design.cells)) {
    const [r, c] = parseKey(k);
    const fits = cellsCovered(r, c, cell).every(([rr, cc]) => rr < size && cc < size);
    if (!fits) continue;
    // Clear the cells this unit will occupy, then place it.
    for (const [rr, cc] of cellsCovered(r, c, cell)) delete next.cells[key(rr, cc)];
    next.cells[k] = { ...cell, fabrics: [...cell.fabrics] };
  }
  return next;
}

/** Distinct fabrics used anywhere in the design, in canonical A→Z order. */
export function fabricsUsed(design: CustomBlockDesign | null): FabricKey[] {
  if (!design) return [];
  const set = new Set<FabricKey>();
  for (const cell of Object.values(design.cells)) {
    for (let i = 0; i < REGION_COUNT[cell.kind]; i++) {
      const f = cell.fabrics[i];
      if (f) set.add(f);
    }
  }
  return [...set].sort();
}

/** Validation problems the editor should surface before letting the user move on. */
export function validateDesign(design: CustomBlockDesign | null): string[] {
  const errors: string[] = [];
  if (!design) return ["No block designed yet."];
  if (design.size < MIN_GRID || design.size > MAX_GRID) {
    errors.push(`Grid must be between ${MIN_GRID}×${MIN_GRID} and ${MAX_GRID}×${MAX_GRID}.`);
  }
  const occ = occupancy(design);
  let empty = 0;
  for (let r = 0; r < design.size; r++) {
    for (let c = 0; c < design.size; c++) if (!occ[key(r, c)]) empty++;
  }
  if (empty > 0) {
    errors.push(`${empty} cell${empty === 1 ? " is" : "s are"} still empty — every cell needs a unit.`);
  }
  for (const [k, cell] of Object.entries(design.cells)) {
    if (cell.fabrics.length < REGION_COUNT[cell.kind] || cell.fabrics.some((f) => !f)) {
      errors.push(`The unit at ${k} is missing a fabric.`);
      break;
    }
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Rotation & symmetry
// ---------------------------------------------------------------------------

const rotate = (rotation: Rotation, by: Rotation): Rotation =>
  (((rotation + by) % 360) as Rotation);

/**
 * Rotate a whole design 90/180/270° clockwise. Used both for the quilt-tiling
 * preview (rotation layout settings) and for symmetry detection.
 */
export function rotateDesign(design: CustomBlockDesign, by: Rotation): CustomBlockDesign {
  if (by === 0) return design;
  const n = design.size;
  const cells: Record<string, CustomCell> = {};
  for (const [k, cell] of Object.entries(design.cells)) {
    const [r, c] = parseKey(k);
    const covered = cellsCovered(r, c, cell);
    // Rotate every covered cell, then re-anchor at the new top-left.
    const moved = covered.map(([rr, cc]) => {
      if (by === 90) return [cc, n - 1 - rr] as [number, number];
      if (by === 180) return [n - 1 - rr, n - 1 - cc] as [number, number];
      return [n - 1 - cc, rr] as [number, number];
    });
    const minR = Math.min(...moved.map((m) => m[0]));
    const minC = Math.min(...moved.map((m) => m[1]));
    cells[key(minR, minC)] = {
      ...cell,
      rotation: rotate(cell.rotation, by),
      fabrics: [...cell.fabrics],
    };
  }
  return { size: n, cells };
}

/** Stable string form of a design — two designs that look identical match. */
export function fingerprint(design: CustomBlockDesign): string {
  const parts: string[] = [`${design.size}`];
  for (let r = 0; r < design.size; r++) {
    for (let c = 0; c < design.size; c++) {
      const cell = design.cells[key(r, c)];
      if (!cell) {
        parts.push(".");
        continue;
      }
      parts.push(
        `${cell.kind}${cell.rotation}:${cell.fabrics
          .slice(0, REGION_COUNT[cell.kind])
          .join("")}`,
      );
    }
  }
  return parts.join("|");
}

/**
 * Which quarter-turns produce a VISUALLY different block. Always includes 0.
 * The rotation-layout picker uses this so users never get offered two
 * settings that render an identical quilt.
 */
export function distinctRotations(design: CustomBlockDesign | null): Rotation[] {
  if (!design) return [0];
  const seen = new Map<string, Rotation>();
  for (const by of [0, 90, 180, 270] as Rotation[]) {
    const fp = fingerprint(rotateDesign(design, by));
    if (!seen.has(fp)) seen.set(fp, by);
  }
  return [...seen.values()].sort((a, b) => a - b);
}

/** True when the block looks the same at every quarter-turn (rotation is pointless). */
export function isFullyRotationSymmetric(design: CustomBlockDesign | null): boolean {
  return distinctRotations(design).length === 1;
}

// ---------------------------------------------------------------------------
// Geometry (for rendering)
// ---------------------------------------------------------------------------

export interface Poly {
  /** Points in the block's own coordinate space, where the block is `size` units wide. */
  points: Array<[number, number]>;
  fabric: FabricKey;
}

/** Rotate a point within a w×h box by a quarter turn clockwise. */
function rotPoint(
  [x, y]: [number, number],
  by: Rotation,
  w: number,
  h: number,
): [number, number] {
  if (by === 0) return [x, y];
  if (by === 90) return [h - y, x];
  if (by === 180) return [w - x, h - y];
  return [y, w - x];
}

/**
 * Polygons for one unit, in cell-local coordinates scaled so one grid cell is
 * 1×1.
 */
function unitPolys(cell: CustomCell): { w: number; h: number; polys: Poly[] } {
  const f = (i: number) => cell.fabrics[i] ?? cell.fabrics[0] ?? "A";
  const rot = cell.rotation;

  if (cell.kind === "square") {
    return {
      w: 1,
      h: 1,
      polys: [{ fabric: f(0), points: [[0, 0], [1, 0], [1, 1], [0, 1]] }],
    };
  }

  if (cell.kind === "hst") {
    // Canonical (rotation 0): triangle 1 is the UPPER-LEFT half, split on the
    // anti-diagonal (top-right → bottom-left).
    const base: Poly[] = [
      { fabric: f(0), points: [[0, 0], [1, 0], [0, 1]] },
      { fabric: f(1), points: [[1, 0], [1, 1], [0, 1]] },
    ];
    return {
      w: 1,
      h: 1,
      polys: base.map((p) => ({
        fabric: p.fabric,
        points: p.points.map((pt) => rotPoint(pt, rot, 1, 1)),
      })),
    };
  }

  if (cell.kind === "qst") {
    // Four triangles meeting at the centre: top, right, bottom, left.
    const base: Poly[] = [
      { fabric: f(0), points: [[0, 0], [1, 0], [0.5, 0.5]] },
      { fabric: f(1), points: [[1, 0], [1, 1], [0.5, 0.5]] },
      { fabric: f(2), points: [[1, 1], [0, 1], [0.5, 0.5]] },
      { fabric: f(3), points: [[0, 1], [0, 0], [0.5, 0.5]] },
    ];
    return {
      w: 1,
      h: 1,
      polys: base.map((p) => ({
        fabric: p.fabric,
        points: p.points.map((pt) => rotPoint(pt, rot, 1, 1)),
      })),
    };
  }

  if (cell.kind === "cornered") {
    // A whole square with a small triangle folded across the chosen corners
    // (Snowball style). Corner order: TL, TR, BR, BL. The cut is at the
    // midpoints, so each triangle covers half the cell on both edges.
    const flags = cornerFlags(cell);
    const corners: Array<Array<[number, number]>> = [
      [[0, 0], [0.5, 0], [0, 0.5]],
      [[1, 0], [1, 0.5], [0.5, 0]],
      [[1, 1], [0.5, 1], [1, 0.5]],
      [[0, 1], [0, 0.5], [0.5, 1]],
    ];
    const base: Poly[] = [
      { fabric: f(0), points: [[0, 0], [1, 0], [1, 1], [0, 1]] },
      ...corners.flatMap((pts, i) => (flags[i] ? [{ fabric: f(1), points: pts }] : [])),
    ];
    return {
      w: 1,
      h: 1,
      polys: base.map((p) => ({
        fabric: p.fabric,
        points: p.points.map((pt) => rotPoint(pt, rot, 1, 1)),
      })),
    };
  }

  if (cell.kind === "onpoint") {
    // A square turned 45° inside the cell, with four background triangles
    // filling the corners.
    return {
      w: 1,
      h: 1,
      polys: [
        { fabric: f(1), points: [[0, 0], [0.5, 0], [0, 0.5]] },
        { fabric: f(1), points: [[1, 0], [1, 0.5], [0.5, 0]] },
        { fabric: f(1), points: [[1, 1], [0.5, 1], [1, 0.5]] },
        { fabric: f(1), points: [[0, 1], [0, 0.5], [0.5, 1]] },
        { fabric: f(0), points: [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]] },
      ],
    };
  }

  if (cell.kind === "hrt") {
    // A 2×1 rectangle split corner to corner — a long, stretched diagonal.
    const base: Poly[] = [
      { fabric: f(0), points: [[0, 0], [2, 0], [0, 1]] },
      { fabric: f(1), points: [[2, 0], [2, 1], [0, 1]] },
    ];
    const upright = rot === 90 || rot === 270;
    return {
      w: upright ? 1 : 2,
      h: upright ? 2 : 1,
      polys: base.map((p) => ({
        fabric: p.fabric,
        points: p.points.map((pt) => rotPoint(pt, rot, 2, 1)),
      })),
    };
  }

  if (cell.kind === "split") {
    // The cell cut straight across the middle into two equal halves.
    const base: Poly[] = [
      { fabric: f(0), points: [[0, 0], [1, 0], [1, 0.5], [0, 0.5]] },
      { fabric: f(1), points: [[0, 0.5], [1, 0.5], [1, 1], [0, 1]] },
    ];
    return {
      w: 1,
      h: 1,
      polys: base.map((p) => ({
        fabric: p.fabric,
        points: p.points.map((pt) => rotPoint(pt, rot, 1, 1)),
      })),
    };
  }

  return { w: 1, h: 1, polys: [] };
}


/**
 * Every polygon in the block, in block coordinates where the whole block is
 * `size` × `size`. Multiply by (pixels / size) to draw.
 */
export function blockPolys(design: CustomBlockDesign): Poly[] {
  const out: Poly[] = [];
  for (const [k, cell] of Object.entries(design.cells)) {
    const [r, c] = parseKey(k);
    const { polys } = unitPolys(cell);
    for (const p of polys) {
      out.push({
        fabric: p.fabric,
        points: p.points.map(([x, y]) => [c + x, r + y] as [number, number]),
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Piece tallies (consumed by the yardage engine)
// ---------------------------------------------------------------------------

export interface UnitTally {
  /** Plain squares: fabric → count of finished-size squares. */
  squares: Record<string, number>;
  /**
   * HST units needing a starting-square pair at the PLAIN unit size.
   * Key is `${fabricA}|${fabricB}` with the pair sorted, value = unit count.
   */
  hst: Record<string, number>;
  /**
   * HST units cut at the larger QST trim size (these get recut into
   * hourglass units). Same key format as `hst`.
   */
  qstHalves: Record<string, number>;
  /** Finished hourglass (QST) unit count — for the instructions only. */
  qstUnits: number;
  /** "Snipped corners": base squares per fabric. */
  corneredBases: Record<string, number>;
  /** "Snipped corners": stitch-and-flip corner squares per fabric. */
  corneredCorners: Record<string, number>;
  /** "Square on point": centre (diamond) squares per fabric. */
  onpointCenters: Record<string, number>;
  /** "Square on point": background corner TRIANGLES per fabric (4 per unit). */
  onpointCornerTris: Record<string, number>;
  /** "Long triangles": unit count keyed `${fabricA}|${fabricB}` (sorted). */
  hrtUnits: Record<string, number>;
  /** "Split in half": half-cell rectangles per fabric. */
  splitHalves: Record<string, number>;
}

const bump = (rec: Record<string, number>, k: string, n = 1) => {
  rec[k] = (rec[k] ?? 0) + n;
};

const pairKey = (a: FabricKey, b: FabricKey) => (a <= b ? `${a}|${b}` : `${b}|${a}`);

/**
 * Roll a design up into per-fabric piece counts for ONE block.
 *
 * HST/QST counts are kept as UNIT counts (not starting squares) so the caller
 * can multiply by the block count FIRST and only then divide by the
 * 2-at-a-time / 4-at-a-time yields. Doing it in that order avoids rounding up
 * once per block, which would badly overstate yardage on a big quilt.
 */
export function unitTally(design: CustomBlockDesign): UnitTally {
  const tally: UnitTally = {
    squares: {},
    hst: {},
    qstHalves: {},
    qstUnits: 0,
    corneredBases: {},
    corneredCorners: {},
    onpointCenters: {},
    onpointCornerTris: {},
    hrtUnits: {},
    splitHalves: {},
  };
  for (const cell of Object.values(design.cells)) {
    const f = (i: number) => (cell.fabrics[i] ?? cell.fabrics[0] ?? "A") as FabricKey;
    switch (cell.kind) {
      case "square":
        bump(tally.squares, f(0));
        break;
      case "hst":
        bump(tally.hst, pairKey(f(0), f(1)));
        break;
      case "qst":
        // An hourglass is two HSTs (cut oversized) sewn back together and
        // recut. Each HST supplies two ADJACENT triangles: top+right and
        // bottom+left.
        tally.qstUnits += 1;
        bump(tally.qstHalves, pairKey(f(0), f(1)));
        bump(tally.qstHalves, pairKey(f(2), f(3)));
        break;
      case "cornered": {
        bump(tally.corneredBases, f(0));
        const on = cornerFlags(cell).filter(Boolean).length;
        if (on > 0) bump(tally.corneredCorners, f(1), on);
        break;
      }
      case "onpoint":
        bump(tally.onpointCenters, f(0));
        bump(tally.onpointCornerTris, f(1), 4);
        break;
      case "hrt":
        bump(tally.hrtUnits, pairKey(f(0), f(1)));
        break;
      case "split":
        bump(tally.splitHalves, f(0));
        bump(tally.splitHalves, f(1));
        break;
    }
  }
  return tally;
}

/** Sum tallies from several blocks (weighted by how many of each are needed). */
export function scaleTally(tally: UnitTally, factor: number): UnitTally {
  const scaleRec = (rec: Record<string, number>) => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(rec)) out[k] = v * factor;
    return out;
  };
  return {
    squares: scaleRec(tally.squares),
    hst: scaleRec(tally.hst),
    qstHalves: scaleRec(tally.qstHalves),
    qstUnits: tally.qstUnits * factor,
    corneredBases: scaleRec(tally.corneredBases),
    corneredCorners: scaleRec(tally.corneredCorners),
    onpointCenters: scaleRec(tally.onpointCenters),
    onpointCornerTris: scaleRec(tally.onpointCornerTris),
    hrtUnits: scaleRec(tally.hrtUnits),
    splitHalves: scaleRec(tally.splitHalves),
  };
}


export function mergeTallies(a: UnitTally, b: UnitTally): UnitTally {
  const mergeRec = (x: Record<string, number>, y: Record<string, number>) => {
    const out = { ...x };
    for (const [k, v] of Object.entries(y)) out[k] = (out[k] ?? 0) + v;
    return out;
  };
  return {
    squares: mergeRec(a.squares, b.squares),
    hst: mergeRec(a.hst, b.hst),
    qstHalves: mergeRec(a.qstHalves, b.qstHalves),
    qstUnits: a.qstUnits + b.qstUnits,
    corneredBases: mergeRec(a.corneredBases, b.corneredBases),
    corneredCorners: mergeRec(a.corneredCorners, b.corneredCorners),
    onpointCenters: mergeRec(a.onpointCenters, b.onpointCenters),
    onpointCornerTris: mergeRec(a.onpointCornerTris, b.onpointCornerTris),
    hrtUnits: mergeRec(a.hrtUnits, b.hrtUnits),
    splitHalves: mergeRec(a.splitHalves, b.splitHalves),
  };

}

/**
 * Swap one fabric pair throughout a design — powers the "alternate blocks"
 * fabric-swap variation.
 */
export function swapFabrics(
  design: CustomBlockDesign,
  a: FabricKey,
  b: FabricKey,
): CustomBlockDesign {
  const cells: Record<string, CustomCell> = {};
  for (const [k, cell] of Object.entries(design.cells)) {
    cells[k] = {
      ...cell,
      fabrics: cell.fabrics.map((f) => (f === a ? b : f === b ? a : f)),
    };
  }
  return { size: design.size, cells };
}

/**
 * Upgrade a design saved by an older version of the editor. Flying geese
 * units were removed from the palette; any saved geese cell becomes an HST
 * using the same two fabrics ([goose, sky] → [triangle 1, triangle 2]) so
 * the quilter's design still loads and fills every cell.
 */
export function migrateDesign(design: CustomBlockDesign | null): CustomBlockDesign | null {
  if (!design) return design;
  let changed = false;
  const cells: Record<string, CustomCell> = {};
  for (const [k, cell] of Object.entries(design.cells)) {
    if ((cell.kind as string) === "geese") {
      cells[k] = { kind: "hst", rotation: cell.rotation, fabrics: cell.fabrics.slice(0, 2) };
      changed = true;
    } else {
      cells[k] = cell;
    }
  }
  return changed ? { size: design.size, cells } : design;
}
