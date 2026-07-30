import type { ReactElement } from "react";
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
                x={(i * 200) / 3}
                y={(j * 200) / 3}
                width={200 / 3 + 0.5}
                height={200 / 3 + 0.5}
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
      const r3 = get("rail3", "C");
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
      return <BearPawBlockSvg pad={pad} claw={claw} bg={bg} centerAccent={centerAccent} />;
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
    case "checkerboard": {
      const a = get("outerA", "A");
      const b = get("outerB", "B");
      const c = get("innerC", "C");
      const d = get("innerD", "D");
      return <CheckerboardBlock size={200} a={a} b={b} c={c} d={d} />;
    }
    case "cabin-in-the-cotton": {
      // Single-block preview shows an "even" position block (outer ring = Fabric D).
      const center = get("center", "A");
      const round1 = get("round1", "B");
      const round2 = get("center", "A"); // Round 2 uses Fabric A (same as center)
      const round3 = get("round3Even", "D");
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



  }
}

/** Shared renderer for Checkerboard — nested hourglass block.
 *  Outer 4 QST triangles meet at block center; A fills top+bottom, B fills
 *  left+right. Inner smaller on-point diamond (corners at 12.5%/87.5% of each
 *  edge midpoint via 3/16 and 13/16 fractions) split by its own diagonals
 *  into 4 quarters; C fills one diagonal pair, D fills the other. */
