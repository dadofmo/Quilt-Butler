/**
 * Holistic correctness audit for yardage math.
 * Tests calculator output against independent hand-calcs.
 */
import { calculateYardage, calculateMaterials, computePrecutPlan } from "/dev-server/src/lib/yardage";
import type { PlannerState, FabricKey } from "/dev-server/src/lib/planner-store";
import { rotateDesign, type CustomBlockDesign, type CustomCell } from "/dev-server/src/lib/custom-block";

function base(): PlannerState {
  return {
    pattern: null,
    quiltWidth: 50, quiltHeight: 65, sizePreset: "throw",
    fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
    cornerAccentSize: 0,
    assignments: {}, safetyBuffer: false,
    fabricNames: {}, fabricPhotos: {},
    patchworkFabricCount: 4, patchworkGrid: {},
    pricePerYard: "", itemPrices: {},
    fabricSource: "yardage", jellyRollStripCount: 40,
  };
}


function ceilQuarter(yards: number) { return Math.ceil(yards * 4) / 4; }

const failures: string[] = [];
function check(label: string, actual: number, expected: number, eps = 0.0001) {
  const ok = Math.abs(actual - expected) < eps;
  if (!ok) failures.push(`❌ ${label}: got ${actual}, expected ${expected}`);
  else console.log(`✓ ${label}: ${actual}`);
}

// =========================================================================
// SIMPLE SQUARES — patchwork mode is the default UX (slider min=2)
// =========================================================================
console.log("\n=== Simple Squares: 50×65, 12.5\" block, 4-fabric checkerboard ===");
{
  const s = { ...base(), pattern: "simple-squares" as const, blockSize: 12.5, patchworkFabricCount: 4 };
  // 4 across × 5 down = 20 blocks. Checkerboard splits 5/5/5/5.
  // Cut size 13. Per strip floor(42.5/13)=3. Strips per fab = ceil(5/3)=2. Inches=2*13=26.
  const r = calculateYardage(s);
  check("4 fabrics returned", r.fabrics.length, 4);
  for (const fab of ["A","B","C","D"] as FabricKey[]) {
    const f = r.fabrics.find(x => x.fabric === fab)!;
    check(`SS ${fab} count`, f.pieces[0].count, 5);
    check(`SS ${fab} cut size`, f.pieces[0].w, 13);
    check(`SS ${fab} strips`, f.strips[0].count, 2);
    check(`SS ${fab} inches`, f.totalInches, 26);
  }
}

// =========================================================================
// NINE PATCH
// =========================================================================
console.log("\n=== Nine Patch: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12, sashingWidth: 2 };
  // Between-blocks sashing math: block count is driven by quilt size / block size
  // (sashing is added BETWEEN blocks and grows the finished quilt).
  // across=floor(50/12)=4, down=floor(65/12)=5 → 20 blocks.
  // Patch=4. Cut=4.5. Per strip floor(42.5/4.5)=9.
  // A: 5*20=100 squares. Strips=ceil(100/9)=12. Inches=12*4.5=54.
  // B: 4*20=80 squares.  Strips=ceil(80/9)=9.   Inches=9*4.5=40.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("9P A count", a.pieces[0].count, 100);
  check("9P A strips", a.strips[0].count, 12);
  check("9P A inches", a.totalInches, 54);
  check("9P A yards", a.yards, ceilQuarter(54/36));
  check("9P B count", b.pieces[0].count, 80);
  check("9P B strips", b.strips[0].count, 9);
  check("9P B inches", b.totalInches, 40.5);
  // Sashing C (between blocks only, no cornerstones for Nine Patch):
  // vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("9P C sashing strip count", c.pieces[0].count, 31);
  check("9P no cornerstone D", r.fabrics.find(f => f.fabric === "D") ? 1 : 0, 0);
}

// =========================================================================
// NINE PATCH — sashing off (0" sashing, optional)
// =========================================================================
console.log("\n=== Nine Patch: 50×65, 12\" block, no border, NO sashing ===");
{
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12, sashingWidth: 0 };
  // No sashing: across=floor(50/12)=4, down=floor(65/12)=5 → 20 blocks.
  // A: 5*20=100 squares. Cut=4.5. Per strip=9. Strips=ceil(100/9)=12.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("9P (no sash) A count", a.pieces[0].count, 100);
  check("9P (no sash) A strips", a.strips[0].count, 12);
  check("9P (no sash) no sashing C", r.fabrics.find(f => f.fabric === "C") ? 1 : 0, 0);
}

// =========================================================================
// HST
// =========================================================================
console.log("\n=== HST: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "hst" as const, blockSize: 12 };
  // 20 blocks. Cut=12.875. squaresEach=ceil(20/2)=10. Per strip floor(42.5/12.875)=3.
  // Strips=ceil(10/3)=4. Inches=4*12.875=51.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("HST A count", a.pieces[0].count, 10);
  check("HST A cut", a.pieces[0].w, 12.875);
  check("HST A strips", a.strips[0].count, 4);
  check("HST A inches", a.totalInches, 51.5);
  check("HST B mirrors A", b.totalInches, 51.5);
}

console.log("\n=== HST: ODD blocks (15) — must round up squaresEach ===");
{
  const s = { ...base(), pattern: "hst" as const, quiltWidth: 36, quiltHeight: 60, blockSize: 12 };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("HST odd count", a.pieces[0].count, 8); // ceil(15/2)
}

console.log("\n=== HST: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "hst" as const, blockSize: 12, sashingWidth: 2 };
  // across=floor(50/12)=4, down=floor(65/12)=5 → 20 blocks. Cut=12.875.
  // squaresEach=10. Per strip floor(42.5/12.875)=3. Strips=ceil(10/3)=4. Inches=4*12.875=51.5.
  // Sashing C: vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("HST(sash) A count", a.pieces[0].count, 10);
  check("HST(sash) A inches", a.totalInches, 51.5);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("HST(sash) C sashing strip count", c.pieces[0].count, 31);
  check("HST(sash) no cornerstone D", r.fabrics.find(f => f.fabric === "D") ? 1 : 0, 0);
}

// =========================================================================
// RAIL FENCE
// =========================================================================
console.log("\n=== Rail Fence: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "rail-fence" as const, blockSize: 12 };
  // 20 blocks × 3 rails = 20 per fabric.
  // railHeight=4.5, railLength=12.5. Per strip floor(42.5/12.5)=3.
  // Strips=ceil(20/3)=7. Inches=7*4.5=31.5.
  const r = calculateYardage(s);
  for (const fab of ["A","B","C"] as FabricKey[]) {
    const f = r.fabrics.find(x => x.fabric === fab)!;
    check(`RF ${fab} count`, f.pieces[0].count, 20);
    check(`RF ${fab} w (length)`, f.pieces[0].w, 12.5);
    check(`RF ${fab} h (height)`, f.pieces[0].h, 4.5);
    check(`RF ${fab} strips`, f.strips[0].count, 7);
    check(`RF ${fab} stripWidth`, f.strips[0].stripWidth, 4.5);
    check(`RF ${fab} inches`, f.totalInches, 31.5);
  }
}

console.log("\n=== Rail Fence: rail1 & rail3 share fabric A ===");
{
  const s = {
    ...base(), pattern: "rail-fence" as const, blockSize: 12,
    assignments: { rail1: "A" as FabricKey, rail2: "B" as FabricKey, rail3: "A" as FabricKey },
  };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("RF shared A count (40 rails)", a.pieces[0].count, 40);
  check("RF shared A strips", a.strips[0].count, 14); // ceil(40/3)
  check("RF shared A inches", a.totalInches, 63);
}

// =========================================================================
// LOG CABIN
// =========================================================================
console.log("\n=== Log Cabin: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "log-cabin" as const, blockSize: 12 };
  // 4×5 = 20 blocks. centerFinished=3, logFinished=1.5, 3 rounds = 12 logs/block.
  // Cuts (with +0.5 seam):
  //   center cut = 3.5"
  //   log cut width (height) = 2"
  //   dark log lengths (cut): 3.5, 5, 6.5, 8, 9.5, 11
  //   light log lengths (cut): 5, 6.5, 8, 9.5, 11, 12.5
  // Per-strip math (44" bolt → 42.5" usable):
  //   3.5  → floor(42.5/3.5)=12 → ceil(20/12)=2 strips × 2"   = 4"   (dark)
  //   5    → floor(42.5/5)=8    → ceil(20/8)=3   × 2"   = 6"
  //   6.5  → floor(42.5/6.5)=6  → ceil(20/6)=4   × 2"   = 8"
  //   8    → floor(42.5/8)=5    → ceil(20/5)=4   × 2"   = 8"
  //   9.5  → floor(42.5/9.5)=4  → ceil(20/4)=5   × 2"   = 10"
  //   11   → floor(42.5/11)=3   → ceil(20/3)=7   × 2"   = 14"
  //   12.5 → floor(42.5/12.5)=3 → ceil(20/3)=7   × 2"   = 14"  (light only)
  // Dark inches  = 4+6+8+8+10+14 = 50
  // Light inches = 6+8+8+10+14+14 = 60
  // Center A (cut 3.5): per strip floor(42.5/3.5)=12, strips=ceil(20/12)=2, inches=2*3.5=7.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("LC center A inches", a.totalInches, 7);
  check("LC center A pieces[0] count", a.pieces[0].count, 20);
  check("LC center A cut size", a.pieces[0].w, 3.5);
  check("LC light B inches", b.totalInches, 60);
  check("LC dark C inches", c.totalInches, 50);
  // 6 length buckets per log fabric (one per round-step).
  check("LC light B bucket count", b.pieces.length, 6);
  check("LC dark C bucket count", c.pieces.length, 6);
  for (const bk of b.pieces) check(`LC light bucket ${bk.w}" count`, bk.count, 20);
  for (const bk of c.pieces) check(`LC dark bucket ${bk.w}" count`, bk.count, 20);
  // Log cut height = blockSize/8 + 0.5 = 2.0
  check("LC log cut height", b.pieces[0].h, 2);
}

console.log("\n=== Log Cabin: light & dark share fabric A — buckets must merge ===");
{
  const s = {
    ...base(), pattern: "log-cabin" as const, blockSize: 12,
    assignments: { center: "D" as FabricKey, light: "A" as FabricKey, dark: "A" as FabricKey },
  };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // Dark lengths: 3.5,5,6.5,8,9.5,11. Light lengths: 5,6.5,8,9.5,11,12.5.
  // Merged unique: 3.5,5,6.5,8,9.5,11,12.5 (7 buckets).
  check("LC merged A bucket count", a.pieces.length, 7);
  const total = a.pieces.reduce((acc, p) => acc + p.count, 0);
  // 12 logs/block × 20 blocks = 240
  check("LC merged A total logs", total, 240);
}

console.log("\n=== Log Cabin: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "log-cabin" as const, blockSize: 12, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing D (default): between blocks only.
  // vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const d = r.fabrics.find(f => f.fabric === "D")!;
  check("LC(sash) D sashing strip count", d.pieces[0].count, 31);
  check("LC(sash) D strip width", d.pieces[0].h, 2.5);
  check("LC(sash) D strip length", d.pieces[0].w, 12.5);
}

// =========================================================================
// OHIO STAR
// =========================================================================
console.log("\n=== Ohio Star: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "ohio-star" as const, blockSize: 12, borderWidth: 0 };
  // 50×65, no border, 12" block: 4×5 = 20 blocks.
  // unitFinished = 12/3 = 4. plainCut = 4.5. qstCut = 5.25.
  // Per block: 2 star QST squares + 2 bg QST squares + 4 bg corners + 1 center.
  // Star (A): 2*20 = 40 QST squares at 5.25". Per strip floor(42.5/5.25)=8.
  //          Strips=ceil(40/8)=5. Inches=5*5.25=26.25.
  // Bg (B):  2*20 = 40 QST squares at 5.25" (5 strips × 5.25 = 26.25)
  //        + 4*20 = 80 corner squares at 4.5". Per strip floor(42.5/4.5)=9.
  //          Strips=ceil(80/9)=9. Inches=9*4.5=40.5.
  //        Total B inches = 26.25 + 40.5 = 66.75.
  // Center (D): 1*20 = 20 squares at 4.5". Per strip 9. Strips=ceil(20/9)=3.
  //          Inches=3*4.5=13.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const d = r.fabrics.find(f => f.fabric === "D")!;
  check("OS A QST square count", a.pieces[0].count, 40);
  check("OS A QST cut size", a.pieces[0].w, 5.25);
  check("OS A strips", a.strips[0].count, 5);
  check("OS A inches", a.totalInches, 26.25);
  // Bg has TWO piece buckets (QST + corners)
  check("OS B bucket count", b.pieces.length, 2);
  check("OS B QST count", b.pieces[0].count, 40);
  check("OS B corner count", b.pieces[1].count, 80);
  check("OS B QST cut", b.pieces[0].w, 5.25);
  check("OS B corner cut", b.pieces[1].w, 4.5);
  check("OS B inches", b.totalInches, 66.75);
  check("OS D center count", d.pieces[0].count, 20);
  check("OS D center cut", d.pieces[0].w, 4.5);
  check("OS D strips", d.strips[0].count, 3);
  check("OS D inches", d.totalInches, 13.5);
  // Glossary should be attached (has sewing steps)
  check("OS basics glossary length", r.basics?.length ?? 0, 5);
}

console.log("\n=== Ohio Star: star & center share fabric A ===");
{
  const s = {
    ...base(), pattern: "ohio-star" as const, blockSize: 12, borderWidth: 0,
    assignments: { star: "A" as FabricKey, bg: "B" as FabricKey, center: "A" as FabricKey },
  };
  // A now holds 40 QST squares (5.25") + 20 center squares (4.5").
  // Two buckets — different cut sizes, never merged.
  // Star QST: 5 strips × 5.25 = 26.25. Center: 3 strips × 4.5 = 13.5. Total=39.75.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("OS shared A bucket count", a.pieces.length, 2);
  const totalA = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("OS shared A total pieces", totalA, 60); // 40 QST + 20 centers
  check("OS shared A inches", a.totalInches, 39.75);
}

