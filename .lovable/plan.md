# Plan

## What I’ll fix
- Restore the license-device flow so entering a valid key can list existing activations instead of failing with `400 Invalid request path`.
- Keep the current activation UX unchanged; only fix the broken API path logic behind the modal.

## Implementation
1. Rework `api/license-devices.ts` to stop treating the customer-facing license key as a valid path segment for Freemius install-list endpoints.
2. Use the existing shared Freemius helper flow in `api/_freemius.ts` to resolve the real internal license id from the entered key, then fetch installs with the correct product-scoped license id path.
3. Update `api/license-deactivate.ts` to use the same resolved internal license id when deleting an install, so device removal and re-activation stay consistent.
4. Preserve the improved JSON error/debug responses so any future Freemius rejection is surfaced clearly in the UI instead of as an opaque failure.
5. Validate the final API responses by checking the relevant endpoint behavior after the code changes.

## Technical details
- Current broken path:
  ```text
  /v1/products/30617/licenses/{licenseKey}/installs.json
  ```
  Freemius rejects this because installs endpoints expect the internal numeric/string license id, not the raw license key.
- Activation can still use:
  ```text
  /v1/products/30617/licenses/activate.json
  ```
  with `license_key` in the POST body.
- Device listing/deletion should instead follow:
  ```text
  lookup key -> internal license id
  /v1/products/30617/licenses/{licenseId}/installs.json
  /v1/products/30617/licenses/{licenseId}/installs/{installId}.json
  ```
- If Freemius still rejects the signed auth scheme in `_freemius.ts`, I’ll keep the same user-visible error surface and adjust the auth format in the next pass based on the returned debug body.