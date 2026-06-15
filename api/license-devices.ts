// Lists devices (installs) currently activated against a Freemius license.
// Freemius install-list endpoints require the INTERNAL license id (not the
// customer-facing license key) in the URL path, and they require the signed
// product-scope Authorization header. We resolve the id via findLicenseIdByKey
// and then call the product-scoped installs endpoint through freemiusFetch.

export const config = { runtime: "nodejs" };

import { freemiusFetch, findLicenseIdByKey, CORS_HEADERS } from "./_freemius";

type DeviceSummary = {
  install_id: string;
  title: string;
  last_seen: string | null;
};

function jsonError(
  res: any,
  status: number,
  error: string,
  debug?: { status?: number; body?: string },
) {
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

    if (!process.env.FREEMIUS_API_TOKEN?.trim()) {
      jsonError(res, 500, "License server is not configured.", {
        status: 500,
        body: "FREEMIUS_API_TOKEN missing",
      });
      return;
    }

    const licenseId = await findLicenseIdByKey(licenseKey);
    if (!licenseId) {
      jsonError(res, 404, "We couldn't find that license key.", {
        status: 404,
        body: "license lookup returned no match",
      });
      return;
    }

    const { status, json, text } = await freemiusFetch({
      method: "GET",
      path: `/licenses/${encodeURIComponent(licenseId)}/installs.json`,
    });

    if (status >= 400 || json?.error) {
      console.error("[license-devices] freemius error", status, text?.slice(0, 400));
      jsonError(
        res,
        status >= 400 ? status : 502,
        "We couldn't load your devices. Please try again.",
        { status, body: text?.slice(0, 400) },
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
      // Last resort.
    }
  }
}
