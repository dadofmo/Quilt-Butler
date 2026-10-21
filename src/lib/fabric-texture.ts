import FFT from "fft.js";

/**
 * Periodic-plus-smooth decomposition (Moisan): remove the smooth lighting
 * field responsible for a repeat seam, rather than mixing opposing motifs.
 * The correction is harmonic inside the image, so it cannot add an edge band.
 * Dimensions must be powers of two (the prepared canvas guarantees this).
 */
export function seamlessFabricPixels(source: Uint8ClampedArray, width: number, height: number, averagedEdges = false, smoothEdges = false) {
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
    // Exact mode matches edge pixels (best for smooth prints). Averaged mode
    // measures each jump from a few pixels, extrapolated to the edge, so a
    // fine weave whose rib phase differs at the two edges is NOT mistaken for
    // a lighting jump (that would paint a light-to-dark ramp across each tile).
    const jumpAcross = (n: number, sample: (i: number) => number) => {
      const k = averagedEdges ? Math.max(1, Math.min(8, n >> 3)) : 1;
      let first = 0, last = 0;
      for (let i = 0; i < k; i++) { first += sample(i); last += sample(n - 1 - i); }
      return (last - first) / k * (n - 1) / (n - k);
    };
    // Smooth mode keeps only the gradual (lighting) part of each edge jump.
    // A motif touching one edge but not the other is a sharp, local jump;
    // diffusing it into the tile paints cloudy blotches on plain grounds.
    const lowPass = (jumps: Float64Array) => {
      if (!smoothEdges) return jumps;
      const n = jumps.length, radius = Math.max(2, n >> 3);
      const sorted = Float64Array.from(jumps).sort();
      const med = sorted[n >> 1];
      const clipped = jumps.map(j => Math.max(med - 16, Math.min(med + 16, j)));
      return clipped.map((_, i) => {
        let sum = 0;
        for (let k = -radius; k <= radius; k++) sum += clipped[((i + k) % n + n) % n];
        return sum / (2 * radius + 1);
      });
    };
    const colJumps = lowPass(Float64Array.from({ length: width }, (_, x) => jumpAcross(height, y => at(x, y))));
    for (let x = 0; x < width; x++) {
      field[2 * x] += colJumps[x];
      field[2 * ((height - 1) * width + x)] -= colJumps[x];
    }
    const rowJumps = lowPass(Float64Array.from({ length: height }, (_, y) => jumpAcross(width, x => at(x, y))));
    for (let y = 0; y < height; y++) {
      field[2 * y * width] += rowJumps[y];
      field[2 * (y * width + width - 1)] -= rowJumps[y];
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
 * Returns the shortest reliable full repeat, including dense checks, or
 * null when the print has no reliable axis repeat. Cropping
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
    const low = 2;
    const high = Math.floor(side * 0.65);
    // Neighbouring pixels in a flower are similar, but that is NOT a print
    // repeat. Require correlation to fall into a valley and rise to a real
    // interior peak before allowing a crop (never crop a descending shoulder).
    const isRepeatPeak = (lag: number) => {
      if (r(lag) <= r(lag - 1) || r(lag) < r(lag + 1)) return false;
      let valley = r(1);
      for (let i = 2; i < lag; i++) valley = Math.min(valley, r(i));
      return r(lag) - valley >= 0.15;
    };
    let best = -1;
    for (let lag = low; lag < high; lag++) {
      if (isRepeatPeak(lag) && (best < 0 || r(lag) > r(best))) best = lag;
    }
    if (best < low || best >= high || r(best) < 0.45) return null;
    // Prefer the fundamental repeat over a large multiple. Large crops keep
    // small phase/lighting differences that become patchwork bands on gingham.
    const threshold = Math.max(0.65, r(best) * 0.9);
    for (let lag = low; lag < best; lag++) {
      if (r(lag) >= threshold && isRepeatPeak(lag)) {
        best = lag;
        break;
      }
    }
    const a = r(best - 1), b = r(best), c = r(best + 1);
    const curve = a - 2 * b + c;
    const offset = curve < 0 ? Math.max(-0.5, Math.min(0.5, (a - c) / (2 * curve))) : 0;
    return best + offset;
  };
  return { x: axis(true), y: axis(false) };
}

/**
 * Photographed lighting gain per pixel. A low-order (quadratic) surface is
 * fitted to log brightness and divided out: it follows lamp falloff, shadows
 * and vignetting across the photo, but is far too smooth to follow motifs, so
 * a large dark flower or a wide stripe is never "corrected" away.
 */
