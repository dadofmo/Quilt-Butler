import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

interface Props {
  photos?: Partial<Record<FabricKey, string>>;
  /** Unique suffix to scope pattern IDs when multiple instances coexist on the page. */
  idSuffix?: string;
}

/**
 * Renders <defs> with an SVG <pattern> for every fabric that has an
 * uploaded photo. Object-bounding-box coordinates restart the photo inside
 * every piece, preventing a camera image from spreading across the block.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos, idSuffix = "" }: Props) {
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  return (
    <defs>
      {entries.map((k) => (
        <pattern
          key={k}
          id={`fabric-${k}${idSuffix}`}
          patternUnits="objectBoundingBox"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
          x={0}
          y={0}
        >
          <image
            href={photos[k]!}
            xlinkHref={photos[k]!}
            x={0}
            y={0}
            width={1}
            height={1}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      ))}
    </defs>
  );
}
