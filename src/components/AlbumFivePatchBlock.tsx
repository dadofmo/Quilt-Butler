import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { albumFivePatchGeometry, type AlbumRole } from "@/lib/album-five-patch";

const pieces = albumFivePatchGeometry();
export function AlbumFivePatchBlock({ size, fills }: { size: number; fills: Record<AlbumRole, string> }) {
  return <>{pieces.map((piece, i) => <polygon key={i}
    points={piece.points.map(([x, y]) => `${x * size / 10},${y * size / 10}`).join(" ")}
    fill={fills[piece.role]} />)}</>;
}
export function albumFivePatchFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey, string>>) {
  const fill = (id: AlbumRole) => {
    const section = getPattern("album-five-patch")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { fills: { dark: fill("dark"), light: fill("light"), bars: fill("bars") } };
}