function CheckerboardBlock({
  size,
  a,
  b,
  c,
  d,
}: {
  size: number;
  a: string;
  b: string;
  c: string;
  d: string;
}) {
  const S = size;
  const cx = S / 2;
  const cy = S / 2;
  // Inner diamond corners sit AT the block edge midpoints — the diamond fills
  // the whole block on-point, leaving 4 outer corner right-triangles.
  const inTop = { x: cx, y: 0 };
  const inRight = { x: S, y: cy };
  const inBot = { x: cx, y: S };
  const inLeft = { x: 0, y: cy };
  // Midpoints of the big diamond's 4 edges — used to split the diamond into
  // 4 smaller on-point squares (pinwheel around the true center).
  const mNE = { x: (inTop.x + inRight.x) / 2, y: (inTop.y + inRight.y) / 2 };
  const mES = { x: (inRight.x + inBot.x) / 2, y: (inRight.y + inBot.y) / 2 };
  const mSW = { x: (inBot.x + inLeft.x) / 2, y: (inBot.y + inLeft.y) / 2 };
  const mWN = { x: (inLeft.x + inTop.x) / 2, y: (inLeft.y + inTop.y) / 2 };
  // Outer 4 quarters via the two block diagonals; A top+bottom, B left+right.
  // The diamond overlays the middle, so what remains visible is 8 corner-
  // adjacent right-triangles (A near top/bottom edges, B near left/right).
  return (
    <>
      <polygon points={`0,0 ${S},0 ${cx},${cy}`} fill={a} />
      <polygon points={`${S},0 ${S},${S} ${cx},${cy}`} fill={b} />
      <polygon points={`${S},${S} 0,${S} ${cx},${cy}`} fill={a} />
      <polygon points={`0,${S} 0,0 ${cx},${cy}`} fill={b} />
      {/* Inner diamond split into 4 on-point squares meeting at center.
          N & S small squares → C (mint); E & W → D (cream). */}
      <polygon points={`${inTop.x},${inTop.y} ${mNE.x},${mNE.y} ${cx},${cy} ${mWN.x},${mWN.y}`} fill={c} />
      <polygon points={`${inRight.x},${inRight.y} ${mES.x},${mES.y} ${cx},${cy} ${mNE.x},${mNE.y}`} fill={d} />
      <polygon points={`${inBot.x},${inBot.y} ${mSW.x},${mSW.y} ${cx},${cy} ${mES.x},${mES.y}`} fill={c} />
      <polygon points={`${inLeft.x},${inLeft.y} ${mWN.x},${mWN.y} ${cx},${cy} ${mSW.x},${mSW.y}`} fill={d} />
    </>
  );
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

export { IdahoBeautyBlock, CheckerboardBlock, CabinInTheCottonBlock, FancyStripeBlock, MapleStarBlock, LoveInAMistBlock, FourXStarBlock, AntiqueTileBlock, EconomyBlock, CaliforniaQuiltBlock };

/**
 * Shared renderer for "California Quilt".
 *
 * Drafted on a 6-unit grid (u = size / 6) as a 3×3 nine-patch of 2u cells:
 *
 *   - Corners: plain Fabric A squares (2u) with a 1u accent (C) triangle
 *     tucked into the inner corner, hypotenuse facing outward.
 *   - Edges: outer half is a plain Fabric B rectangle (2u × 1u); inner half
 *     is a flying-geese unit — a B goose pointing in at the centre with two
 *     C side triangles.
 *   - Centre: a 2u square-in-a-square — C background with the Fabric D
 *     square set on point, its points touching the cell's edge midpoints.
 *
 * Geometry matches the yardage math in yardage.ts exactly.
 */
function CaliforniaQuiltBlock({
  size,
  bg,
  geese,
  accent,
  center,
}: {
  size: number;
  bg: string;
  geese: string;
  accent: string;
  center: string;
}) {
  const u = size / 6;
  // Rotate a point (in grid units) about the block centre (3,3) by k × 90°.
  const rot = ([x, y]: [number, number], k: number): [number, number] => {
    let p: [number, number] = [x, y];
    for (let i = 0; i < k; i++) p = [6 - p[1], p[0]];
    return p;
  };
  const poly = (pts: [number, number][], k: number, fill: string, key: string) => (
    <polygon
      key={key}
      points={pts
        .map((p) => rot(p, k))
        .map(([x, y]) => `${x * u},${y * u}`)
        .join(" ")}
      fill={fill}
    />
  );

  const quarters = [0, 1, 2, 3];
  return (
    <>
      {/* Background fills the whole block; everything else overlays it. */}
      <rect x={0} y={0} width={size} height={size} fill={bg} />
      {quarters.map((k) => (
        <g key={`cq-${k}`}>
          {/* Outer edge rectangle (2u × 1u) */}
          {poly(
            [
              [2, 0],
              [4, 0],
              [4, 1],
              [2, 1],
            ],
            k,
            geese,
            `cq-rect-${k}`,
          )}
          {/* Flying goose pointing in toward the centre */}
          {poly(
            [
              [2, 1],
              [4, 1],
              [3, 2],
            ],
            k,
            geese,
            `cq-goose-${k}`,
          )}
          {/* Two accent side triangles of the geese unit */}
          {poly(
            [
              [2, 1],
              [3, 2],
              [2, 2],
            ],
            k,
            accent,
            `cq-gl-${k}`,
          )}
          {poly(
            [
              [4, 1],
              [4, 2],
              [3, 2],
            ],
            k,
            accent,
            `cq-gr-${k}`,
          )}
          {/* Accent triangle in the inner corner of the background square */}
          {poly(
            [
              [2, 1],
              [2, 2],
              [1, 2],
            ],
            k,
            accent,
            `cq-corner-${k}`,
          )}
        </g>
      ))}
      {/* Centre square-in-a-square */}
      <rect x={2 * u} y={2 * u} width={2 * u} height={2 * u} fill={accent} />
      <polygon
        points={`${3 * u},${2 * u} ${4 * u},${3 * u} ${3 * u},${4 * u} ${2 * u},${3 * u}`}
        fill={center}
      />
    </>
  );
}

/**
 * Shared renderer for the "Economy Block" (double square-in-a-square).
 *
 *   - Outer corners (round 2) fill the whole block.
 *   - Round 1 is an on-point square whose points touch the midpoints of the
 *     block edges → finished side = S/√2.
 *   - The centre square sits straight (rotated twice by 45° = 90°) with
 *     finished side = S/2, centred in the block.
 *
 * Geometry matches the yardage math in yardage.ts exactly.
 */
function EconomyBlock({
  size,
  center,
  round1,
  round2,
}: {
  size: number;
  center: string;
  round1: string;
  round2: string;
}) {
  const S = size;
  const h = S / 2;
  const q = S / 4;
  return (
    <>
      <rect x={0} y={0} width={S} height={S} fill={round2} />
      <polygon points={`${h},0 ${S},${h} ${h},${S} 0,${h}`} fill={round1} />
      <rect x={q} y={q} width={h} height={h} fill={center} />
    </>
  );
}

/**
 * Shared renderer for "Antique Tile" — a straight-seam block with no
 * triangles. Drafted on a 6-unit grid with 1-1-2-1-1 row/column tracks:
 *
 *   ┌──── A ────┬─ B ─┬──── A ────┐   row 1 (1u tall)
 *   │ A │  C  │   D   │  C  │ A   │   row 2 (1u tall)
 *   │ B │  D  │   E   │  D  │ B   │   row 3 (2u tall)
 *   │ A │  C  │   D   │  C  │ A   │   row 4 (1u tall)
 *   └──── A ────┴─ B ─┴──── A ────┘   row 5 (1u tall)
 *
 * Column tracks are 1u, 1u, 2u, 1u, 1u (6u total), matching the rows, so the
 * block has full 90° rotational symmetry.
 */
function AntiqueTileBlock({
  size,
  corner,
  edge,
  accent,
  frame,
  center,
}: {
  size: number;
  corner: string;
  edge: string;
  accent: string;
  frame: string;
  center: string;
}) {
  const u = size / 6;
  const R = (x: number, y: number, w: number, h: number, fill: string, key: string) => (
    <rect key={key} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} />
  );
  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={corner} />
      {/* Row 1 — corner rectangles either side of the top edge rectangle */}
      {R(0, 0, 2, 1, corner, "at-r1c1")}
      {R(2, 0, 2, 1, edge, "at-r1c3")}
      {R(4, 0, 2, 1, corner, "at-r1c5")}
      {/* Row 2 */}
      {R(0, 1, 1, 1, corner, "at-r2c1")}
      {R(1, 1, 1, 1, accent, "at-r2c2")}
      {R(2, 1, 2, 1, frame, "at-r2c3")}
      {R(4, 1, 1, 1, accent, "at-r2c4")}
      {R(5, 1, 1, 1, corner, "at-r2c5")}
      {/* Row 3 — the tall middle row */}
      {R(0, 2, 1, 2, edge, "at-r3c1")}
      {R(1, 2, 1, 2, frame, "at-r3c2")}
      {R(2, 2, 2, 2, center, "at-r3c3")}
      {R(4, 2, 1, 2, frame, "at-r3c4")}
      {R(5, 2, 1, 2, edge, "at-r3c5")}
      {/* Row 4 — mirror of row 2 */}
      {R(0, 4, 1, 1, corner, "at-r4c1")}
      {R(1, 4, 1, 1, accent, "at-r4c2")}
      {R(2, 4, 2, 1, frame, "at-r4c3")}
      {R(4, 4, 1, 1, accent, "at-r4c4")}
      {R(5, 4, 1, 1, corner, "at-r4c5")}
      {/* Row 5 — mirror of row 1 */}
      {R(0, 5, 2, 1, corner, "at-r5c1")}
      {R(2, 5, 2, 1, edge, "at-r5c3")}
      {R(4, 5, 2, 1, corner, "at-r5c5")}
    </>
  );
}

