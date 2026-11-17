import type { FabricKey, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { fabricFill } from "@/lib/fabric-fill";
import { DAKOTA_GOLD_PAIR_ROLES, dakotaGoldPieces } from "@/lib/dakota-gold";

/** One shared reference renderer: continuous bars and flush pieces, no guides. */
export function DakotaGoldBlock({ size, assignments = {}, photos }: {
  size: number;
  assignments?: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const pattern = getPattern("dakota-gold");
  if (!pattern) throw new Error("Missing Dakota Gold pattern");
  return (
    <g data-dakota-gold-block="5x5">
      {dakotaGoldPieces(size).map((piece, index) => {
        const section = pattern.sections.find((s) => s.id === piece.role);
        if (!section) throw new Error(`Missing Dakota Gold section: ${piece.role}`);
        return (
          <polygon
            key={`${piece.part}-${piece.row ?? "x"}-${piece.col ?? "x"}-${index}`}
            data-role={piece.role}
            data-part={piece.part}
            data-cell={piece.row === undefined ? undefined : `${piece.row}-${piece.col}`}
            data-pair={piece.pair}
            data-corner={piece.corner}
            data-first-role={piece.pair && piece.corner === DAKOTA_GOLD_CELLS.find((c) => c.row === piece.row && c.col === piece.col && c.kind === "hst" && c.pair === piece.pair && c.firstCorner === piece.corner)?.firstCorner ? DAKOTA_GOLD_PAIR_ROLES[piece.pair][0] : undefined}
            points={piece.points.map(([x, y]) => `${x},${y}`).join(" ")}
            fill={fabricFill(assignments[piece.role] ?? section.defaultFabric, photos)}
          />
        );
      })}
    </g>
  );
}
