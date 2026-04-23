import { FABRIC_COLORS, type FabricKey } from "@/lib/planner-store";
import type { PatternId, SectionAssignments } from "@/lib/planner-store";
import { PatternDiagram } from "./PatternDiagram";

interface Props {
  pattern: PatternId;
  assignments: SectionAssignments;
  hasBorder: boolean;
  borderFabric: FabricKey;
}

/**
 * Print-only legend that sits next to the page title in the printed
 * yardage plan. Shows a single block in color with A/B/C labels so the
 * quilter can quickly see which fabric goes where while cutting.
 *
 * Layout: a colored block diagram on the left, a small text key on the
 * right explaining what each letter means.
 */
export function PrintBlockLegend({
  pattern,
  assignments,
  hasBorder,
  borderFabric,
}: Props) {
  // Try to read the role assignments for nine-patch style blocks.
  // Fall back to A / B / C when assignments aren't set.
  const centerFabric = (assignments.center ?? "A") as FabricKey;
  const outerFabric = (assignments.outer ?? "B") as FabricKey;

  const items: Array<{ label: string; fabric: FabricKey; role: string }> = [
    { label: "A", fabric: centerFabric, role: "Center & corner blocks" },
    { label: "B", fabric: outerFabric, role: "Alternating blocks" },
  ];
  if (hasBorder) {
    items.push({ label: "C", fabric: borderFabric, role: "Border" });
  }

  return (
    <div className="print-only-flex mt-4 items-start gap-4 rounded-xl border border-border bg-card p-3">
      <div className="shrink-0">
        <PatternDiagram
          pattern={pattern}
          assignments={assignments}
          hasBorder={hasBorder}
          size={140}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-foreground text-sm font-semibold">
          Block layout key
        </div>
        <ul className="mt-2 space-y-1.5">
          {items.map((it) => (
            <li key={it.label} className="flex items-center gap-2 text-xs">
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-[11px] font-bold text-foreground"
                style={{ background: FABRIC_COLORS[it.fabric] }}
              >
                {it.label}
              </span>
              <span className="text-foreground">
                <strong>Fabric {it.label}:</strong> {it.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
