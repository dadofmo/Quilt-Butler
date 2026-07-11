import type { PatternId } from "@/lib/planner-store";
import { BearPawBlockSvg } from "./BearPawBlockSvg";


interface Props {
  pattern: PatternId;
  size?: number;
}

const C = {
  a: "var(--fabric-a)",
  b: "var(--fabric-b)",
  c: "var(--fabric-c)",
  d: "var(--fabric-d)",
};



const PATTERN_ALT: Record<PatternId, string> = {
  "nine-patch":
    "Nine Patch quilt block diagram showing 3x3 checkerboard grid layout",
  hst: "Half Square Triangle quilt block diagram showing diagonal triangle layout",
  "simple-squares":
    "Simple Squares patchwork quilt block diagram showing multi-fabric square grid layout",
  "rail-fence":
    "Rail Fence quilt block diagram showing horizontal strip layout",
  "log-cabin":
    "Log Cabin quilt block diagram showing concentric rectangular strip layout",
  "ohio-star":
    "Ohio Star quilt block diagram showing eight pointed star layout",
  "flying-geese":
    "Flying Geese quilt block diagram showing triangle geese in a row layout",
  "disappearing-nine-patch":
    "Disappearing Nine Patch quilt block diagram showing rotated cut block layout",
  "squares-on-point":
    "Squares on Point quilt block diagram showing diagonal rotated square layout",
  "plus-block":
    "Plus Block quilt block diagram showing cross shaped block layout",
  pinwheel:
    "Pinwheel quilt block diagram showing four half square triangle units arranged with blades spinning clockwise around the center",
  "churn-dash":
    "Churn Dash quilt block diagram showing 3x3 layout with four corner half square triangles, four side rectangular bar units, and a solid center square",
  "bear-paw":
    "Bear Paw quilt block diagram showing four traditional paw units around sashing with a separate center accent square",
  "irish-chain":
    "Irish Chain quilt block diagram showing a 9-patch chain block with five contrasting corner and center squares forming diagonal chains across alternating background blocks",
  "sawtooth-star":
    "Sawtooth Star quilt block diagram showing a 4x4 grid with a large 2x2 center square, four background corner squares, and eight half square triangle units forming an eight pointed star",
  "friendship-star":
    "Friendship Star quilt block diagram showing a 3x3 grid with a center square, four background corner squares, and four half square triangle units forming a rotational star",
  "snowball-block":
    "Snowball Block quilt diagram showing two adjacent blocks with corner accent triangles where the two fabrics swap roles to create an alternating checkerboard pattern",
  "four-patch":
    "Four Patch quilt block diagram showing a simple 2x2 grid of four equal squares in four distinct fabric colors",
  "streak-of-lightning":
    "Streak of Lightning quilt block diagram showing a 2x2 grid of half square triangle units forming a peak and valley chevron",
  "bow-tie":
    "Bow Tie quilt block diagram showing a 2x2 grid of plain squares with a small on-point center square forming the knot at the seam intersection",
  shoofly:
    "Shoofly quilt block diagram showing a 3x3 grid with four half-square-triangle corners pointing inward, a center accent square, and four plain background side squares",
  "jacobs-ladder":
    "Jacob's Ladder quilt block diagram showing a 6x6 grid built from five four-patches at the four corners and center plus four large half-square-triangle units on the edges, with the accent triangles forming the classic diagonal ladder band across the block",
  "autumn-tints":
    "Autumn Tints quilt block diagram showing a 4x4 grid of 16 plain squares with two solid 2x2 dominant fabric corners on the top-left and bottom-right, four background squares, and two accent fabrics placed on opposite corners with 180 degree rotational symmetry",
  "card-trick":
    "Card Trick quilt block diagram showing a 3x3 grid with four card-colored diamonds set on point, one in each quadrant of the block, meeting at the center and framed by background triangles in the four outer corners",
  "oh-susannah":
    "Oh Susannah quilt block diagram showing a 4x4 grid with plain squares around the outside and four half-square-triangle units in the center that meet to form a large diamond of background fabric in the middle of the block",
  "twin-star":
    "Twin Star quilt block diagram showing a 3x3 grid with plain background corners and center, and four edge cells each split into a large accent triangle plus two small triangles that rotate around the center to form two nested pinwheel-style stars",
  "star-and-cross":
    "Star and Cross quilt block diagram showing a 5x5 grid with a solid cross of dark-red rectangles running through the middle, a small peach center square where the cross arms meet, and four corner units each with a plain background rectangle on top and one background plus one orange accent square below",
};

