// Vercel serverless function — activates a Freemius license key using
// the documented product-scope license activation endpoint:
//   POST /v1/products/{product_id}/licenses/activate.json
//
// This endpoint does NOT require an Authorization header (it's
// authenticated by the license key itself), which avoids the legacy
// `Authorization: FS ...` signing path that Freemius now rejects.
//
// Env vars (Vercel → Settings → Environment Variables):
//   - OWNER_MASTER_KEY  (optional secret string that always unlocks)
//   - FREEMIUS_SECRET_KEY  (no longer required for activation; kept
//     optional for future server-side calls)

const PRODUCT_ID = "30617";
const FREEMIUS_API = "https://api.freemius.com";

type FreemiusActivateResponse = {
  install_id?: string;
  install_api_token?: string;
  license_plan_name?: string;
  user?: { email?: string };
  license?: {
    id?: string;
    is_active?: boolean;
    is_cancelled?: boolean;
    expiration?: string | null;
  };
  // Error shape
  error?: { message?: string; code?: string; type?: string; http?: number };
  is_cancelled?: boolean;
  expiration?: string | null;
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function friendlyError(status: number, code: string | undefined, message: string | undefined): string {
  const c = (code || "").toLowerCase();
  const m = (message || "").toLowerCase();

  if (c.includes("invalid_license") || m.includes("invalid license") || m.includes("license key")) {
    return "We couldn't find that license key. Double-check the key from your purchase email.";
  }
  if (c.includes("cancelled") || m.includes("cancel")) {
    return "This license has been cancelled.";
  }
  if (c.includes("expired") || m.includes("expired")) {
    return "This license has expired.";
  }
  if (c.includes("quota") || m.includes("activation") && m.includes("limit") || m.includes("quota")) {
    return "This license has reached its device activation limit. You can deactivate a device from your Freemius account or email us for help.";
  }
  if (status === 404) {
    return "We couldn't find that license key. Double-check the key from your purchase email.";
  }
  return message || `License server error (${status}).`;
}

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
    const uid = String(body.uid ?? "").trim();
    const title = String(body.title ?? "").trim() || "Quilt Butler (Web)";

    if (!licenseKey) {
      res.status(400).json({ ok: false, error: "License key is required." });
      return;
    }

    // Owner master key — bypasses Freemius entirely.
    const ownerKey = process.env.OWNER_MASTER_KEY?.trim();
    if (ownerKey && licenseKey === ownerKey) {
      res.status(200).json({ ok: true, source: "owner" });
      return;
    }

    if (!uid || uid.length < 8) {
      res.status(400).json({ ok: false, error: "Missing device identifier. Please reload the page and try again." });
      return;
    }

    const payload = { license_key: licenseKey, uid, title };

    const fmRes = await fetch(
      `${FREEMIUS_API}/v1/products/${PRODUCT_ID}/licenses/activate.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const text = await fmRes.text();
    let json: FreemiusActivateResponse | null = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

    if (!fmRes.ok || (json && json.error)) {
      const errMsg = json?.error?.message;
      const errCode = json?.error?.code;
      console.error("[license-activate] Freemius activate error", fmRes.status, text?.slice(0, 400));
      const status = fmRes.status >= 400 ? fmRes.status : 400;
      res.status(status).json({
        ok: false,
        error: friendlyError(status, errCode, errMsg),
      });
      return;
    }

    // Success. Surface basic install/license metadata so the client can
    // persist it for later validation if needed.
    const license = json?.license;
    if (license?.is_cancelled) {
      res.status(403).json({ ok: false, error: "This license has been cancelled." });
      return;
    }
    if (license?.expiration) {
      const exp = new Date(license.expiration).getTime();
      if (!Number.isNaN(exp) && exp < Date.now()) {
        res.status(403).json({ ok: false, error: "This license has expired." });
        return;
      }
    }

    res.status(200).json({
      ok: true,
      source: "freemius",
      install_id: json?.install_id,
      install_api_token: json?.install_api_token,
      plan_name: json?.license_plan_name,
      email: json?.user?.email,
    });
  } catch (err) {
    console.error("[license-activate] unexpected error", err);
    res.status(500).json({
      ok: false,
      error: "Something went wrong validating your license. Please try again.",
    });
  }
}
