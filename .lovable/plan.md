## What’s actually failing
The new error is **not** “bad customer license key” anymore. It is a **server-to-Freemius authentication failure**:

- Your app is reaching `/api/license-activate`
- That function is calling Freemius
- Freemius is replying **401: Invalid Authorization header**

So the pasted key is not the main blocker right now — the backend request itself is being rejected before license lookup completes.

## Files to isolate
- `api/license-activate.ts` — builds the Freemius auth header and hits the license endpoint
- `src/lib/license.ts` — client call path, mainly to keep the UI contract unchanged
- `src/lib/freemius-config.ts` — confirms the product id/public key being used

## Plan
1. **Replace the current auth approach with the supported Freemius auth flow**
   - Stop relying on the current manually signed `Authorization: FS ...` request shape if it does not match the current API requirements.
   - Align the request with Freemius’ documented product-scope API authentication and endpoint namespace.

2. **Update the license lookup endpoint to the correct API namespace**
   - Move off the legacy plugin-style path if needed.
   - Use the documented product/license endpoint that matches the required auth method.

3. **Harden env-var validation and diagnostics**
   - Distinguish between:
     - wrong server credential/config
     - wrong product scope
     - real “license not found”
   - Return a clear config error instead of a misleading customer-facing key error.

4. **Keep the frontend contract unchanged**
   - Preserve the existing modal and `activateLicenseKey()` success/error handling.
   - Only change backend logic unless the error copy needs a tiny wording adjustment.

5. **Verify the real unlock flow after the code change**
   - Check that a fresh browser session can paste a valid emailed key and unlock successfully.
   - Confirm the error changes from auth failure to either success or a true key-specific validation response.

## Technical notes
Most likely causes from the code + docs review:
- The current server code is sending a legacy-style signed header that Freemius now rejects for this endpoint.
- Or `FREEMIUS_SECRET_KEY` in Vercel is not the credential type this endpoint expects.
- Freemius’ current docs show **Bearer token auth for `/products/{product_id}/...` operations**, which may mean this function needs a different credential and path than the current `/v1/plugins/...` signed request.

## Expected result
After implementation, entering a real purchase key should no longer fail with **401 Invalid Authorization header**.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>