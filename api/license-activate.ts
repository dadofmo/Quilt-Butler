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

async function lookupLicense(licenseKey: string, secretKey: string): Promise<FreemiusLicense | null> {
  // Freemius license keys live on the plugin as `secret_key`.
  const resource = `/v1/plugins/${PLUGIN_ID}/licenses.json?secret_key=${encodeURIComponent(licenseKey)}&count=1`;
  const headers = signRequest("GET", resource, null, secretKey);
  const res = await fetch(`${FREEMIUS_API}${resource}`, { method: "GET", headers });
  if (!res.ok) return null;
  const data = (await res.json()) as FreemiusListResponse;
  if (!data?.licenses?.length) return null;
  return data.licenses[0];
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

    const license = await lookupLicense(licenseKey, secretKey);
    if (!license) {
      res.status(404).json({
        ok: false,
        error: "We couldn't find that license key. Double-check the key from your purchase email.",
      });
      return;
    }

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
