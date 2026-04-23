import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { StepShell } from "@/components/StepShell";
import { SIZE_PRESETS, setPlanner, usePlanner } from "@/lib/planner-store";
import { useState } from "react";

export const Route = createFileRoute("/size")({
  head: () => ({
    meta: [
      { title: "Quilt size — Quilt Fabric Planner" },
      { name: "description", content: "Set your finished quilt size, fabric width, block size and border." },
    ],
  }),
  component: SizeStep,
});

function SizeStep() {
  const planner = usePlanner();
  const navigate = useNavigate();

  const [preset, setPreset] = useState(planner.sizePreset);
  const [w, setW] = useState(planner.quiltWidth);
  const [h, setH] = useState(planner.quiltHeight);
  const [fabricWidth, setFabricWidth] = useState<44 | 60>(planner.fabricWidth);
  const [blockSize, setBlockSize] = useState(planner.blockSize);
  const [borderPreset, setBorderPreset] = useState<string>(
    [0, 2, 3, 4, 5].includes(planner.borderWidth) ? String(planner.borderWidth) : "custom",
  );
  const [borderCustom, setBorderCustom] = useState(planner.borderWidth);

  if (!planner.pattern) {
    return (
      <StepShell step={2} title="Pick a pattern first" backTo="/">
        <Link to="/" className="text-primary underline">Go back to patterns</Link>
      </StepShell>
    );
  }

  const onPreset = (key: string) => {
    setPreset(key);
    if (key !== "custom") {
      const p = SIZE_PRESETS[key];
      setW(p.w);
      setH(p.h);
    }
  };

  const next = () => {
    const border = borderPreset === "custom" ? Number(borderCustom) || 0 : Number(borderPreset);
    setPlanner({
      sizePreset: preset,
      quiltWidth: Number(w) || 0,
      quiltHeight: Number(h) || 0,
      fabricWidth,
      blockSize: Number(blockSize),
      borderWidth: border,
    });
    navigate({ to: "/fabrics" });
  };

  return (
    <StepShell step={2} title="Quilt size & basics" subtitle="A few quick details so we can do the math." backTo="/">
      <div className="space-y-6">
        <Field label="Finished quilt size">
          <Select value={preset} onChange={(e) => onPreset(e.target.value)}>
            {Object.entries(SIZE_PRESETS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          {preset === "custom" && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberInput label="Width (in)" value={w} onChange={setW} />
              <NumberInput label="Height (in)" value={h} onChange={setH} />
            </div>
          )}
        </Field>

        <Field label="Fabric width (your bolt)">
          <Select value={String(fabricWidth)} onChange={(e) => setFabricWidth(Number(e.target.value) as 44 | 60)}>
            <option value="44">44 inches</option>
            <option value="60">60 inches</option>
          </Select>
        </Field>

        <Field label="Block size (finished)">
          <Select value={String(blockSize)} onChange={(e) => setBlockSize(Number(e.target.value))}>
            {[6, 8, 10, 12].map((b) => (
              <option key={b} value={b}>{b} inches</option>
            ))}
          </Select>
        </Field>

        <Field label="Border width">
          <Select value={borderPreset} onChange={(e) => setBorderPreset(e.target.value)}>
            <option value="0">None</option>
            <option value="2">2 inches</option>
            <option value="3">3 inches</option>
            <option value="4">4 inches</option>
            <option value="5">5 inches</option>
            <option value="custom">Custom</option>
          </Select>
          {borderPreset === "custom" && (
            <div className="mt-3">
              <NumberInput label="Border (in)" value={borderCustom} onChange={setBorderCustom} />
            </div>
          )}
        </Field>

        <button
          onClick={next}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-xl px-6 py-4 text-lg font-semibold shadow-sm transition-colors"
        >
          Continue →
        </button>
      </div>
    </StepShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-foreground mb-2 block text-base font-semibold">{label}</label>
      {children}
    </div>
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
    />
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-muted-foreground mb-1 block text-sm">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-card border-input focus:ring-ring w-full rounded-xl border-2 px-4 py-3 text-base focus:outline-none focus:ring-2"
      />
    </label>
  );
}
