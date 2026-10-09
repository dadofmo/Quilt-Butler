import { describe, expect, it } from "vitest";
import { seamlessFabricPixels } from "../fabric-texture";

describe("photographed fabric repeats", () => {
  const width = 40;
  const height = 30;
  const source = Uint8ClampedArray.from({ length: width * height * 4 }, (_, i) => (i * 37) % 256);
  const output = seamlessFabricPixels(source, width, height);
  const pixel = (data: Uint8ClampedArray, x: number, y: number) =>
    Array.from(data.slice((y * width + x) * 4, (y * width + x) * 4 + 4));

  it("matches the left and right repeat edges without a brightness jump", () => {
    for (let y = 0; y < height; y++) expect(pixel(output, 0, y)).toEqual(pixel(output, width - 1, y));
    expect(pixel(source, 0, 4)).not.toEqual(pixel(source, width - 1, 4));
  });
  it("matches the top and bottom repeat edges including the corners", () => {
    for (let x = 0; x < width; x++) expect(pixel(output, x, 0)).toEqual(pixel(output, x, height - 1));
  });
  it("retains the unreflected photograph throughout the interior", () => {
    for (let y = 3; y < height - 3; y++) for (let x = 4; x < width - 4; x++)
      expect(pixel(output, x, y)).toEqual(pixel(source, x, y));
  });
});