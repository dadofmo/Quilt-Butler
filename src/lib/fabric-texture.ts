import FFT from "fft.js";

/**
 * Periodic-plus-smooth decomposition (Moisan): remove the smooth lighting
 * field responsible for a repeat seam, rather than mixing opposing motifs.
 * The correction is harmonic inside the image, so it cannot add an edge band.
 * Dimensions must be powers of two (the prepared canvas guarantees this).
 */
export function seamlessFabricPixels(source: Uint8ClampedArray, width: number, height: number) {
  const output = new Uint8ClampedArray(source);
  if (width < 2 || height < 2 || (width & (width - 1)) || (height & (height - 1))) return output;
  const horizontal = new FFT(width);
  const vertical = new FFT(height);
  const field = new Float64Array(width * height * 2);
  const rowIn = horizontal.createComplexArray();
  const rowOut = horizontal.createComplexArray();
  const colIn = vertical.createComplexArray();
  const colOut = vertical.createComplexArray();
  const transform = (inverse: boolean) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width * 2; x++) rowIn[x] = field[y * width * 2 + x];
      if (inverse) horizontal.inverseTransform(rowOut, rowIn);
      else horizontal.transform(rowOut, rowIn);
      field.set(rowOut, y * width * 2);
    }
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        colIn[2 * y] = field[2 * (y * width + x)];
        colIn[2 * y + 1] = field[2 * (y * width + x) + 1];
      }
      if (inverse) vertical.inverseTransform(colOut, colIn);
      else vertical.transform(colOut, colIn);
      for (let y = 0; y < height; y++) {
        field[2 * (y * width + x)] = colOut[2 * y];
        field[2 * (y * width + x) + 1] = colOut[2 * y + 1];
      }
    }
  };
  const denominator = Float64Array.from({ length: width * height }, (_, i) =>
    2 * Math.cos(2 * Math.PI * (i % width) / width) +
    2 * Math.cos(2 * Math.PI * Math.floor(i / width) / height) - 4);
  for (let channel = 0; channel < 3; channel++) {
    field.fill(0);
    const at = (x: number, y: number) => source[(y * width + x) * 4 + channel];
    for (let x = 0; x < width; x++) {
      const jump = at(x, height - 1) - at(x, 0);
      field[2 * x] += jump;
      field[2 * ((height - 1) * width + x)] -= jump;
    }
    for (let y = 0; y < height; y++) {
      const jump = at(width - 1, y) - at(0, y);
      field[2 * y * width] += jump;
      field[2 * (y * width + width - 1)] -= jump;
    }
    transform(false);
    field[0] = 0;
    field[1] = 0;
    for (let i = 1; i < width * height; i++) {
      field[2 * i] /= denominator[i];
      field[2 * i + 1] /= denominator[i];
    }
    transform(true);
    for (let i = 0; i < width * height; i++) output[4 * i + channel] = source[4 * i + channel] - field[2 * i];
  }
  return output;
}

const textures = new Map<string, Promise<string>>();

/** Prepare one lighting-corrected square repeat per photo, not per piece. */
export function fabricTexture(url: string): Promise<string> {
  const cached = textures.get(url);
  if (cached) return cached;
  const result = new Promise<string>(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const available = Math.min(512, image.naturalWidth, image.naturalHeight);
        if (available < 2) { resolve(url); return; }
        const side = 2 ** Math.floor(Math.log2(available));
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