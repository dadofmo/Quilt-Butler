## Problem

Newly purchased license keys are being rejected because the serverless validator is querying Freemius the wrong way.

Current code in `api/license-activate.ts` does this:

```ts
GET /v1/plugins/30617/licenses.json?secret_key=<entered_license_key>&count=1
```

That treats the customer’s license key as a `secret_key` query param on the list endpoint, which does not reliably look up a customer license by the key they pasted. As a result, Freemius returns no matching licenses, and the app shows:

`We couldn't find that license key.`

This matches your symptom exactly: checkout succeeds, email arrives immediately, but a brand-new live key still fails in incognito.

## Plan

1. Replace the current list-style lookup in `api/license-activate.ts` with the correct Freemius license validation flow for a pasted license key.
2. Keep the existing owner override and active / cancelled / expired checks, but apply them to the correctly resolved license record.
3. Improve error handling so Freemius auth errors, not-found responses, and configuration problems return distinct messages instead of all looking like “license not found.”
4. Verify the client contract stays the same (`/api/license-activate` still returns `{ ok: true }` on success) so no UI changes are required in `src/lib/license.ts` or `UnlockModal.tsx`.
5. Test the fix against the deployed flow by validating that a newly issued key can unlock in a fresh browser session.

## Technical details

- Root cause is in `api/license-activate.ts`, not in the modal UI and not in the latest preview tiling change.
- Checkout success already stores local unlock state for the purchasing browser, so the broken part is specifically the manual “enter license key” recovery / second-device flow.
- Most likely fix: use Freemius’s proper license-key activation / validation endpoint instead of `licenses.json?secret_key=...`.
- No design or frontend behavior changes are needed unless we choose to surface a better error message for device-limit failures.

## Expected result

A real license key from the purchase email should activate successfully on `quiltbutler.com`, including in incognito or on a new device.