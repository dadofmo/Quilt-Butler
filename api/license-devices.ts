// Lists devices (installs) currently activated against a Freemius license
// key. Uses the unsigned, license-key-authenticated endpoint to mirror
// the activation path that already works (see license-activate.ts).
//
// Always returns JSON so the client's [debug: …] surface can show the
// real Freemius status + body instead of an opaque "http 500".

export const config = { runtime: "nodejs20.x" };

const PRODUCT_ID = "30617";
const FREEMIUS_API = "https://api.freemius.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type DeviceSummary = {
  install_id: string;
  title: string;
  last_seen: string | null;
};

function jsonError(res: any, status: number, error: string, debug?: { status?: number; body?: string }) {
  res.status(status).json({ ok: false, error, ...(debug ? { debug } : {}) });
}

console.log("[license-devices] boot");

export default async function handler(req: any, res: any) {
  try {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    if (req.method === "OPTIONS") { res.status(204).end(); return; }
    if (req.method !== "POST") {
      jsonError(res, 405, "Method not allowed");
      return;
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const licenseKey = String(body.licenseKey ?? "").trim();
    if (!licenseKey) {
      jsonError(res, 400, "License key is required.");
      return;
    }

    // Unsigned, license-key-authenticated endpoint. The license key in the
    // URL path acts as the credential, identical to /licenses/activate.json.
    const url = `${FREEMIUS_API}/v1/products/${PRODUCT_ID}/licenses/${encodeURIComponent(licenseKey)}/installs.json`;
    const fmRes = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await fmRes.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }

    if (!fmRes.ok || json?.error) {
      console.error("[license-devices] freemius error", fmRes.status, text?.slice(0, 400));
      jsonError(
        res,
        fmRes.status >= 400 ? fmRes.status : 502,
        "We couldn't load your devices. Please try again.",
        { status: fmRes.status, body: text?.slice(0, 400) },
      );
      return;
    }

    const installs: any[] = Array.isArray(json?.installs) ? json.installs : [];
    const devices: DeviceSummary[] = installs.map((i) => ({
      install_id: String(i.id),
      title: String(i.title || i.url || "Unknown device"),
      last_seen: i.updated || i.created || null,
    }));

    res.status(200).json({ ok: true, devices });
  } catch (err: any) {
    console.error("[license-devices] unexpected error", err);
    try {
      const msg = err?.message || String(err);
      const stack = (err?.stack || "").slice(0, 300);
      res.status(500).json({
        ok: false,
        error: "Something went wrong loading your devices. Please try again.",
        debug: { status: 500, body: `${msg} | ${stack}` },
      });
    } catch {
      // Last resort if res is hosed.
    }
  }
}
