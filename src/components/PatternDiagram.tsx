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
      // Proper Ohio Star geometry: 3×3 grid where each edge unit is a QST
      // (quarter-square triangle). The star points are formed by the two
      // triangles that meet at the EDGE of the QST adjacent to the center
      // square — together with the points from the other 3 edge units they
      // form the 8-pointed star. Corner units & center unit are plain.
      const u = 200 / 3; // unit size
      // QST at grid (gx, gy) — `axis` controls which diagonal the star
      // triangles sit on. For Ohio Star, every edge QST has its star points
      // pointing INWARD toward the block center, so:
      //   top edge (1,0):    star points down  → vertical bowtie
      //   right edge (2,1):  star points left  → horizontal bowtie
      //   bottom edge (1,2): star points up    → vertical bowtie
      //   left edge (0,1):   star points right → horizontal bowtie
      const qst = (gx: number, gy: number, axis: "v" | "h", key: string) => {
        const x = gx * u;
        const y = gy * u;
        const cx = x + u / 2;
        const cy = y + u / 2;
        // Two star triangles forming a bowtie along `axis`, two bg triangles
        // along the other axis.
        const starTris =
          axis === "v"
            ? [
                `${x},${y} ${x + u},${y} ${cx},${cy}`,        // top star tri
                `${x},${y + u} ${x + u},${y + u} ${cx},${cy}`, // bottom star tri
              ]
            : [
                `${x},${y} ${x},${y + u} ${cx},${cy}`,         // left star tri
                `${x + u},${y} ${x + u},${y + u} ${cx},${cy}`, // right star tri
              ];
        const bgTris =
          axis === "v"
            ? [
                `${x},${y} ${x},${y + u} ${cx},${cy}`,
                `${x + u},${y} ${x + u},${y + u} ${cx},${cy}`,
              ]
            : [
                `${x},${y} ${x + u},${y} ${cx},${cy}`,
                `${x},${y + u} ${x + u},${y + u} ${cx},${cy}`,
              ];
        return (
          <g key={key}>
            <rect x={x} y={y} width={u} height={u} fill={bg} />
            {bgTris.map((p, i) => (
              <polygon key={`b${i}`} points={p} fill={bg} />
            ))}
            {starTris.map((p, i) => (
              <polygon key={`s${i}`} points={p} fill={star} />
            ))}
          </g>
        );
      };
      return (
        <>
          {/* Background base */}
          <rect width={200} height={200} fill={bg} />
          {/* 4 plain background corner units (already covered by base, but
              drawn explicitly so the per-unit grid lines below land cleanly) */}
          <rect x={0} y={0} width={u} height={u} fill={bg} />
          <rect x={2 * u} y={0} width={u} height={u} fill={bg} />
          <rect x={0} y={2 * u} width={u} height={u} fill={bg} />
          <rect x={2 * u} y={2 * u} width={u} height={u} fill={bg} />
          {/* 4 QST edge units — star points pointing INWARD */}
          {qst(1, 0, "v", "top")}
          {qst(2, 1, "h", "right")}
          {qst(1, 2, "v", "bottom")}
          {qst(0, 1, "h", "left")}
          {/* Center square */}
          <rect x={u} y={u} width={u} height={u} fill={center} />
          {/* Subtle 3×3 unit grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.6}>
            <line x1={u} y1={0} x2={u} y2={200} />
            <line x1={2 * u} y1={0} x2={2 * u} y2={200} />
            <line x1={0} y1={u} x2={200} y2={u} />
            <line x1={0} y1={2 * u} x2={200} y2={2 * u} />
          </g>
        </>
      );
    }
    case "flying-geese": {
      const goose = get("goose", "A");
      const sky = get("sky", "B");
      // Block = 2 geese stacked vertically. Each goose is W×H = 200×100 in
      // diagram units (the classic 2:1 ratio). Goose triangle apex points UP,
      // base sits on the bottom of its lane; sky fills the two corner
      // triangles on either side of the apex.
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
    case "disappearing-nine-patch": {
      // Show the FINISHED (rearranged) block, not the original 9-patch.
      // After slicing the 9-patch in half H+V and rotating each quarter 180°:
      //   - the 4 original CORNER squares (Fabric A) meet at the new CENTER,
      //     forming a 2×2 block of A in the middle (the "chain"),
      //   - the original CENTER square (also A) splits into 4 quarter-pieces
      //     that land at the 4 outer CORNERS of the new block,
      //   - the 4 original ALTERNATING squares (Fabric B) split into halves
      //     that wrap around the edges as the background.
      // Drawn on a 6×6 grid (units of half-a-patch). u = 200/6.
      const center = get("center", "A"); // Fabric A — corners + center of original 9-patch
      const outer = get("outer", "B");   // Fabric B — the alternating squares
      const u = 200 / 6;
      return (
        <>
          {/* Background fill = Fabric B (covers everything not painted with A) */}
          <rect width={200} height={200} fill={outer} />
          {/* Center 2×2 block of A (4 original corner squares meeting) */}
          <rect x={2 * u} y={2 * u} width={2 * u} height={2 * u} fill={center} />
          {/* 4 small A squares at the new outer corners (original center, quartered) */}
          <rect x={0} y={0} width={u} height={u} fill={center} />
          <rect x={5 * u} y={0} width={u} height={u} fill={center} />
          <rect x={0} y={5 * u} width={u} height={u} fill={center} />
          <rect x={5 * u} y={5 * u} width={u} height={u} fill={center} />
          {/* Subtle grid lines marking the slice points (original 9-patch cuts) */}
          <g stroke="white" strokeWidth={1.5} opacity={0.7}>
            <line x1={3 * u} y1={0} x2={3 * u} y2={200} />
            <line x1={0} y1={3 * u} x2={200} y2={3 * u} />
          </g>
        </>
      );
    }
    case "squares-on-point": {
      const sq = get("square", "A");
      const bg = get("bg", "B");
      // Square-in-a-square: 1 on-point square (diamond) per block whose
      // points touch the midpoints of each block edge. The 4 corner
      // triangles are the background. Matches the yardage math
      // (centerSide = blockSize / √2).
      return (
        <>
          <rect width={200} height={200} fill={bg} />
          <polygon points="100,0 200,100 100,200 0,100" fill={sq} />
          {/* Subtle guide lines along the diamond edges so beginners can see
              the corner triangles as separate pieces. */}
          <g stroke="white" strokeWidth={1.5} opacity={0.6} fill="none">
            <polygon points="100,0 200,100 100,200 0,100" />
          </g>
        </>
      );
    }
    case "plus-block": {
      const plus = get("plus", "A");
      const bg = get("bg", "B");
      // 3×3 grid of equal squares — center column + center row form the "+"
      // (5 plus squares), 4 corners are background. Matches the yardage math.
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
          {/* Subtle 3×3 grid lines so beginners can see each square as a
              separate cut piece. */}
          <g stroke="white" strokeWidth={1} opacity={0.6}>
            <line x1={u} y1={0} x2={u} y2={200} />
            <line x1={2 * u} y1={0} x2={2 * u} y2={200} />
            <line x1={0} y1={u} x2={200} y2={u} />
            <line x1={0} y1={2 * u} x2={200} y2={2 * u} />
          </g>
        </>
      );
    }
  }
}
