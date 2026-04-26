import type { PatternId, FabricKey } from "./planner-store";

export interface PatternSection {
  id: string;
  label: string;
  defaultFabric: FabricKey;
  hint?: string;
}

export interface PatternDef {
  id: PatternId;
  name: string;
  sections: PatternSection[];
  hasMath: boolean;
  intro: string;
}

const borderSection: PatternSection = {
  id: "border",
  label: "Border",
  defaultFabric: "C",
  hint: "The frame around the whole quilt.",
};

export const PATTERNS: PatternDef[] = [
  {
    id: "nine-patch",
    name: "Nine Patch",
    hasMath: true,
    intro: "Each block is a 3×3 grid (9 small squares) using two fabrics in a checkerboard. Pick a fabric for the 5 corner+center squares and a contrasting fabric for the 4 squares between them.",
    sections: [
      {
        id: "center",
        label: "Center & corner squares (5 per block)",
        defaultFabric: "A",
        hint: "The 4 corners + the middle square of each block — usually the bolder fabric.",
      },
      {
        id: "outer",
        label: "Alternating squares (4 per block)",
        defaultFabric: "B",
        hint: "The 4 squares between the corners — pick something that contrasts.",
      },
      borderSection,
    ],
  },
  {
    id: "hst",
    name: "Half Square Triangles",
    hasMath: true,
    intro: "Each block is a square split diagonally into two triangles of different fabrics. Pick a fabric for each triangle.",
    sections: [
      { id: "tri1", label: "Triangle A", defaultFabric: "A", hint: "One half of every block." },
      { id: "tri2", label: "Triangle B", defaultFabric: "B", hint: "The other half — pick a contrasting fabric." },
      borderSection,
    ],
  },
  {
    id: "simple-squares",
    name: "Simple Squares",
    hasMath: true,
    intro: "A grid of identical squares — the easiest pattern for beginners. Pick one fabric for all the squares, plus an optional border fabric.",
    sections: [
      { id: "squares", label: "Squares", defaultFabric: "A", hint: "Every square in the grid uses this fabric." },
      // Simple Squares only uses one top fabric (A), so the border defaults
      // to B (the next available) — keeps the labels A & B instead of A & C.
      { id: "border", label: "Border", defaultFabric: "B", hint: "The frame around the whole quilt." },
    ],
  },
  {
    id: "rail-fence",
    name: "Rail Fence",
    hasMath: true,
    intro: "Each block is three parallel strips (rails) sewn together. Alternating blocks are rotated 90° so the rails form a woven 'fence' across the quilt. Pick a fabric for each rail.",
    sections: [
      { id: "rail1", label: "Top rail", defaultFabric: "A", hint: "One of the three strips in every block." },
      { id: "rail2", label: "Middle rail", defaultFabric: "B", hint: "The middle strip — pick something that contrasts with the top and bottom." },
      { id: "rail3", label: "Bottom rail", defaultFabric: "C", hint: "The third strip — together the three fabrics make the woven fence look." },
      { id: "border", label: "Border", defaultFabric: "D", hint: "The frame around the whole quilt." },
    ],
  },
  {
    id: "log-cabin",
    name: "Log Cabin",
    hasMath: true,
    intro:
      "Each block has a small center square (traditionally red — the 'hearth') with skinny strips called 'logs' added in rounds around it. Two adjacent sides of the block are LIGHT logs, the opposite two sides are DARK logs — that's what gives Log Cabin its iconic diagonal split. The center is the same for every block; the light & dark fabrics are usually one each, though many quilters use a small palette.",
    sections: [
      { id: "center", label: "Center square (hearth)", defaultFabric: "A", hint: "The small square in the middle of every block — traditionally red. One of these per block." },
      { id: "light", label: "Light logs", defaultFabric: "B", hint: "The strips on two adjacent sides of every block — typically pale (cream/white/pastel) to read as 'light'." },
      { id: "dark", label: "Dark logs", defaultFabric: "C", hint: "The strips on the OTHER two sides — typically saturated/dark so the diagonal split shows." },
      borderSection,
    ],
  },
  {
    id: "ohio-star",
    name: "Ohio Star",
    hasMath: true,
    intro:
      "A classic 8-pointed star made from a 3×3 grid of 'units'. The 4 corner units are plain background squares, the 4 edge units are pieced 'quarter-square triangles' (QSTs) that form the star points, and the 1 center unit is a plain square. Pick a fabric for the star points, a contrasting fabric for the background, and (optionally) a third fabric to highlight the center.",
    sections: [
      { id: "star", label: "Star points", defaultFabric: "A", hint: "The 8 triangles forming the star — usually the boldest fabric so the star reads clearly against the background." },
      { id: "bg", label: "Background", defaultFabric: "B", hint: "Fills the 4 corner squares and sits between the star points — pick something that contrasts strongly with the star fabric." },
      { id: "center", label: "Center square", defaultFabric: "D", hint: "The single square in the middle of every block — can repeat the star fabric, the background, or use a third accent fabric." },
      borderSection,
    ],
  },
  {
    id: "flying-geese",
    name: "Flying Geese",
    hasMath: true,
    intro:
      "Rows of triangle 'geese' (2:1 wide rectangles) flying across a sky background. Each block stacks 2 geese vertically — pick a bold fabric for the geese and a quieter sky fabric for the corners.",
    sections: [
      { id: "goose", label: "Geese (triangles)", defaultFabric: "A", hint: "The 2 large triangles per block — typically the boldest fabric so the 'geese' read clearly against the sky." },
      { id: "sky", label: "Sky (background)", defaultFabric: "B", hint: "Fills the corners on either side of every goose — pick something calm/light that contrasts with the geese." },
      borderSection,
    ],
  },
  {
    id: "disappearing-nine-patch",
    name: "Disappearing Nine Patch",
    hasMath: false,
    intro: "Start with a nine-patch block, then cut it into quarters and rearrange — creates a more complex look from two fabrics.",
    sections: [
      { id: "center", label: "Center & corner squares", defaultFabric: "A" },
      { id: "outer", label: "Alternating squares", defaultFabric: "B" },
      borderSection,
    ],
  },
  {
    id: "squares-on-point",
    name: "Squares on Point",
    hasMath: false,
    intro: "Squares rotated 45° (like diamonds) sitting on a background fabric.",
    sections: [
      { id: "square", label: "On-point squares", defaultFabric: "A", hint: "The diamond shapes." },
      { id: "bg", label: "Background", defaultFabric: "B", hint: "The fabric they sit on." },
      borderSection,
    ],
  },
  {
    id: "plus-block",
    name: "Plus Block",
    hasMath: false,
    intro: "A simple plus/cross shape on a background.",
    sections: [
      { id: "plus", label: "Plus shape", defaultFabric: "A" },
      { id: "bg", label: "Background", defaultFabric: "B" },
      borderSection,
    ],
  },
];

export function getPattern(id: PatternId | null): PatternDef | null {
  if (!id) return null;
  return PATTERNS.find((p) => p.id === id) ?? null;
}

/**
 * The fabrics a pattern actually uses = unique defaultFabric values across
 * all its sections (border included only when the user picked a border).
 * Returned in canonical order A, B, C, D.
 */
export function fabricsForPattern(pattern: PatternDef, includeBorder: boolean): FabricKey[] {
  const order: FabricKey[] = [
    "A","B","C","D","E","F","G","H","I","J","K","L",
  ];
  const used = new Set<FabricKey>();
  pattern.sections.forEach((s) => {
    if (s.id === "border" && !includeBorder) return;
    used.add(s.defaultFabric);
  });
  return order.filter((f) => used.has(f));
}
