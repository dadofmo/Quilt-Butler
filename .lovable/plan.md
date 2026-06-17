Remove the temporary "Re-lock (testing)" debug button from `src/pages/PatternPickerPage.tsx`:

- Delete the floating button block (lines 155–167), including its `hasFullLicense()` guard and the `localStorage.removeItem("qb_license_v1")` reload handler.
- Drop `hasFullLicense` from the `@/lib/license` import on line 9 (keep `isUnlocked`), since nothing else on this page uses it.
- Leave `hasFullLicense` exported from `src/lib/license.ts` untouched — it's not referenced elsewhere right now, but keeping the export costs nothing and avoids touching shared code.

No other files change. After the edit, the bottom-right "Re-lock (testing)" pill will no longer appear for unlocked users.