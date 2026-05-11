/**
 * Traditional Bear Paw block SVG.
 *
 * The block is a 3×3 arrangement of major components:
 *   [PAW][V-SASH][PAW]
 *   [H-SASH][CENTER][H-SASH]
 *   [PAW][V-SASH][PAW]
 *
 * Each PAW UNIT is itself a 3×3 mini-grid where a 2×2 pad is in the INNER
 * (center-facing) corner of the paw, an L of 4 HST claws runs along the two
 * OUTER edges only, and a single bg corner square sits at the outermost
 * corner. The background half of every HST points inward toward the sashing.
 * This file is the single source of truth for that traditional construction.
 *
 * Geometry: the block is sized so paw size : sashing : paw = 3u : s : 3u
 * where u = 7B/48 and s = B/8. With B=12 this gives 5.25" + 1.5" + 5.25"
 * = 12" exactly. We use the same ratios in SVG units: paw fraction = 0.4375
 * (= 3u/B = 21/48), sash fraction = 0.125 (= s/B = 6/48).
 */

type Orient = "tl" | "tr" | "bl" | "br";
// Corner where the yellow (claw) right-angle sits in the HST cell.
type Corner = "tl" | "tr" | "bl" | "br";

interface BearPawBlockSvgProps {
  pad: string;
  claw: string;
  bg: string;
  centerAccent: string;
  size?: number;
  showGrid?: boolean;
  gridStroke?: string;
  gridStrokeWidth?: number;
  gridOpacity?: number;
}

// For each paw orientation, declare:
//   bgCorner = which (row,col) cell holds the small bg corner square
//   pad      = which 2×2 cell range is the paw pad (rRange, cRange)
//   claws    = list of (row, col, clawRightAngleCornerOfCell) for the 4 HST claw cells.
//   The "corner" is where the yellow (claw) right angle sits inside the HST cell;
//   the background half is the opposite triangle. Right angle points toward the pad.
const PAW_LAYOUT: Record<
  Orient,
  {
    bgCorner: [number, number];
    padR: [number, number];
    padC: [number, number];
    claws: Array<[number, number, Corner]>;
  }
> = {
  tl: {
    bgCorner: [0, 0],
    padR: [1, 2],
    padC: [1, 2],
    claws: [
      [0, 1, "bl"],
      [0, 2, "bl"],
      [1, 0, "tr"],
      [2, 0, "tr"],
    ],
  },
  tr: {
    bgCorner: [0, 2],
    padR: [1, 2],
    padC: [0, 1],
    claws: [
      [0, 0, "br"],
      [0, 1, "br"],
      [1, 2, "tl"],
      [2, 2, "tl"],
    ],
  },
  bl: {
    bgCorner: [2, 0],
    padR: [0, 1],
    padC: [1, 2],
    claws: [
      [2, 1, "tl"],
      [2, 2, "tl"],
      [0, 0, "br"],
      [1, 0, "br"],
    ],
  },
  br: {
    bgCorner: [2, 2],
    padR: [0, 1],
    padC: [0, 1],
    claws: [
      [0, 2, "bl"],
      [1, 2, "bl"],
      [2, 0, "tr"],
      [2, 1, "tr"],
    ],
  },
};

function hstPoints(x: number, y: number, cu: number, corner: Corner) {
  const tl = `${x},${y}`;
  const tr = `${x + cu},${y}`;
  const bl = `${x},${y + cu}`;
  const br = `${x + cu},${y + cu}`;
  switch (corner) {
    case "tl":
      return { claw: `${tl} ${tr} ${bl}`, bg: `${tr} ${br} ${bl}` };
    case "tr":
      return { claw: `${tl} ${tr} ${br}`, bg: `${tl} ${br} ${bl}` };
    case "bl":
      return { claw: `${tl} ${bl} ${br}`, bg: `${tl} ${tr} ${br}` };
    case "br":
      return { claw: `${tr} ${br} ${bl}`, bg: `${tl} ${tr} ${bl}` };
  }
}


