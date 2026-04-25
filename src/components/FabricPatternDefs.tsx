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
      {entries.map((k) => {
        // When tileSize is set: classic "one photo spans the whole block"
        // (userSpaceOnUse). All shapes of this fabric reveal slices of one
        // continuous image — used by swatch chips / coherent-block previews.
        //
        // Default mode (no tileSize): each shape gets its OWN copy of the
        // photo, but we DO NOT stretch it. The pattern uses a viewBox with
        // `preserveAspectRatio="xMidYMid slice"` so the photo fills the
        // shape's bounding box at its native aspect, center-cropped — like
        // CSS `background-size: cover`. A long thin log shows a wide thin
        // slice; a square shows a centered square slice. All strips of the
        // same fabric look like cuts from the same bolt — only the length
        // of the visible slice changes.
        const commonImage = (
          <image
            href={photos[k]!}
            xlinkHref={photos[k]!}
            x={0}
            y={0}
            width={useUserSpace ? tileSize : 100}
            height={useUserSpace ? tileSize : 100}
            preserveAspectRatio="xMidYMid slice"
          />
        );
        return (
          <pattern
            key={k}
            id={`fabric-${k}${idSuffix}`}
            patternUnits={useUserSpace ? "userSpaceOnUse" : "objectBoundingBox"}
            patternContentUnits={useUserSpace ? "userSpaceOnUse" : "objectBoundingBox"}
            width={useUserSpace ? tileSize : 1}
            height={useUserSpace ? tileSize : 1}
            x={0}
            y={0}
            {...(useUserSpace
              ? {}
              : {
                  viewBox: "0 0 100 100",
                  preserveAspectRatio: "xMidYMid slice",
                })}
          >
            {commonImage}
          </pattern>
        );
      })}
    </defs>
  );
}
