## Goal
Make license-key activation work reliably on the live site, including the “3 devices already used” fallback, so you can launch without another trial-and-error loop.

## What I found
- Your new Freemius API token is present in this project, so this no longer looks like “missing secret” on our side.
- Freemius docs do confirm:
  - `POST /products/{product_id}/licenses/activate.json` uses the license key and does **not** need Authorization.
  - Bearer token auth **is** valid for product-scoped endpoints.
- The failure is isolated to the fallback flow after activation says the license is already fully used.
- The most likely issue is that the fallback routes are using the wrong Freemius resource path for listing/removing installs, or the serverless function is throwing before it can send its normal debug JSON.

## Plan
1. **Correct the fallback Freemius calls**
   - Replace the current device-list and device-removal requests with the documented product-scope endpoints/flow for installs and license deactivation.
   - Keep activation on the existing documented `licenses/activate.json` endpoint.

2. **Make the API failure-proof and transparent**
   - Harden `api/_freemius.ts`, `api/license-devices.ts`, and `api/license-deactivate.ts` so they always return structured JSON errors instead of a bare `http 500`.
   - Include the upstream Freemius status/message in a safe debug payload so we can see exactly what production returns if anything is still off.

3. **Verify the exact customer path**
   - Test the live flow end-to-end:
     - enter valid key
     - hit “license utilized” case
     - load current devices
     - free one device
     - activate current device successfully

4. **Tighten the UX only where needed**
   - Keep the modal behavior the same, but ensure the user sees a precise next step if Freemius rejects a device swap for a product-specific reason.

## Technical details
Files involved:
- `api/_freemius.ts`
- `api/license-devices.ts`
- `api/license-deactivate.ts`
- `api/license-activate.ts`
- `src/lib/license.ts`

Freemius doc points already verified:
- Product-scope Bearer auth is supported.
- Activation is unauthenticated beyond the submitted license key.
- The current bug is therefore likely in the fallback install list/deactivate route selection, not in the checkout modal or your Vercel env setup.

## Expected outcome
After this change, entering a valid key on a full license should show the existing devices and let the customer free one and continue, instead of failing with `We couldn't load your devices. [debug: http 500]`.