console.log("\n=== Ohio Star: star & bg share fabric A — math still holds ===");
{
  const s = {
    ...base(), pattern: "ohio-star" as const, blockSize: 12, borderWidth: 0,
    assignments: { star: "A" as FabricKey, bg: "A" as FabricKey, center: "D" as FabricKey },
  };
  // Three buckets retained (intentional): star QST squares, bg QST squares,
  // and bg corner squares. Star + bg buckets share dimensions but stay
  // separately labeled so the cutting plan still tells the quilter what each
  // pile of squares is FOR. Strip count is the same either way because
  // packStrips runs per-bucket on the same dimensions.
  // Star QST: 40 at 5.25" → 5 strips × 5.25 = 26.25
  // Bg QST:   40 at 5.25" → 5 strips × 5.25 = 26.25
  // Corners:  80 at 4.5"  → 9 strips × 4.5  = 40.5
  // Total: 93.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("OS shared star+bg bucket count", a.pieces.length, 3);
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("OS shared star+bg total pieces", totalPieces, 160); // 40+40+80
  check("OS shared star+bg inches", a.totalInches, 93);
}

console.log("\n=== Ohio Star: odd block size 4.25\" — non-integer unit must still produce valid cuts ===");
{
  const s = { ...base(), pattern: "ohio-star" as const, quiltWidth: 17, quiltHeight: 17, blockSize: 4.25, borderWidth: 0 };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // 4×4 = 16 blocks. Star QST = 32 squares.
  check("OS odd-unit A count", a.pieces[0].count, 32);
}

