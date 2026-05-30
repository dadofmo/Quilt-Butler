// Client-only license check. No backend, no network calls.
// Real purchases (including 100%-off Freemius coupons) are persisted in
// localStorage under qb_license_v1. The #QBFREE bypass code is sandbox-only
// and unlocks for the current page session only — padlocks reappear on reload.

import { FREEMIUS_MODE } from "./freemius-config";

const STORAGE_KEY = "qb_license_v1";
const BYPASS_CODE = "#QBFREE";

export const FREE_PATTERNS: readonly string[] = ["nine-patch"];

type LicenseRecord = {
  unlocked: boolean;
  source: "purchase" | "bypass";
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

export function unlock(source: LicenseRecord["source"] = "purchase"): void {
  const record: LicenseRecord = {
    unlocked: true,
    source,
    at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // ignore quota / privacy mode errors
  }
}

/**
 * Sandbox-only test bypass. In live mode this always returns false so the
 * code is worthless to anyone who finds it in the JS bundle. In sandbox it
 * flips an in-memory flag (no localStorage write) so padlocks reappear on
 * the next page load.
 *
 * For real free gifting, create a 100% discount coupon in the Freemius
 * dashboard — recipients enter it during checkout and get a real persisted
 * license via the normal purchaseCompleted flow.
 */
export function applyBypassCode(code: string): boolean {
  if (FREEMIUS_MODE !== "sandbox") return false;
  const normalized = code.trim().toUpperCase();
  if (normalized === BYPASS_CODE.toUpperCase()) {
    sessionUnlocked = true;
    return true;
  }
  return false;
}
