// Deactivates one device on a Freemius license, then activates the caller's
// current device. Uses Bearer token auth (FREEMIUS_API_TOKEN) for delete,
// and the unauthenticated key-based activate endpoint for re-activation.
//
// Deactivation endpoint (documented):
//   DELETE /v1/products/{product_id}/installs/{install_id}/licenses/{license_id}.json?license_key=...

const PRODUCT_ID = "30617";
const FREEMIUS_API = "https://api.freemius.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonError(
  res: any,
  status: number,
  error: string,
  debug?: { status?: number; body?: string; where?: string },
) {
  res.status(status).json({ ok: false, error, ...(debug ? { debug } : {}) });
}

async function freemiusGet(token: string, path: string) {
  const r = await fetch(`${FREEMIUS_API}/v1/products/${PRODUCT_ID}${path}`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: r.status, text, json };
}

async function freemiusDelete(token: string, path: string) {
  const r = await fetch(`${FREEMIUS_API}/v1/products/${PRODUCT_ID}${path}`, {
    method: "DELETE",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  const text = await r.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: r.status, text, json };
}

export default async function handler(req: any, res: any) {
  try {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    if (req.method === "OPTIONS") { res.status(204).end(); return; }
    if (req.method !== "POST") { jsonError(res, 405, "Method not allowed"); return; }

    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const licenseKey = String(body.licenseKey ?? "").trim();
    const installId = String(body.installId ?? "").trim();
    const uid = String(body.uid ?? "").trim();
    const title = String(body.title ?? "").trim() || "Quilt Butler (Web)";

    if (!licenseKey || !installId || !uid) {
      jsonError(res, 400, "Missing license key, device, or device id.");
      return;
    }

    const token = process.env.FREEMIUS_API_TOKEN?.trim();
    if (!token) {
      jsonError(res, 500, "License server is not configured.", {
        status: 500, body: "FREEMIUS_API_TOKEN missing", where: "env",
      });
      return;
    }

    // 1) Resolve license id from key.
    const lookup = await freemiusGet(
      token,
      `/licenses.json?search=${encodeURIComponent(licenseKey)}&enriched=true&count=10`,
    );
    if (lookup.status >= 400) {
      jsonError(res, lookup.status, "We couldn't free up that device.", {
        status: lookup.status, body: `[licenses.json] ${lookup.text?.slice(0, 300)}`, where: "lookup",
      });
      return;
    }
    const licenses: any[] = Array.isArray(lookup.json?.licenses) ? lookup.json.licenses : [];
    const match =
      licenses.find((l) => l?.secret_key === licenseKey) ??
      licenses.find((l) => l?.license_key === licenseKey) ??
      (licenses.length === 1 ? licenses[0] : null);
    if (!match?.id) {
      jsonError(res, 404, "We couldn't find that license key.", {
        status: 200, body: `licenses returned=${licenses.length}`, where: "lookup-match",
      });
      return;
    }
    const licenseId = String(match.id);

    // 2) Deactivate the license from that install using the documented path.
    const del = await freemiusDelete(
      token,
      `/installs/${encodeURIComponent(installId)}/licenses/${encodeURIComponent(licenseId)}.json?license_key=${encodeURIComponent(licenseKey)}`,
    );
    if (del.status >= 400 || del.json?.error) {
      jsonError(
        res,
        del.status >= 400 ? del.status : 502,
        "We couldn't free up that device. Please try a different one.",
        { status: del.status, body: `[deactivate] ${del.text?.slice(0, 300)}`, where: "deactivate" },
      );
      return;
    }

    // 3) Re-activate using the unsigned key-authenticated activate endpoint.
    const actRes = await fetch(
      `${FREEMIUS_API}/v1/products/${PRODUCT_ID}/licenses/activate.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ license_key: licenseKey, uid, title }),
      },
    );
    const actText = await actRes.text();
    let actJson: any = null;
    try { actJson = actText ? JSON.parse(actText) : null; } catch { /* ignore */ }

    if (!actRes.ok || actJson?.error) {
      jsonError(
        res,
        actRes.status >= 400 ? actRes.status : 400,
        actJson?.error?.message || "We freed up that device, but couldn't activate this one. Please try entering your key again.",
        { status: actRes.status, body: `[activate] ${actText?.slice(0, 300)}`, where: "reactivate" },
      );
      return;
    }

    res.status(200).json({
      ok: true,
      source: "freemius",
      install_id: actJson?.install_id,
      plan_name: actJson?.license_plan_name,
      email: actJson?.user?.email,
    });
  } catch (err: any) {
    const msg = err?.message || String(err);
    const stack = (err?.stack || "").slice(0, 300);
    try {
      res.status(500).json({
        ok: false,
        error: "Something went wrong.",
        debug: { status: 500, body: `${msg} | ${stack}`, where: "catch" },
      });
    } catch { /* last resort */ }
  }
}
