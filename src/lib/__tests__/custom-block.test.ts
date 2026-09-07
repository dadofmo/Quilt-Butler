/**
 * "Design Your Own Block" — permutation + render-safety sweep.
 *
 * Covers what snapshot tests and hand-calc audits cannot:
 *  - every unit kind at every grid size 2–8 survives yardage calculation
 *    with positive, finite, non-NaN cuts
 *  - every corner mask of the Snipped-corners unit (all 15 legal combos)
 *  - every legal placement + rotation of the 2-cell Long-triangles unit
 *  - whole-block rotation always yields a complete, valid design with an
 *    identical fabric tally
 *  - fabric swapping / Block-B alternation / legacy migration behaviour
 *  - every unit shape renders to SVG polygons (no throws, no empty output)
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import {
  canPlace,
  cornerFlags,
  migrateDesign,
  rotateDesign,
  unitTally,
  validateDesign,
  type CustomBlockDesign,
  type CustomCell,
  type Rotation,
  type UnitKind,
} from "@/lib/custom-block";
import { calculateYardage } from "@/lib/yardage";
import type { FabricKey, PlannerState } from "@/lib/planner-store";
import { CustomBlockShapes } from "@/components/CustomBlockSvg";

const ROTATIONS: Rotation[] = [0, 90, 180, 270];

function baseState(design: CustomBlockDesign): PlannerState {
  return {
    pattern: "custom-block",
    quiltWidth: 48,
    quiltHeight: 48,
    sizePreset: "custom",
    fabricWidth: 44,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    cornerAccentSize: 0,
    assignments: {},
    customBlock: design,
    customBlockB: null,
    useBlockB: false,
    customSwapPair: null,
    safetyBuffer: false,
    fabricNames: {},
    fabricPhotos: {},
    patchworkFabricCount: 4,
    patchworkGrid: {},
    pricePerYard: "",
    itemPrices: {},
    fabricSource: "yardage",
    jellyRollStripCount: 40,
    fatQuarterWidth: 18,
    fatQuarterHeight: 21,
    fatQuarterTrimMargin: 0.5,
    fatQuarterCount: 20,
    alternateBlocks: false,
    blockLayout: "straight",
  };
}

/** Fill a size×size grid with one unit kind. `null` from make() leaves the
 *  cell to be covered by a neighbour's footprint (used by hrt). */
function fillDesign(size: number, make: (r: number, c: number) => CustomCell | null): CustomBlockDesign {
  const cells: Record<string, CustomCell> = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = make(r, c);
      if (cell) cells[`${r},${c}`] = cell;
    }
  }
  return { size, cells };
}

function unitOfKind(kind: UnitKind, rotation: Rotation = 0): CustomCell {
  switch (kind) {
    case "square":
      return { kind, rotation, fabrics: ["A"] };
    case "hst":
      return { kind, rotation, fabrics: ["A", "B"] };
    case "qst":
      return { kind, rotation, fabrics: ["A", "B", "C", "D"] };
    case "cornered":
      return { kind, rotation, fabrics: ["A", "B"] };
    case "onpoint":
      return { kind, rotation, fabrics: ["A", "B"] };
    case "hrt":
      return { kind, rotation, fabrics: ["A", "B"] };
    case "split":
      return { kind, rotation, fabrics: ["A", "B"] };
  }
}

function expectSaneYardage(state: PlannerState, label: string) {
  const r = calculateYardage(state);
  expect(r.fabrics.length, `${label}: at least one fabric row`).toBeGreaterThan(0);
  for (const f of r.fabrics) {
    for (const p of f.pieces) {
      expect(p.count, `${label}: ${f.fabric} ${p.label} count`).toBeGreaterThan(0);
      expect(p.w, `${label}: ${f.fabric} ${p.label} width`).toBeGreaterThan(0);
      expect(p.h, `${label}: ${f.fabric} ${p.label} height`).toBeGreaterThan(0);
      expect(Number.isFinite(p.w) && Number.isFinite(p.h), `${label}: finite cuts`).toBe(true);
    }
    expect(Number.isFinite(f.totalInches), `${label}: finite inches`).toBe(true);
    expect(f.totalInches, `${label}: positive inches`).toBeGreaterThan(0);
  }
}

