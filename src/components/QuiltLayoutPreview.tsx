import { useEffect, useState } from "react";
import type { PatternId, SectionAssignments, FabricKey } from "@/lib/planner-store";
import { FABRIC_COLORS } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BearPawBlockSvg } from "./BearPawBlockSvg";
import { FabricPatternDefs } from "./FabricPatternDefs";
import { PatternDiagram, IdahoBeautyBlock, CheckerboardBlock, CabinInTheCottonBlock, FancyStripeBlock, MapleStarBlock, LoveInAMistBlock, FourXStarBlock, AntiqueTileBlock, EconomyBlock, CaliforniaQuiltBlock, ClownsChoiceBlock, CornerBeamBlock, FourQueensBlock, FourXsBlock, BrokenDishesBlock, RollingStoneBlock, SummerWindsBlock, SwingInTheCenterBlock, TippecanoeBlock, TulipLadyFingersBlock, WeathervaneBlock, WishingRingBlock, AlaskaHomesteadBlock } from "./PatternDiagram";

interface Props {
  pattern: PatternId;
  assignments: SectionAssignments;
  hasBorder: boolean;
  borderFabric: FabricKey;
  blocksAcross: number;
  blocksDown: number;
  quiltWidth: number;
  quiltHeight: number;
  borderWidth: number;
  /** Sashing width (in) between blocks. 0 = no sashing. */
  sashingWidth?: number;
  /** Sashing fabric (defaults to "C" if omitted). */
  sashingFabric?: FabricKey;
  /** Cornerstone fabric. When undefined, no cornerstone squares are drawn
   *  at sashing intersections (e.g. Nine Patch with optional sashing). */
  cornerstoneFabric?: FabricKey;
  photos?: Partial<Record<FabricKey, string>>;
  /** When true (only meaningful for patterns whose sections support A/B role
   *  swap — currently Shoofly via `supportsAlternate`), swap fabrics A ↔ B
   *  on every other block for a checkerboard alternation across the quilt. */
  alternateBlocks?: boolean;
}

