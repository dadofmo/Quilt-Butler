import type { PatternId } from "@/lib/planner-store";

/**
 * Difficulty rating per pattern, on a 1–5 scale expressed as "yards".
 * 1 yard = beginner-friendly, 5 yards = most challenging.
 */
export const PATTERN_DIFFICULTY: Record<PatternId, 1 | 2 | 3 | 4 | 5> = {
  "simple-squares": 1,
  "rail-fence": 1,
  "nine-patch": 2,
  "squares-on-point": 2,
  "plus-block": 2,
  hst: 3,
  "flying-geese": 3,
  pinwheel: 3,
  "disappearing-nine-patch": 4,
  "ohio-star": 4,
  "log-cabin": 5,
  "churn-dash": 3,
  "bear-paw": 4,
  "irish-chain": 2,
};

interface Props {
  rating: 1 | 2 | 3 | 4 | 5;
  size?: number;
  className?: string;
}

/**
 * A little fabric-bolt icon. The fabric "unrolls" further to the right as
 * the difficulty rating increases (1 = barely unrolled, 5 = fully unrolled).
 */
export function FabricRollIcon({ rating, size = 28, className }: Props) {
  // Unroll length scales with rating. At 1 yard the tail is short; at 5 yards
  // the fabric streams nearly all the way across the icon.
  const tailLengths = { 1: 6, 2: 12, 3: 20, 4: 28, 5: 36 } as const;
  const tail = tailLengths[rating];

  // The bolt sits on the left; tail flows to the right.
  const boltCx = 12;
  const boltCy = 24;
  const boltR = 8;
  const tailY = boltCy - 4;
  const tailH = 8;
  const tailX = boltCx;

  return (
    <svg
      width={size}
      height={size * (40 / 56)}
      viewBox="0 0 56 40"
      role="img"
      aria-label={`Difficulty: ${rating} of 5`}
      className={className}
    >
      {/* Unrolled fabric tail */}
      <rect
        x={tailX}
        y={tailY}
        width={tail}
        height={tailH}
        fill="var(--primary)"
        opacity="0.85"
        rx="1"
      />
      {/* Subtle stripe on the tail to read as fabric */}
      <line
        x1={tailX}
        y1={boltCy}
        x2={tailX + tail}
        y2={boltCy}
        stroke="var(--primary-foreground)"
        strokeWidth="0.5"
        opacity="0.5"
      />
      {/* Bolt body (the rolled-up fabric) */}
      <circle
        cx={boltCx}
        cy={boltCy}
        r={boltR}
        fill="var(--primary)"
        stroke="var(--primary-foreground)"
        strokeWidth="0.75"
      />
      {/* Inner spool ring */}
      <circle
        cx={boltCx}
        cy={boltCy}
        r={boltR - 3}
        fill="none"
        stroke="var(--primary-foreground)"
        strokeWidth="0.75"
        opacity="0.7"
      />
      {/* Center spool dot */}
      <circle cx={boltCx} cy={boltCy} r="1" fill="var(--primary-foreground)" />
    </svg>
  );
}
