## Goal

Give you a safe way to hand out free access without exposing anything stealable in the app's JavaScript, while keeping a fast test bypass for sandbox.

## Approach

### 1. Free gifting → Freemius coupons (no code changes needed)

Freemius has a built-in coupon system. You create a 100% discount code in your Freemius dashboard (Pricing → Coupons → "Add Coupon"). Recipients enter the code during the Freemius checkout window that already opens from the Unlock modal. Total becomes $0, they "complete" the purchase, and the existing `purchaseCompleted` handler in `src/lib/checkout.ts` fires — their device gets a real persisted license, identical to a paying customer.

Per-coupon controls in the Freemius dashboard:
- Single-use vs. multi-use
- Expiration date
- Max redemptions
- Per-user limits
- Revoke at any time
- Full redemption log

Nothing about the coupon lives in your JS bundle, so it cannot be extracted by inspecting the site.

### 2. `#QBFREE` becomes sandbox-only session unlock

Changes to `src/lib/license.ts`:
- Add an in-memory `sessionUnlocked` flag (resets on page reload).
- `applyBypassCode("#QBFREE")`:
  - In sandbox mode → sets `sessionUnlocked = true`, does NOT write to `localStorage`. Padlocks reappear on next page load.
  - In live mode → returns `false` (no-op). Code is worthless to anyone who finds it in the bundle on the live site.
- `unlock("purchase")` continues to write to `localStorage` in both modes — real Freemius purchases (including coupon-redeemed ones) persist forever.
- `isUnlocked(id)` returns true if the pattern is free, OR `sessionUnlocked` is true, OR a persisted license exists.
- One-time migration: on load, if `qb_license_v1` exists with `source === "bypass"`, delete it. Cleans up any leftover unlock from earlier testing so padlocks come back automatically.

No UI changes — `PatternPickerPage` already reacts to `isUnlocked()`.

## What you'll do after this ships

1. Log into your Freemius dashboard.
2. Create a 100% coupon (e.g. `QBGIFT2026`).
3. Share that code with whoever you want to gift access to. They redeem it inside the Freemius checkout window.

## Files touched

- `src/lib/license.ts` — session flag, sandbox-only bypass, bypass-source migration.

That's it. The Unlock modal, checkout flow, and pattern picker UI stay as they are.