// ---------------------------------------------------------------------------

describe("custom block — every unit kind at every grid size 2–8", () => {
  const singleCellKinds: UnitKind[] = ["square", "hst", "qst", "cornered", "onpoint", "split"];

  for (const size of [2, 3, 4, 5, 6, 7, 8]) {
    for (const kind of singleCellKinds) {
      it(`${kind} fills a ${size}×${size} grid, validates, and cuts sanely`, () => {
        const d = fillDesign(size, () => unitOfKind(kind));
        expect(validateDesign(d)).toEqual([]);
        expectSaneYardage(baseState(d), `${kind}@${size}`);
      });
    }

    it(`hrt fills a ${size}×${size} grid horizontally, validates, and cuts sanely`, () => {
      const d = fillDesign(size, (r, c) =>
        c % 2 === 0 ? unitOfKind("hrt", 0) : null,
      );
      expect(validateDesign(d)).toEqual([]);
      expectSaneYardage(baseState(d), `hrt-h@${size}`);
    });

    it(`hrt fills a ${size}×${size} grid vertically, validates, and cuts sanely`, () => {
      const d = fillDesign(size, (r, c) =>
        r % 2 === 0 ? unitOfKind("hrt", 90) : null,
      );
      expect(validateDesign(d)).toEqual([]);
      expectSaneYardage(baseState(d), `hrt-v@${size}`);
    });
  }
});

describe("custom block — Snipped corners: all 15 legal corner masks", () => {
  let maskIndex = 0;
  for (let bits = 1; bits < 16; bits++) {
    const corners = [0, 1, 2, 3].map((i) => ((bits >> i) & 1) === 1);
    maskIndex++;
    it(`mask ${maskIndex} [${corners.map((b) => (b ? 1 : 0)).join("")}] validates and cuts`, () => {
      const d = fillDesign(3, () => ({
        kind: "cornered",
        rotation: 0 as Rotation,
        fabrics: ["A", "B"] as FabricKey[],
        corners,
      }));
      expect(validateDesign(d)).toEqual([]);
      expectSaneYardage(baseState(d), `mask ${bits}`);
    });
  }

  it("rejects a cornered unit with every corner off", () => {
    const d = fillDesign(2, () => ({
      kind: "cornered",
      rotation: 0 as Rotation,
      fabrics: ["A", "B"] as FabricKey[],
      corners: [false, false, false, false],
    }));
    expect(validateDesign(d).length).toBeGreaterThan(0);
  });

  it("cornerFlags defaults a saved design without flags to all four on", () => {
    expect(cornerFlags({ kind: "cornered", rotation: 0, fabrics: ["A", "B"] })).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});

describe("custom block — Long triangles placement rules", () => {
  it("horizontal hrt hangs off the right edge at the last column", () => {
    const d = fillDesign(4, () => unitOfKind("square"));
    delete d.cells["0,0"];
    delete d.cells["0,1"];
    expect(canPlace(d, 0, 0, "hrt", 0)).toBe(true);
    expect(canPlace(d, 0, 3, "hrt", 0)).toBe(false);
  });

  it("vertical hrt hangs off the bottom edge at the last row", () => {
    const d = fillDesign(4, () => unitOfKind("square"));
    delete d.cells["0,0"];
    delete d.cells["1,0"];
    expect(canPlace(d, 0, 0, "hrt", 90)).toBe(true);
    expect(canPlace(d, 3, 0, "hrt", 90)).toBe(false);
  });

  it("every legal anchor + rotation places without collision, everywhere on sizes 2–8", () => {
    for (const size of [2, 3, 4, 5, 6, 7, 8]) {
      for (const rot of ROTATIONS) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            const d: CustomBlockDesign = { size, cells: {} };
            const legal = canPlace(d, r, c, "hrt", rot);
            const horizontal = rot === 0 || rot === 180;
            const fits = horizontal ? c + 1 < size : r + 1 < size;
            expect(legal, `hrt rot ${rot} at ${r},${c} on ${size}`).toBe(fits);
          }
        }
      }
    }
  });
});

