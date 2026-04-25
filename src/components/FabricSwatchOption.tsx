import { useRef } from "react";
import {
  FABRIC_COLORS,
  FABRIC_LABELS,
  type FabricKey,
} from "@/lib/planner-store";

interface Props {
  fabricKey: FabricKey;
  selected: boolean;
  photo?: string;
  onSelect: () => void;
  onUpload: (file: File) => void;
  onClear: () => void;
}

/**
 * One fabric option in the picker grid:
 *   - swatch (color OR uploaded photo thumbnail)
 *   - the letter (A/B/C…)
 *   - "Upload photo" link (or "Replace / Remove" once a photo is set)
 *   - small helper note encouraging the user to upload a real fabric photo
 */
export function FabricSwatchOption({
  fabricKey,
  selected,
  photo,
  onSelect,
  onUpload,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const swatchStyle = photo
    ? {
        backgroundImage: `url(${photo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: FABRIC_COLORS[fabricKey] };

  return (
    <div
      className={`flex flex-col items-stretch gap-1.5 rounded-lg border-2 p-2 transition-all ${
        selected
          ? "border-primary ring-primary/20 ring-2"
          : "border-border hover:border-muted-foreground"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={FABRIC_LABELS[fabricKey]}
        className="flex flex-col items-center gap-1 text-sm font-medium"
      >
        <span
          className="h-10 w-full rounded border border-border/60"
          style={swatchStyle}
        />
        <span className="text-foreground">{fabricKey}</span>
      </button>

      <p className="text-muted-foreground text-[10px] leading-tight">
        If you have the actual fabric, take a photo and upload it from your
        gallery.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
          e.target.value = "";
        }}
      />

      {photo ? (
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-primary font-medium underline-offset-2 hover:underline"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground hover:text-foreground font-medium underline-offset-2 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-primary text-[11px] font-medium underline-offset-2 hover:underline"
        >
          Upload photo
        </button>
      )}
    </div>
  );
}
