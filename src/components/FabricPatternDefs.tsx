import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

/** Photo repeat size in the shared 200-unit block space (~one third of a block). */
export const FABRIC_TILE_UNITS = 64;

interface Props {
  photos?: Partial<Record<FabricKey, string>>;
  /** Unique suffix to scope pattern IDs when multiple instances coexist on the page. */
  idSuffix?: string;
  /** Repeat size in the referencing element's user units. */
  tileSize?: number;
}

/**
 * Renders <defs> with an SVG <pattern> for every fabric that has a photo.
 * The photo is laid out in user space at ONE fixed scale, so a strip, a
 * square and a triangle cut from the same fabric show motifs at the same
 * size and flow continuously across neighbouring pieces — like a real bolt.
 * Each repeat is mirrored (2×2 flip) so tile edges always match and never
 * draw a false seam through a piece.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos, idSuffix = "", tileSize = FABRIC_TILE_UNITS }: Props) {
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  const t = tileSize > 0 ? tileSize : FABRIC_TILE_UNITS;
  return (
    <defs>
      {entries.map((k) => {
        const href = photos[k]!;
        const img = (transform?: string) => (
          <image
            href={href}
            xlinkHref={href}
            x={0}
            y={0}
            width={t}
            height={t}
            preserveAspectRatio="xMidYMid slice"
            transform={transform}
          />
        );
        return (
          <pattern
            key={k}
            id={`fabric-${k}${idSuffix}`}
            patternUnits="userSpaceOnUse"
            width={2 * t}
            height={2 * t}
            x={0}
            y={0}
          >
            {img()}
            {img(`translate(${2 * t} 0) scale(-1 1)`)}
            {img(`translate(0 ${2 * t}) scale(1 -1)`)}
            {img(`translate(${2 * t} ${2 * t}) scale(-1 -1)`)}
          </pattern>
        );
      })}
    </defs>
  );
}
