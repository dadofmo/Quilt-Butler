import { useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_FABRIC_KEYS,
  FABRIC_COLORS,
  type FabricKey,
} from "@/lib/planner-store";

/**
 * Fabric tiling for the HTML patchwork preview. Mirrors the behavior of
 * `FabricPatternDefs` (used by SVG diagrams): the photo tiles at ~40% of
 * a block and repeats — so the motif is the same physical size in the
 * border, sashing, and every square, just like cutting from a real bolt
 * of fabric. Never use `background-size: cover` here — it stretches the
 * photo and produces blown-up/distorted motifs. The tile size is passed
 * in dynamically (derived from the measured block pixel size) so the
 * motif scales with the preview instead of overflowing tiny cells.
 */
function fabricTileStyle(
  key: FabricKey,
  tilePx: number,
  photos?: Partial<Record<FabricKey, string>>,
): React.CSSProperties {
  const url = photos?.[key];
  if (url) {
    return {
      backgroundColor: FABRIC_COLORS[key],
      backgroundImage: `url(${url})`,
      backgroundRepeat: "repeat",
      backgroundSize: `${tilePx}px ${tilePx}px`,
      backgroundPosition: "0 0",
    };
  }
  return { background: FABRIC_COLORS[key] };
}

interface Props {
  /** Number of distinct fabrics to cycle through (2–12). */
  fabricCount: number;
  /** Quilt size — used with blockSize/borderWidth to match real layout. */
  quiltWidth: number;
  quiltHeight: number;
  /** Block size (inches) — drives how many blocks fit across/down. */
  blockSize: number;
  /** Border width (inches) — subtracted from quilt size before dividing. */
  borderWidth: number;
  /** Per-cell assignments, keyed "r,c". */
  grid: Record<string, FabricKey>;
  onChange: (next: Record<string, FabricKey>) => void;
  /** Optional uploaded photos per fabric — overrides solid color in cells. */
  photos?: Partial<Record<FabricKey, string>>;
  /** Fabric assigned to the border — drives the visible frame around the grid. */
  borderFabric?: FabricKey;
  /** Optional sashing width (in) between blocks. 0 = no sashing. */
  sashingWidth?: number;
  /** Sashing fabric — only used when sashingWidth > 0. */
  sashingFabric?: FabricKey;
}

/**
 * Compute the grid shape based on the REAL block layout — how many whole
 * blocks fit across and down inside the inner (un-bordered) area. That way
 * the preview matches what the quilt will actually look like.
 */
export function computeGridShape(
  quiltWidth: number,
  quiltHeight: number,
  blockSize: number,
  borderWidth: number,
) {
  const innerW = Math.max(0, quiltWidth - 2 * borderWidth);
  const innerH = Math.max(0, quiltHeight - 2 * borderWidth);
  const safeBlock = Math.max(0.0001, blockSize);
  const cols = Math.max(1, Math.floor(innerW / safeBlock));
  const rows = Math.max(1, Math.floor(innerH / safeBlock));
  return { rows, cols };
}

/**
 * Tap-to-cycle patchwork preview. Each cell shows the currently assigned
 * fabric color; tapping cycles to the next fabric in the active palette
 * (A through the Nth fabric, wrapping back to A).
 *
 * The grid mirrors the actual quilt layout: blocks-across × blocks-down
 * given the user's chosen block size and border width.
 */
