import type { FabricKey, PatternId, SectionAssignments } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";
import { FabricPatternDefs } from "./FabricPatternDefs";

interface Props {
  pattern: PatternId;
  assignments: SectionAssignments;
  hasBorder: boolean;
  size?: number;
  photos?: Partial<Record<FabricKey, string>>;
}

/**
 * Resolve the fabric for a section. Falls back to the pattern definition's
 * defaultFabric (single source of truth in src/lib/patterns.ts) instead of
 * a hardcoded literal — this prevents the diagram from drifting away from
 * what the calculator and the rest of the UI use.
 */
function fillFor(
  pattern: PatternId,
  assignments: SectionAssignments,
  key: string,
  hardcodedFallback: FabricKey,
  photos?: Partial<Record<FabricKey, string>>,
) {
  const def = getPattern(pattern);
  const sectionDefault = def?.sections.find((s) => s.id === key)?.defaultFabric;
  const f = (assignments[key] ?? sectionDefault ?? hardcodedFallback) as FabricKey;
  return fabricFill(f, photos);
}

export function PatternDiagram({ pattern, assignments, hasBorder, size = 280, photos }: Props) {
  const def = getPattern(pattern);
  const borderDefault = (def?.sections.find((s) => s.id === "border")?.defaultFabric ?? "C") as FabricKey;
  const borderKey = (assignments["border"] ?? borderDefault) as FabricKey;
  const borderHasPhoto = hasBorder && !!photos?.[borderKey];
  const borderColor = hasBorder
    ? borderHasPhoto
      ? "transparent"
      : fabricFill(borderKey, photos)
    : "transparent";

  return (
    <div
      className="relative inline-block rounded-lg p-5 overflow-hidden"
      style={{
        background: borderColor,
        width: size,
        height: size,
        ...(borderHasPhoto
          ? {
              backgroundImage: `url(${photos![borderKey]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}),
      }}
    >
      <div className="bg-card flex h-full w-full items-center justify-center rounded">
        <svg width={size - 40} height={size - 40} viewBox="0 0 200 200">
          {/* No tileSize: each shape gets its OWN copy of the fabric photo
              scaled to fit its bounds (objectBoundingBox). This mirrors how
              a quilter cuts each strip independently from the bolt — every
              log shows the fabric, and the same strip looks identical in
              every block of the full quilt. */}
          <FabricPatternDefs photos={photos} />
          {renderInner(pattern, assignments, photos)}
        </svg>
      </div>
    </div>
  );
}

function renderInner(
  pattern: PatternId,
  a: SectionAssignments,
  photos?: Partial<Record<FabricKey, string>>,
) {
  const get = (k: string, fb: FabricKey) => fillFor(pattern, a, k, fb, photos);
  switch (pattern) {
    case "simple-squares": {
      const c = get("squares", "A");
      return <rect x={0} y={0} width={200} height={200} fill={c} />;
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
                x={i * 66 + 2}
                y={j * 66 + 2}
                width={62}
                height={62}
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
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={i * 50} y={0} width={50} height={66} fill={r1} />
              <rect x={i * 50} y={66} width={50} height={66} fill={r2} />
              <rect x={i * 50} y={132} width={50} height={68} fill={r3} />
            </g>
          ))}
        </>
      );
    }
    case "log-cabin": {
      // 8-unit grid (200/8 = 25 per unit). Center is 2u×2u at (3,3); 12 logs
      // spiral out in equal-length pairs (one dark, one light) around it.
      // See yardage.ts log-cabin branch for the matching cut math.
      const center = get("center", "A");
      const light = get("light", "B");
      const dark = get("dark", "C");
      const u = 25;
      const lr = (x: number, y: number, w: number, h: number, fill: string, key: string) => (
        <rect key={key} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} stroke="white" strokeWidth={1.5} />
      );
      return (
        <>
          {/* Dark logs (right & top sides) — logs 1, 2, 5, 6, 9, 10 */}
          {lr(5, 3, 1, 2, dark, "d1")}
          {lr(3, 2, 3, 1, dark, "d2")}
          {lr(6, 2, 1, 4, dark, "d5")}
          {lr(2, 1, 5, 1, dark, "d6")}
          {lr(7, 1, 1, 6, dark, "d9")}
          {lr(1, 0, 7, 1, dark, "d10")}
          {/* Light logs (left & bottom sides) — logs 3, 4, 7, 8, 11, 12 */}
          {lr(2, 2, 1, 3, light, "l3")}
          {lr(2, 5, 4, 1, light, "l4")}
          {lr(1, 1, 1, 5, light, "l7")}
          {lr(1, 6, 6, 1, light, "l8")}
          {lr(0, 0, 1, 7, light, "l11")}
          {lr(0, 7, 8, 1, light, "l12")}
          {/* Center hearth */}
          <rect x={3 * u} y={3 * u} width={2 * u} height={2 * u} fill={center} stroke="white" strokeWidth={1.5} />
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
    case "disappearing-nine-patch": {
      const center = get("center", "A");
      const outer = get("outer", "B");
      return (
        <>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={i * 66 + 2}
                y={j * 66 + 2}
                width={62}
                height={62}
                fill={(i + j) % 2 === 0 ? center : outer}
              />
            )),
          )}
          <line x1={100} y1={0} x2={100} y2={200} stroke="white" strokeWidth={3} />
          <line x1={0} y1={100} x2={200} y2={100} stroke="white" strokeWidth={3} />
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
          <rect x={70} y={0} width={60} height={200} fill={plus} />
          <rect x={0} y={70} width={200} height={60} fill={plus} />
        </>
      );
    }
  }
}