export function PatternThumb({ pattern, size = 96 }: Props) {
  const s = size;
  const label = PATTERN_ALT[pattern];
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 90 90",
    role: "img" as const,
    "aria-label": label,
  };
  switch (pattern) {
    case "simple-squares":
      return (
        <svg {...common}>
          {[0, 22.5, 45, 67.5].flatMap((y) =>
            [0, 22.5, 45, 67.5].map((x) => (
              <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width={20.5} height={20.5} fill={C.a} />
            )),
          )}
        </svg>

      );
    case "nine-patch":
      return (
        <svg {...common}>
          {[0, 30, 60].flatMap((y, j) =>
            [0, 30, 60].map((x, i) => (
              <rect key={`${i}-${j}`} x={x + 1} y={y + 1} width={28} height={28} fill={(i + j) % 2 === 0 ? C.a : C.b} />
            )),
          )}
        </svg>
      );
    case "hst":
      return (
        <svg {...common}>
          {[0, 1].flatMap((j) =>
            [0, 1].map((i) => {
              const x = i * 45;
              const y = j * 45;
              return (
                <g key={`${i}-${j}`}>
                  <polygon points={`${x},${y} ${x + 45},${y} ${x},${y + 45}`} fill={C.a} />
                  <polygon points={`${x + 45},${y} ${x + 45},${y + 45} ${x},${y + 45}`} fill={C.b} />
                </g>
              );
            }),
          )}
        </svg>
      );
    case "rail-fence":
      return (
        <svg {...common}>
          {[0, 30, 60].map((x, i) => (
            <g key={i}>
              <rect x={x} y={0} width={30} height={30} fill={C.a} />
              <rect x={x} y={30} width={30} height={30} fill={C.b} />
              <rect x={x} y={60} width={30} height={30} fill={C.d} />
            </g>
          ))}
          {/* Jelly Roll Friendly badge moved to overlay in PatternPickerPage */}
        </svg>

      );
    case "log-cabin": {
      const u = 90 / 8;
      const r = (x: number, y: number, w: number, h: number, fill: string) => (
        <rect key={`${x}-${y}-${w}-${h}`} x={x * u} y={y * u} width={w * u} height={h * u} fill={fill} />
      );
      return (
        <svg {...common}>
          {r(5, 3, 1, 2, C.c)}{r(3, 2, 3, 1, C.c)}{r(6, 2, 1, 4, C.c)}{r(2, 1, 5, 1, C.c)}{r(7, 1, 1, 6, C.c)}{r(1, 0, 7, 1, C.c)}
          {r(2, 2, 1, 3, C.b)}{r(2, 5, 4, 1, C.b)}{r(1, 1, 1, 5, C.b)}{r(1, 6, 6, 1, C.b)}{r(0, 0, 1, 7, C.b)}{r(0, 7, 8, 1, C.b)}
          <rect x={3 * u} y={3 * u} width={2 * u} height={2 * u} fill={C.a} />
        </svg>
      );
    }
    case "ohio-star": {
      const u = 30;
      const qst = (gx: number, gy: number, axis: "v" | "h", key: string) => {
        const x = gx * u;
        const y = gy * u;
        const cx = x + u / 2;
        const cy = y + u / 2;
        const tris =
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
            <rect x={x} y={y} width={u} height={u} fill={C.b} />
            {tris.map((p, i) => (
              <polygon key={i} points={p} fill={C.a} />
            ))}
          </g>
        );
      };
      return (
        <svg {...common}>
          <rect width={90} height={90} fill={C.b} />
          {qst(1, 0, "v", "t")}
          {qst(2, 1, "h", "r")}
          {qst(1, 2, "v", "btm")}
          {qst(0, 1, "h", "l")}
          <rect x={u} y={u} width={u} height={u} fill={C.d} />
        </svg>
      );
    }
    case "flying-geese":
      return (
        <svg {...common}>
          {[0, 45].map((y, i) => (
            <g key={i}>
              <rect x={0} y={y} width={90} height={45} fill={C.b} />
              <polygon points={`45,${y} 90,${y + 45} 0,${y + 45}`} fill={C.a} />
            </g>
          ))}
        </svg>
      );
    case "disappearing-nine-patch": {
      const u = 90 / 6;
      return (
        <svg {...common}>
          <rect width={90} height={90} fill={C.b} />
          <rect x={2 * u} y={2 * u} width={2 * u} height={2 * u} fill={C.a} />
          <rect x={0} y={0} width={u} height={u} fill={C.a} />
          <rect x={5 * u} y={0} width={u} height={u} fill={C.a} />
          <rect x={0} y={5 * u} width={u} height={u} fill={C.a} />
          <rect x={5 * u} y={5 * u} width={u} height={u} fill={C.a} />
        </svg>
      );
    }
    case "squares-on-point":
      return (
        <svg {...common}>
          <rect width={90} height={90} fill={C.b} />
          <polygon points="45,0 90,45 45,90 0,45" fill={C.a} />
        </svg>
      );
    case "plus-block":
      return (
        <svg {...common}>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={i * 30}
                y={j * 30}
                width={30}
                height={30}
                fill={i === 1 || j === 1 ? C.a : C.b}
              />
            )),
          )}
        </svg>
      );
    case "pinwheel": {
      // Traditional pinwheel: 2×2 HST grid where each blade right-angle
      // rotates clockwise around the block so all 4 blade hypotenuses meet
      // at the center — that's what creates the spinning illusion.
      return (
        <svg {...common}>
          {/* TL quadrant: blade right-angle at BL (0,45) */}
          <polygon points="0,0 0,45 45,45" fill={C.a} />
          <polygon points="0,0 45,0 45,45" fill={C.b} />
          {/* TR quadrant: blade right-angle at TL (45,0) */}
          <polygon points="45,0 90,0 45,45" fill={C.a} />
          <polygon points="90,0 90,45 45,45" fill={C.b} />
          {/* BR quadrant: blade right-angle at TR (90,45) */}
          <polygon points="45,45 90,45 90,90" fill={C.a} />
          <polygon points="45,45 90,90 45,90" fill={C.b} />
          {/* BL quadrant: blade right-angle at BR (45,90) */}
          <polygon points="45,45 45,90 0,90" fill={C.a} />
          <polygon points="0,45 45,45 0,90" fill={C.b} />
        </svg>
      );
    }
    case "churn-dash": {
      // 3×3 grid, unit=30. Corner HSTs: diagonal from outer corner toward
      // center, dark triangle on outer side. Side bars split into dark+light
      // halves with dark on the outside. Center solid dark.
      return (
        <svg {...common}>
          {/* TL corner HST */}
          <polygon points="0,0 30,0 0,30" fill={C.a} />
          <polygon points="30,0 30,30 0,30" fill={C.b} />
          {/* TR corner HST */}
          <polygon points="60,0 90,0 90,30" fill={C.a} />
          <polygon points="60,0 90,30 60,30" fill={C.b} />
          {/* BL corner HST */}
          <polygon points="0,60 30,90 0,90" fill={C.a} />
          <polygon points="0,60 30,60 30,90" fill={C.b} />
          {/* BR corner HST */}
          <polygon points="90,60 90,90 60,90" fill={C.a} />
          <polygon points="60,60 90,60 60,90" fill={C.b} />
          {/* Top bar — dark top, light bottom */}
          <rect x={30} y={0} width={30} height={15} fill={C.a} />
          <rect x={30} y={15} width={30} height={15} fill={C.b} />
          {/* Bottom bar — dark bottom, light top */}
          <rect x={30} y={75} width={30} height={15} fill={C.a} />
          <rect x={30} y={60} width={30} height={15} fill={C.b} />
          {/* Left bar — dark left, light right */}
          <rect x={0} y={30} width={15} height={30} fill={C.a} />
          <rect x={15} y={30} width={15} height={30} fill={C.b} />
          {/* Right bar — dark right, light left */}
          <rect x={75} y={30} width={15} height={30} fill={C.a} />
          <rect x={60} y={30} width={15} height={30} fill={C.b} />
          {/* Center */}
          <rect x={30} y={30} width={30} height={30} fill={C.a} />
      </svg>
      );
    }
    case "bear-paw":
      return (
        <svg {...common}>
          <BearPawBlockSvg pad={C.a} claw={C.b} bg={C.c} centerAccent={C.d} size={90} showGrid />
        </svg>
      );
    case "irish-chain": {
      // Show a 2x2 mini-quilt: chain block (9-patch CBC/BCB/CBC) alternating
      // with a plain background block — that's the visual signature.
      const half = 45;
      const u = half / 3;
      const chain = (ox: number, oy: number) => (
        <g key={`c-${ox}-${oy}`}>
          {[0, 1, 2].flatMap((j) =>
            [0, 1, 2].map((i) => (
              <rect
                key={`${i}-${j}`}
                x={ox + i * u}
                y={oy + j * u}
                width={u}
                height={u}
                fill={(i + j) % 2 === 0 ? C.b : C.a}
              />
            )),
          )}
        </g>
      );
      const plain = (ox: number, oy: number) => (
        <rect key={`p-${ox}-${oy}`} x={ox} y={oy} width={half} height={half} fill={C.a} />
      );
      return (
        <svg {...common}>
          {chain(0, 0)}
          {plain(half, 0)}
          {plain(0, half)}
          {chain(half, half)}
        </svg>
      );
    }
    case "sawtooth-star": {
      // 4×4 grid (u=22.5). Center 2×2 = contrasting center fabric. Four corners = bg.
      // 8 HST cells with star triangle at inner corner pointing toward center.
      const u = 90 / 4;
      const star = C.a;
      const bg = C.b;
      const center = C.c;
      // For each HST cell, "starCorner" = which corner the star (inner) triangle's right-angle sits at.
      const hsts: Array<[number, number, "TL" | "TR" | "BL" | "BR"]> = [
        [1, 0, "BL"], [2, 0, "BR"],
        [0, 1, "TR"], [3, 1, "TL"],
        [0, 2, "BR"], [3, 2, "BL"],
        [1, 3, "TL"], [2, 3, "TR"],
      ];
      const tri = (col: number, row: number, c: "TL" | "TR" | "BL" | "BR") => {
        const x = col * u, y = row * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const map = { TL: `${TL} ${TR} ${BL}`, TR: `${TL} ${TR} ${BR}`, BL: `${TL} ${BL} ${BR}`, BR: `${TR} ${BL} ${BR}` };
        return map[c];
      };
      const opp = { TL: "BR", BR: "TL", TR: "BL", BL: "TR" } as const;
      return (
        <svg {...common}>
          <rect width={90} height={90} fill={bg} />
          {/* Center 2×2 star square */}
          <rect x={u} y={u} width={2 * u} height={2 * u} fill={center} />
          {/* 8 HST cells */}
          {hsts.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={star} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </svg>
      );
    }
    case "friendship-star": {
      // 3×3 grid. Center = center fabric, 4 corners = bg, 4 edge cells = HST
      // with rotational orientation matching the classic Friendship Star.
      const u = 90 / 3;
      const center = C.d; // pink — matches on-brand fabric token palette
      const bg = C.b;     // yellow
      const points = C.a; // blue
      // Each HST cell: [col, row, starCorner] — corner where the points
      // triangle's right angle sits (rotational windmill orientation).
      const hsts: Array<[number, number, "TL" | "TR" | "BL" | "BR"]> = [
        [1, 0, "BR"], // top edge
        [2, 1, "BL"], // right edge
        [1, 2, "TL"], // bottom edge
        [0, 1, "TR"], // left edge
      ];
      const opp = { TL: "BR", BR: "TL", TR: "BL", BL: "TR" } as const;
      const tri = (col: number, row: number, c: "TL" | "TR" | "BL" | "BR") => {
        const x = col * u, y = row * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        const map = { TL: `${TL} ${TR} ${BL}`, TR: `${TL} ${TR} ${BR}`, BL: `${TL} ${BL} ${BR}`, BR: `${TR} ${BL} ${BR}` };
        return map[c];
      };
      return (
        <svg {...common}>
          <rect width={90} height={90} fill={bg} />
          <rect x={u} y={u} width={u} height={u} fill={center} />
          {hsts.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={points} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </svg>
      );
    }
    case "snowball-block": {
      // 2×2 mini-grid of square blocks with A/B swapped on every other cell —
      // demonstrates the checkerboard alternation on both axes (matches the
      // red/white reference image). Each block is a 45×45 octagon (clipped
      // corners reveal the accent fabric).
      const S = 45;
      const c = 13; // ~29% corner accent — matches MiniBlock/PatternDiagram
      const block = (gx: number, gy: number, main: string, accent: string, key: string) => {
        const ox = gx * S;
        const oy = gy * S;
        const pts = [
          `${ox + c},${oy}`,
          `${ox + S - c},${oy}`,
          `${ox + S},${oy + c}`,
          `${ox + S},${oy + S - c}`,
          `${ox + S - c},${oy + S}`,
          `${ox + c},${oy + S}`,
          `${ox},${oy + S - c}`,
          `${ox},${oy + c}`,
        ].join(" ");
        return (
          <g key={key}>
            <rect x={ox} y={oy} width={S} height={S} fill={accent} />
            <polygon points={pts} fill={main} />
          </g>
        );
      };
      return (
        <svg {...common}>
          {[0, 1].flatMap((r) =>
            [0, 1].map((cIdx) => {
              const swap = (r + cIdx) % 2 === 1;
              const main = swap ? C.b : C.a;
              const accent = swap ? C.a : C.b;
              return block(cIdx, r, main, accent, `${r}-${cIdx}`);
            }),
          )}
        </svg>
      );
    }
    case "four-patch": {
      // Simple 2×2 grid using four distinct demo colors to clearly show
      // this block supports a unique fabric in every position.
      // TL=blue (A), TR=yellow (B), BL=pink (D), BR=green (C) per spec.
      return (
        <svg {...common}>
          <rect x={0} y={0} width={45} height={45} fill={C.a} />
          <rect x={45} y={0} width={45} height={45} fill={C.b} />
          <rect x={0} y={45} width={45} height={45} fill={C.d} />
          <rect x={45} y={45} width={45} height={45} fill={C.c} />
        </svg>
      );
    }
    case "streak-of-lightning": {
      // Exact chevron geometry: background triangles form the two upper
      // outside corners and two lower center triangles; stripe triangles form
      // the peak at top-center and valley opening at bottom-center.
      return (
        <svg {...common}>
          {/* Top-left quadrant */}
          <polygon points="0,0 45,0 0,45" fill={C.b} />
          <polygon points="45,0 45,45 0,45" fill={C.a} />
          {/* Top-right quadrant */}
          <polygon points="45,0 90,0 90,45" fill={C.b} />
          <polygon points="45,0 90,45 45,45" fill={C.a} />
          {/* Bottom-left quadrant */}
          <polygon points="0,45 45,45 0,90" fill={C.a} />
          <polygon points="45,45 45,90 0,90" fill={C.b} />
          {/* Bottom-right quadrant */}
          <polygon points="45,45 90,45 90,90" fill={C.a} />
          <polygon points="45,45 45,90 90,90" fill={C.b} />
          <g stroke="white" strokeWidth={1.5} opacity={0.9}>
            <line x1={45} y1={0} x2={45} y2={90} />
            <line x1={0} y1={45} x2={90} y2={45} />
          </g>
        </svg>
      );
    }
    case "bow-tie": {
      // 2×2 grid of plain squares with a small on-point knot at the seam
      // intersection. A on the TL/BR diagonal (blue), B on the TR/BL diagonal
      // (yellow), knot in pink for visual distinction.
      return (
        <svg {...common}>
          <rect x={0} y={0} width={45} height={45} fill={C.a} />
          <rect x={45} y={0} width={45} height={45} fill={C.b} />
          <rect x={0} y={45} width={45} height={45} fill={C.b} />
          <rect x={45} y={45} width={45} height={45} fill={C.a} />
          {/* Knot: diamond diagonal = 45 (50% of block / 100% of patch),
              corners touching the midpoint of each inner patch edge — matches
              the larger preview/diagram rendering. */}
          <polygon points="45,22.5 67.5,45 45,67.5 22.5,45" fill={C.d} />

        </svg>
      );
    }
    case "shoofly": {
      // Classic Shoofly: 3×3 grid, 4 accent-inward HSTs at corners, 4 plain
      // background side squares, 1 accent center square. Brand palette:
      // background = blue (A), accent = pink (D) for maximum contrast in the
      // small tile view.
      const u = 90 / 3;
      const bg = C.a;
      const accent = C.d;
      // HST corner triangle: accent triangle sits in the corner nearest the
      // block CENTER (i.e. pointing inward). Corners: TL cell → accent in BR;
      // TR cell → accent in BL; BL cell → accent in TR; BR cell → accent in TL.
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
        <svg {...common}>
          <rect width={90} height={90} fill={bg} />
          {/* Center accent square */}
          <rect x={u} y={u} width={u} height={u} fill={accent} />
          {/* HST corners — accent triangle pointing inward */}
          {corners.map(([c, r, sc]) => (
            <g key={`${c}-${r}`}>
              <polygon points={tri(c, r, sc)} fill={accent} />
              <polygon points={tri(c, r, opp[sc])} fill={bg} />
            </g>
          ))}
        </svg>
      );
    }
    case "jacobs-ladder": {
      // 6×6 grid (u=90/6=15). 3×3 arrangement of 2u × 2u sub-blocks:
      //   FP at (r+c)%2 == 0 (5 sub-blocks: corners + center)
      //   HST at (r+c)%2 == 1 (4 sub-blocks: edges)
      // FP: 2×2 checkerboard with A (dark) on backslash cells, B (light) on
      //     antidiagonal cells.
      // HST: 2u square divided by backslash. Ladder accent (C) on the
      //     UPPER-RIGHT half (TL-TR-BR). Background (B) on the LOWER-LEFT
      //     half (TL-BL-BR). All 4 HSTs identical — combined with the FP
      //     checkerboards, the accent triangles + dark FP cells form the
      //     characteristic corner-to-corner ladder band.
      const u = 90 / 6;
      const dark = C.a;      // Fabric A
      const light = C.b;     // Fabric B (also HST background)
      const ladder = C.d;    // Fabric C (ladder accent — brand pink for pop)
      const nodes: React.ReactNode[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = 2 * c * u, y = 2 * r * u;
          if ((r + c) % 2 === 0) {
            // Four-patch
            nodes.push(
              <g key={`fp-${r}-${c}`}>
                <rect x={x} y={y} width={u} height={u} fill={dark} />
                <rect x={x + u} y={y} width={u} height={u} fill={light} />
                <rect x={x} y={y + u} width={u} height={u} fill={light} />
                <rect x={x + u} y={y + u} width={u} height={u} fill={dark} />
              </g>,
            );
          } else {
            // HST — backslash split; ladder in upper-right, bg in lower-left.
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
      return <svg {...common}>{nodes}</svg>;
    }
    case "autumn-tints": {
      // 4×4 grid (u = 90/4 = 22.5). Layout mirrors PatternDiagram exactly.
      //   Row 0: A A B D
      //   Row 1: A A C B
      //   Row 2: B C A A
      //   Row 3: D B A A
      const u = 90 / 4;
      const layout: string[][] = [
        ["A", "A", "B", "D"],
        ["A", "A", "C", "B"],
        ["B", "C", "A", "A"],
        ["D", "B", "A", "A"],
      ];
      const fillMap: Record<string, string> = { A: C.a, B: C.b, C: C.c, D: C.d };
      return (
        <svg {...common}>
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
        </svg>
      );
    }
    case "card-trick": {
      // 3×3 grid. 4 corner HSTs, 4 edge 3-triangle QSTs, 1 center 4-triangle QST.
      // See PatternDiagram card-trick case for the shared geometry table.
      const bg = "var(--fabric-e)";
      const fills: Record<string, string> = { A: C.a, B: C.b, C: C.c, D: C.d, bg };
      const N = 90, U = N / 3;
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
        <svg {...common}>
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
        </svg>
      );
    }
    case "oh-susannah": {
      // 4×4 grid (u = 90/4 = 22.5). Plain squares around the outside;
      // 4 HSTs in the center 2×2 with A at the outer corner and C toward
      // the block center — the C triangles form a diamond in the middle.
      const u = 90 / 4;
      const bg = C.c;
      const A = C.a;
      const B = C.b;
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
      const triPts = (r: number, c: number, corner: "TL" | "TR" | "BL" | "BR", which: "A" | "C") => {
        const x = c * u, y = r * u;
        const TL = `${x},${y}`, TR = `${x + u},${y}`, BL = `${x},${y + u}`, BR = `${x + u},${y + u}`;
        // Triangle A = corner + two adjacent corners; Triangle C = opposite corner + same two adjacent.
        const adj = { TL: [TR, BL], TR: [TL, BR], BL: [TL, BR], BR: [TR, BL] } as const;
        const opp = { TL: BR, TR: BL, BL: TR, BR: TL } as const;
        const cornerPt = { TL, TR, BL, BR }[corner];
        const [a1, a2] = adj[corner];
        return which === "A"
          ? `${cornerPt} ${a1} ${a2}`
          : `${opp[corner]} ${a1} ${a2}`;
      };
      return (
        <svg {...common}>
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
        </svg>
      );
    }
    case "twin-star": {
      // 3×3 grid (u = 90/3 = 30). Corners + center plain background;
      // 4 edge cells are rotated 3-triangle units (A large + B small + D
      // small). Background (Fabric C) never appears inside edge units.
      const u = 90 / 3;
      const A = C.a, B = C.b, D = C.d, bg = C.c;
      const CORNERS = ["TL", "TR", "BR", "BL"] as const;
      const rot = (pt: string, n: number) => {
        if (pt === "CC") return pt;
        const i = CORNERS.indexOf(pt as (typeof CORNERS)[number]);
        return CORNERS[(i + n) % 4];
      };
      const cellPts = (r: number, c: number) => {
        const x = c * u, y = r * u;
        return {
          TL: `${x},${y}`, TR: `${x + u},${y}`, BR: `${x + u},${y + u}`,
          BL: `${x},${y + u}`, CC: `${x + u / 2},${y + u / 2}`,
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
        <svg {...common}>
          {plainCells.map(([r, c]) => (
            <rect key={`p-${r}-${c}`} x={c * u} y={r * u} width={u} height={u} fill={bg} />
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
        </svg>
      );
    }
  }
}



