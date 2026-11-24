import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { grecianSquarePolygons } from "@/lib/grecian-square";

export function GrecianSquareBlock({size, assignments = {}, photos}: {
  size: number; assignments?: SectionAssignments; photos?: Partial<Record<FabricKey,string>>;
}) {
  const pattern = getPattern("grecian-square");
  if (!pattern) throw new Error("Missing Grecian Square pattern");
  return <g data-grecian-square-block="">{grecianSquarePolygons(size).map((p,i) => {
    const section = pattern.sections.find(s => s.id === p.role);
    if (!section) throw new Error(`Missing Grecian Square section: ${p.role}`);
    return <polygon key={i} data-role={p.role} points={p.points.map(([x,y]) => `${x},${y}`).join(" ")}
      fill={fabricFill(assignments[p.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}