export function PatchworkPreview({
  fabricCount,
  quiltWidth,
  quiltHeight,
  blockSize,
  borderWidth,
  grid,
  onChange,
  photos,
  borderFabric,
  sashingWidth = 0,
  sashingFabric,
}: Props) {
  const { rows, cols } = useMemo(
    () => computeGridShape(quiltWidth, quiltHeight, blockSize, borderWidth),
    [quiltWidth, quiltHeight, blockSize, borderWidth],
  );

  const palette: FabricKey[] = ALL_FABRIC_KEYS.slice(
    0,
    Math.max(2, Math.min(12, fabricCount)),
  );

  const cellFor = (r: number, c: number): FabricKey => {
    const key = `${r},${c}`;
    if (grid[key] && palette.includes(grid[key])) return grid[key];
    return palette[(r + c) % palette.length];
  };

  const cycle = (r: number, c: number) => {
    const cur = cellFor(r, c);
    const i = palette.indexOf(cur);
    const nextFab = palette[(i + 1) % palette.length];
    onChange({ ...grid, [`${r},${c}`]: nextFab });
  };

  // Outer frame = border + inner blocks + optional sashing BETWEEN blocks.
  const showSash = sashingWidth > 0 && !!sashingFabric;
  const sashCols = Math.max(0, cols - 1);
  const sashRows = Math.max(0, rows - 1);
  const innerW = cols * blockSize + (showSash ? sashCols * sashingWidth : 0);
  const innerH = rows * blockSize + (showSash ? sashRows * sashingWidth : 0);
  const outerW = innerW + 2 * borderWidth;
  const outerH = innerH + 2 * borderWidth;
  const borderPct = borderWidth > 0 ? (borderWidth / outerW) * 100 : 0;
  const showBorder = borderWidth > 0 && !!borderFabric;

  // Build column/row template tracks: alternating block | sashing | block ...
  const colTracks: string[] = [];
  for (let c = 0; c < cols; c++) {
    colTracks.push(`${blockSize}fr`);
    if (showSash && c < cols - 1) colTracks.push(`${sashingWidth}fr`);
  }
  const rowTracks: string[] = [];
  for (let r = 0; r < rows; r++) {
    rowTracks.push(`${blockSize}fr`);
    if (showSash && r < rows - 1) rowTracks.push(`${sashingWidth}fr`);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="shadow-sm"
        style={{
          width: "min(100%, 360px)",
          aspectRatio: `${outerW} / ${outerH}`,
          padding: showBorder ? `${borderPct}%` : 0,
          ...(showBorder && borderFabric
            ? {
                background: FABRIC_COLORS[borderFabric],
                ...fabricTileStyle(borderFabric, photos),
              }
            : {}),
        }}
        role="group"
        aria-label="Patchwork color preview with border"
      >
        <div
          className="grid h-full w-full"
          style={{
            gridTemplateColumns: colTracks.join(" "),
            gridTemplateRows: rowTracks.join(" "),
            ...(showSash && sashingFabric
              ? {
                  background: FABRIC_COLORS[sashingFabric],
                  ...fabricTileStyle(sashingFabric, photos),
                }
              : {}),
          }}
          role="grid"
          aria-label="Patchwork color preview — tap a square to cycle fabric"
        >
          {Array.from({ length: rows }).flatMap((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const fab = cellFor(r, c);
              // Compute grid placement: each block sits on track (2*r+1, 2*c+1) when sashed.
              const colTrack = showSash ? 2 * c + 1 : c + 1;
              const rowTrack = showSash ? 2 * r + 1 : r + 1;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => cycle(r, c)}
                  aria-label={`Row ${r + 1} column ${c + 1}, fabric ${fab}. Tap to change.`}
                  className="transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                  style={{
                    gridColumn: `${colTrack} / span 1`,
                    gridRow: `${rowTrack} / span 1`,
                    background: FABRIC_COLORS[fab],
                    ...fabricTileStyle(fab, photos),
                  }}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact helper text describing the patchwork tap-to-cycle behavior + the
 * real layout dimensions. Rendered next to the A/B/C/D fabric chips so it
 * doesn't push the preview down.
 */
export function PatchworkPreviewHint({
  fabricCount,
  quiltWidth,
  quiltHeight,
  blockSize,
  borderWidth,
}: {
  fabricCount: number;
  quiltWidth: number;
  quiltHeight: number;
  blockSize: number;
  borderWidth: number;
}) {
  const { rows, cols } = computeGridShape(
    quiltWidth,
    quiltHeight,
    blockSize,
    borderWidth,
  );
  const count = Math.max(2, Math.min(12, fabricCount));
  return (
    <span className="text-muted-foreground text-xs leading-snug">
      Tap any square to cycle through your {count} fabric
      {count === 1 ? "" : "s"}. Layout:{" "}
      <strong>{cols} × {rows} = {cols * rows} blocks</strong> at {blockSize}&quot; each.
    </span>
  );
}

/**
 * Returns the percentage (0–1) of cells that use each fabric in the grid.
 * Used to scale yardage — if 25% of the preview is Fabric A, A needs ~25%
 * of the total top-fabric yardage.
 */
export function gridFabricMix(
  grid: Record<string, FabricKey>,
  fabricCount: number,
  quiltWidth: number,
  quiltHeight: number,
  blockSize: number,
  borderWidth: number,
): Record<FabricKey, number> {
  const { rows, cols } = computeGridShape(
    quiltWidth,
    quiltHeight,
    blockSize,
    borderWidth,
  );
  const palette: FabricKey[] = ALL_FABRIC_KEYS.slice(
    0,
    Math.max(2, Math.min(12, fabricCount)),
  );
  const counts: Partial<Record<FabricKey, number>> = {};
  let total = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      const fab =
        grid[key] && palette.includes(grid[key])
          ? grid[key]
          : palette[(r + c) % palette.length];
      counts[fab] = (counts[fab] ?? 0) + 1;
      total += 1;
    }
  }
  const out = {} as Record<FabricKey, number>;
  for (const k of ALL_FABRIC_KEYS) out[k] = (counts[k] ?? 0) / total;
  return out;
}
