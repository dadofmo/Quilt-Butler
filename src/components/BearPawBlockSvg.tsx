type Corner = "tl" | "tr" | "bl" | "br";

interface BearPawBlockSvgProps {
  pad: string;
  claw: string;
  bg: string;
  size?: number;
  showGrid?: boolean;
  gridStroke?: string;
  gridStrokeWidth?: number;
  gridOpacity?: number;
}

const CORNER_CELLS = [
  { row: 0, col: 0 },
  { row: 0, col: 3 },
  { row: 3, col: 0 },
  { row: 3, col: 3 },
] as const;

const HST_CELLS = [
  { row: 0, col: 1, outer: "tl" },
  { row: 0, col: 2, outer: "tr" },
  { row: 1, col: 0, outer: "tl" },
  { row: 1, col: 3, outer: "tr" },
  { row: 2, col: 0, outer: "bl" },
  { row: 2, col: 3, outer: "br" },
  { row: 3, col: 1, outer: "bl" },
  { row: 3, col: 2, outer: "br" },
] as const satisfies ReadonlyArray<{ row: number; col: number; outer: Corner }>;

function hstPoints(x: number, y: number, u: number, outer: Corner) {
  const tl = `${x},${y}`;
  const tr = `${x + u},${y}`;
  const bl = `${x},${y + u}`;
  const br = `${x + u},${y + u}`;

  switch (outer) {
    case "tl":
      return { bg: `${tl} ${tr} ${bl}`, claw: `${br} ${tr} ${bl}` };
    case "tr":
      return { bg: `${tr} ${tl} ${br}`, claw: `${bl} ${tl} ${br}` };
    case "bl":
      return { bg: `${bl} ${tl} ${br}`, claw: `${tr} ${tl} ${br}` };
    case "br":
      return { bg: `${br} ${tr} ${bl}`, claw: `${tl} ${tr} ${bl}` };
  }
}

export function BearPawBlockSvg({
  pad,
  claw,
  bg,
  size = 200,
  showGrid = false,
  gridStroke = "white",
  gridStrokeWidth = 1,
  gridOpacity = 0.6,
}: BearPawBlockSvgProps) {
  const u = size / 4;

  return (
    <>
      <rect x={u} y={u} width={2 * u} height={2 * u} fill={pad} />

      {CORNER_CELLS.map(({ row, col }) => (
        <rect key={`corner-${row}-${col}`} x={col * u} y={row * u} width={u} height={u} fill={bg} />
      ))}

      {HST_CELLS.map(({ row, col, outer }) => {
        const x = col * u;
        const y = row * u;
        const points = hstPoints(x, y, u, outer);

        return (
          <g key={`hst-${row}-${col}`}>
            <polygon points={points.bg} fill={bg} />
            <polygon points={points.claw} fill={claw} />
          </g>
        );
      })}

      {showGrid && (
        <g stroke={gridStroke} strokeWidth={gridStrokeWidth} opacity={gridOpacity}>
          <line x1={u} y1={0} x2={u} y2={size} />
          <line x1={2 * u} y1={0} x2={2 * u} y2={size} />
          <line x1={3 * u} y1={0} x2={3 * u} y2={size} />
          <line x1={0} y1={u} x2={size} y2={u} />
          <line x1={0} y1={2 * u} x2={size} y2={2 * u} />
          <line x1={0} y1={3 * u} x2={size} y2={3 * u} />
        </g>
      )}
    </>
  );
}