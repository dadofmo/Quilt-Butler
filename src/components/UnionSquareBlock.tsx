import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { unionSquarePolygons } from "@/lib/union-square";

export function UnionSquareBlock({ size, assignments = {}, photos }: {
  size: number; assignments?: SectionAssignments; photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("union-square");
  if (!pattern) throw new Error("Missing Union Square pattern");
  return <g data-union-square-block="">{unionSquarePolygons(size).map((piece, index) => {
    const section = pattern.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Union Square section: ${piece.role}`);
    return <polygon key={index} data-role={piece.role}
      points={piece.points.map(([x,y]) => `${x},${y}`).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)} />;
  })}</g>;
}