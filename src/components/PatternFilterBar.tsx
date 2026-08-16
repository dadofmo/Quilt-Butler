import { Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  EMPTY_FILTERS,
  FABRIC_OPTIONS,
  FEATURE_OPTIONS,
  SKILL_OPTIONS,
  TECHNIQUE_OPTIONS,
  activeFilterCount,
  describeActiveFilters,
  isFiltering,
  toggleValue,
  type FilterState,
} from "@/lib/pattern-filters";

interface Props {
  state: FilterState;
  onChange: (next: FilterState) => void;
  shown: number;
  total: number;
}

/**
 * Search + filter controls for the pattern picker. Purely presentational —
 * all filter logic lives in @/lib/pattern-filters so it can be unit tested.
 */
export function PatternFilterBar({ state, onChange, shown, total }: Props) {
  const count = activeFilterCount(state);
  const active = describeActiveFilters(state);

  const toggle = <K extends "skills" | "fabrics" | "techniques" | "features">(
    group: K,
    value: FilterState[K][number],
  ) => onChange({ ...state, [group]: toggleValue(state[group] as string[], value as string) } as FilterState);

  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          />
          <input
            type="search"
            value={state.query}
            onChange={(e) => onChange({ ...state, query: e.target.value })}
            placeholder="Search patterns…"
            aria-label="Search quilt patterns by name"
            className="border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-11 w-full rounded-xl border-2 pl-9 pr-3 text-base focus-visible:outline-none focus-visible:ring-2"
          />
        </div>

        <Popover>
          <PopoverTrigger
            className="border-border bg-card text-foreground hover:border-primary focus-visible:ring-ring flex h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2"
            aria-label="Filter patterns"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {count > 0 && (
              <span className="bg-primary text-primary-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold">
                {count}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent align="end" className="max-h-[70vh] w-[min(22rem,90vw)] overflow-y-auto p-4">
            <Group title="Skill level">
              {SKILL_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={state.skills.includes(o.value)}
                  onClick={() => toggle("skills", o.value)}
                />
              ))}
            </Group>
            <Group title="Number of fabrics">
              {FABRIC_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={state.fabrics.includes(o.value)}
                  onClick={() => toggle("fabrics", o.value)}
                />
              ))}
            </Group>
            <Group title="Technique">
              {TECHNIQUE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={state.techniques.includes(o.value)}
                  onClick={() => toggle("techniques", o.value)}
                />
              ))}
            </Group>
            <Group title="Features">
              {FEATURE_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  selected={state.features.includes(o.value)}
                  onClick={() => toggle("features", o.value)}
                />
              ))}
            </Group>
            {count > 0 && (
              <button
                onClick={() => onChange({ ...EMPTY_FILTERS, query: state.query })}
                className="text-primary mt-3 text-sm font-semibold underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map((f) => (
            <button
              key={`${f.group}-${f.value}`}
              onClick={() => toggle(f.group, f.value as never)}
              aria-label={`Remove filter ${f.label}`}
              className="border-primary bg-primary/10 text-foreground hover:bg-primary/20 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => onChange({ ...EMPTY_FILTERS, query: state.query })}
            className="text-muted-foreground hover:text-foreground text-xs font-semibold underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      <p className="text-muted-foreground text-sm" aria-live="polite">
        {isFiltering(state)
          ? `Showing ${shown} of ${total} patterns`
          : `${total} patterns`}
      </p>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-muted-foreground mb-2 text-xs font-bold uppercase tracking-wide">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "focus-visible:ring-ring rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 " +
        (selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary")
      }
    >
      {label}
    </button>
  );
}
