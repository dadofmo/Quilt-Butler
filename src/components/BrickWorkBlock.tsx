import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { brickWorkGeometry, type BrickWorkRole } from "@/lib/brick-work";

const pieces = brickWorkGeometry();
export function BrickWorkBlock({ size, fills }: { size: number; fills: Record<BrickWorkRole, string> }) {
  return <>{pieces.map((piece, i) => <polygon key={i}
    points={piece.points.map(([x, y]) => `${x * size},${y * size}`).join(" ")}
    fill={fills[piece.role]} />)}</>;
}
export function brickWorkFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey, string>>) {
  const fill = (id: BrickWorkRole) => {
    const section = getPattern("brick-work")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { fills: { bars: fill("bars"), squares: fill("squares"), background: fill("background") } };
}
