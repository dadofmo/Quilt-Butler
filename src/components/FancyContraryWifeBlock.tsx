import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { fancyContraryPieces } from "@/lib/fancy-contrary-wife";

export function FancyContraryWifeBlock({size,assignments={},photos}: {
  size:number; assignments?:SectionAssignments; photos?:Partial<Record<FabricKey,string>>;
}) {
  const pattern=getPattern("fancy-contrary-wife");
  return <g data-fancy-contrary-wife-block="">{fancyContraryPieces().map((p,i)=> {
    const section=pattern?.sections.find(s=>s.id===p.role);
    if (!section) throw new Error(`Missing Fancy Contrary Wife section: ${p.role}`);
    return <polygon key={i} data-role={p.role} points={p.points.map(([x,y])=>`${x*size/6},${y*size/6}`).join(" ")}
      fill={fabricFill(assignments[p.role]??section.defaultFabric,photos)} />;
  })}</g>;
}