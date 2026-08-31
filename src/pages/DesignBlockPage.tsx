import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Undo2 } from "lucide-react";
import { StepShell } from "@/components/StepShell";
import { CustomBlockSvg } from "@/components/CustomBlockSvg";
import { fabricBackgroundStyle } from "@/lib/fabric-fill";
import { FabricSwatchOption } from "@/components/FabricSwatchOption";

import { setPlanner, usePlanner, type FabricKey } from "@/lib/planner-store";
import { CUSTOM_BLOCK_PATTERN, CUSTOM_BLOCK_ID } from "@/lib/patterns";
import {
  MIN_GRID,
  MAX_GRID,
  REGION_COUNT,
  REGION_LABELS,
  ROTATION_STEPS,
  UNIT_LABEL,
  cellsCovered,
  emptyDesign,
  key,
  occupancy,
  resizeDesign,
  validateDesign,
  type CustomBlockDesign,
  type CustomCell,
  type Rotation,
  type UnitKind,
} from "@/lib/custom-block";

/** Letters the block itself may use — Y (sashing) and Z (border) are reserved. */
const BLOCK_FABRICS: FabricKey[] = ["A", "B", "C", "D", "E", "F", "G", "H"];

const UNIT_KINDS: UnitKind[] = ["square", "hst", "qst", "geese"];

export default function DesignBlockPage() {
  return (
    <>
      <Helmet>
        <title>Design Your Own Quilt Block — QuiltButler</title>
        <meta
          name="description"
          content="Draw your own quilt block on a grid of squares, half-square triangles, quarter-square triangles and flying geese, then get exact yardage and a cutting list."
        />
        <link rel="canonical" href="https://quiltbutler.com/design" />
        <meta property="og:title" content="Design Your Own Quilt Block — QuiltButler" />
        <meta
          property="og:description"
          content="Draw your own quilt block, then get exact yardage, a cutting list and sewing steps."
        />
        <meta property="og:url" content="https://quiltbutler.com/design" />
      </Helmet>
      <DesignBlockInner />
    </>
  );
}