export function lightingGain(gray: Float64Array, side: number) {
  const gain = new Float64Array(side * side).fill(1);
  const terms = (u: number, v: number) => [1, u, v, u * u, u * v, v * v];
  const m = Array.from({ length: 6 }, () => new Float64Array(7));
  const step = Math.max(1, side >> 6);
  let logSum = 0, count = 0;
  for (let y = 0; y < side; y += step) for (let x = 0; x < side; x += step) {
    const value = gray[y * side + x];
    if (!(value > 1)) continue;
    const l = Math.log(value);
    const t = terms(2 * (x + 0.5) / side - 1, 2 * (y + 0.5) / side - 1);
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) m[r][c] += t[r] * t[c];
      m[r][6] += t[r] * l;
    }
    logSum += l;
    count++;
  }
  if (count < 12) return gain;
  for (let col = 0; col < 6; col++) {
    let pivot = col;
    for (let r = col + 1; r < 6; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-9) return gain;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < 6; r++) if (r !== col) {
      const f = m[r][col] / m[col][col];
      for (let c = col; c < 7; c++) m[r][c] -= f * m[col][c];
    }
  }
  const coef = m.map((row, i) => row[6] / row[i]);
  const mean = logSum / count;
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const t = terms(2 * (x + 0.5) / side - 1, 2 * (y + 0.5) / side - 1);
    let fit = 0;
    for (let i = 0; i < 6; i++) fit += coef[i] * t[i];
    gain[y * side + x] = Math.min(1.7, Math.max(0.6, Math.exp(mean - fit)));
  }
  return gain;
}

/**
 * Build the square texture from one print repeat. Fine weaves report tiny
 * repeats (2–6 px); slicing those into hundreds of copies smears the photo
 * into flat vertical bands. So a repeat is widened to a whole multiple of at
 * least side/16, ONE repeat is made seamless on its own (so every internal
 * copy join is seamless, not only the outer tile edge), then copies are laid
 * down by wrap-around sampling.
 */
export function repeatTilePixels(source: Uint8ClampedArray, side: number, lagX: number | null, lagY: number | null) {
  const minLag = Math.max(4, side / 16);
  const widen = (lag: number | null) => {
    if (lag === null || !(lag > 0) || lag > side) return side;
    return lag < minLag ? lag * Math.ceil(minLag / lag) : lag;
  };
  const lx = Math.min(side, widen(lagX));
  const ly = Math.min(side, widen(lagY));
  const copiesX = Math.max(1, Math.round(side / lx));
  const copiesY = Math.max(1, Math.round(side / ly));
  const pow2 = (n: number) => Math.min(side, Math.max(16, 2 ** Math.ceil(Math.log2(n))));
  const pw = pow2(lx), ph = pow2(ly);
  const startX = (side - lx) / 2, startY = (side - ly) / 2;
  const clampAt = (x: number, y: number, c: number) =>
    source[(Math.min(side - 1, Math.max(0, y)) * side + Math.min(side - 1, Math.max(0, x))) * 4 + c];
  // One repeat, resampled to a power-of-two cell.
  const cell = new Uint8ClampedArray(pw * ph * 4);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
    const sx = startX + (x + 0.5) * lx / pw - 0.5, sy = startY + (y + 0.5) * ly / ph - 0.5;
    const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
    for (let c = 0; c < 3; c++) cell[(y * pw + x) * 4 + c] =
      (clampAt(x0, y0, c) * (1 - fx) + clampAt(x0 + 1, y0, c) * fx) * (1 - fy) +
      (clampAt(x0, y0 + 1, c) * (1 - fx) + clampAt(x0 + 1, y0 + 1, c) * fx) * fy;
    cell[(y * pw + x) * 4 + 3] = 255;
  }
  const seamless = seamlessFabricPixels(cell, pw, ph);
  const at = (x: number, y: number, c: number) =>
    seamless[((((y % ph) + ph) % ph) * pw + (((x % pw) + pw) % pw)) * 4 + c];
  const output = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const u = (x + 0.5) * copiesX * pw / side - 0.5, v = (y + 0.5) * copiesY * ph / side - 0.5;
    const x0 = Math.floor(u), y0 = Math.floor(v), fx = u - x0, fy = v - y0;
    for (let c = 0; c < 3; c++) output[(y * side + x) * 4 + c] =
      (at(x0, y0, c) * (1 - fx) + at(x0 + 1, y0, c) * fx) * (1 - fy) +
      (at(x0, y0 + 1, c) * (1 - fx) + at(x0 + 1, y0 + 1, c) * fx) * fy;
    output[(y * side + x) * 4 + 3] = 255;
  }
  return output;
}

