// Lists devices (installs) currently activated against a Freemius license.
// Uses product-scope Bearer token auth (FREEMIUS_API_TOKEN).
//
// Freemius does not expose `/licenses/{id}/installs.json`. Instead we:
//   1) Look up the license by key via `/licenses.json?search=...&enriched=true`
//      to get its numeric `id` and `user_id`.
//   2) List that user's installs via `/users/{user_id}/installs.json`.
//   3) Filter to installs whose `license_id` matches.

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

function jsonError(
  res: any,
  status: number,
  error: string,
  debug?: { status?: number; body?: string; where?: string },
) {
  res.status(status).json({ ok: false, error, ...(debug ? { debug } : {}) });
}

async function freemiusGet(token: string, path: string) {
  const url = `${FREEMIUS_API}/v1/products/${PRODUCT_ID}${path}`;
  const r = await fetch(url, {
    method: "GET",
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
    if (!licenseKey) { jsonError(res, 400, "License key is required."); return; }

    const token = process.env.FREEMIUS_API_TOKEN?.trim();
    if (!token) {
      jsonError(res, 500, "License server is not configured.", {
        status: 500, body: "FREEMIUS_API_TOKEN missing", where: "env",
      });
      return;
    }

    // 1) Resolve license -> id, user_id. `enriched=true` includes user info.
    const lookup = await freemiusGet(
      token,
      `/licenses.json?search=${encodeURIComponent(licenseKey)}&enriched=true&count=10`,
    );
    if (lookup.status >= 400) {
      jsonError(res, lookup.status, "We couldn't load your devices. Please try again.", {
        status: lookup.status,
        body: `[licenses.json] ${lookup.text?.slice(0, 300)}`,
        where: "lookup",
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
        status: 200,
        body: `licenses returned=${licenses.length}`,
        where: "lookup-match",
      });
      return;
    }

    const licenseId = String(match.id);
    const userId = String(match.user_id ?? match.user?.id ?? "");
    if (!userId) {
      jsonError(res, 500, "We couldn't load your devices. Please try again.", {
        status: 500,
        body: `license missing user_id; keys=${Object.keys(match).join(",")}`,
        where: "lookup-user",
      });
      return;
    }

    // 2) List the owning user's installs and filter to this license.
    const installs = await freemiusGet(
      token,
      `/users/${encodeURIComponent(userId)}/installs.json?count=50`,
    );
    if (installs.status >= 400) {
      jsonError(res, installs.status, "We couldn't load your devices. Please try again.", {
        status: installs.status,
        body: `[users/${userId}/installs.json] ${installs.text?.slice(0, 300)}`,
        where: "user-installs",
      });
      return;
    }

    const list: any[] = Array.isArray(installs.json?.installs) ? installs.json.installs : [];
    const forLicense = list.filter((i) => String(i?.license_id ?? "") === licenseId);
    const devices: DeviceSummary[] = forLicense.map((i) => ({
      install_id: String(i.id),
      title: String(i.title || i.url || "Unknown device"),
      last_seen: i.last_seen_at || i.updated || i.created || null,
    }));

    res.status(200).json({ ok: true, devices });
  } catch (err: any) {
    const msg = err?.message || String(err);
    const stack = (err?.stack || "").slice(0, 300);
    try {
      res.status(500).json({
        ok: false,
        error: "Something went wrong loading your devices.",
        debug: { status: 500, body: `${msg} | ${stack}`, where: "catch" },
      });
    } catch { /* last resort */ }
  }
}
