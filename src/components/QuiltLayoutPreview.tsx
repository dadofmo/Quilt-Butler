import type { PatternId, SectionAssignments, FabricKey } from "@/lib/planner-store";
import { FABRIC_COLORS } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";
import { FabricPatternDefs } from "./FabricPatternDefs";
import { PatternDiagram } from "./PatternDiagram";

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
  photos?: Partial<Record<FabricKey, string>>;
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
  photos,
}: Props) {
  const blockCount = blocksAcross * blocksDown;

  const MAX = 220;
  const aspect = quiltWidth / quiltHeight;
  const thumbW = aspect >= 1 ? MAX : Math.round(MAX * aspect);
  const thumbH = aspect >= 1 ? Math.round(MAX / aspect) : MAX;

  const borderPxX = hasBorder ? (borderWidth / quiltWidth) * thumbW : 0;
  const borderPxY = hasBorder ? (borderWidth / quiltHeight) * thumbH : 0;
  const innerW = thumbW - borderPxX * 2;
  const innerH = thumbH - borderPxY * 2;
  const cellW = innerW / blocksAcross;
  const cellH = innerH / blocksDown;

  const borderPhoto = hasBorder ? photos?.[borderFabric] : undefined;
  const borderColor = hasBorder ? FABRIC_COLORS[borderFabric] : "transparent";

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
        <div className="text-foreground text-xs font-semibold uppercase tracking-wide">
          Your full quilt
        </div>
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
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {}),
          }}
        >
          <svg
            width={innerW}
            height={innerH}
            viewBox={`0 0 ${innerW} ${innerH}`}
            className="block"
          >
            {/* No tileSize: each shape independently shows the fabric photo
                scaled to its bounds — the same way a quilter cuts each strip
                from the bolt. Every block looks identical and matches the
                "1 block" preview. */}
            <FabricPatternDefs photos={photos} />
            {Array.from({ length: blocksDown }).map((_, j) =>
              Array.from({ length: blocksAcross }).map((_, i) => {
                // Rail Fence convention: rotate every other block 90° so the
                // rails alternate horizontal/vertical and form a woven fence.
                const rotate = pattern === "rail-fence" && (i + j) % 2 === 1;
                return (
                  <svg
                    key={`${i}-${j}`}
                    x={i * cellW}
                    y={j * cellH}
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
                      />
                    )}
                  </svg>
                );
              }),
            )}
            {Array.from({ length: blocksAcross + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * cellW}
                y1={0}
                x2={i * cellW}
                y2={innerH}
                stroke="white"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {Array.from({ length: blocksDown + 1 }).map((_, j) => (
              <line
                key={`h-${j}`}
                x1={0}
                y1={j * cellH}
                x2={innerW}
                y2={j * cellH}
                stroke="white"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
        </div>
        <p className="text-muted-foreground max-w-[220px] text-center text-[11px]">
          {blocksAcross} × {blocksDown} blocks
          {hasBorder && <> + border</>}
        </p>
      </div>
    </div>
  );
}

function MiniBlock({
  pattern,
  assignments,
  photos,
}: {
  pattern: PatternId;
  assignments: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
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
      const sq = get("square", "A");
      const bg = get("bg", "B");
      // Single on-point diamond per block, matching PatternDiagram & the
      // square-in-a-square yardage math.
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <polygon points="100,0 200,100 100,200 0,100" fill={sq} />
        </>
      );
    }
    case "plus-block": {
      const plus = get("plus", "A");
      const bg = get("bg", "B");
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <rect x={70} width={60} height={200} fill={plus} />
          <rect y={70} width={200} height={60} fill={plus} />
        </>
      );
    }
  }
}