/**
 * Shared renderer for "Four X Star" — a strict 5×5 grid of 25 equal cells.
 *
 * Cell map (read straight off the reference construction graphic):
 *
 *   A  ⧅  D  ⧅  A          ⧅ = half-square-triangle unit; the letter in the
 *   ⧅  C  A  C  ⧅              table below records WHICH corner of the cell
 *   D  A  D  A  D              holds the Fabric B (accent) right angle.
 *   ⧅  C  A  C  ⧅
 *   A  ⧅  D  ⧅  A
 *
 * The eight accent triangles pair up around each Fabric C square, meeting
 * point-to-point at its outer corner to form the four "X" arms of the star.
 * The whole layout has 90° rotational symmetry.
 */
type FourXCorner = "tl" | "tr" | "bl" | "br";
type FourXCell =
  | { k: "bg" }
  | { k: "sq" }
  | { k: "dark" }
  | { k: "hst"; corner: FourXCorner };

const FOUR_X_STAR_GRID: FourXCell[][] = [
  [{ k: "bg" }, { k: "hst", corner: "bl" }, { k: "dark" }, { k: "hst", corner: "br" }, { k: "bg" }],
  [{ k: "hst", corner: "tr" }, { k: "sq" }, { k: "bg" }, { k: "sq" }, { k: "hst", corner: "tl" }],
  [{ k: "dark" }, { k: "bg" }, { k: "dark" }, { k: "bg" }, { k: "dark" }],
  [{ k: "hst", corner: "br" }, { k: "sq" }, { k: "bg" }, { k: "sq" }, { k: "hst", corner: "bl" }],
  [{ k: "bg" }, { k: "hst", corner: "tl" }, { k: "dark" }, { k: "hst", corner: "tr" }, { k: "bg" }],
];

