## Plan

1. Rework the Freemius checkout cleanup so it does more than clear `body/html` overflow.
   - Add one shared teardown routine in `src/lib/checkout.ts` that restores scroll styles, clears any leftover fixed-position/top-offset state, and removes any orphaned Freemius overlay/iframe/backdrop nodes still attached after the hosted X is clicked.

2. Make the close detection more reliable for the hosted modal.
   - Keep the existing success/cancel callbacks, but also watch for the Freemius modal DOM disappearing, becoming hidden, or leaving behind an inert overlay that still captures wheel/touch events.
   - Run the teardown exactly once no matter which close path fires.

3. Tighten the app-side modal cleanup.
   - Update `src/components/UnlockModal.tsx` so unmount/close also restores the broader page scroll state and doesn’t rely on Freemius firing a specific callback.

4. Validate against the exact user flow.
   - Reproduce: open locked pattern → click “Unlock all patterns” → click the Freemius X → verify the QuiltButler page scrolls normally again on the published site and preview.

## Technical details

- Files likely touched: `src/lib/checkout.ts`, `src/components/UnlockModal.tsx`
- Goal: fix only the post-close scroll lock; no payment-provider/config changes
- I’ll target invisible leftover Freemius DOM/state, since the modal is disappearing visually but scroll is still blocked afterward.