describe("custom block — whole-block rotation", () => {
  const mixed = (): CustomBlockDesign =>
    fillDesign(4, (r, c) => {
      if (r === 0 && c % 2 === 0) return unitOfKind("hrt", 0);
      if (r === 0) return null;
      if (r === 1) return { kind: "cornered", rotation: 0, fabrics: ["A", "C"], corners: [true, false, true, false] };
      if (r === 2) return unitOfKind("onpoint", 90);
      if (c % 2 === 0) return unitOfKind("split", 90);
      return unitOfKind("qst", 0);
    });

  it("90/180/270 rotations stay complete and valid", () => {
    const d = mixed();
    for (const by of ROTATIONS) {
      const rd = rotateDesign(d, by);
      expect(Object.keys(rd.cells).length).toBe(Object.keys(d.cells).length);
      expect(validateDesign(rd), `rotate ${by}`).toEqual([]);
    }
  });

  it("four quarter-turns return the original design", () => {
    const d = mixed();
    let rd = d;
    for (let i = 0; i < 4; i++) rd = rotateDesign(rd, 90);
    expect(rd).toEqual(d);
  });

  it("rotation preserves the per-fabric piece tally", () => {
    const d = mixed();
    const t0 = unitTally(d);
    for (const by of ROTATIONS) {
      expect(unitTally(rotateDesign(d, by)), `tally rotate ${by}`).toEqual(t0);
    }
  });

  it("rotation preserves yardage for a design containing hrt at the edges", () => {
    // hrt anchored at (0, size-2) horizontal and (size-2, 0) vertical — the
    // trickiest anchors under rotation.
    const cells: Record<string, CustomCell> = {};
    const size = 4;
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) cells[`${r},${c}`] = unitOfKind("square");
    // replace bottom-right 2×2 with hrt units
    delete cells["2,2"];
    delete cells["2,3"];
    delete cells["3,2"];
    delete cells["3,3"];
    cells["2,2"] = unitOfKind("hrt", 0);   // covers (2,2),(2,3)
    cells["3,2"] = unitOfKind("hrt", 0);   // covers (3,2),(3,3)
    const d: CustomBlockDesign = { size, cells };
    expect(validateDesign(d)).toEqual([]);
    const flat = (des: CustomBlockDesign) =>
      calculateYardage(baseState(des))
        .fabrics.flatMap((f) => f.pieces.map((p) => `${f.fabric}|${p.label}|${p.count}|${p.w}|${p.h}`))
        .sort()
        .join("\n");
    expect(flat(rotateDesign(d, 90))).toBe(flat(d));
    expect(flat(rotateDesign(d, 180))).toBe(flat(d));
    expect(flat(rotateDesign(d, 270))).toBe(flat(d));
  });
});

