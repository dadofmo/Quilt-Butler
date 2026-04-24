import type { PatternId, SectionAssignments, FabricKey } from "@/lib/planner-store";
import { FABRIC_COLORS } from "@/lib/planner-store";
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
}

/**
 * Renders side-by-side: a single block (the one being designed)
 * and a small thumbnail of the entire quilt showing that block
 * tiled blocksAcross × blocksDown, with the border drawn around it.
 *
 * Helps beginners understand: "I'm coloring 1 block, but it repeats
 * to make the whole quilt."
 */
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
}: Props) {
  const blockCount = blocksAcross * blocksDown;

  // Mini quilt sizing
  const MAX = 140; // max thumbnail dimension in px
  const aspect = quiltWidth / quiltHeight;
  const thumbW = aspect >= 1 ? MAX : Math.round(MAX * aspect);
  const thumbH = aspect >= 1 ? Math.round(MAX / aspect) : MAX;

  // Inside the thumbnail, scale border thickness to match real quilt proportions
  const borderPxX = hasBorder ? (borderWidth / quiltWidth) * thumbW : 0;
  const borderPxY = hasBorder ? (borderWidth / quiltHeight) * thumbH : 0;
  const innerW = thumbW - borderPxX * 2;
  const innerH = thumbH - borderPxY * 2;
  const cellW = innerW / blocksAcross;
  const cellH = innerH / blocksDown;

  const borderColor = hasBorder ? FABRIC_COLORS[borderFabric] : "transparent";

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
      {/* Single block — what they're designing */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-foreground text-xs font-semibold uppercase tracking-wide">
          1 block
        </div>
        <PatternDiagram
          pattern={pattern}
          assignments={assignments}
          hasBorder={false}
          size={220}
        />
        <p className="text-muted-foreground max-w-[220px] text-center text-[11px]">
          What you're designing now
        </p>
      </div>

      {/* Arrow + multiplier */}
      <div className="flex flex-row items-center gap-1 sm:flex-col sm:gap-1 sm:pt-16">
        <span className="text-primary text-xl font-bold">×{blockCount}</span>
        <svg
          width="44"
          height="22"
          viewBox="0 0 44 22"
          className="text-muted-foreground hidden sm:block"
          aria-hidden
        >
          <line x1="2" y1="11" x2="38" y2="11" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <polyline points="32,5 40,11 32,17" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          className="text-muted-foreground sm:hidden"
          aria-hidden
        >
          <polyline points="6,4 14,11 6,18" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Whole quilt thumbnail */}
      <div className="flex flex-col items-center gap-2">
        <div className="text-foreground text-xs font-semibold uppercase tracking-wide">
          Your full quilt
        </div>
        <div
          className="rounded-md shadow-sm"
          style={{
            width: thumbW,
            height: thumbH,
            background: borderColor,
            padding: `${borderPxY}px ${borderPxX}px`,
          }}
        >
          <svg
            width={innerW}
            height={innerH}
            viewBox={`0 0 ${innerW} ${innerH}`}
            className="block"
          >
            {Array.from({ length: blocksDown }).map((_, j) =>
              Array.from({ length: blocksAcross }).map((_, i) => (
                <svg
                  key={`${i}-${j}`}
                  x={i * cellW}
                  y={j * cellH}
                  width={cellW}
                  height={cellH}
                  viewBox="0 0 200 200"
                  preserveAspectRatio="none"
                >
                  <MiniBlock
                    pattern={pattern}
                    assignments={assignments}
                  />
                </svg>
              )),
            )}
            {/* Block boundary grid drawn in parent coords so strokes
                stay crisp and uniform regardless of cell aspect ratio.
                This is what visually separates one block from the next. */}
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
        <p className="text-muted-foreground max-w-[160px] text-center text-[11px]">
          {blocksAcross} × {blocksDown} blocks
          {hasBorder && <> + border</>}
        </p>
      </div>
    </div>
  );
}

/**
 * A pattern block rendered without its own border, scaled into 200×200
 * viewBox so the parent SVG can place it via nested <svg> at any size.
 */
function MiniBlock({
  pattern,
  assignments,
}: {
  pattern: PatternId;
  assignments: SectionAssignments;
}) {
  const get = (k: string, fb: FabricKey) =>
    FABRIC_COLORS[(assignments[k] ?? fb) as FabricKey];

  switch (pattern) {
    case "simple-squares": {
      // Block = a single square. Mini block fills its cell so the white
      // grid lines drawn by the parent show the block boundaries.
      const c = get("squares", "A");
      return <rect width={200} height={200} fill={c} />;
    }
    case "nine-patch":
    case "disappearing-nine-patch": {
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
      const r3 = get("rail3", "D");
      return (
        <>
          <rect width={200} height={66.67} fill={r1} />
          <rect y={66.67} width={200} height={66.67} fill={r2} />
          <rect y={133.33} width={200} height={66.67} fill={r3} />
        </>
      );
    }
    case "log-cabin": {
      const center = get("center", "D");
      const light = get("light", "B");
      const dark = get("dark", "A");
      return (
        <>
          <rect width={200} height={200} fill={light} />
          <rect x={30} y={30} width={140} height={140} fill={dark} />
          <rect x={70} y={70} width={60} height={60} fill={center} />
        </>
      );
    }
    case "ohio-star": {
      const star = get("star", "A");
      const bg = get("bg", "B");
      const center = get("center", "D");
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <polygon points="100,10 140,70 60,70" fill={star} />
          <polygon points="190,100 130,140 130,60" fill={star} />
          <polygon points="100,190 60,130 140,130" fill={star} />
          <polygon points="10,100 70,60 70,140" fill={star} />
          <rect x={70} y={70} width={60} height={60} fill={center} />
        </>
      );
    }
    case "flying-geese": {
      const goose = get("goose", "A");
      const sky = get("sky", "B");
      return (
        <>
          {[0, 50, 100, 150].map((y, i) => (
            <g key={i}>
              <rect x={0} y={y} width={200} height={50} fill={sky} />
              <polygon points={`100,${y + 5} 195,${y + 47} 5,${y + 47}`} fill={goose} />
            </g>
          ))}
        </>
      );
    }
    case "squares-on-point": {
      const sq = get("square", "A");
      const bg = get("bg", "B");
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          {[50, 150].flatMap((cy) =>
            [50, 150].map((cx) => (
              <polygon
                key={`${cx}-${cy}`}
                points={`${cx},${cy - 32} ${cx + 32},${cy} ${cx},${cy + 32} ${cx - 32},${cy}`}
                fill={sq}
              />
            )),
          )}
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
