// Shared helpers for Vercel serverless functions that call the
// authenticated (server-side) Freemius API on behalf of our product.
//
// Freemius uses an HMAC-signed auth header in the form:
//   Authorization: FSP <scope_entity_id>:<public_key>:<signature>
//   Date: <RFC1123 date>
//   Content-MD5: <md5 of request body>
//   Content-Type: application/json
//
// signature = url-safe base64( hmac-sha256(string_to_sign, secret_key) )
//   string_to_sign = METHOD\nCONTENT_MD5\nCONTENT_TYPE\nDATE\nRESOURCE_URL
//
// Reference: https://freemius.docs.apiary.io/

import crypto from "node:crypto";

export const PRODUCT_ID = "30617";
export const PUBLIC_KEY = "pk_f993d14743e7f27a372ff2a194da1";
export const FREEMIUS_HOST = "api.freemius.com";
export const FREEMIUS_API = `https://${FREEMIUS_HOST}`;

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function urlSafeB64(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export type FreemiusRequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path under the product scope, e.g. "/licenses.json" or "/licenses/123/installs.json". */
  path: string;
  /** Optional JSON body for POST/PUT requests. */
  body?: unknown;
};

/**
 * Make an authenticated request to Freemius under the product scope.
 * Returns { status, json, text }.
 */
export async function freemiusFetch(opts: FreemiusRequestOptions): Promise<{
  status: number;
  json: any;
  text: string;
}> {
  const secret = process.env.FREEMIUS_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error("FREEMIUS_SECRET_KEY is not configured on the server.");
  }

  const resourcePath = `/v1/products/${PRODUCT_ID}${opts.path}`;
  const bodyStr = opts.body == null ? "" : JSON.stringify(opts.body);
  const contentMd5 = bodyStr ? md5(bodyStr) : "";
  const contentType = bodyStr ? "application/json" : "";
  const date = new Date().toUTCString();

  const stringToSign = [
    opts.method,
    contentMd5,
    contentType,
    date,
    resourcePath,
  ].join("\n");

  const signature = urlSafeB64(
    crypto.createHmac("sha256", secret).update(stringToSign).digest(),
  );

  const headers: Record<string, string> = {
    Accept: "application/json",
    Date: date,
    Authorization: `FS ${PRODUCT_ID}:${PUBLIC_KEY}:${signature}`,
  };
  if (bodyStr) {
    headers["Content-Type"] = "application/json";
    headers["Content-MD5"] = contentMd5;
  }

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
