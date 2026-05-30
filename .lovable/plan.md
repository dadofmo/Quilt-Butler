## Remove "Have a code?" from the Unlock modal

Coupons are entered inside the Freemius checkout itself ("Have a promotional code?" link in the checkout window), so the in-app field is redundant. The sandbox `#QBFREE` bypass is already dead in live mode and no longer needs a UI entry point.

### Change

In `src/components/UnlockModal.tsx`:
- Delete the "Have a code?" toggle button, the code input, the Apply button, and the error message.
- Remove the now-unused `useState` slots (`showCode`, `code`, `codeError`).
- Remove the unused imports (`Input`, `applyBypassCode`) and the `handleApplyCode` function.

The modal will end at the "Unlock all patterns" button.

### Files touched

- `src/components/UnlockModal.tsx` — only.

`applyBypassCode` in `src/lib/license.ts` stays as-is (no caller, no UI, harmless).