function DesignBlockInner() {
  const planner = usePlanner();
  const navigate = useNavigate();

  // Landing here directly (deep link, refresh) still has to select the
  // custom pattern and seed its sashing/border defaults.
  useEffect(() => {
    if (planner.pattern === CUSTOM_BLOCK_ID) return;
    const assignments: Record<string, FabricKey> = {};
    CUSTOM_BLOCK_PATTERN.sections.forEach((sec) => {
      if (sec.id === "border") return;
      assignments[sec.id] = sec.defaultFabric;
    });
    setPlanner({ pattern: CUSTOM_BLOCK_ID, assignments });
  }, [planner.pattern]);

  const [which, setWhich] = useState<"A" | "B">("A");
  const design =
    (which === "A" ? planner.customBlock : planner.customBlockB) ?? emptyDesign(4, "A");

  const [kind, setKind] = useState<UnitKind>("hst");
  const [rotation, setRotation] = useState<Rotation>(0);
  const [regionFabrics, setRegionFabrics] = useState<FabricKey[]>(["A", "B", "C", "D"]);

  const setFabricPhoto = (fk: FabricKey, dataUrl: string | null) => {
    const next = { ...planner.fabricPhotos };
    if (dataUrl) next[fk] = dataUrl;
    else delete next[fk];
    setPlanner({ fabricPhotos: next });
  };

  const handlePhotoUpload = (fk: FabricKey, file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setFabricPhoto(fk, result);
    };
    reader.readAsDataURL(file);
  };

  const save = (next: CustomBlockDesign) =>
    setPlanner(which === "A" ? { customBlock: next } : { customBlockB: next });

  // Undo history: snapshots of the design before each change (per block).
  const [history, setHistory] = useState<Record<"A" | "B", CustomBlockDesign[]>>({ A: [], B: [] });
  const undoStack = history[which];

  const saveWithHistory = (next: CustomBlockDesign) => {
    setHistory((h) => ({ ...h, [which]: [...h[which].slice(-49), design] }));
    save(next);
  };

  const undo = () => {
    const prev = undoStack[undoStack.length - 1];
    if (!prev) return;
    setHistory((h) => ({ ...h, [which]: h[which].slice(0, -1) }));
    save(prev);
  };

  const setSize = (size: number) => saveWithHistory(resizeDesign(design, size));

  const paint = (r: number, c: number) => {
    if (!canPlaceHere(design, r, c, kind, rotation)) return;
    const cells = { ...design.cells };
    const occ = occupancy(design);
    // Free every cell the new unit will sit on (a flying geese unit may be
    // anchored elsewhere, so remove the owner, not just this key).
    const probe: CustomCell = { kind, rotation, fabrics: [] };
    for (const [rr, cc] of cellsCovered(r, c, probe)) {
      const owner = occ[key(rr, cc)];
      if (owner) delete cells[owner];
    }
    cells[key(r, c)] = {
      kind,
      rotation,
      fabrics: regionFabrics.slice(0, REGION_COUNT[kind]),
    };
    save({ ...design, cells });
  };

  const errors = validateDesign(design);
  const occ = occupancy(design);
  const px = Math.min(56, Math.floor(420 / design.size));

  return (
    <StepShell
      step={1}
      title={`Design your own block${planner.useBlockB ? ` — Block ${which}` : ""}`}
      subtitle="Pick a unit, choose its fabrics, then tap the grid to place it. Every cell has to be filled before you continue."
      backTo="/"
    >
      {/* Block A / Block B switcher */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={!!planner.useBlockB}
            onChange={(e) => {
              const on = e.target.checked;
              setPlanner({
                useBlockB: on,
                customBlockB:
                  on && !planner.customBlockB
                    ? emptyDesign(design.size, "A")
                    : planner.customBlockB,
              });
              if (!on) setWhich("A");
            }}
            className="mt-1 h-5 w-5 shrink-0 accent-current"
          />
          <div>
            <div className="text-base font-medium">Design a second block (Block B)</div>
            <p className="text-muted-foreground mt-1 text-xs leading-snug">
              Two-block quilts alternate Block A and Block B like a checkerboard, so
              no two touching blocks are the same. Leave this off to repeat one block
              across the whole quilt.
            </p>
          </div>
        </label>
        {planner.useBlockB && (
          <div className="mt-3 flex gap-2">
            {(["A", "B"] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWhich(w)}
                aria-pressed={which === w}
                className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  which === w ? "border-primary bg-primary/5" : "border-input bg-background"
                }`}
              >
                Block {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid size */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
        <label className="text-foreground mb-2 block text-base font-semibold">
          Grid size ({MIN_GRID}×{MIN_GRID} – {MAX_GRID}×{MAX_GRID})
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={MIN_GRID}
            max={MAX_GRID}
            step={1}
            value={design.size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary"
            aria-label="Grid size"
          />
          <span className="text-foreground bg-muted min-w-[3.5rem] rounded-md px-2 py-1 text-center text-base font-semibold">
            {design.size}×{design.size}
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-snug">
          {planner.blockSize > 0
            ? `Each cell finishes at ${(planner.blockSize / design.size).toFixed(2)}" in your ${planner.blockSize}" block.`
            : `Your block is split into ${design.size} × ${design.size} equal cells. You'll pick the finished block size on the next step.`}
        </p>

      </div>

      {/* Fabric palette + photo uploads */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
        <div className="text-foreground mb-1 text-base font-semibold">Your fabrics</div>
        <p className="text-muted-foreground mb-3 text-xs leading-snug">
          Fabrics A–H start as the standard planner colors. If you have the real
          fabric, upload a photo and it&apos;ll show up in your block, the full-quilt
          preview and the cutting diagrams.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BLOCK_FABRICS.map((f) => (
            <FabricSwatchOption
              key={f}
              fabricKey={f}
              selected={regionFabrics.includes(f)}
              photo={planner.fabricPhotos[f]}
              onSelect={() => {
                const next = [...regionFabrics];
                next[0] = f;
                setRegionFabrics(next);
              }}
              onUpload={(file) => handlePhotoUpload(f, file)}
              onClear={() => setFabricPhoto(f, null)}
            />
          ))}
        </div>
      </div>


      {/* Tool palette */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
        <div className="text-foreground mb-2 text-base font-semibold">Your unit</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {UNIT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                if (ROTATION_STEPS[k] === 1) setRotation(0);
              }}
              aria-pressed={kind === k}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-2 text-center text-xs font-medium transition-colors ${
                kind === k ? "border-primary bg-primary/5" : "border-input bg-background"
              }`}
            >
              <CustomBlockSvg
                design={previewDesign(k, rotation, regionFabrics)}
                photos={planner.fabricPhotos}
                size={52}
              />
              {UNIT_LABEL[k]}
            </button>
          ))}
        </div>

        {ROTATION_STEPS[kind] > 1 && (
          <button
            type="button"
            onClick={() => setRotation((((rotation + 90) % 360) as Rotation))}
            className="border-input bg-background mt-3 rounded-lg border-2 px-4 py-2 text-sm font-semibold"
          >
            Turn a quarter turn ({rotation}°)
          </button>
        )}

        <div className="mt-4 space-y-3">
          {REGION_LABELS[kind].map((label, i) => (
            <div key={label}>
              <div className="text-foreground mb-1 text-sm font-medium">{label}</div>
              <div className="flex flex-wrap gap-2">
                {BLOCK_FABRICS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      const next = [...regionFabrics];
                      next[i] = f;
                      setRegionFabrics(next);
                    }}
                    aria-pressed={regionFabrics[i] === f}
                    aria-label={`${label}: Fabric ${f}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border-2 text-xs font-bold ${
                      regionFabrics[i] === f ? "border-primary" : "border-border"
                    }`}
                    style={fabricBackgroundStyle(f, planner.fabricPhotos)}
                  >
                    <span className="rounded bg-background/80 px-1">{f}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The grid */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4">
        <div className="text-foreground mb-3 text-base font-semibold">Tap to place</div>
        <div className="flex justify-center">
          <div className="relative">
            <CustomBlockSvg
              design={design}
              photos={planner.fabricPhotos}
              size={px * design.size}
            />
            <div
              className="absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${design.size}, minmax(0,1fr))`,
                gridTemplateRows: `repeat(${design.size}, minmax(0,1fr))`,
              }}
            >
              {Array.from({ length: design.size * design.size }, (_, idx) => {
                const r = Math.floor(idx / design.size);
                const c = idx % design.size;
                const filled = !!occ[key(r, c)];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => paint(r, c)}
                    aria-label={`Row ${r + 1}, column ${c + 1}`}
                    className={`border transition-colors hover:bg-primary/20 ${
                      filled ? "border-border/40" : "border-dashed border-primary/60 bg-muted/40"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => save(emptyDesign(design.size, regionFabrics[0] ?? "A"))}
            className="border-input bg-background rounded-lg border-2 px-4 py-2 text-sm font-semibold"
          >
            Clear the grid
          </button>
        </div>
      </div>

      {/* Preview + continue */}
      <div className="bg-card mb-6 rounded-xl border-2 border-border p-4 text-center">
        <div className="text-foreground mb-3 text-base font-semibold">Your block</div>
        <div className="flex justify-center">
          <CustomBlockSvg design={design} photos={planner.fabricPhotos} size={220} />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4">
          <div className="text-foreground text-sm font-semibold">
            Finish your block before you continue
          </div>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-xs">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => navigate("/size")}
        disabled={errors.length > 0}
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next: your quilt size →
      </button>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        Changed your mind?{" "}
        <Link to="/" className="text-primary underline">
          Pick a ready-made pattern instead
        </Link>
        .
      </p>
    </StepShell>
  );
}

/** Small single-unit design used for the tool-palette thumbnails. */
function previewDesign(
  kind: UnitKind,
  rotation: Rotation,
  fabrics: FabricKey[],
): CustomBlockDesign {
  const cell: CustomCell = {
    kind,
    rotation: kind === "square" ? 0 : rotation,
    fabrics: fabrics.slice(0, REGION_COUNT[kind]),
  };
  // Geese cover two cells, so draw them in a 2x2 and fill the rest with sky.
  if (kind === "geese") return { size: 2, cells: buildGeesePreview(cell) };
  return { size: 1, cells: { [key(0, 0)]: cell } };
}

function buildGeesePreview(cell: CustomCell): Record<string, CustomCell> {
  const cells: Record<string, CustomCell> = { [key(0, 0)]: cell };
  const covered = cellsCovered(0, 0, cell);
  for (const [r, c] of [[0, 0], [0, 1], [1, 0], [1, 1]] as Array<[number, number]>) {
    if (covered.some(([rr, cc]) => rr === r && cc === c)) continue;
    cells[key(r, c)] = { kind: "square", rotation: 0, fabrics: [cell.fabrics[1] ?? "B"] };
  }
  return cells;
}

/** A unit may overwrite whatever is already there — it only has to fit. */
function canPlaceHere(
  design: CustomBlockDesign,
  r: number,
  c: number,
  kind: UnitKind,
  rotation: Rotation,
): boolean {
  const probe: CustomCell = { kind, rotation, fabrics: [] };
  return cellsCovered(r, c, probe).every(
    ([rr, cc]) => rr >= 0 && cc >= 0 && rr < design.size && cc < design.size,
  );
}
