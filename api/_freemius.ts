// Shared helpers for Vercel serverless functions that call the
// authenticated Freemius API on behalf of our product.
//
// Freemius supports Bearer token auth for product-scope endpoints
// (everything under /v1/products/{product_id}/...). The token is found
// in the Freemius Developer Dashboard → product → Settings → API Token.
//
// We require FREEMIUS_API_TOKEN in env. The activation endpoint
// authenticates itself with the license key and does not need this.

export const PRODUCT_ID = "30617";
export const FREEMIUS_HOST = "api.freemius.com";
export const FREEMIUS_API = `https://${FREEMIUS_HOST}`;

export type FreemiusRequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path under the product scope, e.g. "/licenses.json" or "/licenses/123/installs.json". */
  path: string;
  /** Optional JSON body for POST/PUT requests. */
  body?: unknown;
};

/**
 * Make an authenticated request to Freemius under the product scope
 * using Bearer token auth. Returns { status, json, text }.
 */
export async function freemiusFetch(opts: FreemiusRequestOptions): Promise<{
  status: number;
  json: any;
  text: string;
}> {
  const token = process.env.FREEMIUS_API_TOKEN?.trim();
  if (!token) {
    throw new Error("FREEMIUS_API_TOKEN is not configured on the server.");
  }

  const resourcePath = `/v1/products/${PRODUCT_ID}${opts.path}`;
  const bodyStr = opts.body == null ? "" : JSON.stringify(opts.body);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (bodyStr) headers["Content-Type"] = "application/json";

  const res = await fetch(`${FREEMIUS_API}${resourcePath}`, {
    method: opts.method,
    headers,
    body: bodyStr || undefined,
  });

  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  return { status: res.status, json, text };
}

/**
 * Look up a license id from a raw license key. Freemius license-scoped
 * endpoints (installs list, install delete) require the numeric license
 * id, not the customer-facing key.
 */
export async function findLicenseIdByKey(licenseKey: string): Promise<string | null> {
  const { status, json } = await freemiusFetch({
    method: "GET",
    path: `/licenses.json?search=${encodeURIComponent(licenseKey)}&count=5`,
  });
  if (status >= 400 || !json) return null;
  const licenses: any[] = Array.isArray(json.licenses) ? json.licenses : [];
  const match = licenses.find((l) => l?.secret_key === licenseKey)
    ?? licenses.find((l) => l?.license_key === licenseKey)
    ?? licenses[0];
  return match?.id ? String(match.id) : null;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