function PawUnit({
  x,
  y,
  size,
  orient,
  pad,
  claw,
  bg,
  showGrid,
  gridStroke,
  gridStrokeWidth,
  gridOpacity,
}: {
  x: number;
  y: number;
  size: number;
  orient: Orient;
  pad: string;
  claw: string;
  bg: string;
  showGrid: boolean;
  gridStroke: string;
  gridStrokeWidth: number;
  gridOpacity: number;
}) {
  const cu = size / 3;
  const layout = PAW_LAYOUT[orient];
  const padX = x + layout.padC[0] * cu;
  const padY = y + layout.padR[0] * cu;
  const padW = (layout.padC[1] - layout.padC[0] + 1) * cu;
  const padH = (layout.padR[1] - layout.padR[0] + 1) * cu;
  const [bcR, bcC] = layout.bgCorner;

  return (
    <g>
      {/* Pad (2×2 inside the paw) */}
      <rect x={padX} y={padY} width={padW} height={padH} fill={pad} />
      {/* Background corner square */}
      <rect x={x + bcC * cu} y={y + bcR * cu} width={cu} height={cu} fill={bg} />
      {/* HST claw cells */}
      {layout.claws.map(([r, c, corner], i) => {
        const cx = x + c * cu;
        const cy = y + r * cu;
        const pts = hstPoints(cx, cy, cu, corner);
        return (
          <g key={`claw-${i}`}>
            <polygon points={pts.bg} fill={bg} />
            <polygon points={pts.claw} fill={claw} />
          </g>
        );
      })}
      {showGrid && (() => {
        // Draw cell grid lines, but skip segments that fall inside the 2×2
        // pad (the pad is a single piece of fabric, so no internal seam).
        const padX2 = padX + padW;
        const padY2 = padY + padH;
        const vSegs = (lx: number) => {
          if (lx > padX && lx < padX2) {
            return [
              [y, padY],
              [padY2, y + size],
            ] as const;
          }
          return [[y, y + size]] as const;
        };
        const hSegs = (ly: number) => {
          if (ly > padY && ly < padY2) {
            return [
              [x, padX],
              [padX2, x + size],
            ] as const;
          }
          return [[x, x + size]] as const;
        };
        const vLines = [x + cu, x + 2 * cu];
        const hLines = [y + cu, y + 2 * cu];
        return (
          <g
            stroke={gridStroke}
            strokeWidth={gridStrokeWidth}
            opacity={gridOpacity}
            fill="none"
          >
            {vLines.flatMap((lx, i) =>
              vSegs(lx).map(([y1, y2], j) => (
                <line key={`v-${i}-${j}`} x1={lx} y1={y1} x2={lx} y2={y2} />
              ))
            )}
            {hLines.flatMap((ly, i) =>
              hSegs(ly).map(([x1, x2], j) => (
                <line key={`h-${i}-${j}`} x1={x1} y1={ly} x2={x2} y2={ly} />
              ))
            )}
          </g>
        );
      })()}
    </g>
  );
}

export function BearPawBlockSvg({
  pad,
  claw,
  bg,
  centerAccent,
  size = 200,
  showGrid = false,
  gridStroke = "white",
  gridStrokeWidth = 1,
  gridOpacity = 0.55,
}: BearPawBlockSvgProps) {
  // Block layout: paw : sash : paw → fractions 0.4375 / 0.125 / 0.4375.
  const pawSize = size * 0.4375;
  const sash = size * 0.125;
  const pawA = 0; // first paw start (x or y)
  const pawB = pawSize + sash; // second paw start
  // Sashing + center fill the whole block in bg first; then we overlay paws.
  return (
    <>
      <rect x={0} y={0} width={size} height={size} fill={bg} />
      <PawUnit
        x={pawA}
        y={pawA}
        size={pawSize}
        orient="tl"
        pad={pad}
        claw={claw}
        bg={bg}
        showGrid={showGrid}
        gridStroke={gridStroke}
        gridStrokeWidth={gridStrokeWidth}
        gridOpacity={gridOpacity}
      />
      <PawUnit
        x={pawB}
        y={pawA}
        size={pawSize}
        orient="tr"
        pad={pad}
        claw={claw}
        bg={bg}
        showGrid={showGrid}
        gridStroke={gridStroke}
        gridStrokeWidth={gridStrokeWidth}
        gridOpacity={gridOpacity}
      />
      <PawUnit
        x={pawA}
        y={pawB}
        size={pawSize}
        orient="bl"
        pad={pad}
        claw={claw}
        bg={bg}
        showGrid={showGrid}
        gridStroke={gridStroke}
        gridStrokeWidth={gridStrokeWidth}
        gridOpacity={gridOpacity}
      />
      <PawUnit
        x={pawB}
        y={pawB}
        size={pawSize}
        orient="br"
        pad={pad}
        claw={claw}
        bg={bg}
        showGrid={showGrid}
        gridStroke={gridStroke}
        gridStrokeWidth={gridStrokeWidth}
        gridOpacity={gridOpacity}
      />
      {/* Center connector square — separate fabric option from the paw claws. */}
      <rect x={pawSize} y={pawSize} width={sash} height={sash} fill={centerAccent} />
      {showGrid && (
        <g
          stroke={gridStroke}
          strokeWidth={gridStrokeWidth}
          opacity={gridOpacity}
          fill="none"
        >
          {/* Outline major sashing channels */}
          <line x1={pawSize} y1={0} x2={pawSize} y2={size} />
          <line x1={pawSize + sash} y1={0} x2={pawSize + sash} y2={size} />
          <line x1={0} y1={pawSize} x2={size} y2={pawSize} />
          <line x1={0} y1={pawSize + sash} x2={size} y2={pawSize + sash} />
        </g>
      )}
    </>
  );
}
