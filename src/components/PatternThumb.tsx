import type { PatternId } from "@/lib/planner-store";

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

export function PatternThumb({ pattern, size = 96 }: Props) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 90 90" } as const;
  switch (pattern) {
    case "simple-squares":
      return (
        <svg {...common} aria-hidden>
          {[0, 22.5, 45, 67.5].flatMap((y) =>
            [0, 22.5, 45, 67.5].map((x) => (
              <rect key={`${x}-${y}`} x={x + 1} y={y + 1} width={20.5} height={20.5} fill={C.a} />
            )),
          )}
        </svg>
      );
    case "nine-patch":
      return (
        <svg {...common} aria-hidden>
          {[0, 30, 60].flatMap((y, j) =>
            [0, 30, 60].map((x, i) => (
              <rect key={`${i}-${j}`} x={x + 1} y={y + 1} width={28} height={28} fill={(i + j) % 2 === 0 ? C.a : C.b} />
            )),
          )}
        </svg>
      );
    case "hst":
      return (
        <svg {...common} aria-hidden>
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
        <svg {...common} aria-hidden>
          {[0, 30, 60].map((x, i) => (
            <g key={i}>
              <rect x={x} y={0} width={30} height={30} fill={C.a} />
              <rect x={x} y={30} width={30} height={30} fill={C.b} />
              <rect x={x} y={60} width={30} height={30} fill={C.d} />
            </g>
          ))}
        </svg>
      );
    case "log-cabin":
      return (
        <svg {...common} aria-hidden>
          <rect x={0} y={0} width={90} height={90} fill={C.b} />
          <rect x={15} y={15} width={60} height={60} fill={C.a} />
          <rect x={30} y={30} width={30} height={30} fill={C.d} />
        </svg>
      );
    case "ohio-star":
      return (
        <svg {...common} aria-hidden>
          <rect width={90} height={90} fill={C.b} />
          <polygon points="45,5 60,30 30,30" fill={C.a} />
          <polygon points="85,45 60,60 60,30" fill={C.a} />
          <polygon points="45,85 30,60 60,60" fill={C.a} />
          <polygon points="5,45 30,30 30,60" fill={C.a} />
          <rect x={30} y={30} width={30} height={30} fill={C.d} />
        </svg>
      );
    case "flying-geese":
      return (
        <svg {...common} aria-hidden>
          {[0, 22.5, 45, 67.5].map((y, i) => (
            <g key={i}>
              <rect x={0} y={y} width={90} height={22.5} fill={C.b} />
              <polygon points={`45,${y + 2} 88,${y + 21} 2,${y + 21}`} fill={C.a} />
            </g>
          ))}
        </svg>
      );
    case "disappearing-nine-patch":
      return (
        <svg {...common} aria-hidden>
          {[0, 30, 60].flatMap((y, j) =>
            [0, 30, 60].map((x, i) => (
              <rect key={`${i}-${j}`} x={x + 1} y={y + 1} width={28} height={28} fill={(i + j) % 2 === 0 ? C.a : C.b} />
            )),
          )}
          <line x1={45} y1={0} x2={45} y2={90} stroke="white" strokeWidth={2} />
          <line x1={0} y1={45} x2={90} y2={45} stroke="white" strokeWidth={2} />
        </svg>
      );
    case "squares-on-point":
      return (
        <svg {...common} aria-hidden>
          <rect width={90} height={90} fill={C.b} />
          {[22.5, 67.5].flatMap((cy) =>
            [22.5, 67.5].map((cx) => (
              <polygon
                key={`${cx}-${cy}`}
                points={`${cx},${cy - 14} ${cx + 14},${cy} ${cx},${cy + 14} ${cx - 14},${cy}`}
                fill={C.a}
              />
            )),
          )}
        </svg>
      );
    case "plus-block":
      return (
        <svg {...common} aria-hidden>
          <rect width={90} height={90} fill={C.b} />
          <rect x={30} y={0} width={30} height={90} fill={C.a} />
          <rect x={0} y={30} width={90} height={30} fill={C.a} />
        </svg>
      );
  }
}