console.log("\n=== Ohio Star: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "ohio-star" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C (default): between blocks only.
  // vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("OS(sash) C sashing strip count", c.pieces[0].count, 31);
  check("OS(sash) C strip width", c.pieces[0].h, 2.5);
  check("OS(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// FLYING GEESE
// =========================================================================
console.log("\n=== Flying Geese: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "flying-geese" as const, blockSize: 12, borderWidth: 0 };
  // 4×5 = 20 blocks. 2 geese/block → 40 geese.
  // Each large square yields 4 geese → ceil(40/4) = 10 large squares.
  // Each large square needs 4 small sky squares → 40 small sky squares.
  // largeCut = 12 + 1.25 = 13.25". smallCut = 6 + 0.875 = 6.875".
  // Goose A: 10 squares @ 13.25". Per strip floor(42.5/13.25)=3. Strips=ceil(10/3)=4.
  //          Inches=4*13.25=53.
  // Sky B: 40 squares @ 6.875". Per strip floor(42.5/6.875)=6. Strips=ceil(40/6)=7.
  //          Inches=7*6.875=48.125.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("FG A large goose count", a.pieces[0].count, 10);
  check("FG A large cut size", a.pieces[0].w, 13.25);
  check("FG A strips", a.strips[0].count, 4);
  check("FG A inches", a.totalInches, 53);
  check("FG B small sky count", b.pieces[0].count, 40);
  check("FG B small cut size", b.pieces[0].w, 6.875);
  check("FG B strips", b.strips[0].count, 7);
  check("FG B inches", b.totalInches, 48.125);
  // Glossary attached.
  check("FG basics glossary length", r.basics?.length ?? 0, 5);
}

console.log("\n=== Flying Geese: goose & sky share fabric A ===");
{
  const s = {
    ...base(), pattern: "flying-geese" as const, blockSize: 12, borderWidth: 0,
    assignments: { goose: "A" as FabricKey, sky: "A" as FabricKey },
  };
  // A holds 10 large (13.25") + 40 small (6.875") squares — different cuts,
  // 2 buckets retained so the cutting plan still labels each pile.
  // Inches: 53 (large) + 48.125 (small) = 101.125.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("FG shared A bucket count", a.pieces.length, 2);
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("FG shared A total pieces", totalPieces, 50);
  check("FG shared A inches", a.totalInches, 101.125);
}

console.log("\n=== Flying Geese: ODD block count (5) — must round up large squares ===");
{
  // 12×24 quilt with 12" block = 1×2 = 2 blocks → 4 geese → 1 large square.
  // 12×36 with 12" = 1×3 = 3 blocks → 6 geese → ceil(6/4) = 2 large squares (with 2 wasted geese).
  const s = { ...base(), pattern: "flying-geese" as const, quiltWidth: 12, quiltHeight: 36, blockSize: 12, borderWidth: 0 };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("FG odd-block large squares", a.pieces[0].count, 2);
  check("FG odd-block small squares", b.pieces[0].count, 8);
}

console.log("\n=== Flying Geese: non-integer block size 9\" ===");
{
  // gooseFinishedW=9, H=4.5. largeCut=10.25, smallCut=5.375.
  const s = { ...base(), pattern: "flying-geese" as const, quiltWidth: 18, quiltHeight: 18, blockSize: 9, borderWidth: 0 };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // 2×2 = 4 blocks → 8 geese → 2 large squares.
  check("FG odd-unit A count", a.pieces[0].count, 2);
  check("FG odd-unit A cut size", a.pieces[0].w, 10.25);
}

console.log("\n=== Flying Geese: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "flying-geese" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C (default): vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("FG(sash) C sashing strip count", c.pieces[0].count, 31);
  check("FG(sash) C strip width", c.pieces[0].h, 2.5);
  check("FG(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// PINWHEEL
// =========================================================================
console.log("\n=== Pinwheel: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "pinwheel" as const, blockSize: 12, borderWidth: 0 };
  // 4×5 = 20 blocks. halfFinished = 6. cut = 6.875.
  // hstUnits = 20*4 = 80. squaresEach = ceil(80/2) = 40.
  // Per strip floor(42.5/6.875) = 6. Strips = ceil(40/6) = 7.
  // Inches = 7 * 6.875 = 48.125.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("PW A blade squares count", a.pieces[0].count, 40);
  check("PW A cut size", a.pieces[0].w, 6.875);
  check("PW A strips", a.strips[0].count, 7);
  check("PW A inches", a.totalInches, 48.125);
  check("PW B mirrors A", b.totalInches, 48.125);
  check("PW basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Pinwheel: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "pinwheel" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C (default): vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("PW(sash) A blade squares count", a.pieces[0].count, 40);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("PW(sash) C sashing strip count", c.pieces[0].count, 31);
  check("PW(sash) C strip width", c.pieces[0].h, 2.5);
  check("PW(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// DISAPPEARING NINE PATCH
// =========================================================================
console.log("\n=== Disappearing Nine Patch: 50×65, 12\" finished block, no border ===");
{
  const s = { ...base(), pattern: "disappearing-nine-patch" as const, blockSize: 12, borderWidth: 0 };
  // 4×5 = 20 finished blocks. Starting block = 13" (12 + 1).
  // patchFinished = 13/3 ≈ 4.3333. cut = 4.8333.
  // A: 5*20 = 100 squares. Per strip floor(42.5/4.8333) = 8. Strips = ceil(100/8) = 13.
  //    Inches = 13 * 4.8333... = 62.8333...
  // B: 4*20 = 80 squares. Strips = ceil(80/8) = 10. Inches = 10 * 4.8333 = 48.333.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const expectedCut = 13/3 + 0.5;
  check("D9P A count", a.pieces[0].count, 100);
  check("D9P A cut size", a.pieces[0].w, expectedCut);
  check("D9P A strips", a.strips[0].count, 13);
  check("D9P A inches", a.totalInches, 13 * expectedCut, 0.001);
  check("D9P B count", b.pieces[0].count, 80);
  check("D9P B strips", b.strips[0].count, 10);
  check("D9P B inches", b.totalInches, 10 * expectedCut, 0.001);
  check("D9P basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Disappearing Nine Patch: starting block math (8\" final → 9\" starting) ===");
{
  const s = { ...base(), pattern: "disappearing-nine-patch" as const, quiltWidth: 32, quiltHeight: 32, blockSize: 8, borderWidth: 0 };
  // 4×4 = 16 blocks. Starting = 9", patch finished = 3", cut = 3.5".
  // A: 80 squares. Per strip floor(42.5/3.5)=12. Strips = ceil(80/12)=7. Inches=7*3.5=24.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("D9P 8\" cut size", a.pieces[0].w, 3.5);
  check("D9P 8\" A count", a.pieces[0].count, 80);
  check("D9P 8\" A strips", a.strips[0].count, 7);
  check("D9P 8\" A inches", a.totalInches, 24.5);
}

console.log("\n=== Disappearing Nine Patch: shared fabric on both sections ===");
{
  const s = {
    ...base(), pattern: "disappearing-nine-patch" as const, blockSize: 12, borderWidth: 0,
    assignments: { center: "A" as FabricKey, outer: "A" as FabricKey },
  };
  // All 9 squares per block are A. 9*20 = 180 squares — but addSquares is
  // called twice (5*20=100 then 4*20=80), so two buckets exist with the same
  // cut size, summing to 180 pieces and 23 strips total (13 + 10).
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("D9P shared A total pieces", totalPieces, 180);
  const totalStrips = a.strips.reduce((acc, sp) => acc + sp.count, 0);
  check("D9P shared A total strips", totalStrips, 23);
}

console.log("\n=== Disappearing Nine Patch: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "disappearing-nine-patch" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C: vSash=15, hSash=16, total=31 at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("D9P(sash) C sashing strip count", c.pieces[0].count, 31);
  check("D9P(sash) C strip width", c.pieces[0].h, 2.5);
  check("D9P(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// SQUARES ON POINT
// =========================================================================
console.log("\n=== Squares on Point: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "squares-on-point" as const, blockSize: 12, borderWidth: 0 };
  // 4×5 = 20 blocks.
  // centerCut = 12/√2 + 0.5 ≈ 8.9853. Per strip floor(42.5/8.9853)=4. Strips=ceil(20/4)=5.
  //   Inches = 5 * 8.9853 ≈ 44.9264.
  // cornerCut = 12/2 + 0.875 = 6.875. Count = 2*20 = 40.
  //   Per strip floor(42.5/6.875)=6. Strips=ceil(40/6)=7. Inches=7*6.875=48.125.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const expectedCenterCut = 12 / Math.SQRT2 + 0.5;
  check("SoP A on-point count", a.pieces[0].count, 20);
  check("SoP A center cut size", a.pieces[0].w, expectedCenterCut, 0.0001);
  check("SoP A strips", a.strips[0].count, 5);
  check("SoP A inches", a.totalInches, 5 * expectedCenterCut, 0.001);
  check("SoP B corner-square count", b.pieces[0].count, 40);
  check("SoP B corner cut size", b.pieces[0].w, 6.875);
  check("SoP B strips", b.strips[0].count, 7);
  check("SoP B inches", b.totalInches, 48.125);
  check("SoP basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Squares on Point: square & bg share fabric A ===");
{
  const s = {
    ...base(), pattern: "squares-on-point" as const, blockSize: 12, borderWidth: 0,
    assignments: { square: "A" as FabricKey, bg: "A" as FabricKey },
  };
  // A holds both buckets — different cut sizes, 2 buckets retained.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("SoP shared A bucket count", a.pieces.length, 2);
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("SoP shared A total pieces", totalPieces, 60); // 20 + 40
  const expectedCenterCut = 12 / Math.SQRT2 + 0.5;
  check("SoP shared A inches", a.totalInches, 5 * expectedCenterCut + 48.125, 0.001);
}

console.log("\n=== Squares on Point: 8\" block ===");
{
  const s = { ...base(), pattern: "squares-on-point" as const, quiltWidth: 32, quiltHeight: 32, blockSize: 8, borderWidth: 0 };
  // 4×4 = 16 blocks.
  // centerCut = 8/√2 + 0.5 ≈ 6.1569. Per strip floor(42.5/6.1569)=6. Strips=ceil(16/6)=3.
  // cornerCut = 4 + 0.875 = 4.875. Count = 32. Per strip floor(42.5/4.875)=8. Strips=ceil(32/8)=4. Inches=4*4.875=19.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SoP 8\" A count", a.pieces[0].count, 16);
  check("SoP 8\" A strips", a.strips[0].count, 3);
  check("SoP 8\" B count", b.pieces[0].count, 32);
  check("SoP 8\" B strips", b.strips[0].count, 4);
  check("SoP 8\" B inches", b.totalInches, 19.5);
}

console.log("\n=== Squares on Point: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "squares-on-point" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C: vSash=15, hSash=16, total=31 at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("SoP(sash) C sashing strip count", c.pieces[0].count, 31);
  check("SoP(sash) C strip width", c.pieces[0].h, 2.5);
  check("SoP(sash) C strip length", c.pieces[0].w, 12.5);
}

console.log("\n=== Squares on Point: alternate (reversed) blocks ON ===");
{
  const s = {
    ...base(), pattern: "squares-on-point" as const, blockSize: 12, borderWidth: 0,
    alternateBlocks: true,
  };
  // 4 across × 5 down = 20 blocks → checkerboard split is 10 / 10.
  // A: 10 on-point squares + 2*10 = 20 corner squares.
  // B: 20 corner squares + 10 on-point squares.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SoP(alt) A on-point count", a.pieces[0].count, 10);
  check("SoP(alt) A corner count", a.pieces[1].count, 20);
  check("SoP(alt) B corner count", b.pieces[0].count, 20);
  check("SoP(alt) B on-point count", b.pieces[1].count, 10);
  const totalCenters =
    a.pieces.filter(p => p.label.includes("On-point")).reduce((n, p) => n + p.count, 0) +
    b.pieces.filter(p => p.label.includes("On-point")).reduce((n, p) => n + p.count, 0);
  check("SoP(alt) total on-point squares still 20", totalCenters, 20);
}



// =========================================================================
// PLUS BLOCK
// =========================================================================
console.log("\n=== Plus Block: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "plus-block" as const, blockSize: 12, borderWidth: 0 };
  // 4×5 = 20 blocks. unit = 12/3 = 4. cut = 4.5.
  // A: 5*20 = 100 squares. Per strip floor(42.5/4.5)=9. Strips=ceil(100/9)=12. Inches=12*4.5=54.
  // B: 4*20 = 80 squares. Strips=ceil(80/9)=9. Inches=9*4.5=40.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("PB A plus count", a.pieces[0].count, 100);
  check("PB A cut size", a.pieces[0].w, 4.5);
  check("PB A strips", a.strips[0].count, 12);
  check("PB A inches", a.totalInches, 54);
  check("PB B bg count", b.pieces[0].count, 80);
  check("PB B strips", b.strips[0].count, 9);
  check("PB B inches", b.totalInches, 40.5);
  check("PB basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Plus Block: plus & bg share fabric A — pooled into 1 bucket ===");
{
  const s = {
    ...base(), pattern: "plus-block" as const, blockSize: 12, borderWidth: 0,
    assignments: { plus: "A" as FabricKey, bg: "A" as FabricKey },
  };
  // 9 squares × 20 blocks = 180 squares total, pooled into ONE 4.5" bucket
  // (same fabric plays both roles): per strip floor(42.5/4.5)=9 →
  // strips = ceil(180/9) = 20, inches = 20 × 4.5 = 90.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("PB shared A total pieces", totalPieces, 180);
  const totalStrips = a.strips.reduce((acc, sp) => acc + sp.count, 0);
  check("PB shared A total strips", totalStrips, 20);
  check("PB shared A inches", a.totalInches, 20 * 4.5);
}

console.log("\n=== Plus Block: 9\" block ===");
{
  const s = { ...base(), pattern: "plus-block" as const, quiltWidth: 27, quiltHeight: 36, blockSize: 9, borderWidth: 0 };
  // 3×4 = 12 blocks. unit=3, cut=3.5.
  // A: 5*12 = 60 squares. Per strip floor(42.5/3.5)=12. Strips=ceil(60/12)=5. Inches=5*3.5=17.5.
  // B: 4*12 = 48 squares. Strips=ceil(48/12)=4. Inches=4*3.5=14.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("PB 9\" A count", a.pieces[0].count, 60);
  check("PB 9\" A strips", a.strips[0].count, 5);
  check("PB 9\" A inches", a.totalInches, 17.5);
  check("PB 9\" B count", b.pieces[0].count, 48);
  check("PB 9\" B strips", b.strips[0].count, 4);
  check("PB 9\" B inches", b.totalInches, 14);
}

console.log("\n=== Plus Block: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "plus-block" as const, blockSize: 12, borderWidth: 0, sashingWidth: 2 };
  // 4×5 = 20 blocks. Sashing C (default): vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("PB(sash) A plus count", a.pieces[0].count, 100);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("PB(sash) C sashing strip count", c.pieces[0].count, 31);
  check("PB(sash) C strip width", c.pieces[0].h, 2.5);
  check("PB(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// BEAR PAW
// =========================================================================
console.log("\n=== Bear Paw: 50×65, 12\" block, 2\" sashing, no border ===");
{
  const s = {
    ...base(),
    pattern: "bear-paw" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { pad: "A" as FabricKey, claws: "B" as FabricKey, bg: "C" as FabricKey, sashing: "F" as FabricKey, cornerstone: "G" as FabricKey },
  };
  // Between-blocks sashing: block count driven by quilt/block, sashing grows the quilt.
  // cols=floor(50/12)=4, rows=floor(65/12)=5 → 20 blocks.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("BP A pad count (20 blocks * 4)", a.pieces[0].count, 80);
  // Sashing F (between blocks only): vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31.
  const f = r.fabrics.find(x => x.fabric === "F")!;
  check("BP sashing strip count", f.pieces[0].count, 31);
  check("BP sashing cut length", f.pieces[0].w, 12.5);
  check("BP sashing cut width", f.pieces[0].h, 2.5);
  // Cornerstones G (interior intersections only): (4-1)*(5-1)=12 squares at 2.5"
  const g = r.fabrics.find(x => x.fabric === "G")!;
  check("BP cornerstone count", g.pieces[0].count, 12);
  check("BP cornerstone cut size", g.pieces[0].w, 2.5);
  check("BP basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Bear Paw: sashing & background share fabric C — totals must merge ===");
{
  const s = {
    ...base(),
    pattern: "bear-paw" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    // Default assignments: bg=C, sashing=C, cornerstone=C — all merge into Fabric C
    assignments: { pad: "A" as FabricKey, claws: "B" as FabricKey, bg: "C" as FabricKey, sashing: "C" as FabricKey, cornerstone: "C" as FabricKey },
  };
  const r = calculateYardage(s);
  // Sanity: only 3 fabric requirements (A pad, B claws+center, C bg+sashing+cornerstone).
  check("BP merged-C fabric requirement count", r.fabrics.length, 3);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  // Independent expected calc (20 blocks, between-blocks sashing):
  //   bg HST starting squares: 16 * 20 = 320
  //   bg corner squares:        4 * 20 = 80
  //   in-block sashing rects:   4 * 20 = 80
  //   perimeter sashing:        31  ((4-1)*5 + (5-1)*4)
  //   cornerstone squares:      12  ((4-1)*(5-1))
  // Total piece groups in C should be 5 (each addSquares/addRails appends one bucket).
  check("BP merged-C bucket count", c.pieces.length, 5);
  const total = c.pieces.reduce((acc, p) => acc + p.count, 0);
  check("BP merged-C total pieces (320+80+80+31+12)", total, 320 + 80 + 80 + 31 + 12);
  // totalInches must equal sum of each bucket's strip-pack contribution; just
  // assert it's > 0 and yards rounded up to 0.25.
  if (c.totalInches <= 0) failures.push("BP merged-C inches not positive");
  if ((c.yards * 4) % 1 !== 0) failures.push("BP merged-C yards not on a 0.25 boundary");
}

console.log("\n=== Bear Paw: 50×65, 12\" block, NO sashing (0\"), no border ===");
{
  const s = {
    ...base(),
    pattern: "bear-paw" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { pad: "A" as FabricKey, claws: "B" as FabricKey, bg: "C" as FabricKey },
  };
  // No sashing → cols=floor(50/12)=4, rows=floor(65/12)=5, blocks=20.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("BP-noSash A pad count (20*4)", a.pieces[0].count, 80);
  // No sashing/cornerstone buckets should exist on any fabric.
  // The in-block sashing rectangles between paws still exist (4 per block, on bg fabric).
  // What must NOT exist: perimeter sashing strips or cornerstone squares.
  const hasPerim = r.fabrics.some(f => f.pieces.some(p => /perimeter sashing/i.test(p.label)));
  const hasCornerBucket = r.fabrics.some(f => f.pieces.some(p => /cornerstone/i.test(p.label)));
  if (hasPerim) failures.push("BP-noSash should not produce perimeter sashing pieces");
  if (hasCornerBucket) failures.push("BP-noSash should not produce cornerstone pieces");
}
// =========================================================================
console.log("\n=== Border: 68×88, 4\" border, 9P pattern, 2\" sashing ===");
{
  const s = {
    ...base(), pattern: "nine-patch" as const,
    quiltWidth: 68, quiltHeight: 88, borderWidth: 4, blockSize: 10,
    sashingWidth: 2,
    assignments: { center: "A" as FabricKey, outer: "B" as FabricKey, sashing: "F" as FabricKey, cornerstone: "G" as FabricKey, border: "C" as FabricKey },
  };
  // Inner before border = 60×80. Between-blocks sashing math:
  // across=floor(60/10)=6, down=floor(80/10)=8 → 48 blocks.
  // Sashed inner finished = 6*10+(6-1)*2 = 70 wide, 8*10+(8-1)*2 = 94 tall.
  // Border: sides=2*94=188, topBot=2*(70+8)=156, total=344.
  // Strips=ceil(344/42.5)=9. Cut=4.5. Inches=9*4.5=40.5.
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  const borderLine = c.pieces.find(p => p.label === "Border strips")!;
  check("Border strip count", borderLine.count, 9);
  check("Border cut height", borderLine.h, 4.5);
  check("Border total inches", c.totalInches, 40.5);
}

// =========================================================================
// MATERIALS
// =========================================================================
console.log("\n=== Materials: 60×80 ===");
{
  const s = { ...base(), quiltWidth: 60, quiltHeight: 80 };
  const m = calculateMaterials(s);
  check("Backing W", m.backing.widthIn, 68);
  check("Backing H", m.backing.heightIn, 88);
  check("Backing widths", m.backing.widths, 2);
  check("Backing yards", m.backing.yards, 5.0);
  check("Batting yards", m.batting.yards, 2.5);
  check("Binding strips", m.binding.stripCount, 7);
  check("Binding yards", m.binding.yards, 0.5);
}

// =========================================================================
// SAFETY BUFFER
// =========================================================================
console.log("\n=== Safety buffer: +10% ===");
{
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12, sashingWidth: 2, safetyBuffer: true };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // Sashed nine-patch (4×5=20 blocks): A inches=54. With buffer: 54*1.1=59.4, /36≈1.65, ceilQuarter=1.75
  check("9P A yards w/ buffer", a.yards, 1.75);
}

// =========================================================================
// EDGE: tiny quilt
// =========================================================================
console.log("\n=== Edge: 5\" quilt with 12\" block (subprime, but must produce 1 block) ===");
{
  const s = { ...base(), pattern: "nine-patch" as const, quiltWidth: 5, quiltHeight: 5, blockSize: 12 };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("Tiny: A count = 5*1", a.pieces[0].count, 5);
}

// =========================================================================
// CROSS-CHECK: Does the displayed "actualW × actualH" match block math?
// =========================================================================
console.log("\n=== Cross-check: actual size derived consistently ===");
{
  // 50×65 quilt, 12" block, 3" border:
  // innerW=44, innerH=59. blocksA=floor(44/12)=3, blocksD=floor(59/12)=4.
  // actualW=3*12+6=42, actualH=4*12+6=54
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12, borderWidth: 3 };
  const innerW = s.quiltWidth - 2*s.borderWidth;
  const innerH = s.quiltHeight - 2*s.borderWidth;
  const ba = Math.max(1, Math.floor(innerW/s.blockSize));
  const bd = Math.max(1, Math.floor(innerH/s.blockSize));
  check("Block count A direction", ba, 3);
  check("Block count D direction", bd, 4);
  const actualW = ba*s.blockSize + 2*s.borderWidth;
  const actualH = bd*s.blockSize + 2*s.borderWidth;
  check("actualW", actualW, 42);
  check("actualH", actualH, 54);
  // Now the calculator should use the SAME 12 blocks (3*4):
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // Center for 12 blocks = 5*12=60 squares. Cut=4.5. Per strip=9. Strips=ceil(60/9)=7.
  check("Calc uses 12 blocks (60 center)", a.pieces[0].count, 60);
  check("Calc strips", a.strips[0].count, 7);
}

// =========================================================================
// PER-STRIP COUNT consistency: sub-cut count on the LAST strip
// (results.tsx caps the last strip's sub-cuts to remaining; verify this never
// produces > perStripMax or < remainder)
// =========================================================================
console.log("\n=== UI/calc consistency: same selvage allowance everywhere ===");
{
  // Cut size 14.5 used to expose a real bug: yardage.ts allocated for 2/strip,
  // results.tsx drew 3/strip → user would be one strip short. Now both must
  // route through piecesPerStrip() / usableFabricWidth().
  const { piecesPerStrip, usableFabricWidth } = await import("/dev-server/src/lib/yardage");
  for (const cut of [4.5, 12.5, 13, 14.5, 21]) {
    const ppsNew = piecesPerStrip(cut, 44);
    const ppsOld = Math.max(1, Math.floor((44 - 0.5) / cut)); // the buggy local formula
    if (ppsNew !== ppsOld) {
      console.log(`  Cut ${cut}": shared=${ppsNew}/strip, old buggy local=${ppsOld}/strip — fix prevents divergence`);
    }
    check(`piecesPerStrip(${cut}, 44)`, ppsNew, Math.floor(42.5 / cut));
  }
  check("usableFabricWidth(44)", usableFabricWidth(44), 42.5);
}

// =========================================================================
// IRISH CHAIN — single chain, 2 fabrics, alternating chain + plain blocks
// =========================================================================
console.log("\n=== Irish Chain: 81×81, 9\" block, no border (matches the 81×81 reference quilt) ===");
{
  const s = { ...base(), pattern: "irish-chain" as const, quiltWidth: 81, quiltHeight: 81, blockSize: 9, borderWidth: 0 };
  // 9×9 = 81 blocks. chain = ceil(81/2)=41, plain = floor(81/2)=40.
  // smallCut = 9/3 + 0.5 = 3.5". plainCut = 9 + 0.5 = 9.5".
  // Chain (B): 5 * 41 = 205 small squares at 3.5". Per strip floor(42.5/3.5)=12.
  //   Strips = ceil(205/12) = 18. Inches = 18*3.5 = 63.
  // Background (A) small: 4 * 41 = 164 squares at 3.5". Strips = ceil(164/12)=14.
  //   Inches = 14*3.5 = 49.
  // Background (A) plain: 40 squares at 9.5". Per strip floor(42.5/9.5)=4.
  //   Strips = ceil(40/4) = 10. Inches = 10*9.5 = 95.
  // A total inches = 49 + 95 = 144.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("IC chain B count", b.pieces[0].count, 205);
  check("IC chain B cut", b.pieces[0].w, 3.5);
  check("IC chain B strips", b.strips[0].count, 18);
  check("IC chain B inches", b.totalInches, 63);
  check("IC bg A bucket count", a.pieces.length, 2);
  check("IC bg A small count", a.pieces[0].count, 164);
  check("IC bg A small cut", a.pieces[0].w, 3.5);
  check("IC bg A plain count", a.pieces[1].count, 40);
  check("IC bg A plain cut", a.pieces[1].w, 9.5);
  check("IC bg A inches", a.totalInches, 144);
  check("IC basics glossary attached", r.basics?.length ?? 0, 5);
}

console.log("\n=== Irish Chain: ODD count (3×3 = 9) — corner is chain ===");
{
  const s = { ...base(), pattern: "irish-chain" as const, quiltWidth: 27, quiltHeight: 27, blockSize: 9, borderWidth: 0 };
  // 3×3 = 9 blocks → chain = 5, plain = 4. Chain B: 25 small. Bg A: 20 small + 4 plain.
  const r = calculateYardage(s);
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("IC odd chain B count", b.pieces[0].count, 25);
  check("IC odd bg A small count", a.pieces[0].count, 20);
  check("IC odd bg A plain count", a.pieces[1].count, 4);
}

// =========================================================================
// SAWTOOTH STAR — 4×4 grid, 1 center + 4 corners + 8 HSTs per block
// =========================================================================
console.log("\n=== Sawtooth Star: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "sawtooth-star" as const, blockSize: 12 };
  // 4×5=20 blocks. u=3. centerCut=6.5, cornerCut=3.5, hstCut=3.875.
  // Star A: 20 centers @6.5 (per strip floor(42.5/6.5)=6, strips=ceil(20/6)=4, inches=26)
  //         + 160 HST squares @3.875 (per strip floor(42.5/3.875)=10, strips=16, inches=62) → 88
  // BG B:  80 corners @3.5 (per strip 12, strips=7, inches=24.5)
  //         + 160 HST squares @3.875 (strips=16, inches=62) → 86.5
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SS-star A pieces buckets", a.pieces.length, 2);
  check("SS-star A center count", a.pieces[0].count, 20);
  check("SS-star A center cut", a.pieces[0].w, 6.5);
  check("SS-star A HST count", a.pieces[1].count, 160);
  check("SS-star A HST cut", a.pieces[1].w, 3.875);
  check("SS-star A inches", a.totalInches, 88);
  check("SS-star B pieces buckets", b.pieces.length, 2);
  check("SS-star B corner count", b.pieces[0].count, 80);
  check("SS-star B corner cut", b.pieces[0].w, 3.5);
  check("SS-star B HST count", b.pieces[1].count, 160);
  check("SS-star B inches", b.totalInches, 86.5);
}

console.log("\n=== Sawtooth Star: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "sawtooth-star" as const, blockSize: 12, sashingWidth: 2 };
  // 4×5=20 blocks. Sashing C: vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("SS-star(sash) C strip count", c.pieces[0].count, 31);
  check("SS-star(sash) C strip width", c.pieces[0].h, 2.5);
  check("SS-star(sash) C strip length", c.pieces[0].w, 12.5);
}

console.log("\n=== Sawtooth Star: 50×65, 12\" block, contrasting center fabric (C) ===");
{
  // Assigning a different fabric to the center square should move the 1 center
  // square per block to that fabric and leave the HST star squares on A.
  const s = {
    ...base(),
    pattern: "sawtooth-star" as const,
    blockSize: 12,
    assignments: { star: "A", center: "C", bg: "B" } as Record<string, FabricKey>,
  };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("SS-star(center) A buckets", a.pieces.length, 1);
  check("SS-star(center) A HST count", a.pieces[0].count, 160);
  check("SS-star(center) A HST cut", a.pieces[0].w, 3.875);
  check("SS-star(center) C buckets", c.pieces.length, 1);
  check("SS-star(center) C center count", c.pieces[0].count, 20);
  check("SS-star(center) C center cut", c.pieces[0].w, 6.5);
  check("SS-star(center) B corner count", b.pieces[0].count, 80);
  check("SS-star(center) B HST count", b.pieces[1].count, 160);
}

// =========================================================================
// CHURN DASH — 3×3 grid, 1 center + 4 HST corners + 4 bar units
// =========================================================================
console.log("\n=== Churn Dash: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "churn-dash" as const, blockSize: 12 };
  // 4×5=20 blocks. unit=4. centerCut=4.5, hstCut=4.875, barLong=4.5, barShort=2.5.
  // Default assignments: center=A, corners=A, bars=A, bg=B.
  // A: 20 center @4.5 sq + 40 HST @4.875 sq + 40 bar rect (4.5×2.5)
  // B: 40 HST @4.875 sq + 40 bar rect (4.5×2.5)
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  // A buckets (in order): center, HST corners, bar rectangles → 3
  check("CD A bucket count", a.pieces.length, 3);
  check("CD A center count", a.pieces[0].count, 20);
  check("CD A HST count", a.pieces[1].count, 40);
  check("CD A bar count", a.pieces[2].count, 80);
  check("CD B bucket count", b.pieces.length, 2);
  check("CD B HST count", b.pieces[0].count, 40);
  check("CD B bar count", b.pieces[1].count, 80);
}

console.log("\n=== Churn Dash: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = { ...base(), pattern: "churn-dash" as const, blockSize: 12, sashingWidth: 2 };
  // Sashing C: vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("CD(sash) C strip count", c.pieces[0].count, 31);
  check("CD(sash) C strip width", c.pieces[0].h, 2.5);
  check("CD(sash) C strip length", c.pieces[0].w, 12.5);
}



// =========================================================================
// FRIENDSHIP STAR — 3×3 block, 1 center + 4 corners + 4 HSTs (star points)
// =========================================================================
console.log("\n=== Friendship Star: 50×65, 12\" block, no border, no sashing, distinct A/B/C ===");
{
  const s = {
    ...base(),
    pattern: "friendship-star" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { center: "A", points: "B", bg: "C" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. u = 12/3 = 4. centerCut=4.5, hstCut=4.875, cornerCut=4.5.
  // A (center): 20 centers @4.5. Per strip floor(42.5/4.5)=9. Strips=ceil(20/9)=3. Inches=3*4.5=13.5.
  // B (points): 80 HST squares @4.875. Per strip floor(42.5/4.875)=8. Strips=ceil(80/8)=10. Inches=10*4.875=48.75.
  // C (bg): 80 corners @4.5 + 80 HSTs @4.875. corner strips=ceil(80/9)=9 → 9*4.5=40.5; hst strips=ceil(80/8)=10 → 10*4.875=48.75. Total inches=89.25.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("FS A center count", a.pieces[0].count, 20);
  check("FS A cut size", a.pieces[0].w, 4.5);
  check("FS A strips", a.strips[0].count, 3);
  check("FS A inches", a.totalInches, 13.5);
  check("FS B points count", b.pieces[0].count, 80);
  check("FS B cut size", b.pieces[0].w, 4.875);
  check("FS B strips", b.strips[0].count, 10);
  check("FS B inches", b.totalInches, 48.75);
  check("FS C bucket count", c.pieces.length, 2);
  check("FS C corner count", c.pieces[0].count, 80);
  check("FS C corner cut", c.pieces[0].w, 4.5);
  check("FS C HST count", c.pieces[1].count, 80);
  check("FS C HST cut", c.pieces[1].w, 4.875);
  check("FS C total inches", c.totalInches, 89.25);
  check("FS C yards", c.yards, ceilQuarter(89.25/36));
  check("FS no D (no border, no sashing)", r.fabrics.find(f => f.fabric === "D") ? 1 : 0, 0);
}

console.log("\n=== Friendship Star: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "friendship-star" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { center: "A", points: "B", bg: "C", sashing: "D" } as Record<string, FabricKey>,
  };
  // Sashing D: vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const d = r.fabrics.find(f => f.fabric === "D")!;
  check("FS(sash) D strip count", d.pieces[0].count, 31);
  check("FS(sash) D strip width", d.pieces[0].h, 2.5);
  check("FS(sash) D strip length", d.pieces[0].w, 12.5);
}

console.log("\n=== Friendship Star: two-fabric look (center === points = B) — verify pooling ===");
{
  const s = {
    ...base(),
    pattern: "friendship-star" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { center: "B", points: "B", bg: "C" } as Record<string, FabricKey>,
  };
  // B pools: 20 centers @4.5 + 80 HSTs @4.875.
  //   center strips = ceil(20/9)=3 → 3*4.5 = 13.5"
  //   hst strips    = ceil(80/8)=10 → 10*4.875 = 48.75"
  //   total = 62.25"  → yards = ceilQuarter((62.25)/36)
  const r = calculateYardage(s);
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("FS pool: B bucket count", b.pieces.length, 2);
  check("FS pool: B center count", b.pieces[0].count, 20);
  check("FS pool: B HST count", b.pieces[1].count, 80);
  check("FS pool: B total inches", b.totalInches, 62.25);
  check("FS pool: B yards (rounded once after pooling)", b.yards, ceilQuarter(62.25/36));
  check("FS pool: A absent", r.fabrics.find(f => f.fabric === "A") ? 1 : 0, 0);
}

console.log("\n=== Friendship Star: small 9\" block edge case (u=3) ===");
{
  const s = {
    ...base(),
    pattern: "friendship-star" as const,
    quiltWidth: 27, quiltHeight: 27,
    blockSize: 9,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { center: "A", points: "B", bg: "C" } as Record<string, FabricKey>,
  };
  // 3×3 = 9 blocks. u=3. centerCut=3.5, hstCut=3.875.
  // A: 9 centers @3.5. Per strip floor(42.5/3.5)=12. Strips=ceil(9/12)=1. Inches=3.5.
  // B: 36 HSTs @3.875. Per strip floor(42.5/3.875)=10. Strips=ceil(36/10)=4. Inches=4*3.875=15.5.
  // C: 36 corners @3.5 + 36 HSTs @3.875. corner strips=ceil(36/12)=3 → 10.5; hst strips=ceil(36/10)=4 → 15.5; total=26.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("FS9 A strips", a.strips[0].count, 1);
  check("FS9 A inches", a.totalInches, 3.5);
  check("FS9 B strips", b.strips[0].count, 4);
  check("FS9 B inches", b.totalInches, 15.5);
  check("FS9 C total inches", c.totalInches, 26);
}


// =========================================================================
// SNOWBALL BLOCK — permanent A/B checkerboard role-swap
// =========================================================================
console.log("\n=== Snowball Block: 50×65, 12\" block, 4\" corner, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "snowball-block" as const,
    blockSize: 12, cornerAccentSize: 4,
    borderWidth: 0, sashingWidth: 0,
    assignments: { mainA: "A", mainB: "B" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. even=10, odd=10. mainCut=12.5, cornerCut=4.5.
  // A: 10 mains @12.5 — per strip floor(42.5/12.5)=3 → 4 strips × 12.5 = 50.
  //    40 corners @4.5 — per strip floor(42.5/4.5)=9 → ceil(40/9)=5 × 4.5 = 22.5.
  //    Total A = 72.5.
  // B mirrors A → 72.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SB A bucket count", a.pieces.length, 2);
  check("SB A main count", a.pieces[0].count, 10);
  check("SB A corner count", a.pieces[1].count, 40);
  check("SB A inches", a.totalInches, 72.5);
  check("SB B mirrors A inches", b.totalInches, 72.5);
  check("SB no sashing C", r.fabrics.find(f => f.fabric === "C") ? 1 : 0, 0);
}

console.log("\n=== Snowball Block: 50×65, 12\" block, 4\" corner, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "snowball-block" as const,
    blockSize: 12, cornerAccentSize: 4,
    sashingWidth: 2,
    assignments: { mainA: "A", mainB: "B", sashing: "C" } as Record<string, FabricKey>,
  };
  // Sashing C: vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("SB(sash) C strip count", c.pieces[0].count, 31);
  check("SB(sash) C strip width", c.pieces[0].h, 2.5);
  check("SB(sash) C strip length", c.pieces[0].w, 12.5);
}

console.log("\n=== Snowball Block: 36×60, 12\" block, 4\" corner — ODD total blocks (3×5=15) ===");
{
  const s = {
    ...base(),
    pattern: "snowball-block" as const,
    quiltWidth: 36, quiltHeight: 60,
    blockSize: 12, cornerAccentSize: 4,
    borderWidth: 0, sashingWidth: 0,
    assignments: { mainA: "A", mainB: "B" } as Record<string, FabricKey>,
  };
  // 3×5 = 15 blocks. Walk grid: even=8, odd=7.
  // A: 8 main + 28 corners. B: 7 main + 32 corners.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SB odd: A main count", a.pieces[0].count, 8);
  check("SB odd: A corner count", a.pieces[1].count, 28);
  check("SB odd: B main count", b.pieces[0].count, 7);
  check("SB odd: B corner count", b.pieces[1].count, 32);
  // Total mains = 8+7=15 ✓ ; total corners = 28+32 = 60 = 15*4 ✓
}

console.log("\n=== Snowball Block: small 8\" block, 3\" corner, 24×24 (3×3=9) ===");
{
  const s = {
    ...base(),
    pattern: "snowball-block" as const,
    quiltWidth: 24, quiltHeight: 24,
    blockSize: 8, cornerAccentSize: 3,
    borderWidth: 0, sashingWidth: 0,
    assignments: { mainA: "A", mainB: "B" } as Record<string, FabricKey>,
  };
  // 3×3 = 9. even=5 (corners + center), odd=4.
  // mainCut=8.5, cornerCut=3.5.
  // A: 5 mains @8.5 — per strip floor(42.5/8.5)=5 → ceil(5/5)=1 strip × 8.5 = 8.5.
  //    16 corners @3.5 — per strip floor(42.5/3.5)=12 → ceil(16/12)=2 × 3.5 = 7.0.
  //    Total A = 15.5.
  // B: 4 mains @8.5 → 1 strip × 8.5 = 8.5. 20 corners @3.5 → ceil(20/12)=2 × 3.5 = 7.0. Total B = 15.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SB small: A main count", a.pieces[0].count, 5);
  check("SB small: A corner count", a.pieces[1].count, 16);
  check("SB small: A inches", a.totalInches, 15.5);
  check("SB small: B main count", b.pieces[0].count, 4);
  check("SB small: B corner count", b.pieces[1].count, 20);
  check("SB small: B inches", b.totalInches, 15.5);
}


// =========================================================================
// FOUR PATCH
// =========================================================================
console.log("\n=== Four Patch: 50×65, 12\" block, no border, no sashing, 4 distinct fabrics ===");
{
  const s = {
    ...base(),
    pattern: "four-patch" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { topLeft: "A", topRight: "B", bottomLeft: "D", bottomRight: "C" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. u=6, cut=6.5. Per strip floor(42.5/6.5)=6. Strips=ceil(20/6)=4.
  // Inches per fabric = 4*6.5 = 26.
  const r = calculateYardage(s);
  for (const fab of ["A","B","C","D"] as FabricKey[]) {
    const f = r.fabrics.find(x => x.fabric === fab)!;
    check(`4P ${fab} count`, f.pieces[0].count, 20);
    check(`4P ${fab} cut`, f.pieces[0].w, 6.5);
    check(`4P ${fab} strips`, f.strips[0].count, 4);
    check(`4P ${fab} inches`, f.totalInches, 26);
  }
}

console.log("\n=== Four Patch: shared fabric — A in two positions pools to 2× count ===");
{
  const s = {
    ...base(),
    pattern: "four-patch" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { topLeft: "A", topRight: "B", bottomLeft: "B", bottomRight: "A" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. A holds TL + BR = 2 positions → 40 squares. B holds TR + BL → 40.
  // cut 6.5. per strip 6. Strips=ceil(40/6)=7. Inches=7*6.5=45.5.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("4P shared A count", a.pieces[0].count, 40);
  check("4P shared A strips", a.strips[0].count, 7);
  check("4P shared A inches", a.totalInches, 45.5);
  check("4P shared B count", b.pieces[0].count, 40);
  check("4P shared B inches", b.totalInches, 45.5);
  check("4P shared no C", r.fabrics.find(f => f.fabric === "C") ? 1 : 0, 0);
  check("4P shared no D", r.fabrics.find(f => f.fabric === "D") ? 1 : 0, 0);
}

console.log("\n=== Four Patch: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "four-patch" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { topLeft: "A", topRight: "B", bottomLeft: "D", bottomRight: "C", sashing: "E" } as Record<string, FabricKey>,
  };
  // vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const e = r.fabrics.find(f => f.fabric === "E")!;
  check("4P(sash) E strip count", e.pieces[0].count, 31);
  check("4P(sash) E strip width", e.pieces[0].h, 2.5);
  check("4P(sash) E strip length", e.pieces[0].w, 12.5);
}


// =========================================================================
// AUTUMN TINTS — 4×4 grid of 16 plain squares. Per block: A=8, B=4, C=2, D=2.
// =========================================================================
console.log("\n=== Autumn Tints: 50×65, 12\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "autumn-tints" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 4×5 = 20 blocks. u = 3, cut = 3.5. Per strip floor(42.5/3.5) = 12.
  // A: 8*20=160 squares → strips=ceil(160/12)=14 → inches=14*3.5=49.
  // B: 4*20=80  squares → strips=ceil(80/12)=7   → inches=7*3.5=24.5.
  // C: 2*20=40  squares → strips=ceil(40/12)=4   → inches=4*3.5=14.
  // D: 2*20=40  squares → strips=ceil(40/12)=4   → inches=4*3.5=14.
  const r = calculateYardage(s);
  const expect: Record<string, [number, number, number]> = {
    A: [160, 14, 49],
    B: [80, 7, 24.5],
    C: [40, 4, 14],
    D: [40, 4, 14],
  };
  for (const fab of ["A", "B", "C", "D"] as FabricKey[]) {
    const f = r.fabrics.find((x) => x.fabric === fab)!;
    const [count, strips, inches] = expect[fab];
    check(`AT ${fab} count`, f.pieces[0].count, count);
    check(`AT ${fab} cut`, f.pieces[0].w, 3.5);
    check(`AT ${fab} strips`, f.strips[0].count, strips);
    check(`AT ${fab} inches`, f.totalInches, inches);
  }
}

console.log("\n=== Autumn Tints: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "autumn-tints" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: {
      dominant: "A",
      background: "B",
      accent1: "C",
      accent2: "D",
      sashing: "E",
    } as Record<string, FabricKey>,
  };
  // Same block math as above; sashing E: vSash=(4-1)*5=15, hSash=(5-1)*4=16,
  // total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const e = r.fabrics.find((f) => f.fabric === "E")!;
  check("AT(sash) E strip count", e.pieces[0].count, 31);
  check("AT(sash) E strip width", e.pieces[0].h, 2.5);
  check("AT(sash) E strip length", e.pieces[0].w, 12.5);
}

// =========================================================================
// STREAK OF LIGHTNING
// =========================================================================
console.log("\n=== Streak of Lightning: 50×65, 12\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "streak-of-lightning" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { stripe: "A", bg: "B" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. u=6, cut=6.875. perStrip floor(42.5/6.875)=6.
  // Each fabric: 20*2 = 40 squares. strips=ceil(40/6)=7. inches=7*6.875=48.125.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SoL A count", a.pieces[0].count, 40);
  check("SoL A cut", a.pieces[0].w, 6.875);
  check("SoL A strips", a.strips[0].count, 7);
  check("SoL A inches", a.totalInches, 48.125);
  check("SoL B count", b.pieces[0].count, 40);
  check("SoL B inches", b.totalInches, 48.125);
}

console.log("\n=== Streak of Lightning: shared fabric — stripe and bg both A pools to 80 ===");
{
  const s = {
    ...base(),
    pattern: "streak-of-lightning" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { stripe: "A", bg: "A" } as Record<string, FabricKey>,
  };
  // 20 blocks * 4 = 80 squares of A, cut 6.875, perStrip 6 → strips ceil(80/6)=14.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("SoL shared A count", a.pieces[0].count, 80);
  check("SoL shared A strips", a.strips[0].count, 14);
  check("SoL shared no B", r.fabrics.find(f => f.fabric === "B") ? 1 : 0, 0);
}

console.log("\n=== Streak of Lightning: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "streak-of-lightning" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { stripe: "A", bg: "B", sashing: "D" } as Record<string, FabricKey>,
  };
  // vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const d = r.fabrics.find(f => f.fabric === "D")!;
  check("SoL(sash) D strip count", d.pieces[0].count, 31);
  check("SoL(sash) D strip width", d.pieces[0].h, 2.5);
  check("SoL(sash) D strip length", d.pieces[0].w, 12.5);
}


// =========================================================================
// BOW TIE
// =========================================================================
console.log("\n=== Bow Tie: 50×65, 12\" block, no border, no sashing, 3 distinct fabrics ===");
{
  const s = {
    ...base(),
    pattern: "bow-tie" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { mainA: "A", mainB: "B", knot: "D" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. u=6, mainCut=6.5. per strip floor(42.5/6.5)=6.
  // A: 2*20=40 mains. strips=ceil(40/6)=7. inches=7*6.5=45.5.
  // B: same as A → 45.5.
  // Knot: diag=12/2=6, side=6/√2≈4.2426, +0.5=4.7426 → ceil to 1/8 = 4.75.
  // perStrip=floor(42.5/4.75)=8. 20 knots → strips=ceil(20/8)=3. inches=3*4.75=14.25.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const d = r.fabrics.find(f => f.fabric === "D")!;
  check("BT A main count", a.pieces[0].count, 40);
  check("BT A cut", a.pieces[0].w, 6.5);
  check("BT A strips", a.strips[0].count, 7);
  check("BT A inches", a.totalInches, 45.5);
  check("BT B main count", b.pieces[0].count, 40);
  check("BT B inches", b.totalInches, 45.5);
  check("BT D knot count", d.pieces[0].count, 20);
  check("BT D knot cut", d.pieces[0].w, 4.75);
  check("BT D strips", d.strips[0].count, 3);
  check("BT D inches", d.totalInches, 14.25);
}

console.log("\n=== Bow Tie: shared fabric — mainA and mainB both A pools to 80 mains ===");
{
  const s = {
    ...base(),
    pattern: "bow-tie" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { mainA: "A", mainB: "A", knot: "D" } as Record<string, FabricKey>,
  };
  // 80 mains of A at 6.5". perStrip 6 → strips ceil(80/6)=14. inches=14*6.5=91.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("BT shared A count", a.pieces[0].count, 80);
  check("BT shared A strips", a.strips[0].count, 14);
  check("BT shared A inches", a.totalInches, 91);
  check("BT shared no B", r.fabrics.find(f => f.fabric === "B") ? 1 : 0, 0);
}

console.log("\n=== Bow Tie: 50×65, 12\" block, no border, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "bow-tie" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { mainA: "A", mainB: "B", knot: "D", sashing: "C" } as Record<string, FabricKey>,
  };
  // vSash=15, hSash=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("BT(sash) C strip count", c.pieces[0].count, 31);
  check("BT(sash) C strip width", c.pieces[0].h, 2.5);
  check("BT(sash) C strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// SHOOFLY — 3×3 grid, 2 fabrics, HST corners pointing inward.
// Block size 12" → u=4" finished. Plain cut = 4.5", HST cut = 4.875".
// Per block: bg = 4 plain + 2 HST squares; accent = 1 center + 2 HST squares.
// =========================================================================
console.log("\n=== Shoofly baseline: 48×60 throw, no sashing, no border, no alt ===");
{
  const s = {
    ...base(),
    pattern: "shoofly" as const,
    quiltWidth: 48,
    quiltHeight: 60,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    alternateBlocks: false,
    assignments: { bg: "A", accent: "B" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. bg: 80 plain @4.5", 40 HST @4.875". accent: 20 center @4.5", 40 HST @4.875".
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const aPlain = a.pieces.find(p => /side squares/i.test(p.label))!;
  const aHst = a.pieces.find(p => /HST/i.test(p.label))!;
  const bCenter = b.pieces.find(p => /center/i.test(p.label))!;
  const bHst = b.pieces.find(p => /HST/i.test(p.label))!;
  check("Shoofly A side squares count", aPlain.count, 80);
  check("Shoofly A side squares size", aPlain.w, 4.5);
  check("Shoofly A HST count", aHst.count, 40);
  check("Shoofly A HST size", aHst.w, 4.875);
  check("Shoofly B center count", bCenter.count, 20);
  check("Shoofly B center size", bCenter.w, 4.5);
  check("Shoofly B HST count", bHst.count, 40);
  check("Shoofly B HST size", bHst.w, 4.875);
}

console.log("\n=== Shoofly alternate blocks: 4×5 grid = 10 even + 10 odd ===");
{
  const s = {
    ...base(),
    pattern: "shoofly" as const,
    quiltWidth: 48,
    quiltHeight: 60,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    alternateBlocks: true,
    assignments: { bg: "A", accent: "B" } as Record<string, FabricKey>,
  };
  // Even (10 blocks): A=bg, B=accent → A: 40 plain + 20 HST; B: 10 center + 20 HST.
  // Odd  (10 blocks): B=bg, A=accent → B: 40 plain + 20 HST; A: 10 center + 20 HST.
  // Pooled: A: 40 plain + 10 center + (20+20)=40 HST; B: 40 plain + 10 center + 40 HST.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const aHst = a.pieces.find(p => /HST/i.test(p.label))!;
  const bHst = b.pieces.find(p => /HST/i.test(p.label))!;
  check("Shoofly alt A HST total", aHst.count, 40);
  check("Shoofly alt B HST total", bHst.count, 40);
  // A has both plain side squares (bg role) AND center squares (flipped role).
  const aPlain = a.pieces.find(p => /side squares/i.test(p.label))!;
  const aCenter = a.pieces.find(p => /center/i.test(p.label))!;
  check("Shoofly alt A plain count", aPlain.count, 40);
  check("Shoofly alt A center count", aCenter.count, 10);
}

console.log("\n=== Shoofly with sashing: 4×5 grid, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "shoofly" as const,
    quiltWidth: 60,
    quiltHeight: 72,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { bg: "A", accent: "B", sashing: "C" } as Record<string, FabricKey>,
  };
  // 4 across, 5 down → vSash=3*5=15, hSash=4*4=16, total=31 at 2.5"×12.5".
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  // 60/12=5 across, 72/12=6 down → vSash=4*6=24, hSash=5*5=25, total=49.
  check("Shoofly sash strip count", c.pieces[0].count, 49);
  check("Shoofly sash strip width", c.pieces[0].h, 2.5);
  check("Shoofly sash strip length", c.pieces[0].w, 12.5);
}

// =========================================================================
// RAIL FENCE — JELLY ROLL PRECUT MODE
// railsPerStrip = floor(42 / 6.5) = 6.
// Block size locked to 6". Rails grouped by fabric (3 rail slots).
// =========================================================================
console.log("\n=== Rail Fence jelly roll: small (36×48) ===");
{
  // 36/6=6 across, 48/6=8 down → 48 blocks. 3 rail fabrics each need 48 rails.
  // Strips per fabric = ceil(48/6) = 8. Total strips = 24. Fits in 40-strip roll.
  const s = { ...base(), pattern: "rail-fence" as const, quiltWidth: 36, quiltHeight: 48, blockSize: 6, fabricSource: "jelly-roll" as const, jellyRollStripCount: 40 };
  const p = computePrecutPlan(s)!;
  check("JR small: 3 fabrics", p.fabrics.length, 3);
  check("JR small: A pieces", p.fabrics[0].piecesNeeded, 48);
  check("JR small: A strips", p.fabrics[0].stripsNeeded, 8);
  check("JR small: total strips", p.totalStripsNeeded, 24);
  check("JR small: feasible", p.feasible ? 1 : 0, 1);
  // Yardage calc should NOT include rails (jelly-roll mode skips them).
  const y = calculateYardage(s);
  check("JR small: no rail yardage", y.fabrics.length, 0);
}

console.log("\n=== Rail Fence jelly roll: throw (50×65, 2 fabrics overlap) ===");
{
  // 50/6=8 across, 65/6=10 down → 80 blocks. With rail2=A, rail3=B, rail1=A,
  // Fabric A gets 2×80=160 rails (ceil(160/6)=27 strips), B gets 80 (ceil(80/6)=14).
  // total = 41. Just over the 40-strip roll → infeasible.
  const s = {
    ...base(),
    pattern: "rail-fence" as const,
    quiltWidth: 50, quiltHeight: 65, blockSize: 6,
    fabricSource: "jelly-roll" as const, jellyRollStripCount: 40,
    assignments: { rail1: "A" as FabricKey, rail2: "A" as FabricKey, rail3: "B" as FabricKey },
  };
  const p = computePrecutPlan(s)!;
  check("JR throw: 2 fabrics", p.fabrics.length, 2);
  const a = p.fabrics.find(x => x.fabric === "A")!;
  const b = p.fabrics.find(x => x.fabric === "B")!;
  check("JR throw: A pieces", a.piecesNeeded, 160);
  check("JR throw: A strips", a.stripsNeeded, 27);
  check("JR throw: B pieces", b.piecesNeeded, 80);
  check("JR throw: B strips", b.stripsNeeded, 14);
  check("JR throw: total strips", p.totalStripsNeeded, 41);
  check("JR throw: infeasible vs 40", p.feasible ? 1 : 0, 0);
}

console.log("\n=== Rail Fence jelly roll: yardage mode unchanged ===");
{
  // Sanity: in yardage mode (default), rail yardage still flows through
  // calculateYardage exactly as before — no precut plan returned.
  const s = { ...base(), pattern: "rail-fence" as const, quiltWidth: 36, quiltHeight: 48, blockSize: 6 };
  const p = computePrecutPlan(s);
  check("JR yardage-mode: no precut plan", p === null ? 1 : 0, 1);
  const y = calculateYardage(s);
  // 48 rails × 3 fabrics. railCutLength=6.5, railCutHeight=2.5.
  // perStrip = floor(42.5/6.5)=6. strips per fab = ceil(48/6)=8. Inches=8*2.5=20.
  check("JR yardage-mode: 3 fabrics produced", y.fabrics.length, 3);
  check("JR yardage-mode: A inches", y.fabrics[0].totalInches, 20);
}


// =========================================================================
// JACOB'S LADDER — 6×6 grid: 5 four-patches + 4 HSTs. u = blockSize / 6.
// Per block: 10 A small + 10 B small @ (u+0.5)"; 2 B-HST + 2 C-HST @ (2u+0.875)".
// Block size 12" → u=2", small=2.5", HST=4.875".
// =========================================================================
console.log("\n=== Jacob's Ladder baseline: 48×60 throw, no sashing/border, alt off ===");
{
  const s = {
    ...base(),
    pattern: "jacobs-ladder" as const,
    quiltWidth: 48,
    quiltHeight: 60,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    alternateBlocks: false,
    assignments: { dark: "A", light: "B", ladder: "D" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. A: 200 small @ 2.5". B: 200 small + 40 HST-start @ 4.875".
  // D: 40 HST-start @ 4.875".
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const d = r.fabrics.find(f => f.fabric === "D")!;
  const aSmall = a.pieces.find(p => /Four-patch dark/i.test(p.label))!;
  const bSmall = b.pieces.find(p => /Four-patch light/i.test(p.label))!;
  const bHst = b.pieces.find(p => /background/i.test(p.label))!;
  const dHst = d.pieces.find(p => /ladder accent/i.test(p.label))!;
  check("JL A small count", aSmall.count, 200);
  check("JL A small size", aSmall.w, 2.5);
  check("JL B small count", bSmall.count, 200);
  check("JL B small size", bSmall.w, 2.5);
  check("JL B HST count", bHst.count, 40);
  check("JL B HST size", bHst.w, 4.875);
  check("JL D HST count", dHst.count, 40);
  check("JL D HST size", dHst.w, 4.875);
}


console.log("\n=== Jacob's Ladder with sashing: 4×5 grid, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "jacobs-ladder" as const,
    quiltWidth: 60,
    quiltHeight: 72,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    alternateBlocks: true,
    assignments: { dark: "A", light: "B", ladder: "D", sashing: "C" } as Record<string, FabricKey>,
  };
  // 60/12=5 across, 72/12=6 down → vSash=4*6=24, hSash=5*5=25, total=49.
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("JL sash strip count", c.pieces[0].count, 49);
  check("JL sash strip width", c.pieces[0].h, 2.5);
  check("JL sash strip length", c.pieces[0].w, 12.5);
}





// =========================================================================
// CARD TRICK — 3×3 grid: 4 corner HSTs + 4 edge QSTs + 1 center QST per block
// =========================================================================
console.log("\n=== Card Trick: 50×65, 12\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "card-trick" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 4×5=20 blocks. u=4. hstCut=4.875, qstCut=5.25.
  // Per block:
  //   Bg(E): 4 HST + 4 QST → across 20 blocks: 80 HST + 80 QST
  //   Each card (A/B/C/D): 1 HST + 4 QST (3 edge quarters + 1 center)
  //     → across 20 blocks: 20 HST + 80 QST
  const r = calculateYardage(s);
  const e = r.fabrics.find(f => f.fabric === "E")!;
  check("CT E buckets", e.pieces.length, 2);
  check("CT E HST count", e.pieces[0].count, 80);
  check("CT E HST cut", e.pieces[0].w, 4.875);
  check("CT E QST count", e.pieces[1].count, 80);
  check("CT E QST cut", e.pieces[1].w, 5.25);
  for (const fab of ["A", "B", "C", "D"] as FabricKey[]) {
    const f = r.fabrics.find(x => x.fabric === fab)!;
    check(`CT ${fab} buckets`, f.pieces.length, 2);
    check(`CT ${fab} HST count`, f.pieces[0].count, 20);
    check(`CT ${fab} HST cut`, f.pieces[0].w, 4.875);
    check(`CT ${fab} QST count`, f.pieces[1].count, 80);
    check(`CT ${fab} QST cut`, f.pieces[1].w, 5.25);
  }
}

console.log("\n=== Card Trick: 50×65, 12\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "card-trick" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { cardA: "A", cardB: "B", cardC: "C", cardD: "D", bg: "E", sashing: "F" } as Record<string, FabricKey>,
  };
  // vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const f = r.fabrics.find(x => x.fabric === "F")!;
  check("CT(sash) F strip count", f.pieces[0].count, 31);
  check("CT(sash) F strip width", f.pieces[0].h, 2.5);
  check("CT(sash) F strip length", f.pieces[0].w, 12.5);
}


// =========================================================================
// OH SUSANNAH — 4×4 grid: 12 plain outer squares + 4 HSTs in center 2×2
// =========================================================================
console.log("\n=== Oh Susannah: 50×65, 12\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "oh-susannah" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 4×5=20 blocks. u=3, plainCut=3.5, hstCut=3.875.
  // Per block:
  //   A: 4 plain + 2 HST starters → 80 plain, 40 HST across 20 blocks
  //   B: 4 plain → 80 plain
  //   C: 4 plain + 2 HST starters → 80 plain, 40 HST
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  check("OS A buckets", A.pieces.length, 2);
  check("OS A plain count", A.pieces[0].count, 80);
  check("OS A plain cut", A.pieces[0].w, 3.5);
  check("OS A HST count", A.pieces[1].count, 40);
  check("OS A HST cut", A.pieces[1].w, 3.875);
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("OS B buckets", B.pieces.length, 1);
  check("OS B plain count", B.pieces[0].count, 80);
  const C = r.fabrics.find(f => f.fabric === "C")!;
  check("OS C plain count", C.pieces[0].count, 80);
  check("OS C HST count", C.pieces[1].count, 40);
  check("OS C HST cut", C.pieces[1].w, 3.875);
}

console.log("\n=== Oh Susannah: 50×65, 12\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "oh-susannah" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { dominant: "A", secondary: "B", bg: "C", sashing: "D" } as Record<string, FabricKey>,
  };
  // 31 sashing strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const d = r.fabrics.find(x => x.fabric === "D")!;
  check("OS(sash) D strip count", d.pieces[0].count, 31);
  check("OS(sash) D strip width", d.pieces[0].h, 2.5);
  check("OS(sash) D strip length", d.pieces[0].w, 12.5);
}


// =========================================================================
// TWIN STAR — 3×3 grid: 5 plain bg squares + 4 large-star HSTs + 4 small B QSTs + 4 small D QSTs
// =========================================================================
console.log("\n=== Twin Star: 50×65, 12\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "twin-star" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 4×5=20 blocks. u=4. plainCut=4.5, hstCut=4.875, qstCut=5.25.
  // Per block: A = 2 HST; B = 1 QST; D = 1 QST; C = 5 plain (NO QST — bg
  // never appears inside an edge unit any more).
  // Across 20 blocks: A = 40 HST; B = 20 QST; D = 20 QST; C = 100 plain.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  check("TS A buckets", A.pieces.length, 1);
  check("TS A HST count", A.pieces[0].count, 40);
  check("TS A HST cut", A.pieces[0].w, 4.875);
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("TS B buckets", B.pieces.length, 1);
  check("TS B QST count", B.pieces[0].count, 20);
  check("TS B QST cut", B.pieces[0].w, 5.25);
  const D = r.fabrics.find(f => f.fabric === "D")!;
  check("TS D buckets", D.pieces.length, 1);
  check("TS D QST count", D.pieces[0].count, 20);
  check("TS D QST cut", D.pieces[0].w, 5.25);
  const C = r.fabrics.find(f => f.fabric === "C")!;
  check("TS C buckets", C.pieces.length, 1);
  check("TS C plain count", C.pieces[0].count, 100);
  check("TS C plain cut", C.pieces[0].w, 4.5);
}

console.log("\n=== Twin Star: 50×65, 12\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "twin-star" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { star: "A", point: "B", point2: "D", bg: "C", sashing: "E" } as Record<string, FabricKey>,
  };
  // 31 sashing strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const e = r.fabrics.find(x => x.fabric === "E")!;
  check("TS(sash) E strip count", e.pieces[0].count, 31);
  check("TS(sash) E strip width", e.pieces[0].h, 2.5);
  check("TS(sash) E strip length", e.pieces[0].w, 12.5);
}


// =========================================================================
// STAR & CROSS — 5×5 unit grid: rectangles + squares only, 4 fabrics.
// =========================================================================
console.log("\n=== Star & Cross: 50×65, 10\" block, no border, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "star-and-cross" as const,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 5×6 = 30 blocks. u = 2. sqCut = 2.5. rectLong = 4.5, rectShort = 2.5.
  // Per block: A = 4 rects + 4 squares; B = 4 squares; C = 4 rects; D = 1 square.
  // Across 30 blocks: A = 120 rects + 120 squares; B = 120 squares;
  //                   C = 120 rects; D = 30 squares.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  check("S&C A buckets", A.pieces.length, 2);
  // pieces are pushed in order: squares first, then rects.
  check("S&C A squares count", A.pieces[0].count, 120);
  check("S&C A squares cut", A.pieces[0].w, 2.5);
  check("S&C A rects count", A.pieces[1].count, 120);
  check("S&C A rects long", A.pieces[1].w, 4.5);
  check("S&C A rects short", A.pieces[1].h, 2.5);
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("S&C B buckets", B.pieces.length, 1);
  check("S&C B squares count", B.pieces[0].count, 120);
  check("S&C B squares cut", B.pieces[0].w, 2.5);
  const C = r.fabrics.find(f => f.fabric === "C")!;
  check("S&C C buckets", C.pieces.length, 1);
  check("S&C C rects count", C.pieces[0].count, 120);
  check("S&C C rects long", C.pieces[0].w, 4.5);
  const D = r.fabrics.find(f => f.fabric === "D")!;
  check("S&C D buckets", D.pieces.length, 1);
  check("S&C D center count", D.pieces[0].count, 30);
  check("S&C D center cut", D.pieces[0].w, 2.5);
}

console.log("\n=== Star & Cross: 50×65, 10\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "star-and-cross" as const,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { bg: "A", accent: "B", cross: "C", center: "D", sashing: "E" } as Record<string, FabricKey>,
  };
  // 5 across × 6 down = 30 blocks. Sashing strips = 4×6 + 5×5 = 24 + 25 = 49
  // at 2.5" × 10.5".
  const r = calculateYardage(s);
  const e = r.fabrics.find(x => x.fabric === "E")!;
  check("S&C(sash) E strip count", e.pieces[0].count, 49);
  check("S&C(sash) E strip width", e.pieces[0].h, 2.5);
  check("S&C(sash) E strip length", e.pieces[0].w, 10.5);
}

console.log("\n=== Idaho Beauty: 50×65, 10\" block, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "idaho-beauty" as const,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 5×6 = 30 blocks. 3×3 core + half-width ring: core = 2.5, ring = 1.25.
  // coreCut = 3, ringCut = 1.75, ring rectangles = 3 × 1.75.
  // Per block: A = 4 core squares + 4 ring squares + 12 ring rects;
  //            B = 32 ring squares; C = 5 core squares.
  // Across 30 blocks: A = 120 core + 120 ring + 360 rects; B = 960 ring; C = 150 core.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  check("IB A buckets", A.pieces.length, 3);
  check("IB A core count", A.pieces[0].count, 120);
  check("IB A core cut", A.pieces[0].w, 3);
  check("IB A ring square count", A.pieces[1].count, 120);
  check("IB A ring square cut", A.pieces[1].w, 1.75);
  check("IB A rects count", A.pieces[2].count, 360);
  check("IB A rects long", A.pieces[2].w, 3);
  check("IB A rects short", A.pieces[2].h, 1.75);
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("IB B buckets", B.pieces.length, 1);
  check("IB B ring square count", B.pieces[0].count, 960);
  check("IB B ring square cut", B.pieces[0].w, 1.75);
  const C = r.fabrics.find(f => f.fabric === "C")!;
  check("IB C buckets", C.pieces.length, 1);
  check("IB C core count", C.pieces[0].count, 150);
  check("IB C core cut", C.pieces[0].w, 3);
}

console.log("\n=== Idaho Beauty: 50×65, 10\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "idaho-beauty" as const,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { bg: "A", accent: "B", solid: "C", sashing: "D" } as Record<string, FabricKey>,
  };
  // 5×6 = 30 blocks. Sashing = 4×6 + 5×5 = 49 strips at 2.5" × 10.5".
  const r = calculateYardage(s);
  const d = r.fabrics.find(x => x.fabric === "D")!;
  check("IB(sash) D strip count", d.pieces[0].count, 49);
  check("IB(sash) D strip width", d.pieces[0].h, 2.5);
  check("IB(sash) D strip length", d.pieces[0].w, 10.5);
}

console.log("\n=== Checkerboard: 50×65, 12\" block, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "checkerboard" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
  };
  // 4×5=20 blocks. outerCut = 13.25. Inner is a 2×2 of plain squares set
  // on-point — each small square finished = 12·√2/4 ≈ 4.2426", cut ≈ 4.7426".
  // Per block: A=2 outer, B=2 outer, C=2 inner, D=2 inner.
  const innerCut = (12 * Math.SQRT2) / 4 + 0.5;
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  check("CB A count", A.pieces[0].count, 40);
  check("CB A cut", A.pieces[0].w, 13.25);
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("CB B count", B.pieces[0].count, 40);
  check("CB B cut", B.pieces[0].w, 13.25);
  const C = r.fabrics.find(f => f.fabric === "C")!;
  check("CB C count", C.pieces[0].count, 40);
  check("CB C cut", C.pieces[0].w, innerCut);
  const D = r.fabrics.find(f => f.fabric === "D")!;
  check("CB D count", D.pieces[0].count, 40);
  check("CB D cut", D.pieces[0].w, innerCut);
}

console.log("\n=== Checkerboard: 50×65, 12\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "checkerboard" as const,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { outerA: "A", outerB: "B", innerC: "C", innerD: "D", sashing: "E" } as Record<string, FabricKey>,
  };
  // 4×5=20 blocks. vSash=(4-1)*5=15, hSash=(5-1)*4=16, total=31 strips at 2.5"×12.5".
  const r = calculateYardage(s);
  const e = r.fabrics.find(x => x.fabric === "E")!;
  check("CB(sash) E strip count", e.pieces[0].count, 31);
  check("CB(sash) E strip width", e.pieces[0].h, 2.5);
  check("CB(sash) E strip length", e.pieces[0].w, 12.5);
}

console.log("\n=== Cabin in the Cotton: 50×65, 15\" block, no sashing/border ===");
{
  const s = {
    ...base(),
    pattern: "cabin-in-the-cotton" as const,
    blockSize: 15,
  };
  // 3×4 = 12 blocks. Even/odd: 6 each.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  const D = r.fabrics.find(f => f.fabric === "D")!;
  const E = r.fabrics.find(f => f.fabric === "E")!;
  // A: 12 centers + 24 R2 short + 24 R2 tall = 60 pieces
  const aCount = A.pieces.reduce((n, p) => n + p.count, 0);
  check("Cabin A total piece count", aCount, 60);
  // B: 24 R1 short + 24 R1 tall = 48
  check("Cabin B total piece count", B.pieces.reduce((n, p) => n + p.count, 0), 48);
  // D and E: 12 short + 12 tall = 24 each (6 blocks × 4 strips)
  check("Cabin D total piece count", D.pieces.reduce((n, p) => n + p.count, 0), 24);
  check("Cabin E total piece count", E.pieces.reduce((n, p) => n + p.count, 0), 24);
}

console.log("\n=== Cabin in the Cotton: same block everywhere (alternateBlocks) ===");
{
  const s = {
    ...base(),
    pattern: "cabin-in-the-cotton" as const,
    blockSize: 15,
    alternateBlocks: true,
  };
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  const D = r.fabrics.find(f => f.fabric === "D")!;
  const E = r.fabrics.find(f => f.fabric === "E");
  check("Cabin(uniform) A total piece count", A.pieces.reduce((n, p) => n + p.count, 0), 60);
  check("Cabin(uniform) B total piece count", B.pieces.reduce((n, p) => n + p.count, 0), 48);
  // All 12 blocks get a Fabric D outer ring: 24 short + 24 tall = 48.
  check("Cabin(uniform) D total piece count", D.pieces.reduce((n, p) => n + p.count, 0), 48);
  check("Cabin(uniform) E unused", E ? E.pieces.reduce((n, p) => n + p.count, 0) : 0, 0);
}

console.log("\n=== Fancy Stripe: 50×65, 12\" block, no sashing/border ===");
{
  const s = { ...base(), pattern: "fancy-stripe" as const, blockSize: 12 };
  // across=floor(50/12)=4, down=floor(65/12)=5 → 20 blocks.
  // Each block = 16 HSTs → 8 A squares + 8 B squares.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("Fancy Stripe A square count", A.pieces.reduce((n, p) => n + p.count, 0), 160);
  check("Fancy Stripe B square count", B.pieces.reduce((n, p) => n + p.count, 0), 160);
  check("Fancy Stripe A cut size", A.pieces[0].w, 3 + 0.875);
}



// =========================================================================
// ALASKA HOMESTEAD — 3×3 grid, 3 fabrics.
// Block 12" → u=4". HST cut = 4.875", centre cut = 4.5",
// edge rectangles = 4.5" × 2.5" (u/2 + 0.5 = 2.5").
// Per block: A = 2 HST squares + 4 rects; B = 2 HST squares;
//            C = 4 rects + 1 centre.
// =========================================================================
console.log("\n=== Alaska Homestead: 48×60, 12\" block, no sashing/border ===");
{
  const s = {
    ...base(),
    pattern: "alaska-homestead" as const,
    quiltWidth: 48,
    quiltHeight: 60,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { bg: "A", points: "B", accent: "C" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  const C = r.fabrics.find(f => f.fabric === "C")!;
  const aHst = A.pieces.find(p => /HST/i.test(p.label))!;
  const aRect = A.pieces.find(p => /inner halves/i.test(p.label))!;
  const bHst = B.pieces.find(p => /HST/i.test(p.label))!;
  const cRect = C.pieces.find(p => /outer bars/i.test(p.label))!;
  const cCentre = C.pieces.find(p => /centre/i.test(p.label))!;
  check("Alaska A HST count", aHst.count, 40);
  check("Alaska A HST cut", aHst.w, 4.875);
  check("Alaska A rect count", aRect.count, 80);
  check("Alaska A rect long", aRect.w, 4.5);
  check("Alaska A rect short", aRect.h, 2.5);
  check("Alaska B HST count", bHst.count, 40);
  check("Alaska B HST cut", bHst.w, 4.875);
  check("Alaska C rect count", cRect.count, 80);
  check("Alaska C centre count", cCentre.count, 20);
  check("Alaska C centre cut", cCentre.w, 4.5);
}

console.log("\n=== Alaska Homestead: 50×65, 10\" block, 2\" sashing ===");
{
  const s = {
    ...base(),
    pattern: "alaska-homestead" as const,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 2,
    assignments: { bg: "A", points: "B", accent: "C", sashing: "D" } as Record<string, FabricKey>,
  };
  // across=floor(50/10)=5, down=floor(65/10)=6 → 30 blocks.
  // u=10/3 → HST cut = 3.3333+0.875 = 4.2083", centre = 3.8333",
  // rects 3.8333" × 2.1667". Sashing: v=(5-1)*6=24, h=(6-1)*5=25 → 49.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const D = r.fabrics.find(f => f.fabric === "D")!;
  const aHst = A.pieces.find(p => /HST/i.test(p.label))!;
  check("Alaska(sash) A HST count", aHst.count, 60);
  check("Alaska(sash) A HST cut", Math.round(aHst.w * 10000) / 10000, Math.round((10 / 3 + 0.875) * 10000) / 10000);
  check("Alaska(sash) D strip count", D.pieces[0].count, 49);
  check("Alaska(sash) D strip width", D.pieces[0].h, 2.5);
  check("Alaska(sash) D strip length", D.pieces[0].w, 10.5);
}


console.log("\n=== Blazing Arrows: 48×60, 12\" block, no sashing ===");
{
  const s = {
    ...base(),
    pattern: "blazing-arrows" as const,
    quiltWidth: 48,
    quiltHeight: 60,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { arrow: "A", bg: "B" } as Record<string, FabricKey>,
  };
  // 4×5 = 20 blocks. u = 3".
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  // HSTs: 2 pairs per block → 40 starting squares per fabric at 3+0.875=3.875".
  check("Blazing A HST count", A.pieces.find(p => /HST/.test(p.label))!.count, 40);
  check("Blazing A HST cut", A.pieces.find(p => /HST/.test(p.label))!.w, 3.875);
  check("Blazing B HST count", B.pieces.find(p => /HST/.test(p.label))!.count, 40);
  // Geese: ceil(20/2) = 10 no-waste sets → 10 large squares at 7.25", 40 small at 3.875" per fabric.
  const aLarge = A.pieces.find(p => /top\/bottom arrows/.test(p.label))!;
  check("Blazing A goose large count", aLarge.count, 10);
  check("Blazing A goose large cut", aLarge.w, 7.25);
  check("Blazing A goose small count", A.pieces.find(p => /side-arrow sky/.test(p.label))!.count, 40);
  check("Blazing A goose small cut", A.pieces.find(p => /side-arrow sky/.test(p.label))!.w, 3.875);
  check("Blazing B goose large count", B.pieces.find(p => /side arrows/.test(p.label))!.count, 10);
  check("Blazing B goose large cut", B.pieces.find(p => /side arrows/.test(p.label))!.w, 7.25);
  check("Blazing B goose small count", B.pieces.find(p => /top\/bottom sky/.test(p.label))!.count, 40);
  // Hourglass: 10 pairs at 7.25" per fabric.
  check("Blazing A QST count", A.pieces.find(p => /Hourglass/.test(p.label))!.count, 10);
  check("Blazing A QST cut", A.pieces.find(p => /Hourglass/.test(p.label))!.w, 7.25);
  check("Blazing B QST count", B.pieces.find(p => /Hourglass/.test(p.label))!.count, 10);
  // No sashing: no C row.
  check("Blazing no sashing row", r.fabrics.some(f => f.fabric === "C"), false);
}

console.log("\n=== Blazing Arrows: 50×65, 10\" block, 2\" sashing, 5 blocks (odd count) ===");
{
  const s = {
    ...base(),
    pattern: "blazing-arrows" as const,
    quiltWidth: 30,
    quiltHeight: 10,
    blockSize: 10,
    borderWidth: 0,
    sashingWidth: 0,
    assignments: { arrow: "A", bg: "B" } as Record<string, FabricKey>,
  };
  // 3×1 = 3 blocks → goose sets = ceil(3/2) = 2, QST pairs = 2.
  const r = calculateYardage(s);
  const A = r.fabrics.find(f => f.fabric === "A")!;
  const B = r.fabrics.find(f => f.fabric === "B")!;
  check("Blazing(3) A HST count", A.pieces.find(p => /HST/.test(p.label))!.count, 6);
  check("Blazing(3) A goose large count", A.pieces.find(p => /top\/bottom arrows/.test(p.label))!.count, 2);
  check("Blazing(3) A goose small count", A.pieces.find(p => /side-arrow sky/.test(p.label))!.count, 8);
  check("Blazing(3) A QST count", A.pieces.find(p => /Hourglass/.test(p.label))!.count, 2);
  check("Blazing(3) B goose large count", B.pieces.find(p => /side arrows/.test(p.label))!.count, 2);
  // u=2.5: HST cut 3.375, goose large 6.25, QST 6.25.
  check("Blazing(3) A HST cut", A.pieces.find(p => /HST/.test(p.label))!.w, 3.375);
  check("Blazing(3) A goose large cut", A.pieces.find(p => /top\/bottom arrows/.test(p.label))!.w, 6.25);
  check("Blazing(3) A QST cut", A.pieces.find(p => /Hourglass/.test(p.label))!.w, 6.25);

  const s2 = { ...s, sashingWidth: 2, assignments: { arrow: "A", bg: "B", sashing: "C" } as Record<string, FabricKey> };
  const r2 = calculateYardage(s2);
  const C = r2.fabrics.find(f => f.fabric === "C")!;
  // vertical = (3-1)*1 = 2, horizontal = (1-1)*3 = 0 → 2 strips at 2.5" × 10.5".
  check("Blazing(sash) C strip count", C.pieces[0].count, 2);
  check("Blazing(sash) C strip width", C.pieces[0].h, 2.5);
  check("Blazing(sash) C strip length", C.pieces[0].w, 10.5);
}

console.log("\n=== Plus Block: alternate (reversed) blocks ===");
{
  const off = { ...base(), pattern: "plus-block" as const, blockSize: 10, borderWidth: 0, sashingWidth: 0 };
  // across=floor(50/10)=5, down=floor(65/10)=6 → 30 blocks (even split 15/15).
  const r0 = calculateYardage(off);
  const a0 = r0.fabrics.find(f => f.fabric === "A")!;
  const b0 = r0.fabrics.find(f => f.fabric === "B")!;
  check("Plus(off) A plus squares", a0.pieces[0].count, 150);
  check("Plus(off) B corner squares", b0.pieces[0].count, 120);

  const on = { ...off, alternateBlocks: true };
  const r1 = calculateYardage(on);
  const a1 = r1.fabrics.find(f => f.fabric === "A")!;
  const b1 = r1.fabrics.find(f => f.fabric === "B")!;
  const aTot = a1.pieces.reduce((n, p) => n + p.count, 0);
  const bTot = b1.pieces.reduce((n, p) => n + p.count, 0);
  check("Plus(alt) A plus squares", a1.pieces[0].count, 75);   // 5 × 15
  check("Plus(alt) A corner squares", a1.pieces[1].count, 60); // 4 × 15
  check("Plus(alt) B corner squares", b1.pieces[0].count, 60);
  check("Plus(alt) B plus squares", b1.pieces[1].count, 75);
  check("Plus(alt) A total squares", aTot, 135);
  check("Plus(alt) B total squares", bTot, 135);
  check("Plus(alt) total squares unchanged (9 × 30)", aTot + bTot, 270);
  check("Plus(alt) cut size unchanged", a1.pieces[0].w, 10 / 3 + 0.5);
}

console.log("\n=== Pinwheel: alternate blocks leaves cut counts unchanged ===");
{
  const off = { ...base(), pattern: "pinwheel" as const, blockSize: 10, borderWidth: 0, sashingWidth: 0 };
  const on = { ...off, alternateBlocks: true };
  const r0 = calculateYardage(off);
  const r1 = calculateYardage(on);
  const a0 = r0.fabrics.find(f => f.fabric === "A")!.pieces[0];
  const a1 = r1.fabrics.find(f => f.fabric === "A")!.pieces[0];
  const b1 = r1.fabrics.find(f => f.fabric === "B")!.pieces[0];
  check("Pinwheel(alt) A square count unchanged", a1.count, a0.count);
  check("Pinwheel(alt) A/B counts equal", a1.count, b1.count);
  check("Pinwheel(alt) A square count", a1.count, 60); // 30 blocks × 4 HST / 2
}

console.log("\n=== Corner Beam: alternate (reversed) blocks ===");
{
  const off = { ...base(), pattern: "corner-beam" as const, blockSize: 10, borderWidth: 0, sashingWidth: 0 };
  // across=floor(50/10)=5, down=floor(65/10)=6 → 30 blocks (even split 15/15).
  const r0 = calculateYardage(off);
  const a0 = r0.fabrics.find(f => f.fabric === "A")!;
  const b0 = r0.fabrics.find(f => f.fabric === "B")!;
  check("CB(off) A beam squares", a0.pieces[0].count, 120);      // 4 × 30
  check("CB(off) A beam cut", a0.pieces[0].w, 5.5);              // u=5, +0.5
  check("CB(off) B flip rects", b0.pieces[0].count, 240);        // 8 × 30
  check("CB(off) B flip rect long", b0.pieces[0].w, 5.5);
  check("CB(off) B flip rect short", b0.pieces[0].h, 3);         // u/2 + 0.5

  const on = { ...off, alternateBlocks: true };
  const r1 = calculateYardage(on);
  const a1 = r1.fabrics.find(f => f.fabric === "A")!;
  const b1 = r1.fabrics.find(f => f.fabric === "B")!;
  const aSq = a1.pieces.filter(p => /beam squares/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const aRe = a1.pieces.filter(p => /rectangles/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const bSq = b1.pieces.filter(p => /beam squares/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const bRe = b1.pieces.filter(p => /rectangles/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  check("CB(alt) A beam squares", aSq, 60);   // 4 × 15
  check("CB(alt) A flip rects", aRe, 120);    // 8 × 15
  check("CB(alt) B beam squares", bSq, 60);
  check("CB(alt) B flip rects", bRe, 120);
  check("CB(alt) total squares unchanged", aSq + bSq, 120);
  check("CB(alt) total rects unchanged", aRe + bRe, 240);
  check("CB(alt) beam cut unchanged", a1.pieces[0].w, 5.5);
}

console.log("\n=== Corner Beam: odd block count splits exactly + shared fabric pools ===");
{
  // 3 × 3 = 9 blocks → 5 primary / 4 reversed.
  const odd = {
    ...base(), pattern: "corner-beam" as const,
    quiltWidth: 30, quiltHeight: 30, blockSize: 10, borderWidth: 0, sashingWidth: 0,
    alternateBlocks: true,
  };
  const r = calculateYardage(odd);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const aSq = a.pieces.filter(p => /beam squares/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const bSq = b.pieces.filter(p => /beam squares/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const aRe = a.pieces.filter(p => /rectangles/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const bRe = b.pieces.filter(p => /rectangles/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  check("CB(odd alt) A beam squares", aSq, 20); // 4 × 5
  check("CB(odd alt) B beam squares", bSq, 16); // 4 × 4
  check("CB(odd alt) A flip rects", aRe, 32);   // 8 × 4
  check("CB(odd alt) B flip rects", bRe, 40);   // 8 × 5
  check("CB(odd alt) squares total", aSq + bSq, 36); // 4 × 9
  check("CB(odd alt) rects total", aRe + bRe, 72);   // 8 × 9

  const shared = {
    ...odd,
    assignments: { beam: "A" as FabricKey, bg: "A" as FabricKey },
  };
  const rs = calculateYardage(shared);
  const sa = rs.fabrics.find(f => f.fabric === "A")!;
  const sSq = sa.pieces.filter(p => /beam squares/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  const sRe = sa.pieces.filter(p => /rectangles/i.test(p.label)).reduce((n, p) => n + p.count, 0);
  check("CB(shared) pooled squares", sSq, 36);
  check("CB(shared) pooled rects", sRe, 72);
  check("CB(shared) one square pile", sa.pieces.filter(p => /beam squares/i.test(p.label)).length, 1);
}

console.log("\n=== Blazing Arrows: alternate (reversed) blocks change nothing ===");
{
  // 5 × 6 = 30 blocks. The block is self-complementary — each fabric already
  // plays both goose roles and shares the HSTs/hourglass equally — so the
  // cutting list must be byte-identical with the toggle on.
  const off = { ...base(), pattern: "blazing-arrows" as const, blockSize: 10, borderWidth: 0, sashingWidth: 0 };
  const r0 = calculateYardage(off);
  const r1 = calculateYardage({ ...off, alternateBlocks: true });
  const flatten = (r: ReturnType<typeof calculateYardage>) =>
    r.fabrics
      .flatMap(f => f.pieces.map(p => `${f.fabric}|${p.label}|${p.count}|${p.w}|${p.h}`))
      .sort()
      .join("\n");
  check("BA(alt) cutting list identical", flatten(r1) === flatten(r0) ? 1 : 0, 1);
  check(
    "BA(alt) reversal note present",
    r1.notes.some(n => /Reversed blocks are ON/.test(n) && /15 blocks/.test(n)) ? 1 : 0,
    1,
  );
  check(
    "BA(off) no reversal note",
    r0.notes.some(n => /Reversed blocks are ON/.test(n)) ? 1 : 0,
    0,
  );
}

// =========================================================================
// DESIGN YOUR OWN BLOCK — hand-calculated cases for the seven unit types
// =========================================================================

/** Build a design with every grid cell filled by the given unit factory. */
function fullDesign(size: number, make: (r: number, c: number) => CustomCell | null): CustomBlockDesign {
  const cells: Record<string, CustomCell> = {};
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = make(r, c);
      if (cell) cells[`${r},${c}`] = cell;
    }
  }
  return { size, cells };
}

// Shared fixture: 48×48 quilt, 12" block, 4×4 grid → unit = 3", 16 blocks.
// 44" bolt → 42.5" usable.
function customBase(design: CustomBlockDesign) {
  return {
    ...base(),
    pattern: "custom-block" as const,
    quiltWidth: 48,
    quiltHeight: 48,
    blockSize: 12,
    borderWidth: 0,
    sashingWidth: 0,
    customBlock: design,
  };
}

console.log("\n=== Custom block: Snipped corners, all 4 corners on ===");
{
  // Per block: 16 base squares (A) + 64 corner squares (B). ×16 blocks:
  // A: 256 at unit+0.5 = 3.5". Per strip floor(42.5/3.5)=12. Strips=ceil(256/12)=22. In=77.
  // B: 1024 at unit/2+0.5 = 2".  Per strip floor(42.5/2)=21.   Strips=ceil(1024/21)=49. In=98.
  const d = fullDesign(4, () => ({ kind: "cornered", rotation: 0, fabrics: ["A", "B"] as FabricKey[], corners: [true, true, true, true] }));
  const r = calculateYardage(customBase(d));
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("CSC A base count", a.pieces[0].count, 256);
  check("CSC A base cut", a.pieces[0].w, 3.5);
  check("CSC A strips", a.strips[0].count, 22);
  check("CSC A inches", a.totalInches, 77);
  check("CSC B corner count", b.pieces[0].count, 1024);
  check("CSC B corner cut", b.pieces[0].w, 2);
  check("CSC B strips", b.strips[0].count, 49);
  check("CSC B inches", b.totalInches, 98);
}

console.log("\n=== Custom block: Snipped corners, only 2 corners on ===");
{
  // Same base; corner count halves: B = 512. Strips=ceil(512/21)=25. In=50.
  const d = fullDesign(4, () => ({ kind: "cornered", rotation: 0, fabrics: ["A", "B"] as FabricKey[], corners: [true, true, false, false] }));
  const r = calculateYardage(customBase(d));
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("CSC-2 B corner count", b.pieces[0].count, 512);
  check("CSC-2 B strips", b.strips[0].count, 25);
  check("CSC-2 B inches", b.totalInches, 50);
}

console.log("\n=== Custom block: Square on point ===");
{
  // unit=3. centreCut = 3/√2 + 0.5 ≈ 2.6213 → round2 = 2.62.
  //   A: 256 at 2.62. Per strip floor(42.5/2.62)=16. Strips=16. In=41.92.
  // cornerCut = 3/2 + 7/8 = 2.375 → round2 = 2.38 (rounds half up).
  //   B: 4 tris/unit → 1024 tris → 512 squares at 2.38.
  //   Per strip floor(42.5/2.38)=17. Strips=ceil(512/17)=31. In=73.78.
  const d = fullDesign(4, () => ({ kind: "onpoint", rotation: 0, fabrics: ["A", "B"] as FabricKey[] }));
  const r = calculateYardage(customBase(d));
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("SoP-C A centre count", a.pieces[0].count, 256);
  check("SoP-C A centre cut", a.pieces[0].w, 2.62);
  check("SoP-C A strips", a.strips[0].count, 16);
  check("SoP-C A inches", a.totalInches, 41.92);
  check("SoP-C B corner squares", b.pieces[0].count, 512);
  check("SoP-C B corner cut", b.pieces[0].w, 2.38);
  check("SoP-C B strips", b.strips[0].count, 31);
  check("SoP-C B inches", b.totalInches, 73.78);
}

console.log("\n=== Custom block: Long triangles (2-cell HRT), horizontal ===");
{
  // 8 anchors per block (rows 0-3, cols 0 & 2). 16 blocks → 128 units.
  // rectsEach = 64 per fabric at (2u+1)=7" × (u+1)=4".
  // Per strip floor(42.5/7)=6. Strips=ceil(64/6)=11. In = 11×4 = 44.
  const d = fullDesign(4, (r, c) =>
    c % 2 === 0 ? { kind: "hrt", rotation: 0, fabrics: ["A", "B"] as FabricKey[] } : null,
  );
  const r = calculateYardage(customBase(d));
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("HRT A rect count", a.pieces[0].count, 64);
  check("HRT A rect length", a.pieces[0].w, 7);
  check("HRT A rect height", a.pieces[0].h, 4);
  check("HRT A strips", a.strips[0].count, 11);
  check("HRT A inches", a.totalInches, 44);
  check("HRT B mirrors A", b.totalInches, 44);
}

console.log("\n=== Custom block: Long triangles, vertical orientation ===");
{
  // Same counts — rotation 90 stacks the pair vertically; cutting math is identical.
  const d = fullDesign(4, (r, c) =>
    r % 2 === 0 ? { kind: "hrt", rotation: 90 as const, fabrics: ["A", "B"] as FabricKey[] } : null,
  );
  const r = calculateYardage(customBase(d));
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("HRT-90 A rect count", a.pieces[0].count, 64);
  check("HRT-90 A inches", a.totalInches, 44);
}

console.log("\n=== Custom block: Split in half ===");
{
  // 16 halves of each fabric per block → 256 each at (u+0.5)=3.5" × (u/2+0.5)=2".
  // Per strip floor(42.5/3.5)=12. Strips=ceil(256/12)=22. In = 22×2 = 44.
  const d = fullDesign(4, () => ({ kind: "split", rotation: 0, fabrics: ["A", "B"] as FabricKey[] }));
  const r = calculateYardage(customBase(d));
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  check("Split A half count", a.pieces[0].count, 256);
  check("Split A length", a.pieces[0].w, 3.5);
  check("Split A height", a.pieces[0].h, 2);
  check("Split A strips", a.strips[0].count, 22);
  check("Split A inches", a.totalInches, 44);
  check("Split B mirrors A", b.totalInches, 44);
}

console.log("\n=== Custom block: whole-block rotation never changes the cutting list ===");
{
  // Mixed design using every unit type, then rotated 90/180/270. Rotation only
  // rearranges cells — every piece count must be byte-identical.
  const mixed = fullDesign(4, (r, c) => {
    if (r === 0 && c % 2 === 0) return { kind: "hrt", rotation: 0, fabrics: ["A", "B"] as FabricKey[] };
    if (r === 0) return null;
    if (r === 1) return { kind: "cornered", rotation: 0, fabrics: ["A", "C"] as FabricKey[], corners: [true, false, true, false] };
    if (r === 2) return { kind: "onpoint", rotation: 0, fabrics: ["D", "E"] as FabricKey[] };
    if (c % 2 === 0) return { kind: "split", rotation: 90 as const, fabrics: ["A", "D"] as FabricKey[] };
    return { kind: "qst", rotation: 0, fabrics: ["A", "B", "C", "D"] as FabricKey[] };
  });
  const flatten = (res: ReturnType<typeof calculateYardage>) =>
    res.fabrics
      .flatMap(f => f.pieces.map(p => `${f.fabric}|${p.label}|${p.count}|${p.w}|${p.h}`))
      .sort()
      .join("\n");
  const r0 = flatten(calculateYardage(customBase(mixed)));
  for (const by of [90, 180, 270] as const) {
    const rr = flatten(calculateYardage(customBase(rotateDesign(mixed, by))));
    check(`Rotation ${by}° keeps cutting list identical`, rr === r0 ? 1 : 0, 1);
  }
}

console.log("\n=== Custom block: alternate-blocks fabric swap splits counts exactly ===");
{
  // Snipped-corner design, swap A↔B on odd blocks. 16 blocks → 8 as drawn,
  // 8 swapped. Even 8: 128 A bases + 512 B corners. Odd 8: 128 B bases + 512 A corners.
  const d = fullDesign(4, () => ({ kind: "cornered", rotation: 0, fabrics: ["A", "B"] as FabricKey[] }));
  const s = { ...customBase(d), alternateBlocks: true, customSwapPair: ["A", "B"] as [FabricKey, FabricKey] };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const b = r.fabrics.find(f => f.fabric === "B")!;
  const bucket = (f: typeof a, re: RegExp) =>
    f.pieces.filter(p => re.test(p.label)).reduce((n, p) => n + p.count, 0);
  check("CSC(alt) A base count", bucket(a, /base squares/i), 128);
  check("CSC(alt) A corner count", bucket(a, /Corner squares/i), 512);
  check("CSC(alt) B base count", bucket(b, /base squares/i), 128);
  check("CSC(alt) B corner count", bucket(b, /Corner squares/i), 512);
  check("CSC(alt) base total unchanged", bucket(a, /base/i) + bucket(b, /base/i), 256);
  check("CSC(alt) corner total unchanged", bucket(a, /Corner/i) + bucket(b, /Corner/i), 1024);
}

console.log("\n=== Custom block: Block B checkerboard alternation ===");
{
  // Block A = all plain squares of A; Block B = all plain squares of C.
  // 16 blocks → 8 each. A: 8×16 = 128 squares at 3.5". C: 128 at 3.5".
  const dA = fullDesign(4, () => ({ kind: "square", rotation: 0, fabrics: ["A"] as FabricKey[] }));
  const dB = fullDesign(4, () => ({ kind: "square", rotation: 0, fabrics: ["C"] as FabricKey[] }));
  const s = { ...customBase(dA), customBlockB: dB, useBlockB: true };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const c = r.fabrics.find(f => f.fabric === "C")!;
  check("BlockB A square count", a.pieces[0].count, 128);
  check("BlockB C square count", c.pieces[0].count, 128);
  check("BlockB no fabric B", r.fabrics.find(f => f.fabric === "B") ? 1 : 0, 0);
}

console.log("\n=== Custom block: odd block count with swap (rounding safety) ===");
{
  // 36×36 quilt with 12" block → 9 blocks → 5 as drawn / 4 swapped.
  // HST design: 16 HST units/block. Even 5 blocks: 80 units A|B.
  // Odd 4 swapped: 64 units B|A (same pair). Total 144 units → 72 squares each.
  const d = fullDesign(4, () => ({ kind: "hst", rotation: 0, fabrics: ["A", "B"] as FabricKey[] }));
  const s = {
    ...customBase(d),
    quiltWidth: 36, quiltHeight: 36,
    alternateBlocks: true, customSwapPair: ["A", "B"] as [FabricKey, FabricKey],
  };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  check("HST(alt odd) A starting squares", a.pieces[0].count, 72);
  check("HST(alt odd) A cut", a.pieces[0].w, 3.88); // round2(3 + 0.875)
}

if (failures.length === 0) {
  console.log("✅ ALL MATH CHECKS PASSED");
} else {
  console.log(`❌ ${failures.length} FAILURES:`);
  failures.forEach(f => console.log("  " + f));
  process.exit(1);
}
