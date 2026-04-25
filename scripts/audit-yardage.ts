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
    fabricWidth: 44, blockSize: 12, borderWidth: 0,
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
console.log("\n=== Nine Patch: 50×65, 12\" block, no border ===");
{
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12 };
  // 4×5=20 blocks. Patch=12/3=4. Cut=4.5. Per strip floor(42.5/4.5)=9.
  // A: 5*20=100 squares. Strips=ceil(100/9)=12. Inches=12*4.5=54.
  // B: 4*20=80 squares. Strips=ceil(80/9)=9. Inches=9*4.5=40.5.
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
// BORDER MATH
// =========================================================================
console.log("\n=== Border: 60×80 inner, 4\" border, 9P pattern ===");
{
  const s = {
    ...base(), pattern: "nine-patch" as const,
    quiltWidth: 68, quiltHeight: 88, borderWidth: 4, blockSize: 10,
    assignments: { center: "A" as FabricKey, outer: "B" as FabricKey, border: "C" as FabricKey },
  };
  // Inner=60×80, blocks=6×8=48.
  // Border: sides=2*80=160, topBot=2*(60+8)=136, total=296. Strips=ceil(296/42.5)=7. Cut=4.5. Inches=7*4.5=31.5.
  const r = calculateYardage(s);
  const c = r.fabrics.find(f => f.fabric === "C")!;
  const borderLine = c.pieces.find(p => p.label === "Border strips")!;
  check("Border strip count", borderLine.count, 7);
  check("Border cut height", borderLine.h, 4.5);
  check("Border total inches", c.totalInches, 31.5);
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
  const s = { ...base(), pattern: "nine-patch" as const, blockSize: 12, safetyBuffer: true };
  const r = calculateYardage(s);
  const a = r.fabrics.find(f => f.fabric === "A")!;
  // Base inches=54. With buffer: 54*1.1=59.4, /36=1.65, ceilQuarter=1.75
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
