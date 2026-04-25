import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

interface Props {
  photos?: Partial<Record<FabricKey, string>>;
  /**
   * Size (in SVG user units) of one repeating tile of the fabric photo.
   * The pattern always uses `userSpaceOnUse` and TILES the photo across
   * every shape that uses it — so a polka dot is the same physical size
   * in a long thin log as in a square. Each shape becomes a "window" onto
   * a continuously-tiled fabric, just like cutting from a real bolt.
   *
   * Default ≈ 80 user units (~40% of a 200-unit block diagram).
   */
  tileSize?: number;
  /** Unique suffix to scope pattern IDs when multiple instances coexist on the page. */
  idSuffix?: string;
}

/**
 * Renders <defs> with an SVG <pattern> for every fabric that has an
 * uploaded photo. The photo tiles at a fixed user-space size so every
 * shape — regardless of dimensions — shows the fabric at the same scale.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos, tileSize, idSuffix = "" }: Props) {
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  // Render the photo at this fixed pixel size in SVG user space, then let
  // the pattern tile/repeat across every shape. This means a polka dot is
  // exactly the same size in a 1"×6" strip as it is in a 3"×3" square —
  // just like a real bolt of fabric. Each shape is a "window" onto the
  // same continuously-tiled fabric. We use `tileSize` if provided, else a
  // sensible default (~80 SVG units, roughly 40% of a 200-unit block).
  const tile = typeof tileSize === "number" && tileSize > 0 ? tileSize : 80;
  return (
    <defs>
      {entries.map((k) => (
        <pattern
          key={k}
          id={`fabric-${k}${idSuffix}`}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
          width={tile}
          height={tile}
          x={0}
          y={0}
        >
          <image
            href={photos[k]!}
            xlinkHref={photos[k]!}
            x={0}
            y={0}
            width={tile}
            height={tile}
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      ))}
    </defs>
  );
}
