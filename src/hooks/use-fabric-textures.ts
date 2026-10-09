import { useEffect, useState } from "react";
import { fabricTexture } from "@/lib/fabric-texture";
import { ALL_FABRIC_KEYS, type FabricKey } from "@/lib/planner-store";

/** Keep photos and their prepared repeats paired during asynchronous replacements. */
export function useFabricTextures(photos?: Partial<Record<FabricKey, string>>) {
  const [ready, setReady] = useState<Partial<Record<FabricKey, { source: string; texture: string }>>>({});
  useEffect(() => {
    let active = true;
    for (const key of ALL_FABRIC_KEYS) {
      const source = photos?.[key];
      if (!source) continue;
      void fabricTexture(source).then(texture => {
        if (active) setReady(previous => previous[key]?.source === source ? previous :
          { ...previous, [key]: { source, texture } });
      });
    }
    return () => { active = false; };
  }, [photos]);
  if (!photos) return photos;
  const output = { ...photos };
  for (const key of ALL_FABRIC_KEYS) {
    const entry = ready[key];
    if (entry && entry.source === photos[key]) output[key] = entry.texture;
  }
  return output;
}