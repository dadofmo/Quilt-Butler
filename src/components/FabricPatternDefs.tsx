import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

interface Props {
  photos?: Partial<Record<FabricKey, string>>;
}

/**
 * Renders <defs> with an SVG <pattern> for every fabric that has an
 * uploaded photo. Each pattern fills its bounding box with the photo,
 * so any shape using `fill="url(#fabric-X)"` will display the fabric.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos }: Props) {
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  return (
    <defs>
      {entries.map((k) => (
        <pattern
          key={k}
          id={`fabric-${k}`}
          patternUnits="objectBoundingBox"
          patternContentUnits="objectBoundingBox"
          width={1}
          height={1}
          preserveAspectRatio="xMidYMid slice"
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
