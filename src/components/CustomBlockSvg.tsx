import type { FabricKey } from "@/lib/planner-store";
import { fabricFill } from "@/lib/fabric-fill";
import { blockPolys, type CustomBlockDesign } from "@/lib/custom-block";
import { FabricPatternDefs } from "./FabricPatternDefs";

/**
 * The shapes of one user-designed block, drawn into a 200×200 viewBox so it
 * drops straight into the same SVG canvases the built-in blocks use
 * (PatternDiagram's block preview and QuiltLayoutPreview's tiled quilt).
 *
 * Adjacent shapes butt up flush — no seam strokes, matching every other
 * block renderer in the app.
 */
export function CustomBlockShapes({
  design,
  photos,
}: {
  design: CustomBlockDesign;
  photos?: Partial<Record<FabricKey, string>>;
}) {
  const unit = 200 / design.size;
  return (
    <>
      {blockPolys(design).map((poly, i) => (
        <polygon
          key={i}
          points={poly.points.map(([x, y]) => `${x * unit},${y * unit}`).join(" ")}
          fill={fabricFill(poly.fabric, photos)}
        />
      ))}
    </>
  );
}

/**
 * Standalone square preview of a custom block, used by the editor and by the
 * pattern tile. `size` is the rendered pixel width.
 *
 * `crop` narrows the visible area to part of the block — the editor uses it
 * for the "Long triangles" thumbnail, whose piece covers two grid cells and
 * so would otherwise float in a half-empty square.
 */
export function CustomBlockSvg({
  design,
  photos,
  size = 220,
  className,
  crop,
}: {
  design: CustomBlockDesign;
  photos?: Partial<Record<FabricKey, string>>;
  size?: number;
  className?: string;
  /** Visible fraction of the 200×200 block, as { w, h } in 0–1. */
  crop?: { w: number; h: number };
}) {
  const vw = 200 * (crop?.w ?? 1);
  const vh = 200 * (crop?.h ?? 1);
  return (
    <svg
      width={(size * vw) / 200}
      height={(size * vh) / 200}
      viewBox={`0 0 ${vw} ${vh}`}
      className={className}
      role="img"
      aria-label="Preview of your custom quilt block"
    >
      <FabricPatternDefs photos={photos} />
      <CustomBlockShapes design={design} photos={photos} />
    </svg>
  );
}

