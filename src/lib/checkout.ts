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
    plugin_id: FREEMIUS_CONFIG.product_id,
    product_id: FREEMIUS_CONFIG.product_id,
    plan_id: FREEMIUS_CONFIG.plan_id,
    pricing_id: FREEMIUS_CONFIG.pricing_id,
    public_key: FREEMIUS_CONFIG.public_key,
    mode: FREEMIUS_MODE === "sandbox" ? "sandbox" : "live",
  });

  const restoreScroll = () => {
    // Freemius's checkout locks body scroll while open and sometimes
    // forgets to fully restore it when closed via the X. Force-clear
    // the styles it (and any wrapping modal) may have left behind.
    if (typeof document === "undefined") return;
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.paddingRight = "";
    document.body.style.top = "";
    document.body.style.height = "";
    document.body.style.width = "";
    document.documentElement.style.overflow = "";
    document.documentElement.style.position = "";
    document.documentElement.style.height = "";
    document.body.classList.remove("fs-checkout-open", "fs-modal-open", "modal-open");
    document.documentElement.classList.remove("fs-checkout-open", "fs-modal-open");
  };

  // Watchdog: the hosted Freemius X button doesn't always fire `cancel`
  // (confirmed on production). Poll for the checkout iframe to disappear
  // or become hidden and restore page scroll regardless.
  let stopWatch: (() => void) | null = null;
  const startCloseWatchdog = () => {
    if (typeof window === "undefined") return;
    const isVisible = () => {
      const iframes = document.querySelectorAll<HTMLIFrameElement>(
        'iframe[src*="checkout.freemius.com"]',
      );
      for (const f of iframes) {
        const r = f.getBoundingClientRect();
        const s = window.getComputedStyle(f);
        if (s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0) {
          return true;
        }
      }
      return false;
    };
    let everVisible = false;
    const id = window.setInterval(() => {
      if (isVisible()) {
        everVisible = true;
      } else if (everVisible) {
        restoreScroll();
        stopWatch?.();
      }
    }, 250);
    stopWatch = () => {
      window.clearInterval(id);
      stopWatch = null;
    };
  };

  handler.open({
    name: "QuiltButler",
    licenses: 1,
    purchaseCompleted: () => {
      stopWatch?.();
      restoreScroll();
      onSuccess();
    },
    success: () => {
      // Some Freemius flows fire `success` instead of purchaseCompleted.
      stopWatch?.();
      restoreScroll();
      onSuccess();
    },
    cancel: () => {
      stopWatch?.();
      restoreScroll();
      onCancel?.();
    },
  });
  startCloseWatchdog();
}
