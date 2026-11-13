import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { eccentricStarPolygons } from "@/lib/eccentric-star";

export function EccentricStarBlock({size, assignments = {}, photos}: {
  size: number; assignments?: SectionAssignments; photos?: Partial<Record<FabricKey,string>>;
}) {
  const pattern = getPattern("eccentric-star");
  if (!pattern) throw new Error("Missing Eccentric Star pattern");
  return <g data-eccentric-star-block="">{eccentricStarPolygons(size).map((p,i) => {
    const section = pattern.sections.find(s => s.id === p.role);
    if (!section) throw new Error(`Missing Eccentric Star section: ${p.role}`);
    return <polygon key={i} data-role={p.role} points={p.points.map(([x,y]) => `${x},${y}`).join(" ")}
      fill={fabricFill(assignments[p.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}