function fourXHstPoints(x: number, y: number, u: number, corner: FourXCorner) {
  const tl = `${x},${y}`;
  const tr = `${x + u},${y}`;
  const bl = `${x},${y + u}`;
  const br = `${x + u},${y + u}`;
  switch (corner) {
    case "tl":
      return { acc: `${tl} ${tr} ${bl}`, bg: `${tr} ${br} ${bl}` };
    case "tr":
      return { acc: `${tl} ${tr} ${br}`, bg: `${tl} ${br} ${bl}` };
    case "bl":
      return { acc: `${tl} ${bl} ${br}`, bg: `${tl} ${tr} ${br}` };
    case "br":
      return { acc: `${tr} ${br} ${bl}`, bg: `${tl} ${tr} ${bl}` };
  }
}

function FourXStarBlock({
  size,
  bg,
  acc,
  sq,
  dark,
}: {
  size: number;
  bg: string;
  acc: string;
  sq: string;
  dark: string;
}) {
  const u = size / 5;
  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={bg} />
      {FOUR_X_STAR_GRID.map((row, r) =>
        row.map((cell, c) => {
          const x = c * u;
          const y = r * u;
          const key = `fx-${r}-${c}`;
          if (cell.k === "hst") {
            const pts = fourXHstPoints(x, y, u, cell.corner);
            return (
              <g key={key}>
                <polygon points={pts.bg} fill={bg} />
                <polygon points={pts.acc} fill={acc} />
              </g>
            );
          }
          const fill = cell.k === "sq" ? sq : cell.k === "dark" ? dark : bg;
          return <rect key={key} x={x} y={y} width={u} height={u} fill={fill} />;
        }),
      )}
    </>
  );
}

/**
 * Shared renderer for "Fancy Stripe" — exactly 16 equal HST cells in a strict
 * 4×4 grid. This follows the uploaded exploded block graphic literally: the
 * top-left 2×2 quadrant uses only anti-diagonal HSTs, with Fabric A in the
 * upper-left/lower-right pair and the remaining quadrants mirrored from that
 * construction. No merged diamonds or resized pieces are drawn.
 */
function FancyStripeBlock({
  size,
  a,
  b,
  debug = false,
  referenceColors = false,
}: {
  size: number;
  a: string;
  b: string;
  debug?: boolean;
  referenceColors?: boolean;
}) {
  const S = size;
  const C = S / 4;
  // Literal 16-cell table from the construction image. Each entry is one
  // independent HST cell: [diagonal, first-side fabric, opposite-side fabric].
  // "main" diagonal = (0,0)→(C,C); upper = upper-right triangle, lower = lower-left.
  // "anti" diagonal = (C,0)→(0,C);  upper = upper-left triangle,  lower = lower-right.
  type Diag = "main" | "anti";
  const T: Array<[Diag, "A" | "B", "A" | "B"]> = [
    // Row 1: TL quadrant cells, then its horizontal mirror.
    ["anti", "A", "B"], ["anti", "B", "A"], ["main", "B", "A"], ["main", "A", "B"],
    // Row 2: TL quadrant cells, then its horizontal mirror.
    ["anti", "B", "A"], ["anti", "A", "B"], ["main", "A", "B"], ["main", "B", "A"],
    // Row 3: vertical mirror of Row 2, then 180° mirror for BR.
    ["main", "A", "B"], ["main", "B", "A"], ["anti", "B", "A"], ["anti", "A", "B"],
    // Row 4: vertical mirror of Row 1, then 180° mirror for BR.
    ["main", "B", "A"], ["main", "A", "B"], ["anti", "A", "B"], ["anti", "B", "A"],
  ];
  const orange = "oklch(0.72 0.17 42)";
  const gray = "oklch(0.78 0.01 35)";
  const fill = (k: "A" | "B") => {
    if (referenceColors) return k === "A" ? orange : gray;
    return k === "A" ? a : b;
  };
  const cells: ReactElement[] = [];
  for (let i = 0; i < 16; i++) {
    const r = Math.floor(i / 4);
    const c = i % 4;
    const x = c * C;
    const y = r * C;
    const [diag, up, lo] = T[i];
    let upPts: string;
    let loPts: string;
    if (diag === "main") {
      // upper-right triangle, lower-left triangle
      upPts = `${x},${y} ${x + C},${y} ${x + C},${y + C}`;
      loPts = `${x},${y} ${x},${y + C} ${x + C},${y + C}`;
    } else {
      // anti: upper-left triangle, lower-right triangle
      upPts = `${x},${y} ${x + C},${y} ${x},${y + C}`;
      loPts = `${x + C},${y} ${x + C},${y + C} ${x},${y + C}`;
    }
    cells.push(<polygon key={`u${i}`} points={upPts} fill={fill(up)} />);
    cells.push(<polygon key={`l${i}`} points={loPts} fill={fill(lo)} />);
  }
  const overlays: ReactElement[] = [];
  if (debug) {
    for (let i = 0; i <= 4; i++) {
      const p = i * C;
      overlays.push(<line key={`h${i}`} x1={0} y1={p} x2={S} y2={p} stroke="#000" strokeWidth={1.25} />);
      overlays.push(<line key={`v${i}`} x1={p} y1={0} x2={p} y2={S} stroke="#000" strokeWidth={1.25} />);
    }
    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / 4);
      const c = i % 4;
      const x = c * C;
      const y = r * C;
      const [diag] = T[i];
      const d = diag === "main"
        ? `M${x},${y} L${x + C},${y + C}`
        : `M${x + C},${y} L${x},${y + C}`;
      overlays.push(<path key={`d${i}`} d={d} stroke="#000" strokeWidth={1} fill="none" />);
    }
  }
  return (
    <>
      {cells}
      {overlays}
    </>
  );
}

