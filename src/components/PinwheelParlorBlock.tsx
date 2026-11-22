import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { pinwheelParlorPolygons } from "@/lib/pinwheel-parlor";

export function PinwheelParlorBlock({ size, assignments = {}, photos }: {
  size: number; assignments?: SectionAssignments; photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("pinwheel-parlor");
  if (!pattern) throw new Error("Missing Pinwheel Parlor pattern");
  return <g data-pinwheel-parlor-block="">{pinwheelParlorPolygons(size).map((p, i) => {
    const section = pattern.sections.find(s => s.id === p.role);
    if (!section) throw new Error(`Missing Pinwheel Parlor section: ${p.role}`);
    return <polygon key={i} data-role={p.role} points={p.points.map(([x, y]) => `${x},${y}`).join(" ")}
      fill={fabricFill(assignments[p.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}