export interface TileArtifacts {
  /** Join difference across the repeat edge relative to normal pixel-to-pixel detail (1 = invisible). */
  seam: number;
  /** Fine detail kept relative to the photo (below 1 = smeared, above 1 = noisy). */
  detail: number;
  /** Strongest light/dark band across columns or rows, in brightness levels. */
  band: number;
  /** Average colour shift from the photo, in RGB levels. */
  colour: number;
  /** Worst local cloudy shift from the photo (patch mean vs typical), in brightness levels. */
  blotch: number;
}

function blotchLevel(t: Float64Array, r: Float64Array, n: number) {
  const cells = 16, size = Math.max(1, Math.floor(n / cells)), means: number[] = [];
  for (let by = 0; by < cells; by++) for (let bx = 0; bx < cells; bx++) {
    let sum = 0, count = 0;
    for (let y = by * size; y < Math.min(n, (by + 1) * size); y++)
      for (let x = bx * size; x < Math.min(n, (bx + 1) * size); x++) { sum += t[y * n + x] - r[y * n + x]; count++; }
    if (count) means.push(sum / count);
  }
  const sorted = [...means].sort((a, b) => a - b);
  const med = sorted[sorted.length >> 1] ?? 0;
  return Math.max(0, ...means.map(m => Math.abs(m - med)));
}

const luma = (px: Uint8ClampedArray, n: number) =>
  Float64Array.from({ length: n * n }, (_, i) => 0.299 * px[4 * i] + 0.587 * px[4 * i + 1] + 0.114 * px[4 * i + 2]);

function bandRange(lum: Float64Array, n: number) {
  let worst = 0;
  for (const horizontal of [true, false]) {
    const means = new Float64Array(n);
    for (let a = 0; a < n; a++) {
      let sum = 0;
      for (let b = 0; b < n; b++) sum += horizontal ? lum[b * n + a] : lum[a * n + b];
      means[a] = sum / n;
    }
    for (const w of [Math.max(2, n >> 4), Math.max(2, n >> 3)]) {
      let lo = Infinity, hi = -Infinity;
      for (let a = 0; a < n; a++) {
        let sum = 0;
        for (let k = 0; k < w; k++) sum += means[(a + k) % n];
        lo = Math.min(lo, sum / w);
        hi = Math.max(hi, sum / w);
      }
      worst = Math.max(worst, hi - lo);
    }
  }
  return worst;
}

/** Measure how a repeating tile will look when laid edge to edge, against the photo it came from. */
export function tileArtifacts(tile: Uint8ClampedArray, reference: Uint8ClampedArray, n: number): TileArtifacts {
  const t = luma(tile, n), r = luma(reference, n);
  const interior = (l: Float64Array) => {
    let sum = 0;
    for (let y = 0; y < n; y++) for (let x = 1; x < n; x++)
      sum += Math.abs(l[y * n + x] - l[y * n + x - 1]) + Math.abs(l[x * n + y] - l[(x - 1) * n + y]);
    return sum / (2 * n * (n - 1));
  };
  let join = 0;
  for (let a = 0; a < n; a++)
    join += Math.abs(t[a * n] - t[a * n + n - 1]) + Math.abs(t[a] - t[(n - 1) * n + a]);
  join /= 2 * n;
  const detailT = interior(t), detailR = interior(r);
  let colour = 0;
  for (let c = 0; c < 3; c++) {
    let dt = 0, dr = 0;
    for (let i = 0; i < n * n; i++) { dt += tile[4 * i + c]; dr += reference[4 * i + c]; }
    colour = Math.max(colour, Math.abs(dt - dr) / (n * n));
  }
  return {
    seam: join / (detailT + 0.5),
    detail: (detailT + 2) / (detailR + 2),
    band: bandRange(t, n),
    colour,
    blotch: blotchLevel(t, r, n),
  };
}

/**
 * Turn any photographed fabric (power-of-two square RGBA) into a repeat tile
 * that lays edge to edge without seams or bands. Candidates are built and
 * MEASURED rather than trusted:
 *   - the whole photo made seamless, edge pixels matched (smooth prints),
 *   - the whole photo made seamless from averaged edges (fine weaves), and
 *   - an exact print-repeat crop (dots/checks, only if a repeat is detected).
 * Among tiles that keep the photo's detail, colour and evenness, the one with
 * the least visible join wins; nothing is assumed to work for every print.
 * Lighting is evened out first so neither candidate repeats a shadow.
 */