/**
 * Shared renderer for "Cabin in the Cotton" — a Courthouse Steps log cabin.
 * 300×300 drafting space. Center 60×60; three concentric rings, each strip
 * 40 units wide, added in top+bottom then left+right pairs.
 *   Round 1: `round1` fabric (usually B)
 *   Round 2: `round2` fabric (usually same as center Fabric A)
 *   Round 3: `round3` fabric — caller passes D or E based on block position
 */
function CabinInTheCottonBlock({
  size,
  center,
  round1,
  round2,
  round3,
}: {
  size: number;
  center: string;
  round1: string;
  round2: string;
  round3: string;
}) {
  const S = size;
  const u = S / 300;
  // Helper: draw rect using 300-space coords.
  const R = (x: number, y: number, w: number, h: number, fill: string, k: string) => (
    <rect key={k} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} />
  );
  return (
    <>
      {/* Center 60×60 at (120,120) */}
      {R(120, 120, 60, 60, center, "c")}
      {/* Round 1 — 40-wide strips: top+bottom (60 long), then left+right (140 long) */}
      {R(120, 80, 60, 40, round1, "r1t")}
      {R(120, 180, 60, 40, round1, "r1b")}
      {R(80, 80, 40, 140, round1, "r1l")}
      {R(180, 80, 40, 140, round1, "r1r")}
      {/* Round 2 — top+bottom (140 long), then left+right (220 long) */}
      {R(80, 40, 140, 40, round2, "r2t")}
      {R(80, 220, 140, 40, round2, "r2b")}
      {R(40, 40, 40, 220, round2, "r2l")}
      {R(220, 40, 40, 220, round2, "r2r")}
      {/* Round 3 — top+bottom (220 long), then left+right (300 long, full block edge) */}
      {R(40, 0, 220, 40, round3, "r3t")}
      {R(40, 260, 220, 40, round3, "r3b")}
      {R(0, 0, 40, 300, round3, "r3l")}
      {R(260, 0, 40, 300, round3, "r3r")}
    </>
  );
}


/**
 * Shared renderer for "Maple Star" — the reference uses an unequal 5×5 grid
 * with track sizes [s, s, C, s, s], where C = 2s (6s total). Each side point is
 * the same 2s × 2s unit: a top flying-geese cap (Fabric A rectangle with two
 * Fabric B flip corners) plus a Fabric C shaft. The right, bottom, and left
 * points are rotations of that single top-point unit around the true center.
 */
