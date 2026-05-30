// Client-only license check. No backend, no network calls.
// Unlocked state is stored in localStorage under qb_license_v1.

const STORAGE_KEY = "qb_license_v1";
const BYPASS_CODE = "#QBFREE";

export const FREE_PATTERNS: readonly string[] = ["nine-patch"];

type LicenseRecord = {
  unlocked: boolean;
  source: "purchase" | "bypass";
  at: string; // ISO timestamp
};

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
  return readLicense() !== null;
}

export function hasFullLicense(): boolean {
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
 * Returns true if the code matches the bypass code and the device is now unlocked.
 * Case-insensitive, leading/trailing whitespace tolerated.
 */
export function applyBypassCode(code: string): boolean {
  const normalized = code.trim().toUpperCase();
  if (normalized === BYPASS_CODE.toUpperCase()) {
    unlock("bypass");
    return true;
  }
  return false;
}
