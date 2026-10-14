import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { alaskaGeometry, type AlaskaRole } from "@/lib/alaska";

const pieces = alaskaGeometry();
export function AlaskaBlock({ size, fills }: { size: number; fills: Record<AlaskaRole, string> }) {
  return <>{pieces.map((piece, i) => <polygon key={i}
    points={piece.points.map(([x, y]) => `${x * size / 12},${y * size / 12}`).join(" ")}
    fill={fills[piece.role]} />)}</>;
}

export function alaskaFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey, string>>) {
  const fill = (id: AlaskaRole) => {
    const section = getPattern("alaska")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { fills: { light: fill("light"), dark: fill("dark"), cross: fill("cross"),
    peach: fill("peach"), coral: fill("coral"), diamond: fill("diamond"), edge: fill("edge") } };
}