function MapleStarBlock({
  size,
  bg,
  acc,
  points,
  center,
  debug = false,
}: {
  size: number;
  bg: string;
  acc: string;
  points: string;
  center: string;
  debug?: boolean;
}) {
  const S = size;
  const u = S / 6;
  const cx = 3 * u;
  const cy = 3 * u;
  const U = (n: number) => n * u;
  const rect = (x: number, y: number, w: number, h: number, fill: string, key: string) => (
    <rect key={key} x={U(x)} y={U(y)} width={U(w)} height={U(h)} fill={fill} />
  );

  const pointUnit = (rotation: number, key: string) => (
    <g key={key} transform={`rotate(${rotation} ${cx} ${cy})`}>
      {/* Flying-geese cap: Fabric A base with two Fabric B stitch-and-flip corners. */}
      {rect(2, 0, 2, 1, bg, `${key}-cap`)}
      <polygon points={`${U(2)},${U(0)} ${U(3)},${U(1)} ${U(2)},${U(1)}`} fill={acc} />
      <polygon points={`${U(4)},${U(0)} ${U(4)},${U(1)} ${U(3)},${U(1)}`} fill={acc} />
      {/* Fabric C shaft directly below the cap. */}
      {rect(2, 1, 2, 1, points, `${key}-shaft`)}
    </g>
  );

  return (
    <>
      {/* Fabric A foundation/background pieces. */}
      <rect x={0} y={0} width={S} height={S} fill={bg} />
      {rect(0, 0, 2, 1, bg, "bg-top-left")}
      {rect(4, 0, 2, 1, bg, "bg-top-right")}
      {rect(0, 1, 1, 1, bg, "bg-upper-left-square")}
      {rect(5, 1, 1, 1, bg, "bg-upper-right-square")}
      {rect(0, 4, 1, 1, bg, "bg-lower-left-square")}
      {rect(5, 4, 1, 1, bg, "bg-lower-right-square")}
      {rect(0, 5, 2, 1, bg, "bg-bottom-left")}
      {rect(4, 5, 2, 1, bg, "bg-bottom-right")}

      {/* 4 identical star-point units, derived from the top unit by rotation. */}
      {pointUnit(0, "point-top")}
      {pointUnit(90, "point-right")}
      {pointUnit(180, "point-bottom")}
      {pointUnit(270, "point-left")}

      {/* Fabric B inner-ring squares. */}
      {rect(1, 1, 1, 1, acc, "inner-tl")}
      {rect(4, 1, 1, 1, acc, "inner-tr")}
      {rect(1, 4, 1, 1, acc, "inner-bl")}
      {rect(4, 4, 1, 1, acc, "inner-br")}

      {/* Fabric D center hearth. */}
      {rect(2, 2, 2, 2, center, "center")}

      {debug && (
        <g stroke="var(--foreground)" strokeWidth={0.75} opacity={0.45} fill="none">
          {[1, 2, 4, 5].map((k) => (
            <g key={k}>
              <line x1={U(k)} y1={0} x2={U(k)} y2={S} />
              <line x1={0} y1={U(k)} x2={S} y2={U(k)} />
            </g>
          ))}
        </g>
      )}
    </>
  );
}


/**
 * Shared renderer for "Love in a Mist" — classic 3×3 nine-patch. Uses a 6-unit
 * drafting grid (u = size/6), so each macro cell is 2u × 2u.
 *
 *   - 4 edge-middle cells: square-in-a-square. A Fabric C on-point square
 *     touches the midpoints of that cell's 4 edges, with Fabric A corner
 *     triangles filling the outer corners.
 *   - Center cell: one plain Fabric A square.
 *   - 4 corner cells: 2×2 four-patch, each sub-cell = u × u.
 *       - Outer-outer sub-cell (touching the block corner): plain Fabric A.
 *       - Inner-inner sub-cell (touching the block center): plain Fabric B.
 *       - The two remaining sub-cells: HSTs (Fabric A + Fabric B), with the
 *         Fabric B triangles pointing toward the 4-patch center.
 *
 * All 4 corner cells are drawn from a single top-left `cornerUnit` rotated
 * around the block center to guarantee identical geometry.
 */
