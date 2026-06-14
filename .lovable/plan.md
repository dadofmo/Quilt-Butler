## What's happening

The red error reads `We couldn't load your devices. [debug: http 500]` with no Freemius body. That `[debug: http 500]` is the client-side fallback used when the API response is **not JSON** — our hardened error path (which would include the real Freemius status + body) never ran. That means `/api/license-devices` is crashing at the Vercel serverless layer and returning an HTML 500 page, not our handler's JSON.

A second concern: the header of `api/license-activate.ts` already says explicitly that the signed `Authorization: FS …` path used in `api/_freemius.ts` is rejected by Freemius. So even if we get past the 500, the signed device-list call is the wrong primitive.

## Plan

### 1. Harden `/api/license-devices` and `/api/license-deactivate` so they always return JSON

- Wrap the entire handler body (including the import of `./_freemius`) in try/catch via a top-level dynamic import inside the handler, so any module-init failure (e.g. `node:crypto` resolution under an unexpected runtime, missing env at import time) is converted to a JSON 500 with `debug.body` set to `err.message + err.stack.slice(0, 300)`.
- Add an explicit Vercel runtime hint at the top of each file:
  ```ts
  export const config = { runtime: "nodejs20.x" };
  ```
  to guarantee Node (not Edge), which is required for `node:crypto`.
- Log `[license-devices] boot` once so Vercel function logs confirm the file is even loading.

After this, retrying Activate will show either `[debug: 500 — <real stack>]` or the real Freemius status — enough to finish the diagnosis.

### 2. Replace the signed Freemius calls with the unsigned, license-key-authenticated endpoints

Per the note already in `license-activate.ts`, Freemius rejects the `FS …` HMAC scheme for this product. Rebuild the two helpers using the same unsigned pattern that already works for activation:

- **List devices** → `GET /v1/products/{PRODUCT_ID}/licenses/{licenseKey}/installs.json` (no Authorization header; license key in the path acts as the credential). Map the returned `installs[]` to `{ install_id, title, last_seen }`.
- **Free a device** → `DELETE /v1/products/{PRODUCT_ID}/licenses/{licenseKey}/installs/{install_id}.json`, then immediately re-issue the existing `POST …/licenses/activate.json` call from `license-activate.ts` with the current device's `uid` + `title`.

This drops `api/_freemius.ts` from the device flow entirely (it can be deleted or kept dormant). It mirrors the activation path that we already know works in production, so it removes one whole class of "signing/auth rejected" failures.

### 3. Keep the existing client UX

No changes to `src/lib/license.ts` interfaces, no changes to `UnlockModal.tsx`. The same red `keyError` line will surface the new (more useful) debug suffix if anything still fails.

## Files touched

- `api/license-devices.ts` — rewrite to use the unsigned `/licenses/{key}/installs.json` endpoint; add `runtime` export; always-JSON error envelope with `debug.body`.
- `api/license-deactivate.ts` — rewrite to use unsigned DELETE then re-activate; same hardening.
- `api/_freemius.ts` — no longer imported by the device endpoints. Leave the file in place for now; we can delete it in a follow-up once the new path is confirmed working.

## What I need from you after the redeploy

Just retry Activate with the same key and paste the new red line. If step 2's endpoint shape is right for your Freemius product, you'll see the device picker instead. If Freemius returns an auth error on the unsigned device-list endpoint (some products require signing for that route even when activation is unsigned), the new `[debug: <status> — <body>]` will tell us exactly that, and the follow-up is to bring back signing but with the corrected scheme Freemius now expects.
