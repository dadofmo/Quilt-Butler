import { useSyncExternalStore } from "react";
import type { CustomBlockDesign } from "./custom-block";

const STORAGE_KEY = "quiltbutler-planner-state";

/**
 * How finished blocks are turned/arranged when they're sewn into the quilt
 * top. Rotation-only settings — every block is pieced identically, so the
 * cutting list and yardage are unchanged; only the orientation of each block
 * (and therefore the secondary design across the quilt) differs.
 *
 * Patterns opt in by listing settings in `PatternDef.layouts`. Patterns whose
 * secondary design depends on a fixed, intrinsic tiling (Rail Fence, Jacob's
 * Ladder, Broken Dishes, Irish Chain, ...) must NOT opt in.
 */
export type BlockLayout =
  | "straight"
  | "alternating"
  | "barn-raising"
  | "herringbone";



export type PatternId =
  | "simple-squares"
  | "nine-patch"
  | "hst"
  | "rail-fence"
  | "log-cabin"
  | "ohio-star"
  | "flying-geese"
  | "disappearing-nine-patch"
  | "squares-on-point"
  | "plus-block"
  | "pinwheel"
  | "churn-dash"
  | "bear-paw"
  | "irish-chain"
  | "sawtooth-star"
  | "friendship-star"
  | "snowball-block"
  | "four-patch"
  | "streak-of-lightning"
  | "bow-tie"
  | "shoofly"
  | "jacobs-ladder"
  | "autumn-tints"
  | "card-trick"
  | "oh-susannah"
  | "twin-star"
  | "star-and-cross"
  | "idaho-beauty"
  | "checkerboard"
  | "cabin-in-the-cotton"
  | "fancy-stripe"
  | "maple-star"
  | "love-in-a-mist"
  | "four-x-star"
  | "antique-tile"
  | "economy-block"
  | "california-quilt"
  | "clowns-choice"
  | "corner-beam"
  | "four-queens"
  | "four-xs"
  | "broken-dishes"
  | "rolling-stone"
  | "summer-winds"
  | "swing-in-the-center"
  | "tippecanoe-and-tyler-too"
  | "tulip-lady-fingers"
  | "weathervane"
  | "wishing-ring"
  | "alaska-homestead"
  | "blazing-arrows"
  /** The user-designed block from the "Design Your Own Block" editor. */
  | "custom-block";

/**
 * Fabric slots. A–L are the classic palette used by every built-in pattern.
 * M–Z exist so a user-designed custom block can be genuinely scrappy without
 * running out of distinct fabrics. Built-in patterns never reach past L.
 */
export type FabricKey =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L"
  | "M" | "N" | "O" | "P" | "Q" | "R"
  | "S" | "T" | "U" | "V" | "W" | "X"
  | "Y" | "Z";

export const ALL_FABRIC_KEYS: FabricKey[] = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M",
  "N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
];

/** The 12 slots the built-in (non-custom) patterns draw from. */
export const CLASSIC_FABRIC_KEYS: FabricKey[] = [
  "A","B","C","D","E","F","G","H","I","J","K","L",
];

export type SectionAssignments = Record<string, FabricKey>;

export interface PlannerState {
  pattern: PatternId | null;
  quiltWidth: number; // inches
  quiltHeight: number; // inches
  sizePreset: string;
  /** Usable fabric width in inches (full bolt width, selvage to selvage). User-entered. */
  fabricWidth: number;
  blockSize: number; // inches (decimal allowed)
  borderWidth: number; // inches, 0 for none
  /** Sashing width between blocks (inches). Currently only used by Bear Paw,
   *  where it is permanent (default 2") and cannot be 0. */
  sashingWidth: number;
  /** Corner accent square finished size for Snowball Block (inches).
   *  0 = not set yet. Other patterns ignore this field. */
  cornerAccentSize: number;
  assignments: SectionAssignments;
  safetyBuffer: boolean;
  fabricNames: Partial<Record<FabricKey, string>>;
  /** Optional user-uploaded photo (data URL) for each fabric — used in previews instead of the swatch color. */
  fabricPhotos: Partial<Record<FabricKey, string>>;
  /** Number of distinct fabrics user wants to use in the patchwork preview (2–12). */
  patchworkFabricCount: number;
  /** Per-cell fabric assignments for the patchwork preview grid, keyed "r,c". */
  patchworkGrid: Record<string, FabricKey>;
  /** Optional price per yard (USD or local currency, agnostic) for the cost estimator on the results page. */
  pricePerYard: string;
  /** Per-line-item prices on the shopping list, keyed by line id (e.g. "fabric-A", "backing", "batting", "binding", "piecing-thread", "quilting-thread"). Stored as strings to preserve user input. */
  itemPrices: Record<string, string>;
  /** Where the block fabric comes from. "yardage" = traditional bolt (default,
   *  used by every existing flow). "jelly-roll" = pre-cut 2.5" strips
   *  (currently only supported on Rail Fence). "fat-quarter" = pre-cut
   *  ~18"×21" fabric rectangles (currently only supported on Simple Squares).
   *  Border/sashing/backing/batting/binding still use yardage in every mode. */
  fabricSource: "yardage" | "jelly-roll" | "fat-quarter";
  /** How many 2.5" strips are in the user's jelly roll (industry standard 40). */
  jellyRollStripCount: number;
  /** Raw width of one fat quarter the user owns, in inches. Defaults to 18"
   *  (the Standard 42"-bolt FQ). Wide-bolt FQs are typically 19"–21" wide. */
  fatQuarterWidth: number;
  /** Raw height of one fat quarter the user owns, in inches. Defaults to 21". */
  fatQuarterHeight: number;
  /** How much fabric the user trims off EACH side of every FQ when squaring up
   *  (selvage + crooked-edge allowance). Default 0.5". User-overridable. */
  fatQuarterTrimMargin: number;
  /** How many fat quarters the user owns (for feasibility messaging). */
  fatQuarterCount: number;
  /** When true (and the current pattern opts in via `supportsAlternate`),
   *  swap Fabric A ↔ Fabric B on every other block to create a checkerboard
   *  alternation across the whole quilt. Piece counts are unchanged; only
   *  the per-fabric split flips. Ignored for patterns that don't opt in. */
  alternateBlocks: boolean;
  /** Chosen block-rotation setting for patterns that opt in via
   *  `PatternDef.layouts`. Rotation only — never changes piece counts. */
  blockLayout: BlockLayout;

