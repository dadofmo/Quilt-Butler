import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { sawtoothPolygons } from "@/lib/sawtooth";

/** One shared reference renderer: flush pieces, with no guide-line overlay. */
export function SawtoothBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("sawtooth");
  if (!pattern) throw new Error("Missing Sawtooth pattern");
  return (
    <g data-sawtooth-block="3x3">
      {sawtoothPolygons(size).map((piece, index) => {
        const section = pattern.sections.find((s) => s.id === piece.role);
        if (!section) throw new Error(`Missing Sawtooth section: ${piece.role}`);
        return (
          <polygon
            key={`${piece.row}-${piece.col}-${piece.part}-${index}`}
            data-role={piece.role}
            data-cell={`${piece.row}-${piece.col}`}
            data-part={piece.part}
            data-corner={piece.corner}
            points={piece.points.map(([x, y]) => `${x},${y}`).join(" ")}
            fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)}
          />
        );
      })}
    </g>
  );
}
