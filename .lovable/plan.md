## Diagnosis
The new error is still a **server-to-Freemius auth failure**, not a bad customer key.

Your app is currently doing this:
- `api/license-activate.ts` signs a legacy `Authorization: FS ...` header
- then calls `/v1/plugins/30617/licenses.json?...`
- Freemius responds `401 Invalid Authorization header`

The more important finding is that the current Freemius SaaS/license docs use a different flow for this use case:
- **Activate key:** `POST /v1/products/{product_id}/licenses/activate.json`
- request body includes `license_key`, `uid`, and `title`
- this flow is documented as the license-key integration path
- the product API docs are centered on **product-scoped endpoints** and newer auth patterns, while the old plugin-signed lookup path is what is failing here

## Files to change
- `api/license-activate.ts`
- `src/lib/license.ts`
- `src/components/UnlockModal.tsx` (only if tiny UX copy/state changes are needed)

## Plan
1. **Replace license lookup with direct activation**
   - Stop searching `/v1/plugins/.../licenses.json` by secret key.
   - Change the backend to call Freemius’ documented license activation endpoint:
     `POST /v1/products/30617/licenses/activate.json`
   - Send the license key in the JSON body with a generated device/install identifier and a simple device title.

2. **Use the correct auth model for the new endpoint**
   - Implement the activation call exactly as documented for the product endpoint.
   - Remove the failing legacy signed-header dependency from the activation path.
   - Keep auth/config handling explicit so a true credential/config problem is reported separately from a bad key.

3. **Persist the activation details needed for future validation**
   - Store the returned activation data needed for later checks (for example install/license metadata) alongside the local unlock state.
   - Keep the current “unlock this browser/device after valid activation” behavior intact.

4. **Tighten error handling**
   - Distinguish between:
     - invalid/unknown license key
     - inactive/cancelled/expired license
     - device activation limit reached
     - Freemius config/server error
   - Return clearer messages instead of surfacing raw auth noise to the user.

5. **Keep the UI contract nearly unchanged**
   - Preserve the existing modal and activate flow.
   - Only make small UX tweaks if needed, such as a better error string for activation-limit or invalid-key cases.

6. **Validate the real recovery path**
   - Confirm that a fresh browser session can paste a newly purchased key and unlock successfully.
   - If Freemius rejects the key after the API change, the message should become a real license-specific response instead of `401 Invalid Authorization header`.

## Technical details
- Current failing path: legacy signed request to `/v1/plugins/{id}/licenses.json`
- Replacement path: product license activation endpoint under `/v1/products/{product_id}/licenses/activate.json`
- Request body should include:
  - `license_key`
  - `uid` (stable per device/browser install)
  - `title` (human-readable device label)
- After activation, future checks can use the install/license details returned by Freemius instead of scanning license lists.

## Expected result
Pasting a real emailed key should stop failing with the authorization-header error and should either:
- unlock successfully, or
- show a true license-specific reason from Freemius.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>