## Goal
Use the Freemius API Bearer Authorization Token to fix the deployed device-list/device-swap license flow.

## Confirmed
- Yes, the needed credential is the **Freemius API Bearer Authorization Token** from your product’s **Settings → API Token** page.
- The secret `FREEMIUS_API_TOKEN` is now saved in this project.

## Plan
1. Update `api/_freemius.ts` to use `FREEMIUS_API_TOKEN` for product-scope Freemius requests.
2. Keep `api/license-devices.ts` and `api/license-deactivate.ts` on the same license-id resolution flow, but route their requests through the updated auth helper.
3. Preserve the current debug/error payloads so any remaining Freemius issue is visible in the UI.
4. Verify the fallback flow where a license is already used on 3 devices.

## Important
You should also add the same `FREEMIUS_API_TOKEN` value to your Vercel project environment variables before the next deploy, or Vercel will still fail at runtime even after the code change.