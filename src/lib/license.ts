// License state. Mostly client-only; license-key activation calls a
// Vercel serverless function (/api/license-activate) that talks to
// Freemius using the server-side FREEMIUS_SECRET_KEY.
//
// Customers receive a license key in their purchase email. They can
// re-enter it on any device, any browser, after any cache clear — this
// is the fail-safe path for iOS Safari storage purges, new phones, etc.
//
// Legacy: the in-browser purchaseCompleted callback still writes a
// localStorage record with source "purchase" so existing buyers keep
// access without re-entering anything.

import { FREEMIUS_MODE } from "./freemius-config";

const STORAGE_KEY = "qb_license_v1";

export const FREE_PATTERNS: readonly string[] = ["nine-patch"];

type LicenseRecord = {
  unlocked: boolean;
  source: "purchase" | "bypass" | "key" | "owner";
  /** License key, if unlock came from key entry. */
  licenseKey?: string;
  /** Buyer's email from Freemius, if available. */
  email?: string;
  at: string; // ISO timestamp
};

// In-memory only. Cleared on page reload.
let sessionUnlocked = false;

// One-time migration: scrub any persisted bypass record from earlier testing
// so padlocks come back automatically under the new sandbox-only behavior.
(function migrateLegacyBypass() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as LicenseRecord;
    if (parsed && parsed.source === "bypass") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
})();

function readLicense(): LicenseRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LicenseRecord;
    return parsed && parsed.unlocked ? parsed : null;
  } catch {
    return null;
  }
}

export function isUnlocked(patternId: string): boolean {
  if (FREE_PATTERNS.includes(patternId)) return true;
  if (sessionUnlocked) return true;
  return readLicense() !== null;
}

export function hasFullLicense(): boolean {
  if (sessionUnlocked) return true;
  return readLicense() !== null;
}

export function unlock(source: LicenseRecord["source"] = "purchase", licenseKey?: string, email?: string): void {
  const record: LicenseRecord = {
    unlocked: true,
    source,
    licenseKey,
    email,
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore quota / privacy mode errors
  }
}

const DEVICE_UID_KEY = "qb_device_uid_v1";

function getOrCreateDeviceUid(): string {
  try {
    const existing = localStorage.getItem(DEVICE_UID_KEY);
    if (existing && existing.length >= 16) return existing;
    const uid =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "")
        : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    localStorage.setItem(DEVICE_UID_KEY, uid);
    return uid;
  } catch {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }
}

function getDeviceTitle(): string {
  try {
    const ua = navigator.userAgent || "";
    if (/iPhone/i.test(ua)) return "Quilt Butler — iPhone";
    if (/iPad/i.test(ua)) return "Quilt Butler — iPad";
    if (/Android/i.test(ua)) return "Quilt Butler — Android";
    if (/Mac OS/i.test(ua)) return "Quilt Butler — Mac";
    if (/Windows/i.test(ua)) return "Quilt Butler — Windows";
  } catch { /* ignore */ }
  return "Quilt Butler (Web)";
}

export type ActivationFailure = {
  ok: false;
  error: string;
  reason?: "limit_reached" | "invalid" | "cancelled" | "expired";
};

/**
 * Activate a license key against the server. On success, persists the
 * unlock so it survives reloads on this device.
 */
export async function activateLicenseKey(
  rawKey: string,
): Promise<{ ok: true } | ActivationFailure> {
  const licenseKey = rawKey.trim();
  if (!licenseKey) {
    return { ok: false, error: "Please enter your license key." };
  }
  try {
    const res = await fetch("/api/license-activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        uid: getOrCreateDeviceUid(),
        title: getDeviceTitle(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      reason?: ActivationFailure["reason"];
      source?: "owner" | "freemius";
      email?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        error: data.error || "We couldn't activate that key. Please try again.",
        reason: data.reason,
      };
    }
    unlock(data.source === "owner" ? "owner" : "key", licenseKey, data.email);
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Network error. Check your connection and try again.",
    };
  }
}

export type LicenseDevice = {
  install_id: string;
  title: string;
  last_seen: string | null;
};

/** Fetch the list of devices currently activated against a license key. */
export async function listLicenseDevices(
  rawKey: string,
): Promise<{ ok: true; devices: LicenseDevice[] } | { ok: false; error: string }> {
  const licenseKey = rawKey.trim();
  if (!licenseKey) return { ok: false, error: "Please enter your license key." };
  try {
    const res = await fetch("/api/license-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      devices?: LicenseDevice[];
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "We couldn't load your devices." };
    }
    return { ok: true, devices: data.devices || [] };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

/**
 * Free up one device on a license, then activate the current device.
 * On success, persists the unlock just like activateLicenseKey.
 */
export async function swapLicenseDevice(
  rawKey: string,
  installId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const licenseKey = rawKey.trim();
  if (!licenseKey || !installId) {
    return { ok: false, error: "Please pick a device to free up." };
  }
  try {
    const res = await fetch("/api/license-deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey,
        installId,
        uid: getOrCreateDeviceUid(),
        title: getDeviceTitle(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      source?: "owner" | "freemius";
      email?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "We couldn't free up that device." };
    }
    unlock("key", licenseKey, data.email);
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error. Check your connection and try again." };
  }
}

/**
 * Sandbox-only test bypass. In production builds this is a no-op and is
 * fully tree-shaken so the bypass string never ships in the JS bundle.
 */
export function applyBypassCode(code: string): boolean {
  if (!import.meta.env.DEV) return false;
  const normalized = code.trim().toUpperCase();
  if (normalized === "#QBFREE") {
    sessionUnlocked = true;
    return true;
  }
  return false;
}
