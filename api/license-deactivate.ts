// Deactivates one device on a Freemius license, then activates the
// caller's current device. Uses unsigned, license-key-authenticated
// endpoints (same pattern as license-activate.ts).

export const config = { runtime: "nodejs20.x" };

const PRODUCT_ID = "30617";
const FREEMIUS_API = "https://api.freemius.com";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonError(res: any, status: number, error: string, debug?: { status?: number; body?: string }) {
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

    // Step 1 — deactivate the chosen install via the unsigned, license-
    // key-authenticated DELETE endpoint.
    const delUrl = `${FREEMIUS_API}/v1/products/${PRODUCT_ID}/licenses/${encodeURIComponent(licenseKey)}/installs/${encodeURIComponent(installId)}.json`;
    const delRes = await fetch(delUrl, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    const delText = await delRes.text();
    let delJson: any = null;
    try { delJson = delText ? JSON.parse(delText) : null; } catch { /* ignore */ }

    if (!delRes.ok || delJson?.error) {
      console.error("[license-deactivate] delete install error", delRes.status, delText?.slice(0, 400));
      jsonError(
        res,
        delRes.status >= 400 ? delRes.status : 502,
        "We couldn't free up that device. Please try a different one.",
        { status: delRes.status, body: delText?.slice(0, 400) },
      );
      return;
    }

    // Step 2 — re-activate this device.
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
