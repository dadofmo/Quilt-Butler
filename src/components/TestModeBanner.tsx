import { FREEMIUS_MODE } from "@/lib/freemius-config";

export function TestModeBanner() {
  if (FREEMIUS_MODE !== "sandbox") return null;
  return (
    <div className="w-full bg-yellow-300 px-3 py-1.5 text-center text-xs font-semibold text-yellow-950">
      Test mode — payments are not live yet.
    </div>
  );
}
