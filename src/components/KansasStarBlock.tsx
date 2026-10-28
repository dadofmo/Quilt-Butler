import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { kansasGeometry } from "@/lib/kansas-star";

/**
 * One Kansas Star block: the full 3×3 grid of square-in-a-square units.
 * Renders flush like every other block: no seam outlines, no gutters. The
 * white lines in the reference photo are construction guides only.
 */
export function KansasStarBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("kansas-star");
  return <g data-kansas-block="3x3">{kansasGeometry(size).map((piece, i) => {
    const section = pattern?.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Kansas Star section: ${piece.role}`);
    return <polygon key={i} data-kansas-colorway={piece.colorway} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}
