/**
 * Normalise a camera or gallery fabric photo before it is stored.
 * Phone cameras produce 4–12 MB pictures; stored raw they overflow the
 * browser's saved-planner space (so photos silently vanish on reload) and
 * decode slowly. Downscale to a sharp 1024 px JPEG, flatten transparency
 * onto white, and respect the camera's rotation. Returns null when the
 * browser cannot read the file at all.
 */
export const MAX_FABRIC_PHOTO_PX = 1024;

export function fabricPhotoSize(width: number, height: number, max = MAX_FABRIC_PHOTO_PX) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function decode(file: Blob): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
    image.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    image.src = url;
  });
}

const readAsDataUrl = (file: Blob) => new Promise<string | null>(resolve => {
  const reader = new FileReader();
  reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
  reader.onerror = () => resolve(null);
  reader.readAsDataURL(file);
});

export async function prepareFabricPhoto(file: File): Promise<string | null> {
  // Some Android camera captures report an empty type; let decoding decide.
  if (file.type && !file.type.startsWith("image/")) return null;
  const image = await decode(file);
  if (!image || !image.naturalWidth || !image.naturalHeight) return null;
  try {
    const { width, height } = fabricPhotoSize(image.naturalWidth, image.naturalHeight);
    let src: CanvasImageSource = image;
    let w = image.naturalWidth, h = image.naturalHeight;
    // Halve gradually so fine weaves do not alias into stripes.
    while (w / 2 >= width * 1.5) {
      const step = document.createElement("canvas");
      step.width = Math.round(w / 2);
      step.height = Math.round(h / 2);
      const ctx = step.getContext("2d");
      if (!ctx) break;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, step.width, step.height);
      src = step; w = step.width; h = step.height;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return readAsDataUrl(file);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";
    context.drawImage(src, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.9);
  } catch {
    return readAsDataUrl(file);
  }
}
