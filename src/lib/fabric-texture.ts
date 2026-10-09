/** Blend only opposite photo edges, retaining the original print orientation. */
export function seamlessFabricPixels(source: Uint8ClampedArray, width: number, height: number) {
  const output = new Uint8ClampedArray(source.length);
  const bandX = Math.max(1, Math.round(width * 0.08));
  const bandY = Math.max(1, Math.round(height * 0.08));
  for (let y = 0; y < height; y++) {
    const dy = Math.min(y, height - 1 - y);
    const wy = dy < bandY ? (1 - dy / bandY) / 2 : 0;
    for (let x = 0; x < width; x++) {
      const dx = Math.min(x, width - 1 - x);
      const wx = dx < bandX ? (1 - dx / bandX) / 2 : 0;
      for (let channel = 0; channel < 4; channel++) {
        const at = (xx: number, yy: number) => source[(yy * width + xx) * 4 + channel];
        output[(y * width + x) * 4 + channel] =
          at(x, y) * (1 - wx) * (1 - wy) +
          at(width - 1 - x, y) * wx * (1 - wy) +
          at(x, height - 1 - y) * (1 - wx) * wy +
          at(width - 1 - x, height - 1 - y) * wx * wy;
      }
    }
  }
  return output;
}

const textures = new Map<string, Promise<string>>();

/** Prepare one square crop per photo, not per piece, with matching repeat edges. */
export function fabricTexture(url: string): Promise<string> {
  const cached = textures.get(url);
  if (cached) return cached;
  const result = new Promise<string>(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const side = Math.min(512, image.naturalWidth, image.naturalHeight);
        if (side < 1) { resolve(url); return; }
        const canvas = document.createElement("canvas");
        canvas.width = side;
        canvas.height = side;
        const context = canvas.getContext("2d");
        if (!context) { resolve(url); return; }
        const crop = Math.min(image.naturalWidth, image.naturalHeight);
        context.drawImage(image, (image.naturalWidth - crop) / 2, (image.naturalHeight - crop) / 2,
          crop, crop, 0, 0, side, side);
        const pixels = context.getImageData(0, 0, side, side);
        pixels.data.set(seamlessFabricPixels(pixels.data, side, side));
        context.putImageData(pixels, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch { resolve(url); }
    };
    image.onerror = () => resolve(url);
    image.src = url;
  });
  // Bound retained photo data when users replace camera pictures repeatedly.
  if (textures.size >= 24) textures.delete(textures.keys().next().value ?? "");
  textures.set(url, result);
  return result;
}