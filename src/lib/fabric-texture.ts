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

/**
 * Find the print's own repeat along each axis (e.g. a polka-dot lattice).
 * Returns the lag, in pixels, of the strongest repeat between 35% and 65%
 * of the side, or null when the print has no reliable axis repeat. Cropping
 * the photo to exactly that lag makes tile edges meet dot-to-dot.
 */
export function detectPrintRepeat(gray: Float64Array, side: number): { x: number | null; y: number | null } {
  if (side < 16 || (side & (side - 1))) return { x: null, y: null };
  const size = side * 2;
  const fft = new FFT(size);
  const input = fft.createComplexArray();
  const output = fft.createComplexArray();
  const axis = (horizontal: boolean) => {
    const power = new Float64Array(size);
    for (let line = 0; line < side; line++) {
      let mean = 0;
      for (let i = 0; i < side; i++) mean += horizontal ? gray[line * side + i] : gray[i * side + line];
      mean /= side;
      input.fill(0);
      for (let i = 0; i < side; i++)
        input[2 * i] = (horizontal ? gray[line * side + i] : gray[i * side + line]) - mean;
      fft.transform(output, input);
      for (let k = 0; k < size; k++) power[k] += output[2 * k] ** 2 + output[2 * k + 1] ** 2;
    }
    input.fill(0);
    for (let k = 0; k < size; k++) input[2 * k] = power[k];
    fft.inverseTransform(output, input);
    const zero = output[0] / side;
    if (!(zero > 1e-9)) return null;
    const r = (lag: number) => output[2 * lag] / (side - lag) / zero;
    const low = Math.ceil(side * 0.35);
    const high = Math.floor(side * 0.65);
    let best = -1;
    for (let lag = low; lag <= high; lag++) if (best < 0 || r(lag) > r(best)) best = lag;
    if (best <= low || best >= high || r(best) < 0.45) return null;
    const a = r(best - 1), b = r(best), c = r(best + 1);
    const curve = a - 2 * b + c;
    const offset = curve < 0 ? Math.max(-0.5, Math.min(0.5, (a - c) / (2 * curve))) : 0;
    return best + offset;
  };
  return { x: axis(true), y: axis(false) };
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
        const left = (image.naturalWidth - crop) / 2;
        const top = (image.naturalHeight - crop) / 2;
        context.drawImage(image, left, top, crop, crop, 0, 0, side, side);
        // Regular prints: crop to a whole number of print repeats, then lay
        // copies side by side so every tile edge continues the print exactly.
        const sample = context.getImageData(0, 0, side, side).data;
        const gray = new Float64Array(side * side);
        for (let i = 0; i < side * side; i++)
          gray[i] = 0.299 * sample[4 * i] + 0.587 * sample[4 * i + 1] + 0.114 * sample[4 * i + 2];
        const repeat = detectPrintRepeat(gray, side);
        if (repeat.x || repeat.y) {
          const scale = crop / side;
          const lagX = repeat.x ?? side;
          const lagY = repeat.y ?? side;
          const copiesX = Math.max(1, Math.round(side / lagX));
          const copiesY = Math.max(1, Math.round(side / lagY));
          const sourceWidth = lagX * scale;
          const sourceHeight = lagY * scale;
          const sourceLeft = left + (crop - sourceWidth) / 2;
          const sourceTop = top + (crop - sourceHeight) / 2;
          context.clearRect(0, 0, side, side);
          for (let row = 0; row < copiesY; row++) for (let column = 0; column < copiesX; column++) {
            const x0 = Math.round(column * side / copiesX);
            const x1 = Math.round((column + 1) * side / copiesX);
            const y0 = Math.round(row * side / copiesY);
            const y1 = Math.round((row + 1) * side / copiesY);
            context.drawImage(image, sourceLeft, sourceTop, sourceWidth, sourceHeight, x0, y0, x1 - x0, y1 - y0);
          }
        }
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
