import { describe, it, expect } from "vitest";
import { getPattern } from "@/lib/patterns";
import { calculateYardage } from "@/lib/yardage";
import { blockPolys, unitTally, validateDesign, type CustomBlockDesign } from "@/lib/custom-block";
import {
  WALTZ_BLOCK_A,
  WALTZ_BLOCK_B,
  whirlwindDesigns,
  whirlwindPlainUnits,
  whirlwindPlainPieces,
  whirlwindSewingNotes,
} from "@/lib/whirlwind-waltz";
import { studioPair } from "@/lib/studio-pairs";
import type { PlannerState } from "@/lib/planner-store";

function base(): PlannerState {
  return {
    pattern: "whirlwind-waltz",
    quiltWidth: 48,
    quiltHeight: 48,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    fabricWidth: 44,
    safetyBuffer: 0,
    assignments: {},
    alternateBlocks: false,
    blockLayout: "straight",
    customBlock: null,
    customBlockB: null,
    useBlockB: false,
    customSwapPair: null,
  } as unknown as PlannerState;
}

/** Fabric of the coloured triangle's right-angle corner, per HST cell. */
const hstCorner = (d: CustomBlockDesign, key: string) => {
  const poly = blockPolys({ size: 6, cells: { [key]: d.cells[key] } }).find(
    (p) => p.fabric === d.cells[key].fabrics[1],
  )!;
  const [r, c] = key.split(",").map(Number);
  const xs = poly.points.map(([x]) => x - c);
  const ys = poly.points.map(([, y]) => y - r);
  const corner = (x: number, y: number) => poly.points.some(([px, py]) => px - c === x && py - r === y);
  const right = xs.filter((x) => x === 1).length === 2;
  const bottom = ys.filter((y) => y === 1).length === 2;
  void corner;
  return `${bottom ? "B" : "T"}${right ? "R" : "L"}`;
};

describe("Whirlwind Waltz registration", () => {
  it("is a Studio Pick two-block set with nine fabric roles plus sashing and border", () => {
    const def = getPattern("whirlwind-waltz");
    expect(def?.name).toBe("Whirlwind Waltz");
    expect(def?.sections.map((s) => s.id)).toEqual([
      "background", "starArms1", "starArms2", "starCorners1", "starCorners2",
      "arrowArms1", "arrowArms2", "arrowCorners1", "arrowCorners2", "sashing", "border",
    ]);
    expect(studioPair("whirlwind-waltz")?.names).toEqual({ a: "star block", b: "arrow block" });
  });
});

describe("Whirlwind Waltz geometry (matches the Studio reference)", () => {
  it("both designs are valid 6×6 grids", () => {
    expect(WALTZ_BLOCK_A.size).toBe(6);
    expect(WALTZ_BLOCK_B.size).toBe(6);
    expect(validateDesign(WALTZ_BLOCK_A)).toEqual([]);
    expect(validateDesign(WALTZ_BLOCK_B)).toEqual([]);
  });

  it("star block HSTs spin the arm tips around the centre", () => {
    expect(Object.fromEntries(["0,2", "0,3", "2,0", "2,5", "3,0", "3,5", "5,2", "5,3"]
      .map((k) => [k, hstCorner(WALTZ_BLOCK_A, k)]))).toEqual({
      "0,2": "BL", "0,3": "BR", "2,0": "TR", "2,5": "TL",
      "3,0": "BR", "3,5": "BL", "5,2": "TL", "5,3": "TR",
    });
  });

  it("arrow block HSTs make every arm tip point outward", () => {
    expect(Object.fromEntries(["0,2", "0,3", "2,0", "2,5", "3,0", "3,5", "5,2", "5,3"]
      .map((k) => [k, hstCorner(WALTZ_BLOCK_B, k)]))).toEqual({
      "0,2": "BR", "0,3": "BL", "2,0": "BR", "2,5": "BL",
      "3,0": "TR", "3,5": "TL", "5,2": "TR", "5,3": "TL",
    });
  });

  it("each block is 180° symmetric: opposite arms and corners share a fabric", () => {
    for (const d of [WALTZ_BLOCK_A, WALTZ_BLOCK_B]) {
      for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
        const cell = d.cells[`${r},${c}`];
        const opp = d.cells[`${5 - r},${5 - c}`];
        expect(opp.kind).toBe(cell.kind);
        expect(opp.fabrics).toEqual(cell.fabrics);
        if (cell.kind === "hst") expect((opp.rotation - cell.rotation + 360) % 360).toBe(180);
      }
    }
  });

  it("tallies 8 HSTs and 28 plain squares per block", () => {
    for (const d of [WALTZ_BLOCK_A, WALTZ_BLOCK_B]) {
      const t = unitTally(d);
      expect(Object.values(t.hst).reduce((a, b) => a + b, 0)).toBe(8);
      expect(Object.values(t.squares).reduce((a, b) => a + b, 0)).toBe(28);
    }
  });

  it("fabric assignments remap roles", () => {
    const { a, b } = whirlwindDesigns({ starArms1: "K", arrowCorners2: "L" });
    expect(new Set(blockPolys(a).map((p) => p.fabric)).has("K")).toBe(true);
    expect(new Set(blockPolys(b).map((p) => p.fabric)).has("L")).toBe(true);
  });
});

