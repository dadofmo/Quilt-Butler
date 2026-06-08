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

// RFC 2822 date in the exact format the Freemius API expects.
// Node's Date.toUTCString() returns "...GMT"; Freemius wants "...+0000".
function rfc2822Date(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`
  );
}

// Matches the official Freemius SDKs: base64-url-encode the *hex* HMAC digest
// (NOT the raw binary). Strip '=' padding, replace '+' -> '-' and '/' -> '_'.
function base64UrlEncodeHex(hex: string): string {
  return Buffer.from(hex)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signRequest(method: string, resource: string, body: string | null, secretKey: string) {
  const date = rfc2822Date(new Date());
  const contentMd5 = body ? crypto.createHash("md5").update(body).digest("hex") : "";
  const contentType = body ? "application/json" : "";
  const stringToSign = `${method}\n${contentMd5}\n${contentType}\n${date}\n${resource}`;
  const hexDigest = crypto.createHmac("sha256", secretKey).update(stringToSign).digest("hex");
  const signature = base64UrlEncodeHex(hexDigest);
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
  // Freemius does not allow looking up a license by its secret_key as a path
  // segment (returns 400 "Invalid request path"). We have to list licenses
  // and match by secret_key.
  //
  // Strategy 1: search query (works for most installations).
  const search = await freemiusGet(
    `/v1/plugins/${PLUGIN_ID}/licenses.json?search=${encodeURIComponent(licenseKey)}&filter=all&count=10`,
    secretKey,
  );
  if (search.ok && Array.isArray(search.json?.licenses)) {
    const match = (search.json.licenses as any[]).find(
      (l) => l.secret_key === licenseKey,
    );
    if (match) return { kind: "found", license: match as FreemiusLicense };
  }

  // Strategy 2: paginate through the most recent licenses and match by
  // secret_key. Covers cases where the `search` param is ignored by the API.
  if (search.ok) {
    let offset = 0;
    const pageSize = 50;
    const maxPages = 20; // up to 1000 most recent licenses
    for (let page = 0; page < maxPages; page++) {
      const list = await freemiusGet(
        `/v1/plugins/${PLUGIN_ID}/licenses.json?count=${pageSize}&offset=${offset}&filter=all`,
        secretKey,
      );
      if (!list.ok || !Array.isArray(list.json?.licenses)) break;
      const licenses = list.json.licenses as any[];
      if (licenses.length === 0) break;
      const match = licenses.find((l) => l.secret_key === licenseKey);
      if (match) return { kind: "found", license: match as FreemiusLicense };
      if (licenses.length < pageSize) break;
      offset += pageSize;
    }
    return { kind: "not_found" };
  }

  // The license-list call itself failed — surface the underlying error.
  const msg =
    search.json?.error?.message ||
    search.text?.slice(0, 200) ||
    `HTTP ${search.status}`;
  return { kind: "error", status: search.status, message: msg };
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
