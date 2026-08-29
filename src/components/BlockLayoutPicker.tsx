import type {
  BlockLayout,
  FabricKey,
  PatternId,
  SectionAssignments,
} from "@/lib/planner-store";
import { LAYOUT_HINTS, LAYOUT_LABELS } from "@/lib/block-layouts";
import { QuiltCanvas } from "./QuiltLayoutPreview";
import type { CustomBlockDesign } from "@/lib/custom-block";

interface Props {
  pattern: PatternId;
  assignments: SectionAssignments;
  photos?: Partial<Record<FabricKey, string>>;
  /** Settings offered: always "straight" first, then the pattern's opt-ins. */
  options: BlockLayout[];
  value: BlockLayout;
  onChange: (next: BlockLayout) => void;
  /** "custom-block" only — the user's design(s), passed to each thumbnail. */
  customBlock?: CustomBlockDesign | null;
  customBlockB?: CustomBlockDesign | null;
  useBlockB?: boolean;
  customSwapPair?: [FabricKey, FabricKey] | null;
}

/**
 * "How the blocks are turned" picker. Rotation-only settings — every block is
 * pieced identically, so nothing here changes the cutting list or yardage.
 * Only rendered for patterns that declare `layouts` in src/lib/patterns.ts.
 */
export function BlockLayoutPicker({
  pattern,
  assignments,
  photos,
  options,
  value,
  onChange,
  customBlock = null,
  customBlockB = null,
  useBlockB = false,
  customSwapPair = null,
}: Props) {
  return (
    <div className="mt-4 rounded-xl border-2 border-input bg-card p-4">
      <div className="text-base font-medium">How your blocks are turned</div>
      <p className="text-muted-foreground mt-1 text-xs leading-snug">
        Every block is pieced exactly the same way — only the direction you
        turn it when you sew the rows changes. Your cutting list and yardage
        stay identical, and the full-quilt preview above follows your choice.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-2 text-center transition-colors ${
                active ? "border-primary bg-primary/5" : "border-input bg-background"
              }`}
            >
              <QuiltCanvas
                pattern={pattern}
                assignments={assignments}
                hasBorder={false}
                borderFabric={"C" as FabricKey}
                blocksAcross={4}
                blocksDown={4}
                quiltWidth={48}
                quiltHeight={48}
                borderWidth={0}
                sashingWidth={0}
                sashingFabric={"C" as FabricKey}
                photos={photos}
                alternateBlocks={false}
                blockLayout={opt}
                customBlock={customBlock}
                customBlockB={customBlockB}
                useBlockB={useBlockB}
                customSwapPair={customSwapPair}
                maxSize={84}
              />
              <span className="text-xs font-medium leading-tight">
                {LAYOUT_LABELS[opt]}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-muted-foreground mt-3 text-xs leading-snug">
        {LAYOUT_HINTS[value]}
      </p>
    </div>
  );
}