export function QuiltLayoutPreview({
  pattern,
  assignments,
  hasBorder,
  borderFabric,
  blocksAcross,
  blocksDown,
  quiltWidth,
  quiltHeight,
  borderWidth,
  sashingWidth = 0,
  sashingFabric = "C",
  cornerstoneFabric,
  photos,
  alternateBlocks = false,
}: Props) {
  const blockCount = blocksAcross * blocksDown;
  const [fullOpen, setFullOpen] = useState(false);
  const fullMax = useViewportMax();

  const canvasProps: CanvasProps = {
    pattern,
    assignments,
    hasBorder,
    borderFabric,
    blocksAcross,
    blocksDown,
    quiltWidth,
    quiltHeight,
    borderWidth,
    sashingWidth,
    sashingFabric,
    cornerstoneFabric,
    photos,
    alternateBlocks,
  };

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="text-foreground text-xs font-semibold uppercase tracking-wide">
          1 block
        </div>
        {pattern === "rail-fence" ? (
          <div className="flex items-stretch gap-2">
            <div className="flex flex-col justify-around py-[5px] text-right">
              {(["rail1", "rail2", "rail3"] as const).map((id, idx) => {
                // Resolve through the pattern definition first so this stays
                // in lockstep with src/lib/patterns.ts (Rail Fence rails = A/B/C).
                const railDef = getPattern(pattern)?.sections.find((s) => s.id === id);
                const fab = (assignments[id] ?? railDef?.defaultFabric ?? (["A", "B", "C"] as const)[idx]) as FabricKey;
                const role = ["Top rail", "Middle rail", "Bottom rail"][idx];
                return (
                  <div key={id} className="flex items-center justify-end gap-1.5">
                    <span className="text-foreground text-[10px] font-medium leading-tight">
                      {role}
                    </span>
                    <span
                      className="border-border text-foreground inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold"
                      style={{ background: fabricFill(fab, photos) }}
                      aria-label={`Fabric ${fab}`}
                    >
                      {fab}
                    </span>
                  </div>
                );
              })}
            </div>
            <PatternDiagram
              pattern={pattern}
              assignments={assignments}
              hasBorder={false}
              size={220}
              photos={photos}
            />
          </div>
        ) : (
          <PatternDiagram
            pattern={pattern}
            assignments={assignments}
            hasBorder={false}
            size={220}
            photos={photos}
          />
        )}
      </div>

      <div className="flex flex-row items-center gap-1 sm:flex-col sm:gap-1 sm:pt-16">
        <span className="text-primary text-xl font-bold">×{blockCount}</span>
        <svg width="44" height="22" viewBox="0 0 44 22" className="text-muted-foreground hidden sm:block" aria-hidden>
          <line x1="2" y1="11" x2="38" y2="11" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <polyline points="32,5 40,11 32,17" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 22 22" className="text-muted-foreground sm:hidden" aria-hidden>
          <polyline points="6,4 14,11 6,18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-col items-center gap-1">
          <div className="text-foreground text-xs font-semibold uppercase tracking-wide">
            Your full quilt
          </div>
          <button
            type="button"
            onClick={() => setFullOpen(true)}
            className="text-primary no-print text-[11px] font-medium underline underline-offset-2 hover:opacity-80"
          >
            See quilt full screen
          </button>
        </div>
        <QuiltCanvas {...canvasProps} maxSize={220} />
        <p className="text-muted-foreground max-w-[220px] text-center text-[11px]">
          {blocksAcross} × {blocksDown} blocks
          {hasBorder && <> + border</>}
        </p>
      </div>

      <Dialog open={fullOpen} onOpenChange={setFullOpen}>
        <DialogContent className="max-w-[96vw] sm:max-w-[96vw] p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold uppercase tracking-wide">
              Your full quilt
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <QuiltCanvas {...canvasProps} maxSize={fullMax} />
          </div>
          <p className="text-muted-foreground text-center text-xs">
            {blocksAcross} × {blocksDown} blocks
            {hasBorder && <> + border</>}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Largest square box (px) that comfortably fits the current viewport. */
function useViewportMax() {
  const [max, setMax] = useState(320);
  useEffect(() => {
    const update = () =>
      setMax(
        Math.max(
          240,
          Math.floor(Math.min(window.innerWidth * 0.86, window.innerHeight * 0.72)),
        ),
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return max;
}

interface CanvasProps {
  pattern: PatternId;
  assignments: SectionAssignments;
  hasBorder: boolean;
  borderFabric: FabricKey;
  blocksAcross: number;
  blocksDown: number;
  quiltWidth: number;
  quiltHeight: number;
  borderWidth: number;
  sashingWidth: number;
  sashingFabric: FabricKey;
  cornerstoneFabric?: FabricKey;
  photos?: Partial<Record<FabricKey, string>>;
  alternateBlocks: boolean;
}

/**
 * Renders the finished quilt (border + tiled blocks + sashing) inside a box
 * whose longest side is `maxSize` px. All internal geometry is proportional
 * to `maxSize`, so the same code drives the small thumbnail and the
 * full-screen view.
 */
function QuiltCanvas({
  pattern,
  assignments,
  hasBorder,
  borderFabric,
  blocksAcross,
  blocksDown,
  quiltWidth,
  quiltHeight,
  borderWidth,
  sashingWidth,
  sashingFabric,
  cornerstoneFabric,
  photos,
  alternateBlocks,
  maxSize,
}: CanvasProps & { maxSize: number }) {
  const MAX = maxSize;
  const aspect = quiltWidth / quiltHeight;
  const thumbW = aspect >= 1 ? MAX : Math.round(MAX * aspect);
  const thumbH = aspect >= 1 ? Math.round(MAX / aspect) : MAX;

  const borderPxX = hasBorder ? (borderWidth / quiltWidth) * thumbW : 0;
  const borderPxY = hasBorder ? (borderWidth / quiltHeight) * thumbH : 0;
  const innerW = thumbW - borderPxX * 2;
  const innerH = thumbH - borderPxY * 2;
  const sashPxX = sashingWidth > 0 ? (sashingWidth / quiltWidth) * thumbW : 0;
  const sashPxY = sashingWidth > 0 ? (sashingWidth / quiltHeight) * thumbH : 0;
  const sashCols = Math.max(0, blocksAcross - 1);
  const sashRows = Math.max(0, blocksDown - 1);
  const cellW = (innerW - sashCols * sashPxX) / Math.max(1, blocksAcross);
  const cellH = (innerH - sashRows * sashPxY) / Math.max(1, blocksDown);

  const sashingFill = fabricFill(sashingFabric, photos);
  const cornerFill = cornerstoneFabric ? fabricFill(cornerstoneFabric, photos) : null;

  const borderPhoto = hasBorder ? photos?.[borderFabric] : undefined;
  const borderColor = hasBorder ? FABRIC_COLORS[borderFabric] : "transparent";

  return (
    <div
      className="rounded-md shadow-sm overflow-hidden"
      style={{
        width: thumbW,
        height: thumbH,
        background: borderColor,
        padding: `${borderPxY}px ${borderPxX}px`,
        ...(borderPhoto
          ? {
              backgroundImage: `url(${borderPhoto})`,
              // Tile the fabric photo at the SAME visual scale as inside
              // the blocks (FabricPatternDefs uses ~80 units per 200-unit
              // block = 40% of a block). Using "cover" stretched the whole
              // photo across the border rectangle, making prints look
              // gigantic. Repeat + fixed tile matches a real bolt.
              backgroundSize: `${Math.max(24, Math.round(cellW * 0.4))}px ${Math.max(24, Math.round(cellW * 0.4))}px`,
              backgroundRepeat: "repeat",
              backgroundPosition: "top left",
            }
          : {}),
      }}
    >
      <svg
        width={innerW}
        height={innerH}
        viewBox={`0 0 ${innerW} ${innerH}`}
        className="block"
        role="img"
        aria-label="QuiltButler quilt visualizer showing fabric color preview of finished quilt layout"
      >
        {/* No tileSize: each shape independently shows the fabric photo
            scaled to its bounds — the same way a quilter cuts each strip
            from the bolt. Every block looks identical and matches the
            "1 block" preview. */}
        <FabricPatternDefs photos={photos} />
        {/* Sashing background fills the inner rectangle so all gaps
            between blocks (and around the inside edge) show the sashing
            fabric color. The block tiles draw on top, leaving sashing
            visible only in the gaps. */}
        {sashingWidth > 0 && (
          <rect x={0} y={0} width={innerW} height={innerH} fill={sashingFill} />
        )}
        {Array.from({ length: blocksDown }).map((_, j) =>
          Array.from({ length: blocksAcross }).map((_, i) => {
            // Rail Fence: rotate every other block 90° for the woven look.
            // Jacob's Ladder: always rotate every other block 90° so the
            // ladder diagonals from neighboring blocks meet up to form the
            // classic on-point diamond secondary pattern — this is
            // intrinsic to the pattern, not user-toggleable.
            const railRotate = pattern === "rail-fence" && (i + j) % 2 === 1;
            const jlRotate =
              pattern === "jacobs-ladder" && (i + j) % 2 === 1;
            // Broken Dishes: alternate blocks get a quarter turn — this is
            // what joins the triangles of neighbouring blocks into the
            // on-point diamonds and four-pointed bursts. Intrinsic to the
            // pattern, not user-toggleable.
            const bdRotate =
              pattern === "broken-dishes" && (i + j) % 2 === 1;
            const rotate = railRotate || jlRotate || bdRotate;
            const bx = i * (cellW + sashPxX);
            const by = j * (cellH + sashPxY);
            // Irish Chain alternates a chain block with a plain background
            // block in a checkerboard — corner cell (0,0) is a chain block.
            const irishPlain = pattern === "irish-chain" && (i + j) % 2 === 1;
            // Snowball Block: fabrics A and B swap roles on every other
            // cell — this is what creates the diamond pattern at the seams.
            const snowballSwap = pattern === "snowball-block" && (i + j) % 2 === 1;
            // Shoofly (and any future pattern) supports an opt-in
            // "alternate blocks" toggle that swaps A ↔ B on every other
            // block for a checkerboard look. Driven by the alternateBlocks
            // prop set by Step 2.
            const shooflySwap = pattern === "shoofly" && alternateBlocks && (i + j) % 2 === 1;
            // Squares on Point: same opt-in swap — the diamond fabric and the
            // background corners trade places on every other block, in both
            // directions (rows and columns), for a checkerboard effect.
            const sopSwap =
              pattern === "squares-on-point" && alternateBlocks && (i + j) % 2 === 1;
            const swap = snowballSwap || shooflySwap || sopSwap;
            return (
              <svg
                key={`${i}-${j}`}
                x={bx}
                y={by}
                width={cellW}
                height={cellH}
                viewBox="0 0 200 200"
                preserveAspectRatio="none"
              >
                {rotate ? (
                  <g transform="rotate(90 100 100)">
                    <MiniBlock
                      pattern={pattern}
                      assignments={assignments}
                      photos={photos}
                    />
                  </g>
                ) : (
                  <MiniBlock
                    pattern={pattern}
                    assignments={assignments}
                    photos={photos}
                    irishPlain={irishPlain}
                    swap={swap}
                    row={j}
                    col={i}
                  />
                )}
              </svg>
            );
          }),
        )}
        {/* Cornerstone squares at interior sashing intersections only
            (no outer perimeter cornerstones). */}
        {sashingWidth > 0 && cornerFill &&
          Array.from({ length: sashCols }).map((_, ci) =>
            Array.from({ length: sashRows }).map((_, cj) => {
              const cx = (ci + 1) * cellW + ci * sashPxX;
              const cy = (cj + 1) * cellH + cj * sashPxY;
              return (
                <rect
                  key={`cs-${ci}-${cj}`}
                  x={cx}
                  y={cy}
                  width={sashPxX}
                  height={sashPxY}
                  fill={cornerFill}
                />
              );
            }),
          )}
        {/* No hairline grid: blocks butt up flush. Separation between
            blocks comes from sashing only (never a white stroke). */}
      </svg>
    </div>
  );
}


function MiniBlock({
  pattern,
  assignments,
  photos,
  irishPlain,
  swap,
  row = 0,
  col = 0,
}: {
  pattern: PatternId;
  assignments: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
  irishPlain?: boolean;
  /** Snowball Block: when true, swap which fabric is the main square vs. the
   *  corner accent. Shoofly: when true, swap Fabric A ↔ Fabric B for the
   *  alternate-blocks checkerboard. Used on alternating grid cells. */
  swap?: boolean;
  /** Grid position of this block within the quilt. Currently only used by
   *  "Cabin in the Cotton" to alternate the outer-ring fabric (D vs E). */
  row?: number;
  col?: number;
}) {
  // Fallback resolves through the pattern definition (single source of truth
  // in src/lib/patterns.ts) before the literal — so a section's defaultFabric
  // change propagates here automatically.
  const def = getPattern(pattern);
  const get = (k: string, fb: FabricKey) => {
    const sectionDefault = def?.sections.find((s) => s.id === k)?.defaultFabric;
    return fabricFill((assignments[k] ?? sectionDefault ?? fb) as FabricKey, photos);
  };

  switch (pattern) {
    case "simple-squares": {
      const c = get("squares", "A");
      return <rect width={200} height={200} fill={c} />;
    }
    case "nine-patch": {
      const center = get("center", "A");
      const outer = get("outer", "B");
      return (
        <>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={i * 66.67}
                y={j * 66.67}
                width={66.67}
                height={66.67}
                fill={(i + j) % 2 === 0 ? center : outer}
              />
            )),
          )}
        </>
      );
    }
    case "disappearing-nine-patch": {
      // Match PatternDiagram: render the FINISHED (rearranged) block —
      // 2×2 center of A, 4 small A corners, B background.
      const center = get("center", "A");
      const outer = get("outer", "B");
      const u = 200 / 6;
      return (
        <>
          <rect width={200} height={200} fill={outer} />
          <rect x={2 * u} y={2 * u} width={2 * u} height={2 * u} fill={center} />
          <rect x={0} y={0} width={u} height={u} fill={center} />
          <rect x={5 * u} y={0} width={u} height={u} fill={center} />
          <rect x={0} y={5 * u} width={u} height={u} fill={center} />
          <rect x={5 * u} y={5 * u} width={u} height={u} fill={center} />
        </>
      );
    }
    case "hst": {
      const t1 = get("tri1", "A");
      const t2 = get("tri2", "B");
      return (
        <>
          {[0, 1].flatMap((j) =>
            [0, 1].map((i) => {
              const x = i * 100;
              const y = j * 100;
              return (
                <g key={`${i}-${j}`}>
                  <polygon points={`${x},${y} ${x + 100},${y} ${x},${y + 100}`} fill={t1} />
                  <polygon points={`${x + 100},${y} ${x + 100},${y + 100} ${x},${y + 100}`} fill={t2} />
                </g>
              );
            }),
          )}
        </>
      );
    }
    case "rail-fence": {
      const r1 = get("rail1", "A");
      const r2 = get("rail2", "B");
      const r3 = get("rail3", "C");
      return (
        <>
          <rect width={200} height={66.67} fill={r1} />
          <rect y={66.67} width={200} height={66.67} fill={r2} />
          <rect y={133.33} width={200} height={66.67} fill={r3} />
        </>
      );
    }
    case "log-cabin": {
      // 8-unit grid (200/8 = 25). Center 2u×2u at (3,3); 12 logs spiral out.
      // Dark = top/right sides, Light = bottom/left — classic diagonal split.
      const center = get("center", "A");
      const light = get("light", "B");
      const dark = get("dark", "C");
      const u = 25;
      const lr = (x: number, y: number, w: number, h: number, fill: string, key: string) => (
        <rect key={key} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} />
      );
      return (
        <>
          {lr(5, 3, 1, 2, dark, "d1")}
          {lr(3, 2, 3, 1, dark, "d2")}
          {lr(6, 2, 1, 4, dark, "d5")}
          {lr(2, 1, 5, 1, dark, "d6")}
          {lr(7, 1, 1, 6, dark, "d9")}
          {lr(1, 0, 7, 1, dark, "d10")}
          {lr(2, 2, 1, 3, light, "l3")}
          {lr(2, 5, 4, 1, light, "l4")}
          {lr(1, 1, 1, 5, light, "l7")}
          {lr(1, 6, 6, 1, light, "l8")}
          {lr(0, 0, 1, 7, light, "l11")}
          {lr(0, 7, 8, 1, light, "l12")}
          <rect x={3 * u} y={3 * u} width={2 * u} height={2 * u} fill={center} />
        </>
      );
    }
    case "ohio-star": {
      const star = get("star", "A");
      const bg = get("bg", "B");
      const center = get("center", "D");
      // Same Ohio Star geometry as PatternDiagram — kept in sync so the
      // single-block view and the full-quilt preview show the same star.
      const u = 200 / 3;
      const qst = (gx: number, gy: number, axis: "v" | "h", key: string) => {
        const x = gx * u;
        const y = gy * u;
        const cx = x + u / 2;
        const cy = y + u / 2;
        const starTris =
          axis === "v"
            ? [
                `${x},${y} ${x + u},${y} ${cx},${cy}`,
                `${x},${y + u} ${x + u},${y + u} ${cx},${cy}`,
              ]
            : [
                `${x},${y} ${x},${y + u} ${cx},${cy}`,
                `${x + u},${y} ${x + u},${y + u} ${cx},${cy}`,
              ];
        return (
          <g key={key}>
            <rect x={x} y={y} width={u} height={u} fill={bg} />
            {starTris.map((p, i) => (
              <polygon key={`s${i}`} points={p} fill={star} />
            ))}
          </g>
        );
      };
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          {qst(1, 0, "v", "top")}
          {qst(2, 1, "h", "right")}
          {qst(1, 2, "v", "bottom")}
          {qst(0, 1, "h", "left")}
          <rect x={u} y={u} width={u} height={u} fill={center} />
        </>
      );
    }
    case "flying-geese": {
      const goose = get("goose", "A");
      const sky = get("sky", "B");
      // 2 geese per block, stacked vertically — matches PatternDiagram &
      // the No-Waste yardage math in yardage.ts.
      return (
        <>
          {[0, 100].map((y, i) => (
            <g key={i}>
              <rect x={0} y={y} width={200} height={100} fill={sky} />
              <polygon points={`100,${y} 200,${y + 100} 0,${y + 100}`} fill={goose} />
            </g>
          ))}
        </>
      );
    }
    case "squares-on-point": {
      const sqFab = get("square", "A");
      const bgFab = get("bg", "B");
      // Single on-point diamond per block, matching PatternDiagram & the
      // square-in-a-square yardage math. When swap is true (alternate blocks
      // toggle + odd cell) the diamond and background fabrics trade places.
      const sq = swap ? bgFab : sqFab;
      const bg = swap ? sqFab : bgFab;
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <polygon points="100,0 200,100 100,200 0,100" fill={sq} />
        </>
      );
    }
    case "plus-block": {
      const plusFab = get("plus", "A");
      const bgFab = get("bg", "B");
      // Alternate-blocks toggle: on odd cells the plus and background fabrics
      // trade places, so the quilt reads as positive/negative crosses.
      const plus = swap ? bgFab : plusFab;
      const bg = swap ? plusFab : bgFab;
      // 3×3 grid of equal squares — same geometry as PatternDiagram.
      const u = 200 / 3;
      const isPlus = (i: number, j: number) => i === 1 || j === 1;
      return (
        <>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={i * u}
                y={j * u}
                width={u}
                height={u}
                fill={isPlus(i, j) ? plus : bg}
              />
            )),
          )}
        </>
      );
    }
    case "churn-dash": {
      const center = get("center", "A");
      const corners = get("corners", "A");
      const bars = get("bars", "A");
      const bg = get("bg", "B");
      const u = 200 / 3;
      const cornerHst = (gx: number, gy: number, key: string) => {
        const x = gx * u;
        const y = gy * u;
        const outerX = gx === 0 ? x : x + u;
        const outerY = gy === 0 ? y : y + u;
        const innerX = gx === 0 ? x + u : x;
        const innerY = gy === 0 ? y + u : y;
        const edgeAX = outerX;
        const edgeAY = innerY;
        const edgeBX = innerX;
        const edgeBY = outerY;
        return (
          <g key={key}>
            <polygon
              points={`${outerX},${outerY} ${edgeAX},${edgeAY} ${edgeBX},${edgeBY}`}
              fill={corners}
            />
            <polygon
              points={`${innerX},${innerY} ${edgeAX},${edgeAY} ${edgeBX},${edgeBY}`}
              fill={bg}
            />
          </g>
        );
      };
      return (
        <>
          {cornerHst(0, 0, "tl")}
          {cornerHst(2, 0, "tr")}
          {cornerHst(0, 2, "bl")}
          {cornerHst(2, 2, "br")}
          <rect x={u} y={0} width={u} height={u / 2} fill={bars} />
          <rect x={u} y={u / 2} width={u} height={u / 2} fill={bg} />
          <rect x={u} y={2 * u + u / 2} width={u} height={u / 2} fill={bars} />
          <rect x={u} y={2 * u} width={u} height={u / 2} fill={bg} />
          <rect x={0} y={u} width={u / 2} height={u} fill={bars} />
          <rect x={u / 2} y={u} width={u / 2} height={u} fill={bg} />
          <rect x={2 * u + u / 2} y={u} width={u / 2} height={u} fill={bars} />
          <rect x={2 * u} y={u} width={u / 2} height={u} fill={bg} />
          <rect x={u} y={u} width={u} height={u} fill={center} />
        </>
      );
    }
    case "pinwheel": {
      const blades = get("blades", "A");
      const bg = get("bg", "B");
      // Traditional pinwheel — blade right angles rotate clockwise around the
      // block so all four blade hypotenuses meet at the center, creating the
      // spinning illusion. Kept in lockstep with PatternDiagram & the tile.
      return (
        <>
          {/* TL quadrant: blade right-angle at BL (0,100) */}
          <polygon points="0,0 0,100 100,100" fill={blades} />
          <polygon points="0,0 100,0 100,100" fill={bg} />
          {/* TR quadrant: blade right-angle at TL (100,0) */}
          <polygon points="100,0 200,0 100,100" fill={blades} />
          <polygon points="200,0 200,100 100,100" fill={bg} />
          {/* BR quadrant: blade right-angle at TR (200,100) */}
          <polygon points="100,100 200,100 200,200" fill={blades} />
          <polygon points="100,100 200,200 100,200" fill={bg} />
          {/* BL quadrant: blade right-angle at BR (100,200) */}
          <polygon points="100,100 100,200 0,200" fill={blades} />
          <polygon points="0,100 100,100 0,200" fill={bg} />
        </>
      );
    }
    case "bear-paw": {
      const pad = get("pad", "A");
      const claw = get("claws", "B");
      const bg = get("bg", "C");
      const centerAccent = get("center-accent", "D");
      return <BearPawBlockSvg pad={pad} claw={claw} bg={bg} centerAccent={centerAccent} />;
    }
    case "irish-chain": {
      const bg = get("background", "A");
      const chain = get("chain", "B");
      if (irishPlain) {
        return <rect width={200} height={200} fill={bg} />;
      }
      const u = 200 / 3;
      return (
        <>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={i * u}
                y={j * u}
                width={u}
                height={u}
                fill={(i + j) % 2 === 0 ? chain : bg}
              />
            )),
          )}
        </>
      );
    }
    case "sawtooth-star": {
      const star = get("star", "A");
      const centerFab = (assignments["center"] ?? assignments["star"] ?? "A") as FabricKey;
      const center = get("center", centerFab);
      const bg = get("bg", "B");
      const u = 200 / 4;
      const hsts: Array<[number, number, "TL" | "TR" | "BL" | "BR"]> = [
        [1, 0, "BL"], [2, 0, "BR"],
        [0, 1, "TR"], [3, 1, "TL"],
        [0, 2, "BR"], [3, 2, "BL"],
        [1, 3, "TL"], [2, 3, "TR"],
      ];
      const opp = { TL: "BR", BR: "TL", TR: "BL", BL: "TR" } as const;
      const tri = (col: number, row: number, c: "TL" | "TR" | "BL" | "BR") => {
        const x = col * u, y = row * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const map = { TL: `${TL} ${TR} ${BL}`, TR: `${TL} ${TR} ${BR}`, BL: `${TL} ${BL} ${BR}`, BR: `${TR} ${BL} ${BR}` };
        return map[c];
      };
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <rect x={u} y={u} width={2 * u} height={2 * u} fill={center} />
          {hsts.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={star} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </>
      );
    }
    case "friendship-star": {
      const center = get("center", "A");
      const points = get("points", "B");
      const bg = get("bg", "C");
      const u = 200 / 3;
      const hsts: Array<[number, number, "TL" | "TR" | "BL" | "BR"]> = [
        [1, 0, "BR"],
        [2, 1, "BL"],
        [1, 2, "TL"],
        [0, 1, "TR"],
      ];
      const opp = { TL: "BR", BR: "TL", TR: "BL", BL: "TR" } as const;
      const tri = (col: number, row: number, c: "TL" | "TR" | "BL" | "BR") => {
        const x = col * u, y = row * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const map = { TL: `${TL} ${TR} ${BL}`, TR: `${TL} ${TR} ${BR}`, BL: `${TL} ${BL} ${BR}`, BR: `${TR} ${BL} ${BR}` };
        return map[c];
      };
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <rect x={u} y={u} width={u} height={u} fill={center} />
          {hsts.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={points} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </>
      );
    }
    case "snowball-block": {
      // Single snowball block: octagon main square with 4 corner accent
      // triangles. `swap` (set on alternating grid cells) flips which fabric
      // is the main vs. accent — that's what creates the diamond pattern at
      // the seams. The visual corner fraction is fixed for the preview.
      const a = get("mainA", "A");
      const b = get("mainB", "B");
      const main = swap ? b : a;
      const accent = swap ? a : b;
      const c = 60; // visual corner accent (~30% of the 200-wide block)
      const pts = [
        `${c},0`,
        `${200 - c},0`,
        `${200},${c}`,
        `${200},${200 - c}`,
        `${200 - c},${200}`,
        `${c},${200}`,
        `${0},${200 - c}`,
        `${0},${c}`,
      ].join(" ");
      return (
        <>
          <rect width={200} height={200} fill={accent} />
          <polygon points={pts} fill={main} />
        </>
      );
    }
    case "four-patch": {
      const tl = get("topLeft", "A");
      const tr = get("topRight", "B");
      const bl = get("bottomLeft", "D");
      const br = get("bottomRight", "C");
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={tl} />
          <rect x={100} y={0} width={100} height={100} fill={tr} />
          <rect x={0} y={100} width={100} height={100} fill={bl} />
          <rect x={100} y={100} width={100} height={100} fill={br} />
        </>
      );
    }
    case "streak-of-lightning": {
      // Same exact peak/valley chevron geometry as PatternDiagram. Each block
      // repeats without rotation or mirroring; yardage and fabric assignments
      // stay unchanged.
      const stripe = get("stripe", "A");
      const bg = get("bg", "B");
      return (
        <>
          {/* Top-left quadrant */}
          <polygon points="0,0 100,0 0,100" fill={bg} />
          <polygon points="100,0 100,100 0,100" fill={stripe} />
          {/* Top-right quadrant */}
          <polygon points="100,0 200,0 200,100" fill={bg} />
          <polygon points="100,0 200,100 100,100" fill={stripe} />
          {/* Bottom-left quadrant */}
          <polygon points="0,100 100,100 0,200" fill={stripe} />
          <polygon points="100,100 100,200 0,200" fill={bg} />
          {/* Bottom-right quadrant */}
          <polygon points="100,100 200,100 200,200" fill={stripe} />
          <polygon points="100,100 100,200 200,200" fill={bg} />
        </>
      );
    }
    case "bow-tie": {
      // Same geometry as PatternDiagram, no rotation/mirroring between tiles
      // so the knot diamonds and A/B diagonals read consistently across the
      // whole quilt.
      const a = get("mainA", "A");
      const b = get("mainB", "B");
      const knot = get("knot", "D");
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={a} />
          <rect x={100} y={0} width={100} height={100} fill={b} />
          <rect x={0} y={100} width={100} height={100} fill={b} />
          <rect x={100} y={100} width={100} height={100} fill={a} />
          <polygon points="100,50 150,100 100,150 50,100" fill={knot} />
        </>
      );
    }
    case "shoofly": {
      // Shoofly full-quilt tile. Matches the single-block diagram exactly.
      // When swap is true (alternateBlocks + odd cell), Fabric A and B trade
      // roles for the checkerboard alternation.
      const bgFab = get("bg", "A");
      const accentFab = get("accent", "B");
      const bg = swap ? accentFab : bgFab;
      const accent = swap ? bgFab : accentFab;
      const u = 200 / 3;
      const corners: Array<[number, number, "TL" | "TR" | "BL" | "BR"]> = [
        [0, 0, "BR"],
        [2, 0, "BL"],
        [0, 2, "TR"],
        [2, 2, "TL"],
      ];
      const opp = { TL: "BR", BR: "TL", TR: "BL", BL: "TR" } as const;
      const tri = (col: number, row: number, c: "TL" | "TR" | "BL" | "BR") => {
        const x = col * u, y = row * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const map = { TL: `${TL} ${TR} ${BL}`, TR: `${TL} ${TR} ${BR}`, BL: `${TL} ${BL} ${BR}`, BR: `${TR} ${BL} ${BR}` };
        return map[c];
      };
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <rect x={u} y={u} width={u} height={u} fill={accent} />
          {corners.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={accent} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </>
      );
    }
    case "jacobs-ladder": {
      // Jacob's Ladder mini-block. Same geometry as PatternDiagram's
      // jacobs-ladder case (200-unit viewBox, 6×6 unit grid, 3×3 arrangement
      // of 2u sub-blocks: 5 four-patches + 4 HSTs). Rotation for alternate
      // blocks is applied at the outer <g transform="rotate(90 100 100)">
      // in the tile loop, so this component always draws the base
      // (un-rotated) orientation.
      const dark = get("dark", "A");
      const light = get("light", "B");
      const ladder = get("ladder", "D");
      const u = 200 / 6;
      const nodes: React.ReactNode[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = 2 * c * u, y = 2 * r * u;
          if ((r + c) % 2 === 0) {
            nodes.push(
              <g key={`fp-${r}-${c}`}>
                <rect x={x} y={y} width={u} height={u} fill={dark} />
                <rect x={x + u} y={y} width={u} height={u} fill={light} />
                <rect x={x} y={y + u} width={u} height={u} fill={light} />
                <rect x={x + u} y={y + u} width={u} height={u} fill={dark} />
              </g>,
            );
          } else {
            const TL = `${x},${y}`;
            const TR = `${x + 2 * u},${y}`;
            const BL = `${x},${y + 2 * u}`;
            const BR = `${x + 2 * u},${y + 2 * u}`;
            nodes.push(
              <g key={`hst-${r}-${c}`}>
                <polygon points={`${TL} ${TR} ${BR}`} fill={ladder} />
                <polygon points={`${TL} ${BL} ${BR}`} fill={light} />
              </g>,
            );
          }
        }
      }
      return <>{nodes}</>;
    }
    case "autumn-tints": {
      // 4×4 grid of 16 plain squares — no rotation between tiles. The block's
      // 180° rotational symmetry produces the diagonal secondary automatically
      // when tiled, so every block draws in the same base orientation.
      const dom = get("dominant", "A");
      const bg = get("background", "B");
      const acc1 = get("accent1", "C");
      const acc2 = get("accent2", "D");
      const u = 200 / 4;
      const layout: string[][] = [
        ["A", "A", "B", "D"],
        ["A", "A", "C", "B"],
        ["B", "C", "A", "A"],
        ["D", "B", "A", "A"],
      ];
      const fillMap: Record<string, string> = { A: dom, B: bg, C: acc1, D: acc2 };
      return (
        <>
          {layout.flatMap((row, r) =>
            row.map((k, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * u}
                y={r * u}
                width={u}
                height={u}
                fill={fillMap[k]}
              />
            )),
          )}
        </>
      );
    }
    case "card-trick": {
      // Full-quilt tile — matches the single-block diagram exactly. No
      // rotation between tiles so all four cards line up consistently.
      const A = get("cardA", "A");
      const B = get("cardB", "B");
      const D_ = get("cardD", "D");
      const Cf = get("cardC", "C");
      const bg = get("bg", "E");
      const fills: Record<string, string> = { A, B, C: Cf, D: D_, bg };
      const N = 200, U = N / 3;
      const cellPts = (r: number, c: number) => {
        const x = c * U, y = r * U;
        return {
          TL: `${x},${y}`, TR: `${x + U},${y}`, BL: `${x},${y + U}`,
          BR: `${x + U},${y + U}`, CC: `${x + U / 2},${y + U / 2}`,
        };
      };
      const cells: Array<{ r: number; c: number; tris: [string, string][] }> = [
        { r: 0, c: 0, tris: [["TL TR BL", "bg"], ["TR BR BL", "A"]] },
        { r: 0, c: 1, tris: [["TL TR CC", "bg"], ["TL BL CC", "A"], ["BL BR CC", "A"], ["TR BR CC", "B"]] },
        { r: 0, c: 2, tris: [["TL TR BR", "bg"], ["TL BR BL", "B"]] },
        { r: 1, c: 0, tris: [["TL BL CC", "bg"], ["TL TR CC", "A"], ["TR BR CC", "D"], ["BL BR CC", "D"]] },
        { r: 1, c: 1, tris: [["TL TR CC", "A"], ["TR BR CC", "B"], ["BL BR CC", "C"], ["TL BL CC", "D"]] },
        { r: 1, c: 2, tris: [["TR BR CC", "bg"], ["TL TR CC", "B"], ["TL BL CC", "B"], ["BL BR CC", "C"]] },
        { r: 2, c: 0, tris: [["TL BL BR", "bg"], ["TL TR BR", "D"]] },
        { r: 2, c: 1, tris: [["BL BR CC", "bg"], ["TL TR CC", "C"], ["TL BL CC", "D"], ["TR BR CC", "C"]] },
        { r: 2, c: 2, tris: [["BL BR TR", "bg"], ["TL TR BL", "C"]] },
      ];
      return (
        <>
          {cells.flatMap((cell) => {
            const p = cellPts(cell.r, cell.c);
            return cell.tris.map(([spec, k], i) => (
              <polygon
                key={`${cell.r}-${cell.c}-${i}`}
                points={spec.split(" ").map((v) => p[v as keyof typeof p]).join(" ")}
                fill={fills[k]}
              />
            ));
          })}
        </>
      );
    }
    case "oh-susannah": {
      // Full-quilt tile — matches the single-block diagram exactly. No
      // rotation so the diamond and cross line up consistently.
      const A = get("dominant", "A");
      const B = get("secondary", "B");
      const bg = get("bg", "C");
      const u = 200 / 4;
      const layout: (string | null)[][] = [
        ["C", "A", "B", "C"],
        ["B", null, null, "A"],
        ["A", null, null, "B"],
        ["C", "B", "A", "C"],
      ];
      const fillMap: Record<string, string> = { A, B, C: bg };
      const hstACorner: Record<string, "TL" | "TR" | "BL" | "BR"> = {
        "1,1": "TL", "1,2": "TR", "2,1": "BL", "2,2": "BR",
      };
      const triPts = (
        r: number, c: number,
        corner: "TL" | "TR" | "BL" | "BR",
        which: "A" | "C",
      ) => {
        const x = c * u, y = r * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const adj = { TL: [TR, BL], TR: [TL, BR], BL: [TL, BR], BR: [TR, BL] } as const;
        const opp = { TL: BR, TR: BL, BL: TR, BR: TL } as const;
        const cornerPt = { TL, TR, BL, BR }[corner];
        const [a1, a2] = adj[corner];
        return which === "A"
          ? `${cornerPt} ${a1} ${a2}`
          : `${opp[corner]} ${a1} ${a2}`;
      };
      return (
        <>
          {layout.flatMap((row, r) =>
            row.map((k, c) => {
              if (k !== null) {
                return (
                  <rect key={`p-${r}-${c}`} x={c * u} y={r * u} width={u} height={u} fill={fillMap[k]} />
                );
              }
              const corner = hstACorner[`${r},${c}`];
              return (
                <g key={`h-${r}-${c}`}>
                  <polygon points={triPts(r, c, corner, "A")} fill={A} />
                  <polygon points={triPts(r, c, corner, "C")} fill={bg} />
                </g>
              );
            }),
          )}
        </>
      );
    }
    case "twin-star": {
      // Full-quilt tile — matches the single-block diagram exactly. No
      // rotation between tiles so the star lines up consistently. Fabric C
      // (background) appears ONLY in corners + center, never inside an edge
      // unit; the third edge triangle is Fabric D.
      const A = get("star", "A");
      const B = get("point", "B");
      const D = get("point2", "D");
      const bg = get("bg", "C");
      const N = 200, U = N / 3;
      const CORNERS = ["TL", "TR", "BR", "BL"] as const;
      const rot = (pt: string, n: number) => {
        if (pt === "CC") return pt;
        const i = CORNERS.indexOf(pt as (typeof CORNERS)[number]);
        return CORNERS[(i + n) % 4];
      };
      const cellPts = (r: number, c: number) => {
        const x = c * U, y = r * U;
        return {
          TL: `${x},${y}`, TR: `${x + U},${y}`, BR: `${x + U},${y + U}`,
          BL: `${x},${y + U}`, CC: `${x + U / 2},${y + U / 2}`,
        } as Record<string, string>;
      };
      const edgeCells = [
        { r: 0, c: 1, n: 0 },
        { r: 1, c: 2, n: 1 },
        { r: 2, c: 1, n: 2 },
        { r: 1, c: 0, n: 3 },
      ];
      const plainCells: Array<[number, number]> = [
        [0, 0], [0, 2], [2, 0], [2, 2], [1, 1],
      ];
      const baseTris = [
        { pts: ["TL", "BL", "BR"], fill: A },
        { pts: ["TL", "TR", "CC"], fill: B },
        { pts: ["TR", "BR", "CC"], fill: D },
      ];
      return (
        <>
          {plainCells.map(([r, c]) => (
            <rect key={`p-${r}-${c}`} x={c * U} y={r * U} width={U} height={U} fill={bg} />
          ))}
          {edgeCells.flatMap(({ r, c, n }) => {
            const p = cellPts(r, c);
            return baseTris.map((t, i) => (
              <polygon
                key={`e-${r}-${c}-${i}`}
                points={t.pts.map((v) => p[rot(v, n)]).join(" ")}
                fill={t.fill}
              />
            ));
          })}
        </>
      );
    }
    case "star-and-cross": {
      // Full-quilt tile — matches the single-block diagram exactly. No
      // rotation between tiles so the cross runs cleanly through each block.
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const cross = get("cross", "C");
      const center = get("center", "D");
      const U = 40; // 200 / 5
      return (
        <>
          <rect x={0} y={0} width={2 * U} height={U} fill={bg} />
          <rect x={0} y={U} width={U} height={U} fill={bg} />
          <rect x={U} y={U} width={U} height={U} fill={acc} />
          <rect x={3 * U} y={0} width={2 * U} height={U} fill={bg} />
          <rect x={3 * U} y={U} width={U} height={U} fill={acc} />
          <rect x={4 * U} y={U} width={U} height={U} fill={bg} />
          <rect x={0} y={3 * U} width={U} height={U} fill={bg} />
          <rect x={U} y={3 * U} width={U} height={U} fill={acc} />
          <rect x={0} y={4 * U} width={2 * U} height={U} fill={bg} />
          <rect x={3 * U} y={3 * U} width={U} height={U} fill={acc} />
          <rect x={4 * U} y={3 * U} width={U} height={U} fill={bg} />
          <rect x={3 * U} y={4 * U} width={2 * U} height={U} fill={bg} />
          <rect x={2 * U} y={0} width={U} height={2 * U} fill={cross} />
          <rect x={2 * U} y={3 * U} width={U} height={2 * U} fill={cross} />
          <rect x={0} y={2 * U} width={2 * U} height={U} fill={cross} />
          <rect x={3 * U} y={2 * U} width={2 * U} height={U} fill={cross} />
          <rect x={2 * U} y={2 * U} width={U} height={U} fill={center} />
        </>
      );
    }
    case "idaho-beauty": {
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const solid = get("solid", "C");
      return <IdahoBeautyBlock size={200} bg={bg} acc={acc} solid={solid} />;
    }
    case "checkerboard": {
      const a = get("outerA", "A");
      const b = get("outerB", "B");
      const c = get("innerC", "C");
      const d = get("innerD", "D");
      return <CheckerboardBlock size={200} a={a} b={b} c={c} d={d} />;
    }
    case "cabin-in-the-cotton": {
      // Outer ring alternates between Fabric D and Fabric E based on the
      // block's position in the finished quilt — checkerboard by (row+col).
      const center = get("center", "A");
      const round1 = get("round1", "B");
      const round2 = get("center", "A");
      const even = (row + col) % 2 === 0;
      const round3 = even ? get("round3Even", "D") : get("round3Odd", "E");
      return <CabinInTheCottonBlock size={200} center={center} round1={round1} round2={round2} round3={round3} />;
    }
    case "fancy-stripe": {
      const a = get("fabA", "A");
      const b = get("fabB", "B");
      return <FancyStripeBlock size={200} a={a} b={b} />;
    }
    case "maple-star": {
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const points = get("points", "C");
      const center = get("center", "D");
      return <MapleStarBlock size={200} bg={bg} acc={acc} points={points} center={center} />;
    }
    case "love-in-a-mist": {
      const bg = get("bg", "A");
      const accent = get("accent", "B");
      const outer = get("outer", "C");
      return <LoveInAMistBlock size={200} bg={bg} accent={accent} outer={outer} />;
    }
    case "four-x-star": {
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const sq = get("squares", "C");
      const dark = get("dark", "D");
      return <FourXStarBlock size={200} bg={bg} acc={acc} sq={sq} dark={dark} />;
    }
    case "antique-tile": {
      const corner = get("corner", "A");
      const edge = get("edge", "B");
      const accent = get("accent", "C");
      const frame = get("frame", "D");
      const center = get("center", "E");
      return (
        <AntiqueTileBlock size={200} corner={corner} edge={edge} accent={accent} frame={frame} center={center} />
      );
    }
    case "economy-block": {
      const center = get("center", "A");
      const round1 = get("round1", "B");
      const round2 = get("round2", "C");
      return <EconomyBlock size={200} center={center} round1={round1} round2={round2} />;
    }
    case "california-quilt": {
      const bg = get("bg", "A");
      const geese = get("geese", "B");
      const accent = get("accent", "C");
      const center = get("center", "D");
      return <CaliforniaQuiltBlock size={200} bg={bg} geese={geese} accent={accent} center={center} />;
    }
    case "clowns-choice": {
      const accent = get("accent", "A");
      const bg = get("bg", "B");
      return <ClownsChoiceBlock size={200} accent={accent} bg={bg} />;
    }
    case "corner-beam": {
      const beam = get("beam", "A");
      const bg = get("bg", "B");
      return <CornerBeamBlock size={200} beam={beam} bg={bg} />;
    }
    case "four-queens": {
      const bg = get("bg", "A");
      const accent = get("accent", "B");
      const queen = get("queen", "C");
      return <FourQueensBlock size={200} bg={bg} accent={accent} queen={queen} />;
    }
    case "four-xs": {
      const x1 = get("x1", "A");
      const x2 = get("x2", "B");
      const x3 = get("x3", "C");
      const x4 = get("x4", "D");
      const bg = get("bg", "E");
      return <FourXsBlock size={200} bg={bg} x1={x1} x2={x2} x3={x3} x4={x4} />;
    }
    case "broken-dishes": {
      const accent1 = get("accent1", "A");
      const accent2 = get("accent2", "B");
      const bg = get("bg", "C");
      return <BrokenDishesBlock size={200} accent1={accent1} accent2={accent2} bg={bg} />;
    }
    case "rolling-stone": {
      const accent1 = get("accent1", "A");
      const accent2 = get("accent2", "B");
      const bg = get("bg", "C");
      return <RollingStoneBlock size={200} accent1={accent1} accent2={accent2} bg={bg} />;
    }
    case "summer-winds": {
      const bg = get("bg", "A");
      const accent = get("accent", "B");
      const dark = get("dark", "C");
      const geese = get("geese", "D");
      return <SummerWindsBlock size={200} bg={bg} accent={accent} dark={dark} geese={geese} />;
    }
    case "swing-in-the-center": {
      const bg = get("bg", "A");
      const dark = get("dark", "B");
      const geese = get("geese", "C");
      return <SwingInTheCenterBlock size={200} bg={bg} dark={dark} geese={geese} />;
    }
    case "tippecanoe-and-tyler-too": {
      const bg = get("bg", "A");
      const mid = get("mid", "B");
      const dark = get("dark", "C");
      const centre = get("centre", "D");
      return <TippecanoeBlock size={200} bg={bg} mid={mid} dark={dark} centre={centre} />;
    }
    case "tulip-lady-fingers": {
      const bg = get("bg", "A");
      const tulip = get("tulip", "B");
      const centre = get("centre", "C");
      return <TulipLadyFingersBlock size={200} bg={bg} tulip={tulip} centre={centre} />;
    }
    case "weathervane": {
      const bg = get("bg", "A");
      const star = get("star", "B");
      const vane = get("vane", "C");
      return <WeathervaneBlock size={200} bg={bg} star={star} vane={vane} />;
    }
    case "wishing-ring": {
      const dark = get("dark", "A");
      const light = get("light", "B");
      return <WishingRingBlock size={200} dark={dark} light={light} />;
    }
    case "alaska-homestead": {
      const bg = get("bg", "A");
      const points = get("points", "B");
      const accent = get("accent", "C");
      return <AlaskaHomesteadBlock size={200} bg={bg} points={points} accent={accent} />;
    }

  }
}



