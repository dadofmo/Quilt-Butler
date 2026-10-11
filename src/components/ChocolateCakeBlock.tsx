import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";

/** A 6×6 reference layout, assembled as nine straight-seam macro units. */
export function ChocolateCakeBlock({ size, center, frame, points, background }: {
  size: number; center: string; frame: string; points: string; background: string;
}) {
  const u = size / 6;
  return <>
    <rect width={size} height={size} fill={background} />
    {[[0, 0], [4, 0], [0, 4], [4, 4]].map(([x, y]) =>
      <polygon key={`${x}-${y}`} points={`${(x + 1) * u},${y * u} ${(x + 2) * u},${(y + 1) * u} ${(x + 1) * u},${(y + 2) * u} ${x * u},${(y + 1) * u}`} fill={frame} />)}
    <rect x={2 * u} y={2 * u} width={2 * u} height={2 * u} fill={center} />
    {[[2, 0, 0], [4, 2, 90], [2, 4, 180], [0, 2, 270]].map(([x, y, turn]) =>
      <g key={`${x}-${y}`} transform={`translate(${x * u} ${y * u}) rotate(${turn} ${u} ${u})`}>
        <polygon points={`0,${u} ${u},0 ${2 * u},${u}`} fill={points} />
        <rect y={u} width={2 * u} height={u} fill={frame} />
      </g>)}
  </>;
}

export function chocolateCakeFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey, string>>) {
  const fill = (id: string) => {
    const section = getPattern("chocolate-cake")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { center: fill("center"), frame: fill("frame"), points: fill("points"), background: fill("background") };
}