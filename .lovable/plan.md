# Self-Service Device Management

## What the user (your customer) will see

When someone enters their license key and it's already used on 3 devices, instead of a scary "activation limit reached" error, they'll see:

> **Your license is already used on 3 devices.**
> Pick one to sign out so you can use this device instead.
>
> - 🖥️ Quilt Butler — Mac (last used yesterday) [Use this device instead]
> - 📱 Quilt Butler — iPhone (last used Nov 2) [Use this device instead]
> - 💻 Quilt Butler — Windows (last used Oct 28) [Use this device instead]

They click one → that device gets signed out → their current device activates automatically. No Freemius account. No support email needed.

## How it works behind the scenes

Two new pieces:

**1. New serverless endpoint: `api/license-devices.ts`**
- Takes the license key
- Asks Freemius "what devices is this key on?" (using your secret key)
- Returns a clean list: device name, last-used date, and an internal id for each

**2. New serverless endpoint: `api/license-deactivate.ts`**
- Takes the license key + the device id to deactivate
- Tells Freemius to release that device
- Then immediately activates the customer's current device (reuses existing activate logic)

**3. Updated UnlockModal**
- When activate returns the "limit reached" error, instead of just showing a message, fetch the device list and show the picker above
- Clicking a device calls deactivate-then-reactivate, then unlocks the app

## Technical details

- Endpoints use Freemius product-scope API at `/v1/products/30617/...` with `Authorization: FSA <product_id>:<secret_key>` signing (required for server-side calls — different from the public activate endpoint we already have).
- `FREEMIUS_SECRET_KEY` (just saved) is read from `process.env` server-side only; never sent to the browser.
- Device names already include platform (iPhone/Mac/Windows/etc.) thanks to `getDeviceTitle()` in `src/lib/license.ts`, so the picker will be recognizable.
- Friendly error mapping in `friendlyError()` updated so the limit error triggers the picker flow instead of a dead-end message.
- No changes to yardage, patterns, or any quilt logic.

## Files I'll touch

- **New:** `api/license-devices.ts`
- **New:** `api/license-deactivate.ts`
- **Edit:** `src/lib/license.ts` — add `listLicenseDevices()` and `deactivateAndActivate()` helpers
- **Edit:** `src/components/UnlockModal.tsx` — add the device-picker UI that appears when limit is reached

## After deploy

You'll deploy to Vercel as usual. Then to test: enter your license key on a 4th browser/incognito session — you should see the picker instead of an error.
