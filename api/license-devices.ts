// Lists the devices (installs) currently activated against a Freemius
// license key. Used to power the self-service "free up a device" picker
// when a customer hits their 3-device activation limit.

import { CORS_HEADERS, findLicenseIdByKey, freemiusFetch } from "./_freemius";

type DeviceSummary = {
  install_id: string;
  title: string;
  last_seen: string | null;
};

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
    if (!licenseKey) {
      res.status(400).json({ ok: false, error: "License key is required." });
      return;
    }

    const licenseId = await findLicenseIdByKey(licenseKey);
    if (!licenseId) {
      res.status(404).json({ ok: false, error: "We couldn't find that license key." });
      return;
    }

    const { status, json, text } = await freemiusFetch({
      method: "GET",
      path: `/licenses/${licenseId}/installs.json`,
    });

    if (status >= 400) {
      console.error("[license-devices] installs fetch error", status, text?.slice(0, 400));
      res.status(status).json({
        ok: false,
        error: "We couldn't load your devices. Please try again.",
      });
      return;
    }

    const installs: any[] = Array.isArray(json?.installs) ? json.installs : [];
    const devices: DeviceSummary[] = installs.map((i) => ({
      install_id: String(i.id),
      title: String(i.title || i.url || "Unknown device"),
      last_seen: i.updated || i.created || null,
    }));

    res.status(200).json({ ok: true, license_id: licenseId, devices });
  } catch (err) {
    console.error("[license-devices] unexpected error", err);
    res.status(500).json({
      ok: false,
      error: "Something went wrong loading your devices. Please try again.",
    });
  }
}
