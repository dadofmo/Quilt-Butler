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
      // Simple Squares uses the patchwork palette (defaults to A–D, 4 fabrics),
      // so the border defaults to E — the next unused letter — so the frame
      // reads as a distinct accent color instead of blending into the grid.
      { id: "border", label: "Border", defaultFabric: "E", hint: "The frame around the whole quilt." },
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
    hasMath: true,
    intro:
      "Start by sewing a regular Nine Patch (3×3 grid of squares using two contrasting fabrics). Then slice the finished block in half horizontally and again vertically — making 4 quarter-blocks — and rotate each quarter 180° before sewing them back together. The two extra seams 'disappear' the original 9-patch and reveal a more complex pinwheel/chain block from just two fabrics.",
    sections: [
      {
        id: "center",
        label: "Center & corner squares (5 per starting block)",
        defaultFabric: "A",
        hint: "The 4 corners + the middle of the original 9-patch — usually the bolder fabric. After the slice-and-rotate these end up forming the chain that runs through the finished block.",
      },
      {
        id: "outer",
        label: "Alternating squares (4 per starting block)",
        defaultFabric: "B",
        hint: "The 4 squares between the corners — pick something that contrasts. After rearrangement these become the pinwheel/background sections of the finished block.",
      },
      borderSection,
    ],
  },
  {
    id: "squares-on-point",
    name: "Squares on Point",
    hasMath: true,
    intro:
      "Each block is one square rotated 45° (a diamond) framed by 4 background corner triangles — a classic 'square-in-a-square' unit. Pick a bold fabric for the on-point square and a calmer fabric for the background corners so the diamond reads clearly.",
    sections: [
      {
        id: "square",
        label: "On-point square (1 per block)",
        defaultFabric: "A",
        hint: "The diamond in the middle of every block — usually the boldest fabric so it pops against the background corners.",
      },
      {
        id: "bg",
        label: "Background corners (4 triangles per block)",
        defaultFabric: "B",
        hint: "The 4 corner triangles that frame the diamond — pick something that contrasts so the on-point shape stands out.",
      },
      borderSection,
    ],
  },
  {
    id: "pinwheel",
    name: "Pinwheel",
    hasMath: true,
    intro:
      "Each Pinwheel block is made from 4 Half Square Triangle units arranged in a 2×2 grid so the blade triangles all spin clockwise around the center, creating the iconic pinwheel illusion. Pick a bold fabric for the blades and a contrasting fabric for the background.",
    sections: [
      {
        id: "blades",
        label: "Pinwheel blades",
        defaultFabric: "A",
        hint: "The 4 spinning triangles per block — usually a bold print or solid so the pinwheel reads clearly against the background.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "B",
        hint: "The other half of each HST unit — pick something that contrasts strongly with your blades so the pinwheel pops.",
      },
      borderSection,
    ],
  },
  {
    id: "plus-block",
    name: "Plus Block",
    hasMath: true,
    intro:
      "Each block is a 3×3 grid where the center column + center row form a bold '+' on a background. The 5 plus squares (center + 4 around it) use one fabric; the 4 corner squares use a contrasting background fabric.",
    sections: [
      {
        id: "plus",
        label: "Plus squares (5 per block)",
        defaultFabric: "A",
        hint: "The 5 squares forming the '+': center + the 4 squares directly above, below, left, and right of it. Usually the boldest fabric so the plus reads clearly.",
      },
      {
        id: "bg",
        label: "Background corners (4 per block)",
        defaultFabric: "B",
        hint: "The 4 corner squares around the '+'. Pick something that contrasts with the plus fabric.",
      },
      borderSection,
    ],
  },
  {
    id: "churn-dash",
    name: "Churn Dash",
    hasMath: true,
    intro:
      "The Churn Dash is a classic 3×3 block made of three unit types: four Half Square Triangle corners, four rectangular bar units on the sides, and one solid center square. It uses two fabrics — a dark and a light — arranged so the dark pieces appear to spin around the center like a churn dash butter-making tool.",
    sections: [
      {
        id: "center",
        label: "Center square",
        defaultFabric: "A",
        hint: "The solid square in the middle of the block — usually your boldest fabric.",
      },
      {
        id: "corners",
        label: "Corner triangles",
        defaultFabric: "A",
        hint: "The four Half Square Triangle corners — typically the same fabric as the center square.",
      },
      {
        id: "bars",
        label: "Side bars",
        defaultFabric: "A",
        hint: "The four rectangular units on each side of the block — creates the spinning handle effect.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "B",
        hint: "The light half of the corners and side bars — pick something that contrasts with your dark fabric.",
      },
      borderSection,
    ],
  },
  {
    id: "bear-paw",
    name: "Bear Paw",
    hasMath: true,
    intro:
      "The Bear Paw is a 4×4 block made from three unit types: one large center paw pad square (covering the 2×2 middle), eight Half Square Triangle claw units surrounding the pad with their triangles pointing toward center, and four small background squares in the four outer corners of the block. It uses three fabrics — a center pad fabric, a claw fabric for just the HST triangles, and a background fabric used for both the light side of each HST and the four corner squares.",
    sections: [
      {
        id: "center",
        label: "Center paw pad",
        defaultFabric: "A",
        hint: "The large square in the center of the block — the main paw pad. Usually your boldest or most distinctive fabric.",
      },
      {
        id: "claws",
        label: "Claw triangles",
        defaultFabric: "B",
        hint: "The triangles in the eight HST units that form the claws around the paw pad. The four small corner squares are background fabric, not claw fabric.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "C",
        hint: "The light triangle in each HST unit AND the four small corner squares of the block — the negative space that makes the claws stand out. Usually a light solid or low-volume print.",
      },
      { ...borderSection, defaultFabric: "D" },
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
