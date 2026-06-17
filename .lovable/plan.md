Good news: the API is working — Freemius returned your one active device ("Quilt Butler — Windows"). The remaining problems are all in the modal UI.

## Problems

1. **Confusing wording.** The header says "Pick one to sign out so you can use this device instead" and the button next to the device says "Use this device instead." Two different phrasings for the same action.
2. **Contradictory red error.** Below the picker we still show the raw Freemius error ("This license is already used on 3 devices. Pick one below to free up.") even though the picker only lists 1 device. That message is the upstream activation error — once we have the device list, it shouldn't be shown.
3. **Dialog won't scroll.** The Activate / Cancel buttons are clipped off the bottom on small viewports because `DialogContent` has no max-height / overflow.

## Fix (UI only, in `src/components/UnlockModal.tsx`)

1. **Rewrite the picker copy** so the instruction and the button agree:
   - Header: "Your license is active on {n} device{s}."
   - Sub-line: "Sign one out to free up a spot for this device."
   - Per-row button label: "Sign out" (while pending: "Signing out…"). `swapLicenseDevice` itself is unchanged — it still deactivates the chosen install and activates the current one.

2. **Suppress the upstream red error once devices are loaded.** In `handleActivateKey`, when `reason === "limit_reached"` and we successfully fetch the device list, clear `keyError` instead of setting it. Only show `keyError` in the picker view if a *swap attempt* fails (network / Freemius error from `handleSwapDevice`). Remove the now-dead `keyError && devices` branch's stale text.

3. **Make the dialog scrollable.** On `<DialogContent>` add `max-h-[90vh] overflow-y-auto` so the Activate / Cancel row is always reachable on phones and short windows.

4. **Tiny consistency tweak.** The intro copy at the top of the modal already says "up to 3 devices," so keep the picker copy aligned with that ("license is active on N device(s)") and drop the redundant "use this device instead" phrase entirely.

## Out of scope

- No changes to `api/license-devices.ts`, `api/license-deactivate.ts`, `api/license-activate.ts`, or `src/lib/license.ts`. The backend round-trip is now working; this is purely a presentation fix.

## Verification

- Open the modal at the current narrow viewport, paste the key: picker shows "Your license is active on 1 device," one row with a "Sign out" button, no red error underneath, and you can scroll to the Activate / Cancel buttons.
- Click "Sign out": row shows "Signing out…", then the success state appears.
- If the swap call fails, the red error appears under the picker (not the stale Freemius "3 devices" text).
