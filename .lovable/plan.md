# Phase 1: Freemius Paywall (Frontend-Only)

Free pattern: Nine Patch. Every other pattern opens an Unlock modal. A successful Freemius purchase — or your secret bypass code `#QBFREE` — stores a license in `localStorage` and unlocks all patterns forever on that device.

No Lovable Cloud. No backend. Survives any future Lovable plan change.

## User flow

1. Visitor taps a paid pattern tile → Unlock modal opens.
2. Modal shows: one-time price, what they get, "Unlock all patterns" button, and a small "Have a code?" link.
3. Click Unlock → Freemius hosted checkout opens (popup).
4. On success, Freemius fires a callback → we save the license locally → modal closes → user proceeds to the size step for the pattern they clicked.
5. On every future visit, paid patterns are unlocked automatically (no login).

## Bypass code

- Code: `#QBFREE` (hardcoded in `src/lib/license.ts`, one line, easy to change later).
- Typed into the "Have a code?" field in the Unlock modal → unlocks the device immediately, no payment, no Freemius involvement.
- For your own testing and anyone you want to give free access to. Don't post it publicly.

## Files to create

- `src/lib/freemius-config.ts` — Product ID `30617`, Plan ID `50283`, Pricing ID `66203`, Public Key `pk_f993d14743e7f27a372ff2a194da1`, plus `FREEMIUS_MODE` (`"sandbox" | "live"`). One line to flip when going live.
- `src/lib/license.ts` — `isUnlocked(patternId)`, `unlock()`, `applyBypassCode(code)`. `localStorage` key `qb_license_v1`. `FREE_PATTERNS = ["nine-patch"]`. Bypass code constant `#QBFREE`.
- `src/lib/checkout.ts` — Lazy-loads the Freemius checkout script and exposes `openCheckout({ onSuccess })`.
- `src/components/UnlockModal.tsx` — Dialog: headline, price, 3-bullet value prop, primary "Unlock all patterns" button, secondary "Have a code?" toggle that reveals an input + Apply button.
- `src/components/TestModeBanner.tsx` — Small yellow banner shown only when `FREEMIUS_MODE === "sandbox"`. Hidden in live mode.

## Files to edit

- `src/pages/PatternPickerPage.tsx` — In tile click handler: if `isUnlocked(p.id)` → `choose(p.id)` as today; else open `UnlockModal` with that pattern id. On modal success → `choose(p.id)`.
- `src/App.tsx` — Render `<TestModeBanner />` above `<Routes>`.

## Going live (one-line change, later)

Flip `FREEMIUS_MODE` from `"sandbox"` to `"live"` in `src/lib/freemius-config.ts`. The bypass code keeps working in both modes.

## Out of scope for Phase 1

Server-side license verification, license transfer between devices, analytics events.

## What I need from you

Just your approval — I'll use the Freemius values we already have and the code `#QBFREE`.