  // ---- "Design Your Own Block" (pattern id "custom-block") ----
  /** The user's Block A design. Null until they use the editor. */
  customBlock: CustomBlockDesign | null;
  /** Optional Block B for a two-block alternating set. */
  customBlockB: CustomBlockDesign | null;
  /** When true (and Block B exists), blocks A and B alternate in a checkerboard. */
  useBlockB: boolean;
  /** Fabric pair swapped on every other block when `alternateBlocks` is on
   *  for a custom block. Null = fall back to the first two fabrics used. */
  customSwapPair: [FabricKey, FabricKey] | null;
}



const initial: PlannerState = {
  pattern: null,
  quiltWidth: 50,
  quiltHeight: 65,
  sizePreset: "throw",
  // Left blank by default so the user explicitly enters fabric width, block size,
  // and border on Step 2 instead of seeing prepopulated values. SizePage treats
  // a stored 0 as "not yet set" and shows an empty input.
  fabricWidth: 0,
  blockSize: 0,
  borderWidth: 0,
  sashingWidth: 2,
  cornerAccentSize: 0,
  assignments: {},
  safetyBuffer: true,
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
  customBlock: null,
  customBlockB: null,
  useBlockB: false,
  customSwapPair: null,
};


function loadPlannerState(): PlannerState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<PlannerState>;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

function persistPlannerState(next: PlannerState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage failures and keep the in-memory store working.
  }
}

let state: PlannerState = loadPlannerState();
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function usePlanner(): PlannerState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}

export function setPlanner(patch: Partial<PlannerState>) {
  state = { ...state, ...patch };
  persistPlannerState(state);
  listeners.forEach((l) => l());
}

export function resetPlanner() {
  state = initial;
  persistPlannerState(state);
  listeners.forEach((l) => l());
}

export const SIZE_PRESETS: Record<string, { label: string; w: number; h: number }> = {
  baby: { label: 'Baby (36" × 48")', w: 36, h: 48 },
  throw: { label: 'Throw (50" × 65")', w: 50, h: 65 },
  twin: { label: 'Twin (60" × 80")', w: 60, h: 80 },
  queen: { label: 'Queen (80" × 95")', w: 80, h: 95 },
  king: { label: 'King (105" × 95")', w: 105, h: 95 },
  custom: { label: "Custom", w: 0, h: 0 },
};

export const FABRIC_COLORS: Record<FabricKey, string> = ALL_FABRIC_KEYS.reduce(
  (acc, k) => {
    acc[k] = `var(--fabric-${k.toLowerCase()})`;
    return acc;
  },
  {} as Record<FabricKey, string>,
);

/** Human-friendly colour name for each fabric slot, mirroring the CSS tokens. */
const FABRIC_COLOR_NAMES: Record<FabricKey, string> = {
  A: "Blue",
  B: "Yellow",
  C: "Green",
  D: "Pink",
  E: "Coral",
  F: "Teal",
  G: "Lavender",
  H: "Mustard",
  I: "Plum",
  J: "Mint",
  K: "Rust",
  L: "Slate",
  M: "Navy",
  N: "Butterscotch",
  O: "Forest",
  P: "Poppy",
  Q: "Orchid",
  R: "Olive",
  S: "Sky",
  T: "Brick",
  U: "Cream",
  V: "Violet",
  W: "Aqua",
  X: "Aubergine",
  Y: "Pear",
  Z: "Charcoal",
};

export const FABRIC_LABELS: Record<FabricKey, string> = ALL_FABRIC_KEYS.reduce(
  (acc, k) => {
    acc[k] = `Fabric ${k} — ${FABRIC_COLOR_NAMES[k]}`;
    return acc;
  },
  {} as Record<FabricKey, string>,
);
