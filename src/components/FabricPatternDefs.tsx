import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

interface Props {
  photos?: Partial<Record<FabricKey, string>>;
  /**
   * When set, patterns use `userSpaceOnUse` with this tile size (in the
   * SVG's user units) instead of `objectBoundingBox`. This makes a single
   * fabric photo span MANY shapes coherently — e.g. all 6 light logs in a
   * Log Cabin block reveal slices of one continuous image, instead of each
   * log showing the entire photo squished into its tiny bounding box.
   *
   * Pass the block / diagram size (e.g. 200 for MiniBlock's 200×200 viewBox).
   * Omit to keep the legacy "fill each shape with the whole photo" behaviour
   * (used by swatch chips and standalone diagrams).
   */
  tileSize?: number;
  /** Unique suffix to scope pattern IDs when multiple instances coexist on the page. */
  idSuffix?: string;
}

/**
 * Renders <defs> with an SVG <pattern> for every fabric that has an
 * uploaded photo. By default each pattern fills the bounding box of the
 * shape it's applied to. With `tileSize`, the pattern instead tiles a
 * fixed-size image across the SVG's user space — so a single fabric photo
 * spans every shape that uses it.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos, tileSize, idSuffix = "" }: Props) {
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  const useUserSpace = typeof tileSize === "number" && tileSize > 0;
  return (
    <defs>
      {entries.map((k) => (
        <pattern
          key={k}
          id={`fabric-${k}${idSuffix}`}
          patternUnits={useUserSpace ? "userSpaceOnUse" : "objectBoundingBox"}
          patternContentUnits={useUserSpace ? "userSpaceOnUse" : "objectBoundingBox"}
          width={useUserSpace ? tileSize : 1}
          height={useUserSpace ? tileSize : 1}
          x={0}
          y={0}
        >
          <image
            href={photos[k]!}
            xlinkHref={photos[k]!}
            x={0}
            y={0}
            width={useUserSpace ? tileSize : 1}
            height={useUserSpace ? tileSize : 1}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      ))}
    </defs>
  );
}
