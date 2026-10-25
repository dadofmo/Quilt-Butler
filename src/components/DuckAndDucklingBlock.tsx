import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { duckAndDucklingGeometry } from "@/lib/duck-and-duckling";

export function DuckAndDucklingBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("duck-and-duckling");
  return <>{duckAndDucklingGeometry(size).map((piece, i) => {
    const section = pattern?.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Duck and Duckling section: ${piece.role}`);
    return <polygon key={i} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)} />;
  })}</>;
}
