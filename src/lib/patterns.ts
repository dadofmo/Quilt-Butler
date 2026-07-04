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
  /** Pattern opts into the reusable "alternate blocks" toggle on Step 2
   *  (swap Fabric A ↔ Fabric B on every other block for a checkerboard).
   *  Only 2-fabric block patterns should enable this. */
  supportsAlternate?: boolean;
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
    intro: "Each block is a 3×3 grid (9 small squares) using two fabrics in a checkerboard. Pick a fabric for the 5 corner+center squares and a contrasting fabric for the 4 squares between them. Optionally add plain sashing strips between blocks for a framed look.",
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Nine Patch block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "D" },
    ],
  },
  {
    id: "hst",
    name: "Half Square Triangles",
    hasMath: true,
    intro: "Each block is a square split diagonally into two triangles of different fabrics. Pick a fabric for each triangle. Optionally add plain sashing strips between blocks for a framed look.",
    sections: [
      { id: "tri1", label: "Triangle A", defaultFabric: "A", hint: "One half of every block." },
      { id: "tri2", label: "Triangle B", defaultFabric: "B", hint: "The other half — pick a contrasting fabric." },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each HST block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "D" },
    ],
  },
  {
    id: "simple-squares",
    name: "Simple Squares",
    hasMath: true,
    intro: "A grid of squares — the easiest pattern for beginners. Choose how many fabrics you want (2–12), then tap squares in the preview to design your patchwork. Add an optional border, and optional plain sashing strips between blocks for a framed look.",
    sections: [
      { id: "squares", label: "Squares", defaultFabric: "A", hint: "Every square in the grid uses this fabric." },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "B",
        hint: "Optional strips of fabric that separate each square — set sashing to 0\" on the previous step if you don't want any.",
      },
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
    intro: "Each block is three parallel strips (rails) sewn together. Alternating blocks are rotated 90° so the rails form a woven 'fence' across the quilt. Pick a fabric for each rail. Optionally add plain sashing strips between blocks for a framed look.",
    sections: [
      { id: "rail1", label: "Top rail", defaultFabric: "A", hint: "One of the three strips in every block." },
      { id: "rail2", label: "Middle rail", defaultFabric: "B", hint: "The middle strip — pick something that contrasts with the top and bottom." },
      { id: "rail3", label: "Bottom rail", defaultFabric: "C", hint: "The third strip — together the three fabrics make the woven fence look." },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Rail Fence block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { id: "border", label: "Border", defaultFabric: "D", hint: "The frame around the whole quilt." },
    ],
  },
  {
    id: "log-cabin",
    name: "Log Cabin",
    hasMath: true,
    intro:
      "Each block has a small center square (traditionally red — the 'hearth') with skinny strips called 'logs' added in rounds around it. Two adjacent sides of the block are LIGHT logs, the opposite two sides are DARK logs — that's what gives Log Cabin its iconic diagonal split. The center is the same for every block; the light & dark fabrics are usually one each, though many quilters use a small palette. Optionally add plain sashing strips between blocks for a framed look.",
    sections: [
      { id: "center", label: "Center square (hearth)", defaultFabric: "A", hint: "The small square in the middle of every block — traditionally red. One of these per block." },
      { id: "light", label: "Light logs", defaultFabric: "B", hint: "The strips on two adjacent sides of every block — typically pale (cream/white/pastel) to read as 'light'." },
      { id: "dark", label: "Dark logs", defaultFabric: "C", hint: "The strips on the OTHER two sides — typically saturated/dark so the diagonal split shows." },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Log Cabin block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "D" },
    ],
  },
  {
    id: "ohio-star",
    name: "Ohio Star",
    hasMath: true,
    intro:
      "A classic 8-pointed star made from a 3×3 grid of 'units'. The 4 corner units are plain background squares, the 4 edge units are pieced 'quarter-square triangles' (QSTs) that form the star points, and the 1 center unit is a plain square. Pick a fabric for the star points, a contrasting fabric for the background, and (optionally) a third fabric to highlight the center. Optionally add plain sashing strips between blocks for a framed look.",
    sections: [
      { id: "star", label: "Star points", defaultFabric: "A", hint: "The 8 triangles forming the star — usually the boldest fabric so the star reads clearly against the background." },
      { id: "bg", label: "Background", defaultFabric: "B", hint: "Fills the 4 corner squares and sits between the star points — pick something that contrasts strongly with the star fabric." },
      { id: "center", label: "Center square", defaultFabric: "D", hint: "The single square in the middle of every block — can repeat the star fabric, the background, or use a third accent fabric." },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Ohio Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Flying Geese block — set sashing to 0\" on the previous step if you don't want any.",
      },
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Disappearing Nine Patch block — set sashing to 0\" on the previous step if you don't want any.",
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Squares on Point block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "pinwheel",
    name: "Pinwheel",
    hasMath: true,
    intro:
      "Each Pinwheel block is made from 4 Half Square Triangle units arranged in a 2×2 grid so the blade triangles all spin clockwise around the center, creating the iconic pinwheel illusion. Pick a bold fabric for the blades and a contrasting fabric for the background. Optionally add plain sashing strips between blocks for a framed look.",
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Pinwheel block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "plus-block",
    name: "Plus Block",
    hasMath: true,
    intro:
      "Each block is a 3×3 grid where the center column + center row form a bold '+' on a background. The 5 plus squares (center + 4 around it) use one fabric; the 4 corner squares use a contrasting background fabric. Optionally add plain sashing strips between blocks for a framed look.",
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Plus Block — set sashing to 0\" on the previous step if you don't want any.",
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
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Churn Dash block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "bear-paw",
    name: "Bear Paw",
    hasMath: true,
    intro:
      "The Bear Paw block is made of four traditional paw units arranged around a small center accent square with sashing between them. Each paw unit has one large pad square tucked into the inner corner, four Half Square Triangle claw units along the two outer edges, and one background corner square at the outermost corner. The claws on all four paws face outward, creating the bear paw effect.",
    sections: [
      {
        id: "pad",
        label: "Paw pads",
        defaultFabric: "A",
        hint: "The large square that forms the base of each paw — your main fabric. You will need four per block.",
      },
      {
        id: "claws",
        label: "Claw fabric",
        defaultFabric: "B",
        hint: "The triangles in each HST unit that form the claws along the outer edges of each paw. Usually a bold contrasting color.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "C",
        hint: "The corner squares and the background triangle in each HST unit. Also forms the cross-strips inside each block that separate the four paws (the strips you see inside the 1 BLOCK preview). Usually a light neutral fabric.",
      },
      {
        id: "center-accent",
        label: "Center accent square",
        defaultFabric: "D",
        hint: "The small square where the four in-block strips meet in the center of the block — often a fun accent color that ties the whole block together.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "The strips of fabric that separate one finished Bear Paw block from the next — only visible in the full quilt view, not inside a single block. Usually your background fabric or a coordinating neutral.",
      },
      {
        id: "cornerstone",
        label: "Cornerstone squares",
        defaultFabric: "E",
        hint: "The small accent squares where sashing strips meet at each intersection — a classic Bear Paw detail.",
      },
      { ...borderSection, defaultFabric: "D" },
    ],
  },
  {
    id: "irish-chain",
    name: "Irish Chain",
    hasMath: true,
    intro:
      "A classic two-fabric quilt built from alternating blocks: a 9-patch chain block (5 contrasting corner+center squares with 4 background squares between them) sewn next to a plain background block of the same size. Lined up in a checkerboard, the contrasting squares connect into long diagonal chains running across the whole quilt. Built efficiently from strip-pieced sets cut into 3-square units.",
    sections: [
      {
        id: "background",
        label: "Background fabric",
        defaultFabric: "A",
        hint: "The main fabric — fills the plain alternate blocks AND the 4 alternating squares inside each chain block. In the example, this is the blue.",
      },
      {
        id: "chain",
        label: "Chain (contrasting) fabric",
        defaultFabric: "B",
        hint: "The contrasting fabric that forms the diagonal chains across the quilt — the 5 corner+center squares in each chain block. In the example, this is the cream.",
      },
      borderSection,
    ],
  },
  {
    id: "sawtooth-star",
    name: "Sawtooth Star",
    hasMath: true,
    intro:
      "The Sawtooth Star is built on a 4×4 grid of equal units. The center four cells form one large center square. The four corners are background squares. The eight remaining cells are Half Square Triangle units — each with a star-colored triangle pointing inward and a background triangle filling the outer corner. The center square is its own fabric choice — use the same fabric as the star points for a traditional 2-color look, or pick a contrasting fabric to make the center pop.",
    sections: [
      {
        id: "star",
        label: "Star points",
        defaultFabric: "A",
        hint: "The 8 star-point triangles in the HST units — forms the points of the star.",
      },
      {
        id: "center",
        label: "Center square",
        defaultFabric: "C",
        hint: "The large 2×2 square in the middle of the star. Pick the same fabric as the star points for a traditional 2-color block, or a different fabric for a contrasting center.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "B",
        hint: "The four corner squares and the background triangles in each HST unit — the fabric behind the star.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Sawtooth Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "friendship-star",
    name: "Friendship Star",
    hasMath: true,
    intro:
      "The Friendship Star is a classic 3×3 block — one center square, four corner background squares, and four Half Square Triangle units forming the star points. You can use the same fabric for the center and points for a traditional two-color look, or pick a different accent fabric for the center to make it pop. Each \"Fabric\" (A / B / C) is one bolt you will buy — use the same letter for parts you want to look the same.",
    sections: [
      {
        id: "center",
        label: "Center square",
        defaultFabric: "A",
        hint: "The square in the middle of the block. Match it to your star points for a classic look, or use a fun accent fabric.",
      },
      {
        id: "points",
        label: "Star points",
        defaultFabric: "B",
        hint: "The triangle in each of the four HST units that forms the star shape.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "C",
        hint: "The four corner squares and the background triangle in each HST unit.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Friendship Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "snowball-block",
    name: "Snowball Block",
    hasMath: true,
    intro:
      "This pattern uses two fabrics that trade places block to block. In one block, Fabric A fills the large center octagon and Fabric B forms the small corner triangles. In the next block, the roles flip — Fabric B becomes the large center and Fabric A becomes the corners. This automatic checkerboard alternation is what creates the diamond pattern where blocks meet — no extra decisions needed, it happens automatically across your whole quilt.",
    sections: [
      {
        id: "mainA",
        label: "Fabric A",
        defaultFabric: "A",
        hint: "Used as the large center square in half your blocks, and as the corner accent in the other half.",
      },
      {
        id: "mainB",
        label: "Fabric B",
        defaultFabric: "B",
        hint: "The second fabric — automatically swaps roles with Fabric A every other block.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Snowball Block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "four-patch",
    name: "Four Patch",
    hasMath: true,
    intro:
      "The Four Patch is the simplest block in quilting — just four equal squares arranged in a 2×2 grid. Use two fabrics for a classic checkerboard look, or four completely different fabrics for a scrappy confetti effect — it's entirely up to you.",
    sections: [
      {
        id: "topLeft",
        label: "Top-left square",
        defaultFabric: "A",
        hint: "The square in the top-left position of every block.",
      },
      {
        id: "topRight",
        label: "Top-right square",
        defaultFabric: "B",
        hint: "The square in the top-right position of every block.",
      },
      {
        id: "bottomLeft",
        label: "Bottom-left square",
        defaultFabric: "D",
        hint: "The square in the bottom-left position of every block.",
      },
      {
        id: "bottomRight",
        label: "Bottom-right square",
        defaultFabric: "C",
        hint: "The square in the bottom-right position of every block.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Four Patch block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "streak-of-lightning",
    name: "Streak of Lightning",
    hasMath: true,
    intro:
      "Each block is four Half Square Triangle units, all facing the same direction. On their own each block shows a simple diagonal stripe — but lined up across a full quilt, the diagonals connect block to block into one continuous zigzag streak. Tip for best results: this pattern looks most striking with no sashing between blocks, so the diagonal lines connect cleanly. Sashing is still available if you prefer a more separated look — just know the continuous zigzag effect will be interrupted at each seam.",
    sections: [
      {
        id: "stripe",
        label: "Stripe fabric",
        defaultFabric: "A",
        hint: "The fabric forming the diagonal line running through each block.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "B",
        hint: "The fabric behind the diagonal stripe.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Streak of Lightning block — set sashing to 0\" on the previous step to keep the zigzag continuous.",
      },
      borderSection,
    ],
  },
  {
    id: "bow-tie",
    name: "Bow Tie",
    hasMath: true,
    intro:
      "Each block is a 2×2 grid of four plain squares with a small on-point square (the 'knot') centered where they meet. Fabric A fills the two diagonal corners (top-left + bottom-right), Fabric B fills the other diagonal (top-right + bottom-left), and Fabric C is the knot — three distinct fabrics. The main squares are full, uncut squares; the knot is appliquéd on top of the center seam intersection so the only angled shape in the whole block is the rotated center square.",
    sections: [
      {
        id: "mainA",
        label: "Fabric A — diagonal squares (top-left + bottom-right)",
        defaultFabric: "A",
        hint: "Two of these per block — the squares in the top-left and bottom-right corners.",
      },
      {
        id: "mainB",
        label: "Fabric B — diagonal squares (top-right + bottom-left)",
        defaultFabric: "B",
        hint: "Two of these per block — the squares in the top-right and bottom-left corners. Pick something that contrasts with Fabric A.",
      },
      {
        id: "knot",
        label: "Fabric C — knot (center diamond)",
        defaultFabric: "D",
        hint: "The small on-point square in the middle of every block. One per block — pick a distinct accent color so the knot pops.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Bow Tie block — set sashing to 0\" on the previous step if you don't want any.",
      },
      borderSection,
    ],
  },
  {
    id: "shoofly",
    name: "Shoofly",
    hasMath: true,
    supportsAlternate: true,
    intro:
      "One of the most classic American beginner blocks — a 3×3 grid built from just two fabrics. Four Half Square Triangle corners point inward toward a center accent square, with four plain background squares filling the sides. Together the four corner triangles and the center form a loose diamond in the middle of every block. Turn on \"Alternate blocks\" below if you want Fabric A and Fabric B to swap roles on every other block for a checkerboard look.",
    sections: [
      {
        id: "bg",
        label: "Background (Fabric A)",
        defaultFabric: "A",
        hint: "The 4 plain side squares in every block, plus the background half of each corner triangle unit. Usually a calm/light fabric so the accent reads.",
      },
      {
        id: "accent",
        label: "Accent (Fabric B)",
        defaultFabric: "B",
        hint: "The 1 center square and the accent half of each corner triangle — together they form the loose diamond in the middle of every block. Pick a fabric that contrasts strongly with the background.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Shoofly block — set sashing to 0\" on the previous step if you don't want any (the traditional look).",
      },
      borderSection,
    ],
  },
  {
    id: "jacobs-ladder",
    name: "Jacob's Ladder",
    hasMath: true,
    intro:
      "One of the most iconic traditional American blocks. Each block is a 3×3 arrangement of nine sub-blocks: five four-patches (at the four corners + the center) and four large half-square-triangle units (on the four edges), for a 6×6 mini-grid overall. Every other block is automatically rotated 90° when tiled so the diagonals from neighboring blocks connect into the classic Jacob's Ladder diamond pattern with checkerboard chains running between the diamonds.",
    sections: [
      {
        id: "dark",
        label: "Four-patch dark squares (Fabric A)",
        defaultFabric: "A",
        hint: "The dark alternating squares inside every four-patch — 10 per block. Usually your boldest fabric.",
      },
      {
        id: "light",
        label: "Four-patch light squares + HST background (Fabric B)",
        defaultFabric: "B",
        hint: "The light alternating squares inside every four-patch AND the background half of each corner HST unit — pick a calm/light fabric that contrasts strongly with the dark and the ladder accent.",
      },
      {
        id: "ladder",
        label: "Ladder accent (Fabric C)",
        defaultFabric: "D",
        hint: "The large triangle on each of the 4 HST units — this is the fabric that forms the diagonal \"ladder\" band. Pick the same tone as Fabric A for the traditional 2-color look, or a distinct third fabric for extra pop.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each Jacob's Ladder block — set sashing to 0\" on the previous step for the classic look where the diagonals connect across neighboring blocks (recommended so the diamond secondary pattern reads).",
      },
      borderSection,
    ],
  },
  {
    id: "autumn-tints",
    name: "Autumn Tints",
    hasMath: true,
    intro:
      "A beginner-friendly 4-color block made entirely of plain squares — no triangles, no diagonal cuts. Each block is a 4×4 grid of 16 equal squares: Fabric A (dominant) fills two solid 2×2 corner groups on the top-left and bottom-right, Fabric B (background) fills 4 squares, and two accent fabrics (C and D) each appear in 2 squares placed on opposite corners. Because the block has 180° rotational symmetry, when you tile it across a quilt the dominant corners chain into a strong diagonal secondary pattern.",
    sections: [
      {
        id: "dominant",
        label: "Dominant squares (Fabric A — 8 per block)",
        defaultFabric: "A",
        hint: "The two 2×2 corner groups (top-left + bottom-right of every block). This is your main fabric — 8 squares per block.",
      },
      {
        id: "background",
        label: "Background squares (Fabric B — 4 per block)",
        defaultFabric: "B",
        hint: "The 4 background squares that separate the dominant corners from the accents — usually a light neutral so the accents pop.",
      },
      {
        id: "accent1",
        label: "First accent (Fabric C — 2 per block)",
        defaultFabric: "C",
        hint: "Two squares per block placed on opposite corners of the block interior.",
      },
      {
        id: "accent2",
        label: "Second accent (Fabric D — 2 per block)",
        defaultFabric: "D",
        hint: "Two squares per block placed on the other pair of opposite corners.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Autumn Tints block — set sashing to 0\" on the previous step for the classic look where the dominant corners chain across neighboring blocks.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "woven-star",
    name: "Woven Star",
    hasMath: true,
    intro:
      "The Woven Star is a striking 4×4 grid block that reads as four interlocking diamond arms crossing through a shared center. The four corners are plain background squares. Eight edge units are Half Square Triangles (HSTs) — each with a colored diamond tip and a background triangle. The four center units are Quarter Square Triangles (QSTs) where the four diamond arms weave over and under each other. Each of the four star arms uses its own fabric (A, B, C, D) so the woven effect really pops against the background (E).",
    sections: [
      {
        id: "point1",
        label: "Star arm A",
        defaultFabric: "A",
        hint: "The first of four star-arm fabrics — forms one interlocking diamond across the block.",
      },
      {
        id: "point2",
        label: "Star arm B",
        defaultFabric: "B",
        hint: "The second star-arm fabric — pick a contrasting color so the diamonds weave visibly.",
      },
      {
        id: "point3",
        label: "Star arm C",
        defaultFabric: "C",
        hint: "The third star-arm fabric.",
      },
      {
        id: "point4",
        label: "Star arm D",
        defaultFabric: "D",
        hint: "The fourth star-arm fabric — completes the four-way woven look.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "E",
        hint: "The four plain corner squares and the background triangles behind the diamond tips — usually a light neutral so the arms pop.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "F",
        hint: "Optional strips of fabric that separate each Woven Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "G" },
    ],
  },
];

export function getPattern(id: PatternId | null): PatternDef | null {
  if (!id) return null;
  return PATTERNS.find((p) => p.id === id) ?? null;
}

/**
 * True when the pattern declares an optional sashing section. Pages should
 * use this instead of hardcoded pattern-id lists so newly added patterns
 * with sashing don't silently regress the "Your full quilt" preview or
 * border-default color math. See patterns-coverage.test for the guardrail.
 */
export function patternHasSashingSection(pattern: PatternDef | null): boolean {
  if (!pattern) return false;
  return pattern.sections.some((s) => s.id === "sashing");
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

/**
 * The default border fabric is the first letter NOT already used by any
 * active block section. This keeps the "Your full quilt" preview's border
 * color in lock-step with the swatch choices on FabricsPage — which always
 * offers the block fabrics + the next free accent letter. Without this,
 * patterns whose static border default (e.g. HST/Nine Patch "D") falls
 * outside the available swatches caused the preview to render a color the
 * user couldn't actually see selected.
 *
 * Pass hasSashing/hasCornerstones to exclude those section fabrics when
 * they're not active for the current size selection.
 */
export function getEffectiveBorderDefault(
  pattern: PatternDef,
  hasSashing: boolean,
  hasCornerstones: boolean,
): FabricKey {
  const order: FabricKey[] = [
    "A","B","C","D","E","F","G","H","I","J","K","L",
  ];
  const used = new Set<FabricKey>();
  pattern.sections.forEach((s) => {
    if (s.id === "border") return;
    if (s.id === "sashing" && !hasSashing) return;
    if (s.id === "cornerstone" && !hasCornerstones) return;
    used.add(s.defaultFabric);
  });
  return order.find((f) => !used.has(f)) ?? "C";
}
