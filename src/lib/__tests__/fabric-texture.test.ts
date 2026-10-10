import { describe, expect, it } from "vitest";
import { seamlessFabricPixels } from "../fabric-texture";

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