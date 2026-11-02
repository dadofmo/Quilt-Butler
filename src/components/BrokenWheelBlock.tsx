import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { brokenWheelPolygons } from "@/lib/broken-wheel";

export function BrokenWheelBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("broken-wheel");
  return <g data-broken-wheel-block="">{brokenWheelPolygons(size).map((poly, i) => {
    const section = pattern?.sections.find(s => s.id === poly.role);
    if (!section) throw new Error(`Missing Broken Wheel section: ${poly.role}`);
    return <polygon key={i} data-role={poly.role} points={poly.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[poly.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}
