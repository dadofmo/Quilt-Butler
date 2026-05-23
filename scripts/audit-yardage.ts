/**
 * Holistic correctness audit for yardage math.
 * Tests calculator output against independent hand-calcs.
 */
import { calculateYardage, calculateMaterials } from "/dev-server/src/lib/yardage";
import type { PlannerState, FabricKey } from "/dev-server/src/lib/planner-store";

function base(): PlannerState {
  return {
    pattern: null,
    quiltWidth: 50, quiltHeight: 65, sizePreset: "throw",
    fabricWidth: 44, blockSize: 12, borderWidth: 0, sashingWidth: 0,
    assignments: {}, safetyBuffer: false,
    fabricNames: {}, fabricPhotos: {},
    patchworkFabricCount: 4, patchworkGrid: {},
    pricePerYard: "", itemPrices: {},
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

console.log("\n=== Plus Block: plus & bg share fabric A — 2 buckets, same cut ===");
{
  const s = {
    ...base(), pattern: "plus-block" as const, blockSize: 12, borderWidth: 0,
    assignments: { plus: "A" as FabricKey, bg: "A" as FabricKey },
  };
  // 9 squares × 20 blocks = 180 squares total. 2 buckets at 4.5". Strips = 12 + 9 = 21.
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  const totalPieces = a.pieces.reduce((acc, p) => acc + p.count, 0);
  check("PB shared A total pieces", totalPieces, 180);
  const totalStrips = a.strips.reduce((acc, sp) => acc + sp.count, 0);
  check("PB shared A total strips", totalStrips, 21);
  check("PB shared A inches", a.totalInches, 21 * 4.5);
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

// =========================================================================
// SUMMARY
// =========================================================================
console.log("\n=========================================");
if (failures.length === 0) {
  console.log("✅ ALL MATH CHECKS PASSED");
} else {
  console.log(`❌ ${failures.length} FAILURES:`);
  failures.forEach(f => console.log("  " + f));
  process.exit(1);
}
