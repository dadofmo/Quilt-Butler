import { FABRIC_COLORS, type FabricKey } from "@/lib/planner-store";
import type { PatternId, SectionAssignments } from "@/lib/planner-store";
import { getPattern } from "@/lib/patterns";
import { PatternDiagram } from "./PatternDiagram";

interface Props {
  pattern: PatternId;
  assignments: SectionAssignments;
  hasBorder: boolean;
  borderFabric: FabricKey;
}

/**
 * Print-only legend that sits next to the page title in the printed
 * yardage plan. Shows a single block in color with a key for each
 * fabric the chosen pattern actually uses (so a 1-fabric pattern like
 * Simple Squares doesn't show ghost A/B/C entries).
 */
export function PrintBlockLegend({
  pattern,
  assignments,
  hasBorder,
  borderFabric,
}: Props) {
  const def = getPattern(pattern);
  if (!def) return null;

  // Build one legend row per pattern section, deduped by fabric so a
  // pattern with 1 top fabric shows 1 row (not 3).
  const seen = new Set<FabricKey>();
  const items: Array<{ fabric: FabricKey; role: string }> = [];
  for (const section of def.sections) {
    if (section.id === "border") continue;
    const fabric = (assignments[section.id] ?? section.defaultFabric) as FabricKey;
    if (seen.has(fabric)) continue;
    seen.add(fabric);
    items.push({ fabric, role: section.label });
  }
  if (hasBorder && !seen.has(borderFabric)) {
    items.push({ fabric: borderFabric, role: "Border" });
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
            <li key={it.fabric} className="flex items-center gap-2 text-xs">
              <span
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border text-[11px] font-bold text-foreground"
                style={{ background: FABRIC_COLORS[it.fabric] }}
              >
                {it.fabric}
              </span>
              <span className="text-foreground">
                <strong>Fabric {it.fabric}:</strong> {it.role}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
