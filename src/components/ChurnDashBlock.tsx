import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { churnPolygons } from "@/lib/churn-dash";

export function ChurnDashBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("churn-dash");
  if (!pattern) return null;
  return <>{churnPolygons(size).map((piece, i) => {
    const section = pattern.sections.find(s => s.id === piece.role);
    if (!section) return null;
    return <polygon key={i} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)} />;
  })}</>;
}