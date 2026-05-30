// Lazy-loads the Freemius hosted checkout script and exposes openCheckout().
import { FREEMIUS_CONFIG, FREEMIUS_MODE } from "./freemius-config";

declare global {
  interface Window {
    FS?: {
      Checkout: {
        configure: (opts: Record<string, unknown>) => {
          open: (opts: Record<string, unknown>) => void;
          close: () => void;
        };
      };
    };
    jQuery?: unknown;
    $?: unknown;
  }
}

const JQUERY_URL = "https://code.jquery.com/jquery-3.7.1.min.js";
const SCRIPT_URL = "https://checkout.freemius.com/checkout.min.js";
let loadPromise: Promise<void> | null = null;

function injectScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset.loaded = "true";
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.FS?.Checkout && window.jQuery) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    if (!window.jQuery) {
      await injectScript(JQUERY_URL);
    }
    if (!window.FS?.Checkout) {
      await injectScript(SCRIPT_URL);
    }
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });

  return loadPromise;
}

export type CheckoutHandlers = {
  onSuccess: () => void;
  onCancel?: () => void;
};

export async function openCheckout({ onSuccess, onCancel }: CheckoutHandlers): Promise<void> {
  await loadScript();
  if (!window.FS?.Checkout) throw new Error("Freemius Checkout unavailable");

  const handler = window.FS.Checkout.configure({
    product_id: FREEMIUS_CONFIG.product_id,
    plan_id: FREEMIUS_CONFIG.plan_id,
    pricing_id: FREEMIUS_CONFIG.pricing_id,
    public_key: FREEMIUS_CONFIG.public_key,
    mode: FREEMIUS_MODE === "sandbox" ? "sandbox" : "live",
  });

  handler.open({
    name: "QuiltButler",
    licenses: 1,
    purchaseCompleted: () => {
      onSuccess();
    },
    success: () => {
      // Some Freemius flows fire `success` instead of purchaseCompleted.
      onSuccess();
    },
    cancel: () => {
      onCancel?.();
    },
  });
}
