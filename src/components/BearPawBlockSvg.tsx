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
type Edge = "top" | "right" | "bottom" | "left";

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
//   claws    = list of (row, col, outwardEdgeOfCell) for the 4 HST claw cells
const PAW_LAYOUT: Record<
  Orient,
  {
    bgCorner: [number, number];
    padR: [number, number];
    padC: [number, number];
    claws: Array<[number, number, Edge]>;
  }
> = {
  tl: {
    bgCorner: [0, 0],
    padR: [1, 2],
    padC: [1, 2],
    claws: [
      [0, 1, "bottom"],
      [0, 2, "bottom"],
      [1, 0, "right"],
      [2, 0, "right"],
    ],
  },
  tr: {
    bgCorner: [0, 2],
    padR: [1, 2],
    padC: [0, 1],
    claws: [
      [0, 0, "bottom"],
      [0, 1, "bottom"],
      [1, 2, "left"],
      [2, 2, "left"],
    ],
  },
  bl: {
    bgCorner: [2, 0],
    padR: [0, 1],
    padC: [1, 2],
    claws: [
      [2, 1, "top"],
      [2, 2, "top"],
      [0, 0, "right"],
      [1, 0, "right"],
    ],
  },
  br: {
    bgCorner: [2, 2],
    padR: [0, 1],
    padC: [0, 1],
    claws: [
      [0, 2, "left"],
      [1, 2, "left"],
      [2, 0, "top"],
      [2, 1, "top"],
    ],
  },
};

function hstPoints(x: number, y: number, cu: number, edge: Edge) {
  const tl = `${x},${y}`;
  const tr = `${x + cu},${y}`;
  const bl = `${x},${y + cu}`;
  const br = `${x + cu},${y + cu}`;
  switch (edge) {
    case "top":
      return { claw: `${tl} ${tr} ${br}`, bg: `${tl} ${bl} ${br}` };
    case "right":
      return { claw: `${tr} ${br} ${bl}`, bg: `${tl} ${tr} ${bl}` };
    case "bottom":
      return { claw: `${bl} ${br} ${tr}`, bg: `${tl} ${tr} ${bl}` };
    case "left":
      return { claw: `${tl} ${bl} ${br}`, bg: `${tl} ${tr} ${br}` };
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
      {showGrid && (
        <g
          stroke={gridStroke}
          strokeWidth={gridStrokeWidth}
          opacity={gridOpacity}
          fill="none"
        >
          <line x1={x + cu} y1={y} x2={x + cu} y2={y + size} />
          <line x1={x + 2 * cu} y1={y} x2={x + 2 * cu} y2={y + size} />
          <line x1={x} y1={y + cu} x2={x + size} y2={y + cu} />
          <line x1={x} y1={y + 2 * cu} x2={x + size} y2={y + 2 * cu} />
        </g>
      )}
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
