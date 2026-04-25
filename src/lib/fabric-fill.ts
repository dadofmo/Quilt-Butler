import { FABRIC_COLORS, type FabricKey } from "./planner-store";

/**
 * SVG fill string for a given fabric key — returns either a `url(#fabric-X)`
 * reference (when the user has uploaded a photo for that fabric) or the
 * underlying CSS variable color.
 *
 * Pair with <FabricPatternDefs photos={planner.fabricPhotos} /> rendered
 * inside the same root <svg>.
 */
export function fabricFill(
  key: FabricKey,
  photos?: Partial<Record<FabricKey, string>>,
): string {
  if (photos && photos[key]) return `url(#fabric-${key})`;
  return FABRIC_COLORS[key];
}

/**
 * CSS background string for HTML elements (swatch buttons, chips, etc.)
 * Returns a `url(...)` background-image when a photo exists, otherwise the
 * solid color. Use as `style={{ background: ..., backgroundSize: 'cover' }}`.
 */
export function fabricBackgroundStyle(
  key: FabricKey,
  photos?: Partial<Record<FabricKey, string>>,
): React.CSSProperties {
  const url = photos?.[key];
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: FABRIC_COLORS[key] };
}
