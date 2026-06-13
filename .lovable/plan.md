# Fix "We couldn't load your devices"

## What's happening
- Activating your key returned `limit_reached` (expected — you're at 3 devices).
- The app then called `/api/license-devices` to show the device picker, and Freemius rejected our signed request.
- The user sees a generic "We couldn't load your devices." with no detail.

## Root cause (most likely)
In `api/_freemius.ts` the Authorization header is built as:

```
Authorization: FSP <product_id>:<public_key>:<signature>
```

Freemius's documented signed-request scheme is `FS`, not `FSP`. The API scope (product/developer/plugin/etc.) is inferred from the request URL, not from the header prefix. With the wrong prefix, every signed call returns 401, which is exactly what we're seeing — activation works (it's an unsigned public endpoint), device list fails (it's signed).

## Fix
1. **`api/_freemius.ts`** — change the auth scheme from `FSP` to `FS`:
   ```
   Authorization: FS <product_id>:<public_key>:<signature>
   ```
   No other changes to the signing math (HMAC-SHA256, url-safe base64, the `METHOD\nMD5\nCT\nDATE\nPATH` string-to-sign all stay the same).

2. **`api/license-devices.ts`** — surface the underlying error (status + Freemius message) into the JSON response when running in a non-production environment, so if it still fails we can see the real reason in the browser instead of the generic "couldn't load your devices". Production-facing copy stays the friendly version.

3. **`api/license-deactivate.ts`** — same treatment for the delete-install call, since it uses the same signed helper.

## Verify after deploy
1. Reload the unlock modal, paste your key, click Activate.
2. You should now see your 3 devices listed (with names + "last used" dates) instead of the red error.
3. Click "Use this device instead" on the oldest one — it should free that slot and activate this browser, then show "License activated!".

## If it still fails
If after the prefix fix the device list still errors, the next likely cause is `FREEMIUS_SECRET_KEY` missing from Vercel env vars. The improved error surface in step 2 will tell us which it is (401 = still an auth problem, 500 with "not configured" = missing env var).

## Out of scope
No changes to yardage, patterns, pricing, or the activation flow itself.
