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
  }
}
