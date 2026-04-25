import { useSyncExternalStore } from "react";

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
  | "plus-block";

export type FabricKey =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export const ALL_FABRIC_KEYS: FabricKey[] = [
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
  assignments: SectionAssignments;
  safetyBuffer: boolean;
  fabricNames: Partial<Record<FabricKey, string>>;
  /** Number of distinct fabrics user wants to use in the patchwork preview (2–12). */
  patchworkFabricCount: number;
  /** Per-cell fabric assignments for the patchwork preview grid, keyed "r,c". */
  patchworkGrid: Record<string, FabricKey>;
}

const initial: PlannerState = {
  pattern: null,
  quiltWidth: 50,
  quiltHeight: 65,
  sizePreset: "throw",
  fabricWidth: 44,
  blockSize: 12,
  borderWidth: 3,
  assignments: {},
  safetyBuffer: true,
  fabricNames: {},
  patchworkFabricCount: 4,
  patchworkGrid: {},
};

let state: PlannerState = initial;
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
  listeners.forEach((l) => l());
}

export function resetPlanner() {
  state = initial;
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

export const FABRIC_COLORS: Record<FabricKey, string> = {
  A: "var(--fabric-a)",
  B: "var(--fabric-b)",
  C: "var(--fabric-c)",
  D: "var(--fabric-d)",
  E: "var(--fabric-e)",
  F: "var(--fabric-f)",
  G: "var(--fabric-g)",
  H: "var(--fabric-h)",
  I: "var(--fabric-i)",
  J: "var(--fabric-j)",
  K: "var(--fabric-k)",
  L: "var(--fabric-l)",
};

export const FABRIC_LABELS: Record<FabricKey, string> = {
  A: "Fabric A — Blue",
  B: "Fabric B — Yellow",
  C: "Fabric C — Green",
  D: "Fabric D — Pink",
  E: "Fabric E — Coral",
  F: "Fabric F — Teal",
  G: "Fabric G — Lavender",
  H: "Fabric H — Mustard",
  I: "Fabric I — Plum",
  J: "Fabric J — Mint",
  K: "Fabric K — Rust",
  L: "Fabric L — Slate",
};
