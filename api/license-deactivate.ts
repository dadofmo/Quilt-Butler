// Deactivates one device on a Freemius license, then activates the
// caller's current device. The DELETE call needs the INTERNAL license id
// resolved from the customer-facing license key via findLicenseIdByKey.

export const config = { runtime: "nodejs" };

import { freemiusFetch, findLicenseIdByKey, CORS_HEADERS, FREEMIUS_API, PRODUCT_ID } from "./_freemius";

function jsonError(
  res: any,
  status: number,
  error: string,
  debug?: { status?: number; body?: string },
) {
  res.status(status).json({ ok: false, error, ...(debug ? { debug } : {}) });
}

console.log("[license-deactivate] boot");

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
    const installId = String(body.installId ?? "").trim();
    const uid = String(body.uid ?? "").trim();
    const title = String(body.title ?? "").trim() || "Quilt Butler (Web)";

    if (!licenseKey || !installId || !uid) {
      jsonError(res, 400, "Missing license key, device, or device id.");
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

    // Step 1 — deactivate the chosen install (signed, product-scoped DELETE).
    const del = await freemiusFetch({
      method: "DELETE",
      path: `/licenses/${encodeURIComponent(licenseId)}/installs/${encodeURIComponent(installId)}.json`,
    });

    if (del.status >= 400 || del.json?.error) {
      console.error("[license-deactivate] delete install error", del.status, del.text?.slice(0, 400));
      jsonError(
        res,
        del.status >= 400 ? del.status : 502,
        "We couldn't free up that device. Please try a different one.",
        { status: del.status, body: del.text?.slice(0, 400) },
      );
      return;
    }

    // Step 2 — re-activate this device using the unsigned, key-authenticated
    // activate endpoint (same path as /api/license-activate).
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
      console.error("[license-deactivate] reactivate error", actRes.status, actText?.slice(0, 400));
      jsonError(
        res,
        actRes.status >= 400 ? actRes.status : 400,
        actJson?.error?.message || "We freed up that device, but couldn't activate this one. Please try entering your key again.",
        { status: actRes.status, body: actText?.slice(0, 400) },
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
    console.error("[license-deactivate] unexpected error", err);
    try {
      const msg = err?.message || String(err);
      const stack = (err?.stack || "").slice(0, 300);
      res.status(500).json({
        ok: false,
        error: "Something went wrong. Please try again.",
        debug: { status: 500, body: `${msg} | ${stack}` },
      });
    } catch {
      // Last resort.
    }
  }
}
