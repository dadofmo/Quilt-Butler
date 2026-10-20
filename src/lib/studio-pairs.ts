import type { FabricKey, PatternId } from "./planner-store";
import type { CustomBlockDesign } from "./custom-block";
import type { GridPiece } from "./grid-optimizer";
import { xChainDesigns, xChainPlainPieces, xChainSewingNotes } from "./x-marks-the-chain";
import { whirlwindDesigns, whirlwindPlainPieces, whirlwindSewingNotes } from "./whirlwind-waltz";

/**
 * Built-in two-block Studio Pick sets. Each is a pair of fixed custom-block
 * designs alternating checkerboard-style (Block A top-left), sharing the
 * custom-block renderer and yardage branch. Every preview, cut and note
 * resolves through this one registry so they can never drift apart.
 */
export interface StudioPair {
  names: { a: string; b: string };
  designs: (assignments?: Record<string, FabricKey | undefined>) => { a: CustomBlockDesign; b: CustomBlockDesign };
  plainPieces: (design: CustomBlockDesign, blockSize: number, seam: number) => GridPiece[];
  sewingNotes: (blockSize: number, assignments: Record<string, FabricKey | undefined>, seam: number) => string[];
  gridNote: (blockSize: number) => string;
}

const PAIRS: Partial<Record<PatternId, StudioPair>> = {
  "x-marks-the-chain": {
    names: { a: "X block", b: "chain block" },
    designs: xChainDesigns,
    plainPieces: xChainPlainPieces,
    sewingNotes: xChainSewingNotes,
    gridNote: (bs) =>
      `X Marks the Chain is a two-block set: Block A (the X) is a 4×4 grid, so its grid squares finish at ${(bs / 4).toFixed(2)}"; Block B (the chain) is a 6×6 grid, so its grid squares finish at ${(bs / 6).toFixed(2)}".`,
  },
  "whirlwind-waltz": {
    names: { a: "star block", b: "arrow block" },
    designs: whirlwindDesigns,
    plainPieces: whirlwindPlainPieces,
    sewingNotes: whirlwindSewingNotes,
    gridNote: (bs) =>
      `Whirlwind Waltz is a two-block set: Block A (the spinning star) and Block B (the arrows) are both 6×6 grids, so every grid square finishes at ${(bs / 6).toFixed(2)}".`,
  },
};

export function studioPair(pattern: PatternId | null | undefined): StudioPair | null {
  return (pattern && PAIRS[pattern]) || null;
}

export function studioPairDesigns(
  pattern: PatternId | null | undefined,
  assignments?: Record<string, FabricKey | undefined>,
) {
  return studioPair(pattern)?.designs(assignments) ?? null;
}
