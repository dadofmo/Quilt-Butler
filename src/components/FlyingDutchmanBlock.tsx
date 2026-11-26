import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { flyingDutchmanPolygons } from "@/lib/flying-dutchman";

export function FlyingDutchmanBlock({
  size,
  assignments = {},
  photos,
}: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("flying-dutchman");
  if (!pattern) throw new Error("Missing Flying Dutchman pattern");
  return (
    <g data-flying-dutchman-block="">
      {flyingDutchmanPolygons(size).map((piece, index) => {
        const section = pattern.sections.find((s) => s.id === piece.role);
        if (!section) throw new Error(`Missing Flying Dutchman section: ${piece.role}`);
        return (
          <polygon
            key={`${piece.row}-${piece.col}-${index}`}
            data-role={piece.role}
            data-cell={`${piece.row}-${piece.col}`}
            points={piece.points.map(([x, y]) => `${x},${y}`).join(" ")}
            fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)}
          />
        );
      })}
    </g>
  );
}
