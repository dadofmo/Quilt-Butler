import { describe, expect, it } from "vitest";
import { buildFabricTile, halveTile, tileArtifacts } from "../fabric-texture";
import { fabricPhotoSize } from "../fabric-photo";

/**
 * Every kind of fabric photo a quilter might take, each shot like a phone
 * picture (uneven lamp light, print not aligned to the frame edge). Whatever
 * the print, the finished repeat must lay edge to edge with no visible seam,
 * no light/dark bands, its detail kept and its colour unchanged.
 */
const side = 128;
type Paint = (x: number, y: number) => [number, number, number];

let seed = 11;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const smoothNoise = (() => {
  const g = Array.from({ length: 17 * 17 }, rand);
  return (x: number, y: number) => {
    const u = x / 8, v = y / 8, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
    const at = (a: number, b: number) => g[(b % 17) * 17 + (a % 17)];
    return (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
  };
})();

const fabrics: Record<string, Paint> = {
  solid: () => [200, 90, 120],
  "polka dots (repeat not aligned to frame)": (x, y) => {
    const dx = (x + 3) % 10 - 5, dy = (y + 6) % 10 - 5;
    return dx * dx + dy * dy < 7 ? [250, 250, 250] : [60, 110, 200];
  },
  "skewed polka dots (photo at an angle)": (x, y) => {
    const px = x + y * 0.08, py = y * 1.04;
    const dx = px % 11 - 5.5, dy = py % 11 - 5.5;
    return dx * dx + dy * dy < 8 ? [255, 240, 245] : [220, 80, 140];
  },
  "dense gingham": (x, y) => {
    const a = x % 6 < 3, b = y % 6 < 3;
    return a && b ? [250, 250, 250] : a || b ? [220, 120, 120] : [190, 20, 30];
  },
  "fine gray knit": (x, y) => {
    const v = 120 + 25 * Math.sin(2 * Math.PI * x / 3 + 0.8 * Math.sin(y / 7));
    return [v, v, v + 4];
  },
  "wide stripes": (x) => (x % 37 < 18 ? [30, 60, 120] : [240, 230, 200]),
  "large floral": (x, y) => {
    const f = Math.exp(-((x - 30) ** 2 + (y - 40) ** 2) / 200) + Math.exp(-((x - 95) ** 2 + (y - 90) ** 2) / 300);
    return [170 + 70 * f, 200 - 90 * f, 230 - 60 * f];
  },
  "batik / irregular blotches": (x, y) => {
    const n = smoothNoise(x, y);
    return [80 + 120 * n, 40 + 60 * n, 120 + 90 * n];
  },
  "grainy linen": () => { const n = rand() * 40; return [180 + n, 170 + n, 150 + n]; },
};

type Light = (x: number, y: number) => number;
const lights: Record<string, Light> = {
  // Lamp at the top-left, ~30% fall-off to the far corner.
  "corner lamp": (x, y) => 1.1 - 0.3 * ((x + y) / (2 * side)),
  // Phone vignette: bright middle, darker edges.
  vignette: (x, y) => 1.05 - 0.25 * (((x - side / 2) ** 2 + (y - side / 2) ** 2) / (side * side / 2)),
};

function photo(paint: Paint, light: Light = lights["corner lamp"], dx = 0, dy = 0) {
  const px = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const l = light(x, y);
    const [r, g, b] = paint(x + dx, y + dy);
    const i = (y * side + x) * 4;
    px[i] = r * l; px[i + 1] = g * l; px[i + 2] = b * l; px[i + 3] = 255;
  }
  return px;
}

/** Reference without lighting: what the fabric actually looks like. */
function evenPhoto(paint: Paint, dx = 0, dy = 0) {
  const px = new Uint8ClampedArray(side * side * 4);
  for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
    const [r, g, b] = paint(x + dx, y + dy);
    px.set([r, g, b, 255], (y * side + x) * 4);
  }
  return px;
}

describe("any fabric photo becomes a seamless, even repeat", () => {
  const framings = [[0, 0], [4, 7], [13, 2]];
  for (const [name, paint] of Object.entries(fabrics))
  for (const [lightName, light] of Object.entries(lights))
  for (const [dx, dy] of framings) {
    it(`${name} — ${lightName}, framed at +${dx},+${dy}`, () => {
      seed = 11;
      const tile = buildFabricTile(photo(paint, light, dx, dy), side);
      seed = 11;
      const reference = evenPhoto(paint, dx, dy);
      const result = tileArtifacts(tile, reference, side);
      const truth = tileArtifacts(reference, reference, side);
      expect(result.seam).toBeLessThan(1.6);
      expect(result.detail).toBeGreaterThan(0.8);
      expect(result.detail).toBeLessThan(1.25);
      expect(result.band).toBeLessThan(truth.band * 1.1 + 8);
    });
  }

  it("rejects an untreated phone photo, so the check can actually fail", () => {
    const raw = photo(fabrics["polka dots (repeat not aligned to frame)"]);
    expect(tileArtifacts(raw, raw, side).seam).toBeGreaterThan(1.6);
  });

  it("keeps the photo's colour", () => {
    const tile = buildFabricTile(photo(fabrics.solid), side);
    expect(Math.abs(tile[0] - 200)).toBeLessThan(25);
    expect(Math.abs(tile[1] - 90)).toBeLessThan(15);
  });

  it("stays seamless after shrinking for display", () => {
    const tile = buildFabricTile(photo(fabrics["batik / irregular blotches"]), side);
    const small = halveTile(tile, side);
    expect(tileArtifacts(small, small, side / 2).seam).toBeLessThan(1.6);
  });
});

describe("stored camera photos", () => {
  it("shrinks a 12-megapixel phone picture to 1024 px on the long side", () => {
    expect(fabricPhotoSize(4000, 3000)).toEqual({ width: 1024, height: 768 });
    expect(fabricPhotoSize(3000, 4000)).toEqual({ width: 768, height: 1024 });
  });
  it("never enlarges a small picture", () => {
    expect(fabricPhotoSize(600, 400)).toEqual({ width: 600, height: 400 });
  });
});
