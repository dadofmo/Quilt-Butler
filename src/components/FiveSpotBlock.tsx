import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { fiveSpotPolygons } from "@/lib/five-spot";

export function FiveSpotBlock({ size, assignments = {}, photos }: {
  size: number; assignments?: SectionAssignments; photos?: Partial<Record<FabricKey,string>>;
}) {
  const pattern = getPattern("five-spot");
  return <g data-five-spot-block="">{fiveSpotPolygons(size).map((poly,i) => {
    const section = pattern?.sections.find(s => s.id === poly.role);
    if (!section) throw new Error(`Missing Five Spot section: ${poly.role}`);
    return <polygon key={i} data-role={poly.role} data-unit={poly.unit}
      points={poly.points.map(p=>p.join(",")).join(" ")}
      fill={fabricFill(assignments[poly.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}