describe("Whirlwind Waltz cutting & sewing", () => {
  it("quadrant units cover every plain cell once without crossing fabrics", () => {
    for (const d of [WALTZ_BLOCK_A, WALTZ_BLOCK_B]) {
      const covered = new Set<string>();
      for (const { row, col, cellsW } of whirlwindPlainUnits()) {
        const f = d.cells[`${row},${col}`].fabrics[0];
        for (let c = col; c < col + cellsW; c++) {
          const k = `${row},${c}`;
          expect(d.cells[k].kind).toBe("square");
          expect(d.cells[k].fabrics[0]).toBe(f);
          expect(covered.has(k)).toBe(false);
          covered.add(k);
        }
      }
      expect(covered.size).toBe(28);
    }
  });

  it("keeps 8 whole bars per block even when fabrics match", () => {
    const pieces = whirlwindPlainPieces(WALTZ_BLOCK_A, 12, 0.5);
    expect(pieces.filter((p) => p.cellsW === 2)).toHaveLength(8);
    expect(pieces.filter((p) => p.cellsW === 2).every((p) => p.cutW === 4.5 && p.cutH === 2.5)).toBe(true);
  });

  it("4×4 quilt at 12\" blocks: 8 of each block with exact cuts", () => {
    const r = calculateYardage(base());
    const bg = r.fabrics.find((f) => f.fabric === "B")!;
    expect(bg.pieces).toEqual(expect.arrayContaining([
      expect.objectContaining({ count: 64, w: 4.5, h: 2.5 }),
      expect.objectContaining({ count: 64, w: 2.5, h: 2.5 }),
      expect.objectContaining({ count: 64, w: 2.88 }),
    ]));
    const f = r.fabrics.find((x) => x.fabric === "F")!;
    expect(f.pieces).toEqual(expect.arrayContaining([
      expect.objectContaining({ count: 16, w: 4.5, h: 2.5 }),
      expect.objectContaining({ count: 32, w: 2.5, h: 2.5 }),
      expect.objectContaining({ count: 16, w: 2.88 }),
    ]));
    expect(r.notes.join(" ")).toContain("Make 8 star blocks and 8 arrow blocks");
  });

  it("sewing notes name the same fabrics and HST corners the previews draw", () => {
    const notes = whirlwindSewingNotes(12, { starArms1: "K" }, 0.5).join(" ");
    expect(notes).toContain("Top-left quadrant — row 1: Fabric A square, Fabric B square, HST (Fabric K triangle in the bottom-left corner)");
    expect(notes).toContain('Fabric B bar 4.50" × 2.50"');
    expect(notes).toContain('6.50" square unfinished');
  });
});
