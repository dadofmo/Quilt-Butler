import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { birdNestGeometry } from "@/lib/bird-nest";

export function BirdNestBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("bird-nest");
  return <>{birdNestGeometry(size).map((piece,i) => {
    const section = pattern?.sections.find(s => s.id === piece.role);
    if (!section) throw new Error(`Missing Bird Nest section: ${piece.role}`);
    return <polygon key={i} points={piece.points.map(p => p.join(",")).join(" ")}
      fill={fabricFill(assignments[piece.role] ?? section.defaultFabric,photos)} />;
  })}</>;
}