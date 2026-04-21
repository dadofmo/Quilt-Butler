import type { PatternId, FabricKey } from "./planner-store";

export interface PatternSection {
  id: string;
  label: string;
  defaultFabric: FabricKey;
}

export interface PatternDef {
  id: PatternId;
  name: string;
  sections: PatternSection[];
  hasMath: boolean;
}

const borderSection: PatternSection = { id: "border", label: "Border", defaultFabric: "C" };

export const PATTERNS: PatternDef[] = [
  {
    id: "simple-squares",
    name: "Simple Squares",
    hasMath: false,
    sections: [
      { id: "squares", label: "Squares", defaultFabric: "A" },
      borderSection,
    ],
  },
  {
    id: "nine-patch",
    name: "Nine Patch",
    hasMath: true,
    sections: [
      { id: "center", label: "Center & corner squares", defaultFabric: "A" },
      { id: "outer", label: "Alternating squares", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "hst",
    name: "Half Square Triangles",
    hasMath: true,
    sections: [
      { id: "tri1", label: "Triangle A", defaultFabric: "A" },
      { id: "tri2", label: "Triangle B", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "rail-fence",
    name: "Rail Fence",
    hasMath: false,
    sections: [
      { id: "rail1", label: "Rail 1", defaultFabric: "A" },
      { id: "rail2", label: "Rail 2", defaultFabric: "B" },
      { id: "rail3", label: "Rail 3", defaultFabric: "D" },
      borderSection,
    ],
  },
  {
    id: "log-cabin",
    name: "Log Cabin",
    hasMath: false,
    sections: [
      { id: "center", label: "Center", defaultFabric: "D" },
      { id: "light", label: "Light logs", defaultFabric: "B" },
      { id: "dark", label: "Dark logs", defaultFabric: "A" },
      borderSection,
    ],
  },
  {
    id: "ohio-star",
    name: "Ohio Star",
    hasMath: false,
    sections: [
      { id: "star", label: "Star points", defaultFabric: "A" },
      { id: "bg", label: "Background", defaultFabric: "B" },
      { id: "center", label: "Center", defaultFabric: "D" },
      borderSection,
    ],
  },
  {
    id: "flying-geese",
    name: "Flying Geese",
    hasMath: false,
    sections: [
      { id: "goose", label: "Goose", defaultFabric: "A" },
      { id: "sky", label: "Sky", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "disappearing-nine-patch",
    name: "Disappearing Nine Patch",
    hasMath: false,
    sections: [
      { id: "center", label: "Center squares", defaultFabric: "A" },
      { id: "outer", label: "Outer squares", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "squares-on-point",
    name: "Squares on Point",
    hasMath: false,
    sections: [
      { id: "square", label: "On-point squares", defaultFabric: "A" },
      { id: "bg", label: "Background", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "plus-block",
    name: "Plus Block",
    hasMath: false,
    sections: [
      { id: "plus", label: "Plus", defaultFabric: "A" },
      { id: "bg", label: "Background", defaultFabric: "B" },
      borderSection,
    ],
  },
];

export function getPattern(id: PatternId | null): PatternDef | null {
  if (!id) return null;
  return PATTERNS.find((p) => p.id === id) ?? null;
}