export function buildFabricTile(source: Uint8ClampedArray, side: number): Uint8ClampedArray {
  const flat = new Uint8ClampedArray(source);
  for (let i = 0; i < side * side; i++) flat[4 * i + 3] = 255;
  const gain = lightingGain(luma(flat, side), side);
  for (let i = 0; i < side * side; i++)
    for (let c = 0; c < 3; c++) flat[4 * i + c] = flat[4 * i + c] * gain[i];
  const candidates = [seamlessFabricPixels(flat, side, side), seamlessFabricPixels(flat, side, side, true), seamlessFabricPixels(flat, side, side, false, true)];
  if (side >= 16) {
    const repeat = detectPrintRepeat(luma(flat, side), side);
    if (repeat.x !== null || repeat.y !== null) candidates.push(repeatTilePixels(flat, side, repeat.x, repeat.y));
  }
  const flatBand = bandRange(luma(flat, side), side);
  const scored = candidates.map(tile => ({ tile, m: tileArtifacts(tile, flat, side) }));
  const faithful = scored.filter(({ m }) =>
    m.detail >= 0.85 && m.detail <= 1.2 && m.colour <= 5 && m.band <= flatBand * 1.1 + 3);
  // Cleanest join among faithful tiles; if none qualify, the most even one.
  // Prefer tiles that don't paint cloudy blotches onto plain grounds.
  const clean = faithful.filter(({ m }) => m.blotch <= 8);
  const pool = clean.length ? clean : faithful.length ? faithful : scored;
  pool.sort((a, b) => pool !== scored ? a.m.seam - b.m.seam : a.m.band - b.m.band);
  return pool[0].tile;
}

/** Halve with averaging; keeps a tile seamless and pre-filters fine weaves against shimmer/moiré. */
export function halveTile(px: Uint8ClampedArray, side: number) {
  const h = side >> 1;
  const out = new Uint8ClampedArray(h * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < h; x++) for (let c = 0; c < 4; c++) {
    const i = (yy: number, xx: number) => px[((2 * y + yy) * side + 2 * x + xx) * 4 + c];
    out[(y * h + x) * 4 + c] = (i(0, 0) + i(0, 1) + i(1, 0) + i(1, 1)) / 4;
  }
  return out;
}

/** Downscale in halving steps; a single big drawImage step aliases fine knits into stripes. */
export function drawSquareCrop(image: CanvasImageSource, width: number, height: number, side: number) {
  const crop = Math.min(width, height);
  let sx = (width - crop) / 2, sy = (height - crop) / 2, size = crop;
  let src: CanvasImageSource = image;
  while (size / 2 >= side * 1.5) {
    const next = Math.round(size / 2);
    const step = document.createElement("canvas");
    step.width = next;
    step.height = next;
    const ctx = step.getContext("2d");
    if (!ctx) break;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, next, next);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, sx, sy, size, size, 0, 0, next, next);
    src = step; sx = 0; sy = 0; size = next;
  }
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, side, side);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(src, sx, sy, size, size, 0, 0, side, side);
  return { canvas, context };
}

const textures = new Map<string, Promise<string>>();

/** Prepare one lighting-corrected, measured-seamless square repeat per photo, not per piece. */
export function fabricTexture(url: string): Promise<string> {
  const cached = textures.get(url);
  if (cached) return cached;
  const result = new Promise<string>(resolve => {
    const image = new Image();
    image.onload = () => {
      try {
        const w = image.naturalWidth, h = image.naturalHeight;
        if (Math.min(w, h) < 1) { resolve(url); return; }
        // Analyse at up to 512 px, never below 64 (tiny photos are enlarged).
        const side = Math.max(64, Math.min(512, 2 ** Math.floor(Math.log2(Math.min(w, h)))));
        const drawn = drawSquareCrop(image, w, h, side);
        if (!drawn) { resolve(url); return; }
        const sample = drawn.context.getImageData(0, 0, side, side).data;
        let tile = buildFabricTile(sample, side);
        let out = side;
        // Deliver at most 256 px: plenty for on-screen tiles and pre-filtered against moiré.
        while (out > 256) { tile = halveTile(tile, out); out >>= 1; }
        drawn.canvas.width = out;
        drawn.canvas.height = out;
        drawn.context.putImageData(new ImageData(new Uint8ClampedArray(tile), out, out), 0, 0);
        resolve(drawn.canvas.toDataURL("image/png"));
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
