import { describe, expect, it } from "vitest";
import { detectPrintRepeat, repeatTilePixels, seamlessFabricPixels } from "../fabric-texture";

describe("photographed fabric repeats", () => {
  const width = 64;
  const height = 32;
  // An unreflected repeating print photographed under uneven lighting.
  const source = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => {
    if (i % 4 === 3) return 255;
    const x = Math.floor(i / 4) % width;
    const y = Math.floor(i / 4 / width);
    return 100 + x + y + (x % 8 === 3 && y % 8 === 3 ? 40 : 0);
  });
  const output = seamlessFabricPixels(source, width, height);
  const pixel = (data: Uint8ClampedArray, x: number, y: number) =>
    Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 4));

  it("removes a photographed lighting jump without creating a vertical blend band", () => {
    for (let y = 0; y < height; y++) {
      expect(Math.abs(pixel(output, 0, y)[0] - pixel(output, width - 1, y)[0])).toBeLessThanOrEqual(1);
      for (let x = 1; x < width; x++) {
        if (x % 8 === 3 || x % 8 === 4) continue;
        expect(Math.abs(pixel(output, x, y)[0] - pixel(output, x - 1, y)[0])).toBeLessThanOrEqual(2);
      }
    }
    expect(pixel(source, 0, 4)).not.toEqual(pixel(source, width - 1, 4));
  });
  it("removes horizontal lighting jumps including the corners", () => {
    for (let x = 0; x < width; x++)
      expect(Math.abs(pixel(output, x, 0)[0] - pixel(output, x, height - 1)[0])).toBeLessThanOrEqual(1);
  });
  it("preserves motif position, contrast and opacity instead of mixing opposite dots", () => {
    for (let y = 3; y < height - 1; y += 8) for (let x = 3; x < width - 1; x += 8) {
      expect(pixel(output, x, y)[0] - pixel(output, x + 1, y)[0]).toBeGreaterThanOrEqual(38);
      expect(pixel(output, x, y)[3]).toBe(255);
    }
  });
});
describe("print repeat detection", () => {
  const side = 128;
  const dots = (period: number) => Float64Array.from({ length: side * side }, (_, i) => {
    const x = i % side, y = Math.floor(i / side);
    const dx = ((x % period) + period) % period - period / 2;
    const dy = ((y % period) + period) % period - period / 2;
    return 80 + x * 0.3 + (dx * dx + dy * dy < (period / 4) ** 2 ? 120 : 0);
  });
  it("finds a whole number of polka-dot repeats on both axes", () => {
    const repeat = detectPrintRepeat(dots(10), side);
    if (repeat.x === null || repeat.y === null) throw new Error("Missing dot repeat");
    expect(Math.abs(repeat.x / 10 - Math.round(repeat.x / 10))).toBeLessThan(0.05);
    expect(Math.abs(repeat.y / 10 - Math.round(repeat.y / 10))).toBeLessThan(0.05);
  });
  it("uses the small full gingham repeat instead of a patch-sized multiple", () => {
    const checks = Float64Array.from({ length: side * side }, (_, i) => {
      const x = i % side, y = Math.floor(i / side);
      return 100 + 45 * Math.cos(2 * Math.PI * x / 8) + 45 * Math.cos(2 * Math.PI * y / 8);
    });
    const repeat = detectPrintRepeat(checks, side);
    expect(repeat.x).toBeCloseTo(8, 1);
    expect(repeat.y).toBeCloseTo(8, 1);
  });
  it("finds no repeat in an irregular print", () => {
    let seed = 7;
    const noise = Float64Array.from({ length: side * side }, () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648 * 255;
    });
    expect(detectPrintRepeat(noise, side)).toEqual({ x: null, y: null });
  });
  it("does not mistake smooth floral motifs for a two-pixel repeat", () => {
    const flowers = Float64Array.from({ length: side * side }, (_, i) => {
      const x = i % side, y = Math.floor(i / side);
      return 180 - 60 * Math.exp(-((x - 23) ** 2 + (y - 37) ** 2) / 180)
        - 45 * Math.exp(-((x - 85) ** 2 + (y - 91) ** 2) / 290)
        - 35 * Math.exp(-((x - 101) ** 2 + (y - 19) ** 2) / 100);
    });
    expect(detectPrintRepeat(flowers, side)).toEqual({ x: null, y: null });
  });
});
describe("fine-weave fabric photos", () => {
  const side = 128;
  // A dark knit whose rib repeats every 3 pixels, with a lighting ramp.
  const knit = Uint8ClampedArray.from({ length: side * side * 4 }, (_, i) => {
    if (i % 4 === 3) return 255;
    const x = Math.floor(i / 4) % side, y = Math.floor(i / 4 / side);
    return 90 + 25 * Math.sin(2 * Math.PI * x / 3 + 0.8 * Math.sin(y / 7)) + x * 0.15;
  });
  const gray = Float64Array.from({ length: side * side }, (_, i) => knit[4 * i]);
  const repeat = detectPrintRepeat(gray, side);
  const out = repeatTilePixels(knit, side, repeat.x, repeat.y);
  const columnMean = (x: number) => {
    let sum = 0;
    for (let y = 0; y < side; y++) sum += out[(y * side + x) * 4];
    return sum / side;
  };
  it("keeps the knit texture instead of smearing it flat", () => {
    let spread = 0;
    for (let y = 0; y < side; y++) for (let x = 1; x < side; x++)
      spread += Math.abs(out[(y * side + x) * 4] - out[(y * side + x - 1) * 4]);
    expect(spread / (side * (side - 1))).toBeGreaterThan(8);
  });
  it("shows no light/dark vertical bands across the tile", () => {
    // Average each 8-column stripe; a band would make stripes differ a lot.
    const stripes = Array.from({ length: side / 8 }, (_, s) => {
      let sum = 0;
      for (let x = s * 8; x < s * 8 + 8; x++) sum += columnMean(x);
      return sum / 8;
    });
    expect(Math.max(...stripes) - Math.min(...stripes)).toBeLessThan(6);
  });
  it("joins repeated copies without a lighting step", () => {
    const ramp = Uint8ClampedArray.from({ length: side * side * 4 }, (_, i) =>
      i % 4 === 3 ? 255 : 60 + (Math.floor(i / 4) % side) * 0.8);
    const tiled = repeatTilePixels(ramp, side, 32, 32);
    for (let x = 1; x < side; x++)
      expect(Math.abs(tiled[x * 4] - tiled[(x - 1) * 4])).toBeLessThanOrEqual(3);
  });
});