function LoveInAMistBlock({
  size,
  bg,
  accent,
  outer,
  debug = false,
}: {
  size: number;
  /** Fabric A — center square + the background "points" around each edge diamond. */
  bg: string;
  /** Fabric B — the 4 edge diamonds AND the corner four-patch accents. */
  accent: string;
  /** Fabric C — the outer corner squares + the outer halves of the corner HSTs. */
  outer: string;
  debug?: boolean;
}) {
  const S = size;
  const u = S / 6;
  const U = (n: number) => n * u;
  const cx = 3 * u;
  const cy = 3 * u;

  /**
   * One square-in-a-square unit for the TOP edge cell, occupying
   * (2u,0)-(4u,2u). The two flip-corner triangles that sit on the block's
   * OUTER edge are Fabric C (outer) so every diamond has the outer fabric
   * on its outside; the two inward-facing triangles stay Fabric A.
   * The other three edge units are this same unit rotated about the center.
   */
  const sisUnitTop = (
    <>
      <rect x={U(2)} y={0} width={U(2)} height={U(2)} fill={bg} />
      {/* Outer (top) flip corners — Fabric C */}
      <polygon points={`${U(2)},${0} ${U(3)},${0} ${U(2)},${U(1)}`} fill={outer} />
      <polygon points={`${U(3)},${0} ${U(4)},${0} ${U(4)},${U(1)}`} fill={outer} />
      {/* Diamond — Fabric B */}
      <polygon
        points={`${U(3)},${0} ${U(4)},${U(1)} ${U(3)},${U(2)} ${U(2)},${U(1)}`}
        fill={accent}
      />
    </>
  );

  const sisAt = (rotation: number, key: string) => (
    <g key={key} transform={`rotate(${rotation} ${cx} ${cy})`}>
      {sisUnitTop}
    </g>
  );


  /**
   * Top-left corner 4-patch, occupying (0,0)-(2u,2u):
   * TL = plain Fabric C (outer corner), BR = plain Fabric B accent, and the
   * TR/BL HSTs pair Fabric C on the outer edge with Fabric B pointing toward
   * the 4-patch center.
   */
  const cornerUnitTL = (
    <>
      {/* TL subcell — plain Fabric C outer corner square */}
      <rect x={0} y={0} width={u} height={u} fill={outer} />
      {/* TR subcell — HST: C outer (TR half), B inner (BL half toward center) */}
      <rect x={U(1)} y={0} width={u} height={u} fill={outer} />
      <polygon points={`${U(1)},${0} ${U(2)},${U(1)} ${U(1)},${U(1)}`} fill={accent} />
      {/* BL subcell — HST: C outer (BL half), B inner (TR half toward center) */}
      <rect x={0} y={U(1)} width={u} height={u} fill={outer} />
      <polygon points={`${0},${U(1)} ${U(1)},${U(1)} ${U(1)},${U(2)}`} fill={accent} />
      {/* BR subcell — plain Fabric B (inner-inner, adjacent to block center) */}
      <rect x={U(1)} y={U(1)} width={u} height={u} fill={accent} />
    </>
  );

  const cornerAt = (rotation: number, key: string) => (
    <g key={key} transform={`rotate(${rotation} ${cx} ${cy})`}>
      {cornerUnitTL}
    </g>
  );

  return (
    <>
      {/* Full background wash so any thin geometry rounding never shows through. */}
      <rect x={0} y={0} width={S} height={S} fill={bg} />

      {/* 4 corner 4-patches — top-left drawn directly, others rotated. */}
      {cornerAt(0, "corner-tl")}
      {cornerAt(90, "corner-tr")}
      {cornerAt(180, "corner-br")}
      {cornerAt(270, "corner-bl")}

      {/* 4 edge-middle square-in-a-square units. */}
      {sisAt(0, "sis-top")}
      {sisAt(90, "sis-right")}
      {sisAt(180, "sis-bottom")}
      {sisAt(270, "sis-left")}

      {/* Center cell — plain background square, matching the construction reference. */}
      <rect x={U(2)} y={U(2)} width={U(2)} height={U(2)} fill={bg} />


      {debug && (
        <g stroke="var(--foreground)" strokeWidth={0.75} opacity={0.45} fill="none">
          {[1, 2, 3, 4, 5].map((k) => (
            <g key={k}>
              <line x1={U(k)} y1={0} x2={U(k)} y2={S} />
              <line x1={0} y1={U(k)} x2={S} y2={U(k)} />
            </g>
          ))}
        </g>
      )}
    </>
  );
}







