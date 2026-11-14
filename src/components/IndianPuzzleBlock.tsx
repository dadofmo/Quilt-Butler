import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { indianPuzzlePolygons } from "@/lib/indian-puzzle";

export function IndianPuzzleBlock({size,assignments={},photos}:{size:number;assignments?:SectionAssignments;photos?:Partial<Record<FabricKey,string>>}) {
  const pattern=getPattern("indian-puzzle");
  if (!pattern) throw new Error("Missing Indian Puzzle pattern");
  return <g data-indian-puzzle-block="">{indianPuzzlePolygons(size).map((p,i)=> {
    const section=pattern.sections.find(s=>s.id===p.role);
    if (!section) throw new Error(`Missing Indian Puzzle section: ${p.role}`);
    return <polygon key={i} data-role={p.role} points={p.points.map(([x,y])=>`${x},${y}`).join(" ")} fill={fabricFill(assignments[p.role]??section.defaultFabric,photos)} />;
  })}</g>;
}