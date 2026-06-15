## Goal
Restore the license-key fallback flow so that when a key is already active on 3 devices, the app can load the existing devices instead of failing with `We couldn't load your devices. [debug: http 500]`.

## What I found
- The error happens on the fallback path after activation returns `limit_reached`.
- That path is: `UnlockModal.tsx` → `src/lib/license.ts` → `/api/license-devices` → `api/_freemius.ts`.
- The activation endpoint uses the public Freemius `licenses/activate.json` route and does not rely on server-side signed auth.
- The device-list and device-swap endpoints do rely on `api/_freemius.ts`, which currently uses the older secret-key signing flow.
- Freemius docs now document **Bearer token auth for product-scope endpoints**, which includes the product-scoped license endpoints this fallback uses.

## Plan
1. **Replace the product-scope Freemius auth helper**
   - Update `api/_freemius.ts` so product-scope requests use Bearer auth when a product API token is configured.
   - Keep response parsing and debug surfacing intact.

2. **Make license lookup + installs list use the corrected auth path**
   - Keep resolving the internal license id from the entered license key.
   - Ensure `/api/license-devices` uses the corrected helper for both the lookup and installs fetch.

3. **Make device swap use the same corrected auth path**
   - Ensure `/api/license-deactivate` uses the same auth mechanism for install deletion before re-activating the current device.

4. **Harden server errors so the UI shows the real backend cause**
   - Preserve the current friendly messages.
   - Ensure 500 responses include the real server debug body so future failures are diagnosable from the UI.

5. **Validate the full fallback flow**
   - Check the “3 devices already used” path.
   - Confirm devices load, one can be removed, and the current device activates successfully.

## Technical details
- Files involved:
  - `api/_freemius.ts`
  - `api/license-devices.ts`
  - `api/license-deactivate.ts`
- Likely root cause:
  - The fallback endpoints are still using a Freemius auth approach that is either rejected for these product-scope calls or depends on a server secret/config that is missing in the deployed environment.
- Expected config after the fix:
  - A product-scoped Freemius API bearer token available in deployment env vars for the Vercel functions.

## Result
After this change, entering a valid key that has hit its device limit should show the existing devices instead of a 500, and the customer should be able to free one and continue.