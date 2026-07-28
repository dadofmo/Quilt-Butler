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
    id: "card-trick",
    name: "Card Trick",
    hasMath: true,
    intro:
      "The Card Trick block is a classic 3×3 block that creates the illusion of four overlapping playing cards. Each 'card' is a square set on point (a diamond) that spans a 2×2 area — the four diamonds meet at the block's center where all four card fabrics touch. The background fabric shows only in the four outer corner triangles. Pick four contrasting card fabrics (A, B, C, D) and one background (E) so the woven-cards illusion reads clearly.",
    sections: [
      {
        id: "cardA",
        label: "Top Left Card",
        defaultFabric: "A",
        hint: "The first card diamond — sits in the top-left quadrant of the block.",
      },
      {
        id: "cardB",
        label: "Top Right Card",
        defaultFabric: "B",
        hint: "The second card diamond — top-right quadrant. Pick something that contrasts with the Top Left Card.",
      },
      {
        id: "cardC",
        label: "Bottom Right Card",
        defaultFabric: "C",
        hint: "The third card diamond — bottom-right quadrant.",
      },
      {
        id: "cardD",
        label: "Bottom Left Card",
        defaultFabric: "D",
        hint: "The fourth card diamond — bottom-left quadrant.",
      },
      {
        id: "bg",
        label: "Background",
        defaultFabric: "E",
        hint: "The four corner triangles that frame the block — usually a light neutral so the four card colors pop.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "F",
        hint: "Optional strips of fabric that separate each Card Trick block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "G" },
    ],
  },
  {
    id: "oh-susannah",
    name: "Oh Susannah",
    hasMath: true,
    intro:
      "Oh Susannah is a classic 4×4 block built from just three fabrics: a dominant accent (Fabric A), a secondary accent (Fabric B), and a background (Fabric C). Plain squares run around the outside of the block; four Half Square Triangle units in the center 2×2 meet along their diagonals to form a large background diamond in the middle. The four A squares in the outer ring plus the four A corner triangles of the center HSTs read as a plus/cross around the diamond, with the B squares filling the opposite arms and the C corners quietly framing the whole block.",
    sections: [
      {
        id: "dominant",
        label: "Dominant accent (Fabric A)",
        defaultFabric: "A",
        hint: "Forms the plus/cross around the center diamond — 4 plain squares in the block's outer ring plus the outer-corner triangle of each of the 4 center HST units. Usually your boldest fabric.",
      },
      {
        id: "secondary",
        label: "Secondary accent (Fabric B)",
        defaultFabric: "B",
        hint: "The 4 plain squares in the OTHER pair of outer-ring arms. Pick something that contrasts with Fabric A. Fabric B never appears in the center HSTs.",
      },
      {
        id: "bg",
        label: "Background (Fabric C)",
        defaultFabric: "C",
        hint: "The 4 plain corner squares of the block AND the center-facing triangle of each of the 4 HSTs — those four triangles join to form the large diamond in the middle of the block. Usually a calm/light fabric so the accents pop.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Oh Susannah block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "E" },
    ],
  },
  {
    id: "twin-star",
    name: "Twin Star",
    hasMath: true,
    intro:
      "Twin Star is a classic 3×3 block built from four fabrics. The 4 corners and the center are plain Fabric C (background) squares. Each of the 4 edge cells is a 3-triangle unit made of one large accent triangle (Fabric A) plus two small triangles (Fabric B point + Fabric D second point). The edge units rotate 90° around the block so Fabric A's large triangles form a bold 4-point pinwheel star radiating from the center, and Fabrics B and D form two nested secondary stars. Fabric C never appears inside the edge units.",
    sections: [
      {
        id: "star",
        label: "Large star (Fabric A)",
        defaultFabric: "A",
        hint: "The 4 big triangles that form the dominant pinwheel star — one per edge cell. Usually your boldest fabric so the star reads clearly.",
      },
      {
        id: "point",
        label: "Secondary star point (Fabric B)",
        defaultFabric: "B",
        hint: "One of the two small triangles in each edge cell. Pick a color that contrasts with the large star, the background, and Fabric D.",
      },
      {
        id: "point2",
        label: "Second star point (Fabric D)",
        defaultFabric: "D",
        hint: "The other small triangle in each edge cell — a fully distinct fabric from the background. It forms a second nested star alongside Fabric B.",
      },
      {
        id: "bg",
        label: "Background (Fabric C)",
        defaultFabric: "C",
        hint: "Fills the 4 corner squares and the center square only. Never used inside the edge units, so the corners read as clean, plain squares.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Twin Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "star-and-cross",
    name: "Star & Cross",
    hasMath: true,
    intro:
      "Star & Cross is a beginner-friendly 4-fabric block built entirely from rectangles and squares — no triangles anywhere. Each block is a 5×5 grid: a bold plus/cross of Fabric C runs through the center horizontal and vertical rows, with a small Fabric D square where the arms meet. The four 2×2 corner units each show a Fabric A background rectangle across the top and, beneath it, one Fabric A background square and one Fabric B accent square — the accent square always sits next to the cross, nearest the center of the block.",
    sections: [
      {
        id: "bg",
        label: "Background (Fabric A)",
        defaultFabric: "A",
        hint: "Fills the four large corner rectangles and one small square in each corner unit — 4 large rectangles + 4 small squares per block. Usually a calm/light fabric so the cross and accents pop.",
      },
      {
        id: "accent",
        label: "Corner accent squares (Fabric B)",
        defaultFabric: "B",
        hint: "The 4 small accent squares — one per corner, always positioned right next to the cross arms (nearest the center of the block). Pick a color that pops against the background.",
      },
      {
        id: "cross",
        label: "Cross arms (Fabric C)",
        defaultFabric: "C",
        hint: "The 4 solid rectangles forming the plus/cross through the block — top, bottom, left, right arms. Usually your boldest fabric so the cross reads clearly.",
      },
      {
        id: "center",
        label: "Center square (Fabric D)",
        defaultFabric: "D",
        hint: "The single small square where the four cross arms meet in the middle of every block.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Star & Cross block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "idaho-beauty",
    name: "Idaho Beauty",
    hasMath: true,
    intro:
      "Idaho Beauty is built as a 3×3 core of full-size cells surrounded by a half-width outer ring. Four on-point diamonds form a plus around the center, five solid accent squares form an X through the core, and eight half-width geese units sit in the outside ring with their background triangles pointing inward toward the block center.",
    sections: [
      {
        id: "bg",
        label: "Background (Fabric A)",
        defaultFabric: "A",
        hint: "Fills the small outer-corner squares, the plain half-width outer-ring rectangles, the inward triangle of every goose unit, and the on-point diamond center of each of the 4 diamond units. Usually a light/calm fabric.",
      },
      {
        id: "accent",
        label: "Accent triangles (Fabric B)",
        defaultFabric: "B",
        hint: "The 4 corner triangles that frame each on-point diamond, plus the two outside corner triangles in every half-width goose unit — pick a fabric that contrasts strongly with the background.",
      },
      {
        id: "solid",
        label: "Solid squares (Fabric C)",
        defaultFabric: "C",
        hint: "The 5 plain, uncut full-size squares that form the X through the 3×3 core. Fabric C never appears in any triangle — pick a mid-tone that reads distinct from both A and B.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Idaho Beauty block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "E" },
    ],
  },
  {
    id: "checkerboard",
    name: "Checkerboard",
    hasMath: true,
    intro:
      "Checkerboard is a nested block: a full-block hourglass on the outside (Fabric A top+bottom, Fabric B left+right) with an on-point square filling the middle. That inner on-point square is pieced from 4 smaller squares in a 2×2 pinwheel — Fabric C in the top and bottom positions, Fabric D in the left and right positions — so all four fabrics meet cleanly at the block center.",
    sections: [
      {
        id: "outerA",
        label: "Outer top+bottom (Fabric A)",
        defaultFabric: "A",
        hint: "The two large triangles that fill the top and bottom of the outer hourglass. Usually your boldest fabric.",
      },
      {
        id: "outerB",
        label: "Outer left+right (Fabric B)",
        defaultFabric: "B",
        hint: "The two large triangles that fill the left and right of the outer hourglass — pick a fabric that contrasts with Fabric A.",
      },
      {
        id: "innerC",
        label: "Inner top+bottom squares (Fabric C)",
        defaultFabric: "C",
        hint: "Two of the four small on-point squares inside the center diamond — they sit in the top and bottom positions of the inner 2×2 pinwheel.",
      },
      {
        id: "innerD",
        label: "Inner left+right squares (Fabric D)",
        defaultFabric: "D",
        hint: "The other two small on-point squares inside the center diamond — they sit in the left and right positions of the inner 2×2 pinwheel.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Checkerboard block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "cabin-in-the-cotton",
    name: "Cabin in the Cotton",
    hasMath: true,
    intro:
      "Cabin in the Cotton is a Courthouse Steps log cabin — strips are added in opposite pairs (top+bottom together, then left+right together) around a center square for three rounds. The outermost ring alternates between two fabrics (D and E) based on each block's position in the finished quilt, creating a striking two-tone checkerboard border effect across the entire top. Fabric A is used for both the center square and the middle (round 2) frame.",
    sections: [
      {
        id: "center",
        label: "Center square + Round 2 frame (Fabric A)",
        defaultFabric: "A",
        hint: "Used twice per block — the small square in the very middle AND the second ring of strips halfway out. Pick your dominant/anchor fabric.",
      },
      {
        id: "round1",
        label: "Round 1 frame (Fabric B)",
        defaultFabric: "B",
        hint: "The first ring of strips directly around the center square — pick a strong contrast with Fabric A so the frame reads clearly.",
      },
      {
        id: "round3Even",
        label: "Outer ring — Fabric D (checkerboard \"even\" blocks)",
        defaultFabric: "D",
        hint: "The outermost ring on blocks at even grid positions (top-left corner is even). Alternates with Fabric E across the quilt for a checkerboard two-tone border.",
      },
      {
        id: "round3Odd",
        label: "Outer ring — Fabric E (checkerboard \"odd\" blocks)",
        defaultFabric: "E",
        hint: "The outermost ring on blocks at odd grid positions — pick a fabric that contrasts with Fabric D so the checkerboard border reads across the quilt.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "F",
        hint: "Optional strips between blocks — set sashing to 0\" on the previous step if you don't want any. Skipping sashing lets the outer rings of neighboring blocks meet edge-to-edge for the strongest checkerboard effect.",
      },
      { ...borderSection, defaultFabric: "G" },
    ],
  },
  {
    id: "fancy-stripe",
    name: "Fancy Stripe",
    hasMath: true,
    intro:
      "Fancy Stripe is built entirely from Half Square Triangle units — 16 identical HSTs arranged as four 2×2 quadrants. Each quadrant creates a diagonal stripe band, and the quadrants mirror around the block so the stripe direction changes cleanly across the center seams. When blocks are tiled, the diagonal lattice continues across block boundaries.",
    sections: [
      {
        id: "fabA",
        label: "Fabric A — stripe accent",
        defaultFabric: "A",
        hint: "The accent fabric that forms the diagonal stripe bands — usually orange or your dominant color.",
      },
      {
        id: "fabB",
        label: "Fabric B — background",
        defaultFabric: "B",
        hint: "The other half of every HST — pick a strong contrast so the stripe bands read clearly.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "C",
        hint: "Optional strips of fabric that separate each block — set sashing to 0\" on the previous step for the seamless diamond-lattice look.",
      },
      { ...borderSection, defaultFabric: "D" },
    ],
  },
  {
    id: "maple-star",
    name: "Maple Star",
    hasMath: true,
    intro:
      "Maple Star is built from an unequal 5-column, 5-row grid where columns 1, 2, 4, and 5 are narrow (width s) and column 3 is wider (width C = 2s); the same pattern applies to the rows. A large Fabric D square sits at the center, four Fabric C rectangles form the shafts/frame, Fabric A fills the background rectangles and flying-geese cap bases, and Fabric B supplies the inner squares plus stitch-and-flip corners for the four side points.",
    sections: [
      {
        id: "bg",
        label: "Background (Fabric A)",
        defaultFabric: "A",
        hint: "The dominant background fabric — used for 4 small squares, 4 outer rectangles, and 4 flying-geese cap bases. Usually the calmest fabric so the star reads clearly.",
      },
      {
        id: "accent",
        label: "Accent squares & flip corners (Fabric B)",
        defaultFabric: "B",
        hint: "The 12 accent squares — 4 fill the inner-ring corners and 8 are used as stitch-and-flip corners on the goose cap bases. Pick a strong contrast with Fabric A.",
      },
      {
        id: "points",
        label: "Cross frame rectangles (Fabric C)",
        defaultFabric: "C",
        hint: "The 4 rectangles that frame the center square and act as the shafts below each side point — top, bottom, left, right.",
      },
      {
        id: "center",
        label: "Center square (Fabric D)",
        defaultFabric: "D",
        hint: "The single large center square (Fabric D) — the anchor of the block. Pick a bold accent so the center pops.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Maple Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "love-in-a-mist",
    name: "Love in a Mist",
    hasMath: true,
    intro:
      "Love in a Mist is a classic 3×3 nine-patch. Fabric A is the background — the plain center square plus the pieced points that frame each edge diamond. Fabric B is the main accent — the four on-point diamonds in the edge-middle cells and the accent pieces inside each corner four-patch. Fabric C fills the outer corner squares and the outer halves of the two half-square-triangle (HST) units along each outside edge.",
    sections: [
      {
        id: "bg",
        label: "Background / center (Fabric A)",
        defaultFabric: "A",
        hint: "The center square plus the stitch-and-flip corner triangles that form the two points on each side of every edge diamond.",
      },
      {
        id: "accent",
        label: "Diamonds & corner accent (Fabric B)",
        defaultFabric: "B",
        hint: "One fabric for both the four on-point edge diamonds and the corner four-patch accents (the inner plain square plus the accent half of each corner HST).",
      },
      {
        id: "outer",
        label: "Outer corners (Fabric C)",
        defaultFabric: "C",
        hint: "The four outermost corner squares plus the outer halves of the two HSTs on the outside edges of each corner four-patch.",
      },

      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "D",
        hint: "Optional strips of fabric that separate each Love in a Mist block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "E" },
    ],
  },
  {
    id: "four-x-star",
    name: "Four X Star",
    hasMath: true,
    intro:
      "Four X Star is a 5×5 grid block built from 25 equal squares — 17 plain squares and 8 half-square-triangle (HST) units. Five Fabric D squares form a big X through the block (four block-edge midpoints plus the center), four Fabric C squares sit diagonally around the center, and eight Fabric B accent triangles pair up point-to-point at the outer corner of each Fabric C square to create the four X-shaped star arms. Fabric A is the background that fills everything else.",
    sections: [
      {
        id: "bg",
        label: "Background (Fabric A)",
        defaultFabric: "A",
        hint: "The 8 plain background squares (4 block corners + the 4 squares around the center) plus the background half of all 8 half-square-triangle units. Usually the calmest fabric so the star arms read clearly.",
      },
      {
        id: "accent",
        label: "Star point triangles (Fabric B)",
        defaultFabric: "B",
        hint: "The accent half of each of the 8 half-square-triangle units. These triangles meet in pairs at the outer corner of each Fabric C square to form the four X arms — pick a strong contrast with Fabric A.",
      },
      {
        id: "squares",
        label: "Inner accent squares (Fabric C)",
        defaultFabric: "C",
        hint: "The 4 plain squares set diagonally around the center of the block — each one is the anchor that the two accent triangles point at.",
      },
      {
        id: "dark",
        label: "X squares (Fabric D)",
        defaultFabric: "D",
        hint: "The 5 plain squares that form the big X: the center square plus the middle square on each of the four block edges. Usually your darkest / boldest fabric.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "E",
        hint: "Optional strips of fabric that separate each Four X Star block — set sashing to 0\" on the previous step if you don't want any.",
      },
      { ...borderSection, defaultFabric: "F" },
    ],
  },
  {
    id: "antique-tile",
    name: "Antique Tile",
    hasMath: true,
    intro:
      "Antique Tile is a straight-seam block with no triangles at all — every piece is a square or a rectangle. It is drafted on a 6-unit grid where the rows and columns measure 1-1-2-1-1, so the middle row and middle column are twice as wide as the others. A big Fabric E square sits in the middle, framed by four Fabric D rectangles, with four small Fabric C squares tucked into the diagonal corners of that frame. Four Fabric B rectangles fill the middle of each outer edge, and Fabric A forms the four bold corner L-shapes (one long rectangle plus one small square each).",
    sections: [
      {
        id: "corner",
        label: "Corner blocks (Fabric A)",
        defaultFabric: "A",
        hint: "The four bold corner L-shapes — each is one long rectangle across the top/bottom plus one small square beside it. Usually the darkest fabric so the tile reads as framed.",
      },
      {
        id: "edge",
        label: "Outer edge rectangles (Fabric B)",
        defaultFabric: "B",
        hint: "The four wide rectangles centred on each outer edge of the block (top, bottom, left and right). A medium tone works nicely here.",
      },
      {
        id: "accent",
        label: "Small accent squares (Fabric C)",
        defaultFabric: "C",
        hint: "The four small squares that sit diagonally out from the corners of the centre frame. This is the little pop of colour in the block.",
      },
      {
        id: "frame",
        label: "Centre frame rectangles (Fabric D)",
        defaultFabric: "D",
        hint: "The four rectangles that box in the big centre square — one above, one below, one each side.",
      },
      {
        id: "center",
        label: "Centre square (Fabric E)",
        defaultFabric: "E",
        hint: "The single large square in the middle of the block. A great spot for a feature print or your lightest fabric.",
      },
      {
        id: "sashing",
        label: "Sashing between blocks",
        defaultFabric: "F",
        hint: "Optional strips of fabric that separate each Antique Tile block — set sashing to 0\" on the previous step if you don't want any.",
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
