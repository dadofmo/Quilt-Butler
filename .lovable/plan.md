# Surface the real Freemius error so we can fix it

The `FS` prefix fix shipped but the device-list call is still failing — and the modal hides the underlying reason. I added a `debug` field to the API response in the last round, but the UI never displays it, so neither of us can see what Freemius actually said.

## Change
1. **`src/lib/license.ts`** — extend `listLicenseDevices` and `swapLicenseDevice` to read the `debug` field from the API response and include it on the returned error (e.g. `error: "We couldn't load your devices. [debug: 401 — {...}]"`).
2. **`src/components/UnlockModal.tsx`** — no UI structure change; the existing red `keyError` line will now include the debug suffix.

After redeploying, retry Activate. The red message will tell us the HTTP status Freemius returned and the first 400 chars of its response body, which pinpoints whether it's auth (401/403), a missing env var (500 "not configured"), a wrong endpoint (404), or something else. I'll then ship the real fix.

This is a temporary diagnostic — once we know the cause and fix it, we'll revert the message back to the friendly version.

## Out of scope
No changes to yardage, patterns, pricing, activation, or the device-picker UI.
