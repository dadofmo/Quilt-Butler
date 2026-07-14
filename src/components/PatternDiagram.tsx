import type { FabricKey, PatternId, SectionAssignments } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";
import { BearPawBlockSvg } from "./BearPawBlockSvg";
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
    case "pinwheel": {
      const blades = get("blades", "A");
      const bg = get("bg", "B");
      // Traditional pinwheel: 2×2 HST grid where each blade triangle's right
      // angle sits at a DIFFERENT corner of its quadrant, rotating clockwise
      // around the block. All 4 blade hypotenuses meet at the center point —
      // that's what creates the iconic spinning illusion. Going clockwise
      // from TL: blade right-angle at BL → TL → TR → BR of each quadrant.
      return (
        <>
          {/* TL quadrant (0,0)-(100,100): blade right-angle at BL (0,100) */}
          <polygon points="0,0 0,100 100,100" fill={blades} />
          <polygon points="0,0 100,0 100,100" fill={bg} />
          {/* TR quadrant (100,0)-(200,100): blade right-angle at TL (100,0) */}
          <polygon points="100,0 200,0 100,100" fill={blades} />
          <polygon points="200,0 200,100 100,100" fill={bg} />
          {/* BR quadrant (100,100)-(200,200): blade right-angle at TR (200,100) */}
          <polygon points="100,100 200,100 200,200" fill={blades} />
          <polygon points="100,100 200,200 100,200" fill={bg} />
          {/* BL quadrant (0,100)-(100,200): blade right-angle at BR (100,200) */}
          <polygon points="100,100 100,200 0,200" fill={blades} />
          <polygon points="0,100 100,100 0,200" fill={bg} />
        </>
      );
    }
    case "churn-dash": {
      const center = get("center", "A");
      const corners = get("corners", "A");
      const bars = get("bars", "A");
      const bg = get("bg", "B");
      const u = 200 / 3;
      // Corner HSTs: diagonal from outer corner to inner corner, dark on outer.
      // Side bars: rectangle split into dark+light halves with dark on outside.
      const cornerHst = (gx: number, gy: number, key: string) => {
        const x = gx * u;
        const y = gy * u;
        // Outer corner of this cell (away from block center)
        const outerX = gx === 0 ? x : x + u;
        const outerY = gy === 0 ? y : y + u;
        const innerX = gx === 0 ? x + u : x;
        const innerY = gy === 0 ? y + u : y;
        // Two adjacent edge corners along the diagonal axis
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
          {/* Top bar (1,0): dark top half */}
          <rect x={u} y={0} width={u} height={u / 2} fill={bars} />
          <rect x={u} y={u / 2} width={u} height={u / 2} fill={bg} />
          {/* Bottom bar (1,2): dark bottom half */}
          <rect x={u} y={2 * u + u / 2} width={u} height={u / 2} fill={bars} />
          <rect x={u} y={2 * u} width={u} height={u / 2} fill={bg} />
          {/* Left bar (0,1): dark left half */}
          <rect x={0} y={u} width={u / 2} height={u} fill={bars} />
          <rect x={u / 2} y={u} width={u / 2} height={u} fill={bg} />
          {/* Right bar (2,1): dark right half */}
          <rect x={2 * u + u / 2} y={u} width={u / 2} height={u} fill={bars} />
          <rect x={2 * u} y={u} width={u / 2} height={u} fill={bg} />
          {/* Center */}
          <rect x={u} y={u} width={u} height={u} fill={center} />
          {/* Subtle 3×3 grid lines */}
          <g stroke="white" strokeWidth={1} opacity={0.6}>
            <line x1={u} y1={0} x2={u} y2={200} />
            <line x1={2 * u} y1={0} x2={2 * u} y2={200} />
            <line x1={0} y1={u} x2={200} y2={u} />
            <line x1={0} y1={2 * u} x2={200} y2={2 * u} />
          </g>
        </>
      );
    }
    case "bear-paw": {
      const pad = get("pad", "A");
      const claw = get("claws", "B");
      const bg = get("bg", "C");
      const centerAccent = get("center-accent", "D");
      return <BearPawBlockSvg pad={pad} claw={claw} bg={bg} centerAccent={centerAccent} showGrid />;
    }
    case "irish-chain": {
      // Single chain block: 3×3 with the contrasting (chain) fabric in the
      // 4 corners + center, background fabric in the 4 alternating squares.
      const bg = get("background", "A");
      const chain = get("chain", "B");
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
          <g stroke="white" strokeWidth={1} opacity={0.6}>
            <line x1={u} y1={0} x2={u} y2={200} />
            <line x1={2 * u} y1={0} x2={2 * u} y2={200} />
            <line x1={0} y1={u} x2={200} y2={u} />
            <line x1={0} y1={2 * u} x2={200} y2={2 * u} />
          </g>
        </>
      );
    }
    case "sawtooth-star": {
      const star = get("star", "A");
      const centerFab = (a["center"] ?? a["star"] ?? "A") as FabricKey;
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
          {/* Subtle 4×4 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.5}>
            {[1, 2, 3].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
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
          {/* Subtle 3×3 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.5}>
            {[1, 2].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "snowball-block": {
      // Single square Snowball block: solid accent background + octagon main
      // square on top. The alternation across the quilt is shown in the
      // adjacent "Your full quilt" panel via the swap flag in
      // QuiltLayoutPreview — not by distorting this single-block diagram.
      // Geometry matches MiniBlock's snowball case so the "1 block" preview
      // and each full-quilt tile read identically.
      const a = get("mainA", "A");
      const b = get("mainB", "B");
      const c = 60; // ~30% corner accent — visual only
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
          <rect width={200} height={200} fill={b} />
          <polygon points={pts} fill={a} stroke="white" strokeWidth={1} />
        </>
      );
    }
    case "four-patch": {
      // 2×2 grid of equal squares. Defaults match the tile illustration
      // (TL=A blue, TR=B yellow, BL=D pink, BR=C green) but each cell
      // updates live from the user's per-position fabric choices.
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
          <g stroke="white" strokeWidth={1.5} opacity={0.6}>
            <line x1={100} y1={0} x2={100} y2={200} />
            <line x1={0} y1={100} x2={200} y2={100} />
          </g>
        </>
      );
    }
    case "streak-of-lightning": {
      // Exact requested Streak of Lightning block geometry, scaled from the
      // user's 300×300 coordinate spec to this 200×200 SVG: top quadrants
      // point toward each other to form a peak; bottom quadrants point toward
      // each other to form a valley. Yardage math is unchanged.
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
          <g stroke="white" strokeWidth={2} opacity={0.9}>
            <line x1={100} y1={0} x2={100} y2={200} />
            <line x1={0} y1={100} x2={200} y2={100} />
          </g>
        </>
      );
    }
    case "bow-tie": {
      // 2×2 grid of plain squares + small on-point knot at the center seam
      // intersection. Fabric A fills TL+BR diagonal, Fabric B fills TR+BL,
      // Fabric C (knot) is appliquéd on top of the center. Diamond diagonal
      // = 25% of the block (= 50% of one patch) — matches the yardage math
      // which cuts the knot at (blockSize/4 + seam) per side.
      const a = get("mainA", "A");
      const b = get("mainB", "B");
      const knot = get("knot", "D");
      return (
        <>
          <rect x={0} y={0} width={100} height={100} fill={a} />
          <rect x={100} y={0} width={100} height={100} fill={b} />
          <rect x={0} y={100} width={100} height={100} fill={b} />
          <rect x={100} y={100} width={100} height={100} fill={a} />
          {/* Subtle 2×2 grid lines so beginners can see the patch seams */}
          <g stroke="white" strokeWidth={1.5} opacity={0.6}>
            <line x1={100} y1={0} x2={100} y2={200} />
            <line x1={0} y1={100} x2={200} y2={100} />
          </g>
          {/* On-point knot: diagonal = 50% of block. Corners at midpoints of
              the inner patch edges → (100,50), (150,100), (100,150), (50,100). */}
          <polygon points="100,50 150,100 100,150 50,100" fill={knot} stroke="white" strokeWidth={1} />
        </>
      );
    }
    case "shoofly": {
      // Shoofly single-block diagram. 3×3 grid on a 200-unit block:
      //   - 4 side squares + 1 center square @ u=200/3
      //   - 4 HST corners with the accent triangle pointing INWARD.
      // Fabric assignment follows the pattern definition:
      //   - bg = "A" (background/light) fills 4 side squares + background half of each HST
      //   - accent = "B" (accent/dark) fills center + accent half of each HST
      const bg = get("bg", "A");
      const accent = get("accent", "B");
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
          {/* Subtle 3×3 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.5}>
            {[1, 2].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "jacobs-ladder": {
      // Full-size Jacob's Ladder single block. Uses 200-unit viewBox with a
      // 6×6 unit grid (u = 200/6). See PatternThumb's jacobs-ladder case
      // for the full geometry explanation — kept in lockstep here so the
      // "1 block" diagram matches the tile exactly.
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
      return (
        <>
          {nodes}
          {/* Subtle 6×6 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.35}>
            {[1, 2, 3, 4, 5].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
          {/* Slightly stronger sub-block boundaries (2u grid) */}
          <g stroke="white" strokeWidth={2} opacity={0.7}>
            <line x1={2 * u} y1={0} x2={2 * u} y2={200} />
            <line x1={4 * u} y1={0} x2={4 * u} y2={200} />
            <line x1={0} y1={2 * u} x2={200} y2={2 * u} />
            <line x1={0} y1={4 * u} x2={200} y2={4 * u} />
          </g>
        </>
      );
    }
    case "autumn-tints": {
      // 4×4 grid of 16 plain squares. Rotationally symmetric layout:
      //   Row 0: A A B D
      //   Row 1: A A C B
      //   Row 2: B C A A
      //   Row 3: D B A A
      // Fabric A forms two solid 2×2 corner groups (TL + BR). Subtle white
      // grid lines match nine-patch / plus-block style so beginners can see
      // each cut piece clearly.
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
          <g stroke="white" strokeWidth={1} opacity={0.5}>
            {[1, 2, 3].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "card-trick": {
      // 3×3 grid. 4 corner HSTs, 4 edge 3-triangle QSTs, 1 center 4-triangle
      // QST. Top Left Card occupies the top-left quadrant, Top Right Card top-
      // right, D bottom-left — all four cards meet at the exact block center.
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
          {/* Subtle 3×3 grid lines to help beginners see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.35}>
            {[1, 2].map((k) => (
              <g key={k}>
                <line x1={k * U} y1={0} x2={k * U} y2={200} />
                <line x1={0} y1={k * U} x2={200} y2={k * U} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "oh-susannah": {
      // 4×4 grid on a 200 viewBox (u=50). Plain squares around the outside;
      // center 2×2 is 4 HSTs. Fabric A sits at the OUTER corner of each
      // center HST; Fabric C (bg) fills the triangle containing the block's
      // center point — the 4 C triangles join into a large diamond.
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
          {/* Subtle 4×4 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.5}>
            {[1, 2, 3].map((k) => (
              <g key={k}>
                <line x1={k * u} y1={0} x2={k * u} y2={200} />
                <line x1={0} y1={k * u} x2={200} y2={k * u} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "twin-star": {
      // 3×3 grid on a 200 viewBox. Corners + center = plain background.
      // Each edge cell is a 3-triangle unit (Fabric A large + Fabric B small
      // point + Fabric D small second point). Background (Fabric C) NEVER
      // appears inside an edge unit. Units rotate 90° CW around the block:
      //   top-center → middle-right → bottom-center → middle-left.
      // Base (top-center, n=0):
      //   A: TL, BL, BR   B: TL, TR, CC   D: TR, BR, CC
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
      const edgeCells: Array<{ r: number; c: number; n: number }> = [
        { r: 0, c: 1, n: 0 },  // top-center
        { r: 1, c: 2, n: 1 },  // middle-right
        { r: 2, c: 1, n: 2 },  // bottom-center
        { r: 1, c: 0, n: 3 },  // middle-left
      ];
      const plainCells: Array<[number, number]> = [
        [0, 0], [0, 2], [2, 0], [2, 2], [1, 1],
      ];
      const baseTris: Array<{ pts: string[]; fill: string }> = [
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
          {/* Subtle 3×3 grid lines so beginners can see the construction */}
          <g stroke="white" strokeWidth={1} opacity={0.45}>
            {[1, 2].map((k) => (
              <g key={k}>
                <line x1={k * U} y1={0} x2={k * U} y2={200} />
                <line x1={0} y1={k * U} x2={200} y2={k * U} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "star-and-cross": {
      // 5×5 unit grid on a 200 viewBox → u = 40. Rectangles + squares only.
      // Layout (per spec, scaled from 500→200):
      //   Corners (2u×2u): top rect (bg, 2u×u) + bottom row of two u×u squares
      //     (one bg, one accent). Accent square always sits nearest center.
      //   Cross arms (Fabric C): top/bottom u×2u rectangles + left/right 2u×u
      //   Center (Fabric D): 1 u×u square at (2u,2u).
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const cross = get("cross", "C");
      const center = get("center", "D");
      const U = 40; // 200 / 5
      return (
        <>
          {/* Top-left corner unit */}
          <rect x={0} y={0} width={2 * U} height={U} fill={bg} />
          <rect x={0} y={U} width={U} height={U} fill={bg} />
          <rect x={U} y={U} width={U} height={U} fill={acc} />
          {/* Top-right corner unit (mirrored horizontally) */}
          <rect x={3 * U} y={0} width={2 * U} height={U} fill={bg} />
          <rect x={3 * U} y={U} width={U} height={U} fill={acc} />
          <rect x={4 * U} y={U} width={U} height={U} fill={bg} />
          {/* Bottom-left corner unit (mirrored vertically) */}
          <rect x={0} y={3 * U} width={U} height={U} fill={bg} />
          <rect x={U} y={3 * U} width={U} height={U} fill={acc} />
          <rect x={0} y={4 * U} width={2 * U} height={U} fill={bg} />
          {/* Bottom-right corner unit (mirrored both) */}
          <rect x={3 * U} y={3 * U} width={U} height={U} fill={acc} />
          <rect x={4 * U} y={3 * U} width={U} height={U} fill={bg} />
          <rect x={3 * U} y={4 * U} width={2 * U} height={U} fill={bg} />
          {/* Cross arms */}
          <rect x={2 * U} y={0} width={U} height={2 * U} fill={cross} />
          <rect x={2 * U} y={3 * U} width={U} height={2 * U} fill={cross} />
          <rect x={0} y={2 * U} width={2 * U} height={U} fill={cross} />
          <rect x={3 * U} y={2 * U} width={2 * U} height={U} fill={cross} />
          {/* Center square */}
          <rect x={2 * U} y={2 * U} width={U} height={U} fill={center} />
          {/* Subtle 5×5 grid lines so beginners can see construction */}
          <g stroke="white" strokeWidth={0.75} opacity={0.35}>
            {[1, 2, 3, 4].map((k) => (
              <g key={k}>
                <line x1={k * U} y1={0} x2={k * U} y2={200} />
                <line x1={0} y1={k * U} x2={200} y2={k * U} />
              </g>
            ))}
          </g>
        </>
      );
    }
    case "idaho-beauty": {
      const bg = get("bg", "A");
      const acc = get("accent", "B");
      const solid = get("solid", "C");
      return <IdahoBeautyBlock size={200} bg={bg} acc={acc} solid={solid} showGrid />;
    }
  }
}

/** Shared renderer for Idaho Beauty — used by the thumb, single-block diagram,
 *  and full-quilt tile so every preview stays pixel-identical.
 *
 *  True geometry is a 3×3 core of full-size cells surrounded by a half-width
 *  outer ring. In a 400×400 drafting space: border ring = 50, core cells = 100.
 *  A = cream/background, B = teal triangles, C = aqua solid core squares.
 */
function IdahoBeautyBlock({
  size,
  bg,
  acc,
  solid,
  showGrid,
}: {
  size: number;
  bg: string;
  acc: string;
  solid: string;
  showGrid?: boolean;
}) {
  const border = size / 8;
  const core = size / 4;
  const p0 = 0;
  const p1 = border;
  const p2 = border + core;
  const p3 = border + core * 2;
  const p4 = border + core * 3;
  const p5 = size;
  const grid = [p1, p2, p3, p4];

  // Half-width flying-geese unit. The cream/background triangle points inward,
  // matching the uploaded reference; teal/accent fills the two outside corners.
  const Goose = ({
    x,
    y,
    w,
    h,
    dir,
    k,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    dir: "D" | "U" | "R" | "L";
    k: string;
  }) => {
    if (dir === "D") {
      return (
        <g key={k}>
          <polygon points={`${x},${y} ${x + w},${y} ${x + w / 2},${y + h}`} fill={bg} />
          <polygon points={`${x},${y} ${x + w / 2},${y + h} ${x},${y + h}`} fill={acc} />
          <polygon points={`${x + w},${y} ${x + w / 2},${y + h} ${x + w},${y + h}`} fill={acc} />
        </g>
      );
    }
    if (dir === "U") {
      return (
        <g key={k}>
          <polygon points={`${x},${y + h} ${x + w},${y + h} ${x + w / 2},${y}`} fill={bg} />
          <polygon points={`${x},${y + h} ${x + w / 2},${y} ${x},${y}`} fill={acc} />
          <polygon points={`${x + w},${y + h} ${x + w / 2},${y} ${x + w},${y}`} fill={acc} />
        </g>
      );
    }
    if (dir === "R") {
      return (
        <g key={k}>
          <polygon points={`${x},${y} ${x},${y + h} ${x + w},${y + h / 2}`} fill={bg} />
          <polygon points={`${x},${y} ${x + w},${y + h / 2} ${x + w},${y}`} fill={acc} />
          <polygon points={`${x},${y + h} ${x + w},${y + h / 2} ${x + w},${y + h}`} fill={acc} />
        </g>
      );
    }
    return (
      <g key={k}>
        <polygon points={`${x + w},${y} ${x + w},${y + h} ${x},${y + h / 2}`} fill={bg} />
        <polygon points={`${x + w},${y} ${x},${y + h / 2} ${x},${y}`} fill={acc} />
        <polygon points={`${x + w},${y + h} ${x},${y + h / 2} ${x},${y + h}`} fill={acc} />
      </g>
    );
  };

  // Core diamond unit: 4 accent (B) corner triangles + on-point background (A) diamond.
  const Diamond = ({ x, y, k }: { x: number; y: number; k: string }) => (
    <g key={k}>
      <polygon points={`${x},${y} ${x + core / 2},${y} ${x},${y + core / 2}`} fill={acc} />
      <polygon points={`${x + core},${y} ${x + core},${y + core / 2} ${x + core / 2},${y}`} fill={acc} />
      <polygon points={`${x + core},${y + core} ${x + core / 2},${y + core} ${x + core},${y + core / 2}`} fill={acc} />
      <polygon points={`${x},${y + core} ${x},${y + core / 2} ${x + core / 2},${y + core}`} fill={acc} />
      <polygon
        points={`${x + core / 2},${y} ${x + core},${y + core / 2} ${x + core / 2},${y + core} ${x},${y + core / 2}`}
        fill={bg}
      />
    </g>
  );

  return (
    <>
      {/* Outer half-width ring */}
      <rect x={p0} y={p0} width={border} height={border} fill={bg} />
      <Goose k="ib-top-left" x={p1} y={p0} w={core} h={border} dir="D" />
      <rect x={p2} y={p0} width={core} height={border} fill={bg} />
      <Goose k="ib-top-right" x={p3} y={p0} w={core} h={border} dir="D" />
      <rect x={p4} y={p0} width={border} height={border} fill={bg} />

      <Goose k="ib-left-top" x={p0} y={p1} w={border} h={core} dir="R" />
      <rect x={p0} y={p2} width={border} height={core} fill={bg} />
      <Goose k="ib-left-bottom" x={p0} y={p3} w={border} h={core} dir="R" />

      <Goose k="ib-right-top" x={p4} y={p1} w={border} h={core} dir="L" />
      <rect x={p4} y={p2} width={border} height={core} fill={bg} />
      <Goose k="ib-right-bottom" x={p4} y={p3} w={border} h={core} dir="L" />

      <rect x={p0} y={p4} width={border} height={border} fill={bg} />
      <Goose k="ib-bottom-left" x={p1} y={p4} w={core} h={border} dir="U" />
      <rect x={p2} y={p4} width={core} height={border} fill={bg} />
      <Goose k="ib-bottom-right" x={p3} y={p4} w={core} h={border} dir="U" />
      <rect x={p4} y={p4} width={border} height={border} fill={bg} />

      {/* 3×3 core */}
      <rect x={p1} y={p1} width={core} height={core} fill={solid} />
      <Diamond k="ib-diamond-top" x={p2} y={p1} />
      <rect x={p3} y={p1} width={core} height={core} fill={solid} />
      <Diamond k="ib-diamond-left" x={p1} y={p2} />
      <rect x={p2} y={p2} width={core} height={core} fill={solid} />
      <Diamond k="ib-diamond-right" x={p3} y={p2} />
      <rect x={p1} y={p3} width={core} height={core} fill={solid} />
      <Diamond k="ib-diamond-bottom" x={p2} y={p3} />
      <rect x={p3} y={p3} width={core} height={core} fill={solid} />

      {showGrid && (
        <g stroke="white" strokeWidth={0.75} opacity={0.35} fill="none">
          {grid.map((pos) => (
            <g key={pos}>
              <line x1={pos} y1={0} x2={pos} y2={size} />
              <line x1={0} y1={pos} x2={size} y2={pos} />
            </g>
          ))}
          {[
            [p1 + core / 2, p0, p1 + core / 2, p1],
            [p3 + core / 2, p0, p3 + core / 2, p1],
            [p1 + core / 2, p4, p1 + core / 2, p5],
            [p3 + core / 2, p4, p3 + core / 2, p5],
            [p0, p1 + core / 2, p1, p1 + core / 2],
            [p0, p3 + core / 2, p1, p3 + core / 2],
            [p4, p1 + core / 2, p5, p1 + core / 2],
            [p4, p3 + core / 2, p5, p3 + core / 2],
          ].map(([x1, y1, x2, y2], k) => (
            <g key={k}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} />
            </g>
          ))}
        </g>
      )}
    </>
  );
}

export { IdahoBeautyBlock };




