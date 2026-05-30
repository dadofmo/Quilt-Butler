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

function isVisibleElement(node: Element | null): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(node);
  const rect = node.getBoundingClientRect();
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && rect.width > 0 && rect.height > 0;
}

function hasVisibleFreemiusCheckout() {
  if (typeof document === "undefined") return false;
  return Array.from(document.querySelectorAll('iframe[src*="checkout.freemius.com"]')).some((node) =>
    isVisibleElement(node),
  );
}

function hasVisibleAppDialog() {
  if (typeof document === "undefined") return false;
  return Array.from(document.querySelectorAll('[role="dialog"][data-state="open"]')).some((node) =>
    isVisibleElement(node),
  );
}

function scheduleRestorePasses() {
  if (typeof window === "undefined") return;

  const restoreIfSafe = () => {
    if (hasVisibleFreemiusCheckout() || hasVisibleAppDialog()) return;
    restoreCheckoutPageState();
  };

  restoreIfSafe();
  window.requestAnimationFrame(restoreIfSafe);
  [60, 180, 400, 900].forEach((delay) => {
    window.setTimeout(restoreIfSafe, delay);
  });
}

export function restoreCheckoutPageState() {
  if (typeof document === "undefined") return;

  const bodyTop = Number.parseInt(document.body.style.top || "0", 10);
  const shouldRestoreScrollPosition = Number.isFinite(bodyTop) && bodyTop !== 0;

  document.body.style.overflow = "";
  document.body.style.position = "";
  document.body.style.paddingRight = "";
  document.body.style.top = "";
  document.body.style.height = "";
  document.body.style.width = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.overflowX = "";
  document.body.style.overflowY = "";
  document.body.style.overscrollBehavior = "";
  document.body.style.pointerEvents = "";
  document.body.style.touchAction = "";

  document.documentElement.style.overflow = "";
  document.documentElement.style.position = "";
  document.documentElement.style.height = "";
  document.documentElement.style.width = "";
  document.documentElement.style.left = "";
  document.documentElement.style.right = "";
  document.documentElement.style.overflowX = "";
  document.documentElement.style.overflowY = "";
  document.documentElement.style.overscrollBehavior = "";
  document.documentElement.style.pointerEvents = "";
  document.documentElement.style.touchAction = "";

  document.body.classList.remove("fs-checkout-open", "fs-modal-open", "modal-open");
  document.documentElement.classList.remove("fs-checkout-open", "fs-modal-open");

  document.body.removeAttribute("data-scroll-locked");
  document.body.removeAttribute("inert");
  document.documentElement.removeAttribute("inert");
  document.body.style.removeProperty("--removed-body-scroll-bar-size");

  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const cleanupCandidates = new Set<HTMLElement>();

  document
    .querySelectorAll<HTMLElement>('iframe[src*="checkout.freemius.com"], body > div, body > section')
    .forEach((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      const isFreemiusFrame =
        node.tagName === "IFRAME" &&
        typeof (node as HTMLIFrameElement).src === "string" &&
        (node as HTMLIFrameElement).src.includes("checkout.freemius.com");
      const containsFreemiusFrame = !!node.querySelector?.('iframe[src*="checkout.freemius.com"]');
      const looksLikeFullscreenOverlay =
        (style.position === "fixed" || style.position === "absolute") &&
        rect.width >= viewportWidth * 0.9 &&
        rect.height >= viewportHeight * 0.9;
      const isHiddenOverlay =
        (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") &&
        (style.position === "fixed" || style.position === "absolute");

      if (isFreemiusFrame || containsFreemiusFrame || looksLikeFullscreenOverlay || isHiddenOverlay) {
        cleanupCandidates.add(node);
      }
    });

  cleanupCandidates.forEach((node) => {
    if (node.id === "root") return;
    node.remove();
  });

  if (!hasVisibleFreemiusCheckout() && !hasVisibleAppDialog()) {
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(document.documentElement);

    if (bodyStyle.overflow === "hidden" || bodyStyle.overflowY === "hidden") {
      document.body.style.overflow = "auto";
      document.body.style.overflowY = "auto";
    }

    if (htmlStyle.overflow === "hidden" || htmlStyle.overflowY === "hidden") {
      document.documentElement.style.overflow = "auto";
      document.documentElement.style.overflowY = "auto";
    }

    if (bodyStyle.pointerEvents === "none") {
      document.body.style.pointerEvents = "auto";
    }

    if (htmlStyle.pointerEvents === "none") {
      document.documentElement.style.pointerEvents = "auto";
    }
  }

  if (shouldRestoreScrollPosition) {
    window.scrollTo({ top: Math.abs(bodyTop) });
  }
}

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

  let didFinish = false;
  let stopWatch: (() => void) | null = null;
  let checkoutWasVisible = false;
  let pendingReason: "success" | "cancel" | null = null;
  const markVisibility = () => {
    if (hasVisibleFreemiusCheckout()) {
      checkoutWasVisible = true;
      return true;
    }
    return false;
  };
  const settle = (reason: "success" | "cancel") => {
    pendingReason = reason;

    if (!markVisibility()) {
      if (checkoutWasVisible) {
        finish(reason);
      }
      return;
    }

    if (reason === "cancel") {
      pendingReason = "cancel";
    }
  };
  const startWindowRestoreWatch = () => {
    if (typeof window === "undefined") return () => undefined;

    const queueRestore = () => {
      window.setTimeout(() => {
        if (!hasVisibleFreemiusCheckout()) {
          scheduleRestorePasses();
        }
      }, 0);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        queueRestore();
      }
    };

    window.addEventListener("focus", queueRestore);
    window.addEventListener("pageshow", queueRestore);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", queueRestore);
      window.removeEventListener("pageshow", queueRestore);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  };

  const stopWindowRestoreWatch = startWindowRestoreWatch();
  const finish = (reason: "success" | "cancel") => {
    if (didFinish) return;
    didFinish = true;
    stopWatch?.();
    stopWindowRestoreWatch();
    try {
      handler.close();
    } catch {
      // ignore cleanup failures from the hosted SDK
    }
    scheduleRestorePasses();
    if (reason === "success") {
      onSuccess();
      return;
    }
    onCancel?.();
  };

  // Watchdog: the hosted Freemius X button doesn't always fire `cancel`
  // (confirmed on production). Poll for the checkout iframe to disappear
  // or become hidden and restore page scroll regardless.
  const startCloseWatchdog = () => {
    if (typeof window === "undefined") return;
    let everVisible = false;
    const checkClosed = () => {
      if (markVisibility()) {
        everVisible = true;
      } else if (everVisible) {
        finish(pendingReason ?? "cancel");
      }
    };

    const id = window.setInterval(() => {
      checkClosed();
    }, 250);

    const observer = new MutationObserver(() => {
      checkClosed();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "style", "inert"],
    });

    stopWatch = () => {
      window.clearInterval(id);
      observer.disconnect();
      stopWatch = null;
    };
  };

  handler.open({
    name: "QuiltButler",
    licenses: 1,
    purchaseCompleted: () => {
      settle("success");
    },
    success: () => {
      // Some Freemius flows fire `success` instead of purchaseCompleted.
      settle("success");
    },
    cancel: () => {
      settle("cancel");
    },
    canceled: () => {
      settle("cancel");
    },
  });
  startCloseWatchdog();
}
