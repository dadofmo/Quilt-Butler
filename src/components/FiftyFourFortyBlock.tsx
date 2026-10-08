import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { getPattern } from "@/lib/patterns";

/** Five four-patches and four inward-facing background V triangles. */
export function FiftyFourFortyBlock({ size, points, accent, background }: {
  size: number; points: string; accent: string; background: string;
}) {
  const u = size / 3;
  return <>
    {[[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].map(([col, row]) =>
      <g key={`${col}-${row}`} transform={`translate(${col * u} ${row * u})`}>
        {[0, 1].flatMap(r => [0, 1].map(c => <rect key={`${r}-${c}`}
          x={c * u / 2} y={r * u / 2} width={u / 2} height={u / 2}
          fill={((r === c) !== ((col === 2 && row === 0) || (col === 0 && row === 2))) ? background : accent} />))}
      </g>)}
    {[[1, 0, 0], [2, 1, 90], [1, 2, 180], [0, 1, 270]].map(([col, row, turn]) =>
      <g key={`${col}-${row}`} transform={`translate(${col * u} ${row * u}) rotate(${turn} ${u / 2} ${u / 2})`}>
        <polygon points={`0,0 ${u / 2},${u} 0,${u}`} fill={points} />
        <polygon points={`${u},0 ${u},${u} ${u / 2},${u}`} fill={points} />
        <polygon points={`0,0 ${u},0 ${u / 2},${u}`} fill={background} />
      </g>)}
  </>;
}

export function fiftyFourFortyFills(assignments: SectionAssignments, photos?: Partial<Record<FabricKey, string>>) {
  const fill = (id: string) => {
    const section = getPattern("fifty-four-forty-or-fight")?.sections.find(s => s.id === id);
    return section ? fabricFill(assignments[id] ?? section.defaultFabric, photos) : "none";
  };
  return { points: fill("points"), accent: fill("accent"), background: fill("background") };
}