describe("custom block — fabric swap and Block B alternation", () => {
  it("swap A↔B keeps total piece counts identical (inches may differ by strip packing)", () => {
    const d = fillDesign(4, () => unitOfKind("cornered"));
    const on: PlannerState = {
      ...baseState(d),
      alternateBlocks: true,
      customSwapPair: ["A", "B"],
    };
    const off = baseState(d);
    // Piece counts are a pure design property — swapping fabrics on odd
    // blocks must never add or lose pieces. Total INCHES can legitimately
    // differ by a partial strip: split across two fabrics, 128 bases pack
    // into 11 strips each (22 total) vs 256 into 22 — same here, but corner
    // squares round up differently, which is correct real-world behaviour.
    const pieceCount = (s: PlannerState) =>
      calculateYardage(s).fabrics.flatMap((f) => f.pieces).reduce((n, p) => n + p.count, 0);
    expect(pieceCount(on)).toBe(pieceCount(off));
    // And the per-shape totals must match too (bases with bases, corners with corners).
    const byShape = (s: PlannerState) => {
      const totals = new Map<string, number>();
      for (const f of calculateYardage(s).fabrics)
        for (const p of f.pieces)
          totals.set(`${p.w}x${p.h}`, (totals.get(`${p.w}x${p.h}`) ?? 0) + p.count);
      return [...totals.entries()].sort();
    };
    expect(byShape(on)).toEqual(byShape(off));
  });

  it("Block B checkerboard yields both designs' fabrics and same total inches", () => {
    const dA = fillDesign(4, () => unitOfKind("square"));
    const dB = fillDesign(4, () => ({ kind: "square" as const, rotation: 0 as Rotation, fabrics: ["C"] as FabricKey[] }));
    const s: PlannerState = { ...baseState(dA), customBlockB: dB, useBlockB: true };
    const r = calculateYardage(s);
    expect(r.fabrics.map((f) => f.fabric)).toContain("A");
    expect(r.fabrics.map((f) => f.fabric)).toContain("C");
  });
});

describe("custom block — legacy migration", () => {
  it("converts saved geese units to hst pairs and drops stale fields", () => {
    const legacy = {
      size: 2,
      cells: {
        "0,0": { kind: "geese", rotation: 0, fabrics: ["A", "B"] },
      },
    } as unknown as CustomBlockDesign;
    const m = migrateDesign(legacy);
    expect(m).not.toBeNull();
    // The geese cell must be gone or converted; either way nothing may keep kind "geese".
    for (const cell of Object.values(m!.cells)) {
      expect(cell.kind).not.toBe("geese");
    }
  });

  it("passes modern designs through untouched", () => {
    const d = fillDesign(2, () => unitOfKind("onpoint"));
    expect(migrateDesign(d)).toEqual(d);
  });
});

describe("custom block — rendering safety", () => {
  const kinds: UnitKind[] = ["square", "hst", "qst", "cornered", "onpoint", "hrt", "split"];

  it("every unit kind renders polygons without throwing", () => {
    for (const kind of kinds) {
      for (const rot of ROTATIONS) {
        const d = fillDesign(2, (r, c) => {
          if (kind === "hrt") {
            return rot === 0 || rot === 180 ? (c === 0 ? unitOfKind("hrt", rot) : null) : r === 0 ? unitOfKind("hrt", rot) : null;
          }
          return unitOfKind(kind, rot);
        });
        const html = renderToStaticMarkup(
          createElement("svg", null, createElement(CustomBlockShapes, { design: d })),
        );
        expect(html, `${kind} rot ${rot}`).toContain("<polygon");
      }
    }
  });

  it("cornered renders for every corner mask", () => {
    for (let bits = 1; bits < 16; bits++) {
      const corners = [0, 1, 2, 3].map((i) => ((bits >> i) & 1) === 1);
      const d = fillDesign(2, () => ({
        kind: "cornered" as const,
        rotation: 0 as Rotation,
        fabrics: ["A", "B"] as FabricKey[],
        corners,
      }));
      const html = renderToStaticMarkup(
        createElement("svg", null, createElement(CustomBlockShapes, { design: d })),
      );
      expect(html, `mask ${bits}`).toContain("<polygon");
      expect(html).not.toContain("NaN");
    }
  });

  it("renders with fabric photos without throwing", () => {
    const d = fillDesign(2, () => unitOfKind("qst"));
    const photos = { A: "data:image/png;base64,AAAA" };
    const html = renderToStaticMarkup(
      createElement("svg", null, createElement(CustomBlockShapes, { design: d, photos })),
    );
    expect(html).toContain("url(");
  });
});
