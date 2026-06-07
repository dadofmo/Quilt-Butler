// Vercel serverless function — activates a Freemius license key.
// Runs on Vercel's Node.js runtime. Reads secrets from env vars set in
// the Vercel dashboard (Settings → Environment Variables):
//   - FREEMIUS_SECRET_KEY  (required, sk_... from Freemius dashboard)
//   - OWNER_MASTER_KEY     (optional, secret string that always unlocks)
//
// Public/non-secret config (plugin_id, public_key) lives in the source
// because it's already exposed in the browser bundle.

import crypto from "node:crypto";

const PLUGIN_ID = "30617";
const PLUGIN_PUBLIC_KEY = "pk_f993d14743e7f27a372ff2a194da1";
const FREEMIUS_API = "https://api.freemius.com";

type FreemiusLicense = {
  id?: string;
  is_active?: boolean;
  is_cancelled?: boolean;
  expiration?: string | null;
  quota?: number | null;
  activated?: number;
};

type FreemiusListResponse = {
  licenses?: FreemiusLicense[];
  error?: { message?: string; code?: string };
};

function signRequest(method: string, resource: string, body: string | null, secretKey: string) {
  const date = new Date().toUTCString();
  const contentMd5 = body ? crypto.createHash("md5").update(body).digest("hex") : "";
  const contentType = body ? "application/json" : "";
  const stringToSign = `${method}\n${contentMd5}\n${contentType}\n${date}\n${resource}`;
  const signature = crypto.createHmac("sha256", secretKey).update(stringToSign).digest("base64");
  const headers: Record<string, string> = {
    Date: date,
    Authorization: `FS ${PLUGIN_ID}:${PLUGIN_PUBLIC_KEY}:${signature}`,
  };
  if (body) {
    headers["Content-Type"] = contentType;
    headers["Content-MD5"] = contentMd5;
  }
  return headers;
}

type LookupResult =
  | { kind: "found"; license: FreemiusLicense }
  | { kind: "not_found" }
  | { kind: "error"; status: number; message: string };

async function freemiusGet(resource: string, secretKey: string) {
  const headers = signRequest("GET", resource, null, secretKey);
  const res = await fetch(`${FREEMIUS_API}${resource}`, { method: "GET", headers });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, ok: res.ok, json, text };
}

async function lookupLicense(licenseKey: string, secretKey: string): Promise<LookupResult> {
  // Strategy 1: direct lookup by license key as the resource id.
  // Freemius supports GET /v1/plugins/{id}/licenses/{license_key}.json
  const direct = await freemiusGet(
    `/v1/plugins/${PLUGIN_ID}/licenses/${encodeURIComponent(licenseKey)}.json`,
    secretKey,
  );
  if (direct.ok && direct.json && !direct.json.error && (direct.json.id || direct.json.secret_key)) {
    return { kind: "found", license: direct.json as FreemiusLicense };
  }
  // 404 from the direct endpoint is a clean "not found" — fall through to search to be safe.
  // Strategy 2: search the licenses list by the key.
  const search = await freemiusGet(
    `/v1/plugins/${PLUGIN_ID}/licenses.json?search=${encodeURIComponent(licenseKey)}&filter=all&count=5`,
    secretKey,
  );
  if (search.ok && search.json?.licenses?.length) {
    const match =
      (search.json.licenses as FreemiusLicense[]).find(
        (l: any) => l.secret_key === licenseKey,
      ) ?? (search.json.licenses[0] as FreemiusLicense);
    return { kind: "found", license: match };
  }

  // If both attempts failed for a non-404 reason, surface the error.
  const failing = !direct.ok && direct.status !== 404 ? direct : !search.ok ? search : null;
  if (failing) {
    const msg = failing.json?.error?.message || failing.text?.slice(0, 200) || `HTTP ${failing.status}`;
    return { kind: "error", status: failing.status, message: msg };
  }
  return { kind: "not_found" };
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: any, res: any) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const licenseKey = String(body.licenseKey ?? "").trim();
    if (!licenseKey) {
      res.status(400).json({ ok: false, error: "License key is required." });
      return;
    }

    // Owner master key — bypasses Freemius. Lives only in env vars.
    const ownerKey = process.env.OWNER_MASTER_KEY?.trim();
    if (ownerKey && licenseKey === ownerKey) {
      res.status(200).json({ ok: true, source: "owner" });
      return;
    }

    const secretKey = process.env.FREEMIUS_SECRET_KEY?.trim();
    if (!secretKey) {
      res.status(500).json({
        ok: false,
        error: "Server is not configured. Please contact support.",
      });
      return;
    }

    const lookup = await lookupLicense(licenseKey, secretKey);
    if (lookup.kind === "error") {
      console.error("[license-activate] Freemius error", lookup.status, lookup.message);
      res.status(502).json({
        ok: false,
        error: `License server error (${lookup.status}): ${lookup.message}`,
      });
      return;
    }
    if (lookup.kind === "not_found") {
      res.status(404).json({
        ok: false,
        error: "We couldn't find that license key. Double-check the key from your purchase email.",
      });
      return;
    }
    const license = lookup.license;

    if (license.is_cancelled || license.is_active === false) {
      res.status(403).json({
        ok: false,
        error: "This license is no longer active.",
      });
      return;
    }

    if (license.expiration) {
      const exp = new Date(license.expiration).getTime();
      if (!Number.isNaN(exp) && exp < Date.now()) {
        res.status(403).json({ ok: false, error: "This license has expired." });
        return;
      }
    }

    res.status(200).json({ ok: true, source: "freemius" });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Something went wrong validating your license. Please try again.",
    });
  }
}
