import { useId, useLayoutEffect, useRef } from "react";
import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";
import { useFabricTextures } from "@/hooks/use-fabric-textures";

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
 * Smooth lighting differences are removed before repeating; motifs are never
 * mirrored or crossfaded into ghost dots or stripe-like folds inside a piece.
 *
 * Place this as the FIRST child inside the root <svg> of any diagram
 * that wants to render uploaded fabric photos.
 */
export function FabricPatternDefs({ photos, idSuffix = "", tileSize = FABRIC_TILE_UNITS }: Props) {
  const textures = useFabricTextures(photos);
  const scope = useId().replace(/:/g, "");
  const defsRef = useRef<SVGDefsElement>(null);
  // A user-space pattern normally follows each shape's local transform.
  // Cancel that transform so translated/rotated units sample ONE fabric plane.
  // Scoped references also prevent another preview's photos stealing these IDs.
  useLayoutEffect(() => {
    const defs = defsRef.current;
    const svg = defs?.ownerSVGElement;
    if (!defs || !svg) return;
    defs.querySelectorAll('[data-fabric-aligned]').forEach(node => node.remove());
    const rootMatrix = svg.getCTM?.();
    svg.querySelectorAll<SVGGraphicsElement>('rect, polygon, path, circle, ellipse').forEach((shape, i) => {
      const fill = shape.getAttribute('fill');
      const key = ALL_FABRIC_KEYS.find(k =>
        fill === `url(#fabric-${k}${idSuffix})` ||
        fill?.startsWith(`url(#${scope}-fabric-${k}-piece-`),
      );
      if (!key || !photos?.[key]) return;
      const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
      const id = `${scope}-fabric-${key}-piece-${i}`;
      pattern.id = id;
      pattern.setAttribute('href', `#${scope}-fabric-${key}`);
      pattern.setAttribute('data-fabric-aligned', '');
      const matrix = shape.getCTM?.();
      if (matrix && rootMatrix) {
        const inverse = matrix.inverse().multiply(rootMatrix);
        pattern.setAttribute('patternTransform', `matrix(${inverse.a} ${inverse.b} ${inverse.c} ${inverse.d} ${inverse.e} ${inverse.f})`);
      }
      defs.appendChild(pattern);
      shape.setAttribute('fill', `url(#${id})`);
      // Shared edges must not blend with the canvas and appear as pale seams.
      shape.setAttribute('shape-rendering', 'crispEdges');
    });
  });
  if (!photos) return null;
  const entries = ALL_FABRIC_KEYS.filter((k) => !!photos[k]);
  if (entries.length === 0) return null;
  const t = tileSize > 0 ? tileSize : FABRIC_TILE_UNITS;
  return (
    <defs ref={defsRef}>
      {entries.map((k) => {
        const href = textures?.[k];
        if (!href) return null;
        const img = () => (
          <image
            href={href}
            xlinkHref={href}
            x={0}
            y={0}
            width={t}
            height={t}
            preserveAspectRatio="xMidYMid slice"
          />
        );
        return (
          <pattern
            key={k}
            id={`${scope}-fabric-${k}`}
            patternUnits="userSpaceOnUse"
            width={t}
            height={t}
            x={0}
            y={0}
          >
            {img()}
          </pattern>
        );
      })}
    </defs>
  );
}
