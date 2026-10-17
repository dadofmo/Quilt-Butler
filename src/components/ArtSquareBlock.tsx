import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { artSquareGeometry, type ArtSquareRole } from "@/lib/art-square";

const pieces = artSquareGeometry();
export function ArtSquareBlock({ size, fills }: { size: number; fills: Record<ArtSquareRole,string> }) {
  return <>{pieces.map((piece,i) => <polygon key={i}
    points={piece.points.map(([x,y]) => `${x*size/4},${y*size/4}`).join(" ")}
    fill={fills[piece.role]} />)}</>;
}
export function artSquareFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey,string>>) {
  const fill = (id: ArtSquareRole) => {
    const section = getPattern("art-square")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { fills: { center: fill("center"), background: fill("background"), corners: fill("corners") } };
}