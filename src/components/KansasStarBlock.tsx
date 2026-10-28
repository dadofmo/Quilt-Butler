import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { kansasGeometry, type KansasColorway } from "@/lib/kansas-star";

/**
 * Kansas Star renders flush like every other block: no seam outlines, no
 * gutters. The white lines in the reference photo are construction guides
 * only and must not appear in any render.
 */
export function KansasStarBlock({ size, colorway = "A", assignments = {}, photos }: {
  size: number;
  colorway?: KansasColorway;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("kansas-star");
  return <g data-kansas-colorway={colorway}>{kansasGeometry(size, colorway).map((piece, i) => {
    const section = pattern?.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Kansas Star section: ${piece.role}`);
    return <polygon key={i} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}
