1. Update the Freemius checkout integration so scroll cleanup does not rely only on Freemius callbacks.
   - Add a stronger cleanup path in `src/lib/checkout.ts` that detects the hosted checkout closing even when the top-right X does not fire `cancel`.
   - Use a DOM-based fallback (for example: observing checkout overlay removal/visibility change and restoring page scroll) so production behavior matches the success/cancel paths.

2. Keep the page resilient if any overlay styles are left behind.
   - Expand the existing restore routine to clear the relevant `body`/`html` lock styles and any leftover fixed-position/top offset values.
   - If needed, also remove any inert empty Freemius backdrop element still intercepting scrolling after close.

3. Validate on the deployed flow.
   - Reproduce the exact sequence on `quiltbutler.com`: open locked pattern, launch checkout, close with X, then verify the page scrolls normally.
   - Confirm the normal purchase-success path still unlocks as before.

Technical details
- Files likely touched: `src/lib/checkout.ts` and only if necessary `src/components/UnlockModal.tsx`.
- No backend or payment-config changes.
- The bug appears to be specific to the hosted Freemius close control on production, which seems to bypass our current `cancel` cleanup path.