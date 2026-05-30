## Fix: load jQuery before Freemius checkout

The console error on quiltbutler.com is `Uncaught ReferenceError: jQuery is not defined` from `checkout.min.js`. Freemius's hosted checkout script requires jQuery on `window`, and our app doesn't include it. That's why clicking "Unlock all patterns" does nothing.

### Change

Update `src/lib/checkout.ts` so `loadScript()` loads jQuery first (if not already present), then loads the Freemius script.

Sequence inside `loadScript()`:
1. If `window.jQuery` exists → skip jQuery load.
2. Otherwise inject `<script src="https://code.jquery.com/jquery-3.7.1.min.js">` and await its `load` event.
3. Then inject the existing Freemius `https://checkout.freemius.com/checkout.min.js` and await its `load` event.
4. Cache the combined promise so repeat clicks don't re-fetch.

Everything else (`openCheckout`, the Freemius config, the unlock modal, license storage) stays exactly as-is.

### Files touched

- `src/lib/checkout.ts` — only `loadScript()`.

### Verify after publish

Open https://quiltbutler.com in a fresh incognito window → click a locked pattern → click **Unlock all patterns**. The Freemius checkout modal should open with no console errors.
