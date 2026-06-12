// Deactivates one device (install) on a Freemius license, then activates
// the caller's current device. Used by the self-service "free up a
// device" flow when a customer is at their 3-device limit.

import { CORS_HEADERS, FREEMIUS_API, PRODUCT_ID, findLicenseIdByKey, freemiusFetch } from "./_freemius";

export default async function handler(req: any, res: any) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body ?? {});
    const licenseKey = String(body.licenseKey ?? "").trim();
    const installId = String(body.installId ?? "").trim();
    const uid = String(body.uid ?? "").trim();
    const title = String(body.title ?? "").trim() || "Quilt Butler (Web)";

    if (!licenseKey || !installId || !uid) {
      res.status(400).json({ ok: false, error: "Missing license key, device, or device id." });
      return;
    }

    const licenseId = await findLicenseIdByKey(licenseKey);
    if (!licenseId) {
      res.status(404).json({ ok: false, error: "We couldn't find that license key." });
      return;
    }

    // Step 1 — deactivate the chosen install.
    const del = await freemiusFetch({
      method: "DELETE",
      path: `/licenses/${licenseId}/installs/${installId}.json`,
    });
    if (del.status >= 400) {
      console.error("[license-deactivate] delete install error", del.status, del.text?.slice(0, 400));
      res.status(del.status).json({
        ok: false,
        error: "We couldn't free up that device. Please try a different one.",
      });
      return;
    }

    // Step 2 — re-activate this device using the public license activate
    // endpoint (same one used on first-time activation). This avoids
    // re-signing here and matches what the client normally does.
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
      res.status(actRes.status >= 400 ? actRes.status : 400).json({
        ok: false,
        error: actJson?.error?.message || "We freed up that device, but couldn't activate this one. Please try entering your key again.",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      source: "freemius",
      install_id: actJson?.install_id,
      plan_name: actJson?.license_plan_name,
      email: actJson?.user?.email,
    });
  } catch (err) {
    console.error("[license-deactivate] unexpected error", err);
    res.status(500).json({
      ok: false,
      error: "Something went wrong. Please try again.",
    });
  }
}
