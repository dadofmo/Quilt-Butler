## Go live

Single change in `src/lib/freemius-config.ts`:

```ts
export const FREEMIUS_MODE: "sandbox" | "live" = "live";
```

### What this flips
- `openCheckout` passes `mode: "live"` to Freemius → real charges, real licenses, real payouts.
- `applyBypassCode("#QBFREE")` returns `false` → the sandbox bypass is dead on the live site, even if someone finds the string in the bundle.
- `TestModeBanner` (if it keys off `FREEMIUS_MODE === "sandbox"`) disappears.
- Real purchases and 100%-off coupon redemptions still persist via `unlock("purchase")` → `localStorage`, unchanged.

### Pre-flight (your side, not code)
- Freemius dashboard: payout/banking info complete, product 30617 / plan 50283 / pricing 66203 set to $7.99 live, public key `pk_f993d...` is the production key (it is in most Freemius setups — sandbox and live share the public key, mode is what switches).
- Any gift coupons you want ready (e.g. `QBGIFT2026`, 100% off) created in the live coupon list — sandbox coupons do not carry over.

### After deploy — smoke test
1. Open the live site in a fresh incognito window. Padlocks visible.
2. Click a locked pattern → Unlock modal → "Have a code?" → enter `#QBFREE` → should fail.
3. Click "Unlock all patterns" → Freemius checkout should open in **live** mode (no sandbox banner inside the popup).
4. Either close it, or run one real $7.99 purchase / 100%-off coupon to confirm `purchaseCompleted` still persists the license.

### Files touched
- `src/lib/freemius-config.ts` — one line.

That's the whole change.
