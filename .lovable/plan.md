## Fix: Assign Fabrics button disabled in jelly-roll mode

**Root cause**
In `src/pages/SizePage.tsx`, line 840, the button's `disabled` prop is:

```
!blockSizeValid || !fabricWidthValid || !borderValid || (isSashed && !sashingValid) || (isSnowball && !cornerAccentValid)
```

In jelly-roll mode the bolt-width field is hidden (line 446 `{!isJellyRoll && ...}`), so `fabricWidthText` stays empty and `fabricWidthValid` is `false` — keeping the button permanently disabled. The `next()` handler at line 369 already handles this correctly by defaulting to 44" when in jelly-roll mode; the disabled check just wasn't updated to match.

**Change**
Update the `disabled` expression on line 840 to skip the `fabricWidthValid` check in jelly-roll mode and use `stripCountValid` instead:

```ts
disabled={
  !blockSizeValid ||
  !borderValid ||
  (!isJellyRoll && !fabricWidthValid) ||
  (isJellyRoll && !stripCountValid) ||
  (isSashed && !sashingValid) ||
  (isSnowball && !cornerAccentValid)
}
```

This mirrors the existing guards in `next()` so the button enables exactly when submission would succeed.

**Verification**
- Manual: switch to Rail Fence + jelly roll, apply a suggested exact-fit combo, confirm "Assign fabrics →" is clickable.
- Non-jelly-roll patterns unaffected (still require fabricWidthValid).
- Run `bun audit:math` (no math changed, but standard safety check).