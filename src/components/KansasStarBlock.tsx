import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { kansasGeometry, type KansasColorway } from "@/lib/kansas-star";

/**
 * Kansas Star reference shows thin light seam outlines between the diamond
 * and its corner triangles. These are visual seam lines only (not fabric) —
 * nothing is added to the cutting plan. Drawn with the card token so it
 * themes correctly.
 */
export function KansasStarBlock({ size, colorway = "A", assignments = {}, photos }: {
  size: number;
  colorway?: KansasColorway;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("kansas-star");
  const outline = Math.max(0.4, size * 0.012);
  return <g data-kansas-colorway={colorway}>{kansasGeometry(size, colorway).map((piece, i) => {
    const section = pattern?.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Kansas Star section: ${piece.role}`);
    return <polygon key={i} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)}
      stroke="var(--card)" strokeWidth={outline} strokeLinejoin="round" data-seam-outline="visual" />;
  })}</g>;
}
