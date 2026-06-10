# Pre-launch readiness for QuiltButler

You've confirmed: license-key activation works in incognito on the live site, your real test purchase went through, and Freemius support has cleared the account. The goal of this pass is to harden the buy → activate → re-activate → support path so the first wave of paying users from Facebook/Reddit doesn't hit anything embarrassing.

## What I'll change in code

1. **Confirmation copy after successful key activation.** Right now the modal just closes. Show a brief inline success state before closing: "License activated on this device. Save the email from Freemius with your license key — you'll need it to unlock QuiltButler on a new device or browser." That single line removes the biggest support question you will get ("I bought it on my laptop, how do I unlock it on my phone?").

2. **Trim the license-key input on paste.** Buyers copy from email and often grab a trailing space or newline. `activateLicenseKey` already `trim()`s, but the visible input still shows the whitespace and looks wrong. Trim on change + strip pasted content.

3. **Friendlier copy on the "device limit reached" error.** The current message says to deactivate on another device but doesn't tell them how. Add a one-line pointer to the Freemius license-recovery / management page (same URL we already use for recovery — it's the user account portal).

4. **Make the support email a one-click `mailto:` with a prefilled subject** on the recovery line in `UnlockModal` (currently only the footer has it). When activation fails the user is already frustrated; surfacing "Email support" right there cuts your inbound friction.

5. **Persist the buyer's email alongside the license record** (`src/lib/license.ts`) when activation succeeds. The Freemius response includes it; storing it locally lets us prefill a `mailto:` and also lets you (later) show "Licensed to alice@example.com" in the footer for trust. No server change.

6. **Remove dev-only artifacts from the live bundle.** `#QBFREE` bypass and the `applyBypassCode` export are already gated by `FREEMIUS_MODE !== "sandbox"`, so they're inert — but the constant + function still ship in JS. Tree-shake them out behind a `import.meta.env.DEV` guard so curious users poking the bundle don't even see the string. (`TestModeBanner` and `restoreCheckoutPageState` stay — they're load-bearing.)

7. **Add `noindex` to `/terms` and `/privacy`?** No — leave them indexable. But add a `Last updated` date to both so they look maintained. (Trust signal for first-time buyers.)

8. **404 page already exists and is fine.** No change.

## What I'll verify manually (no code changes)

Run through this list in a fresh incognito window on **both desktop and an actual phone** (iOS Safari is the one that bites):

- Buy flow: click Unlock → Freemius checkout opens → close it with the X → page scroll returns, no frozen body.
- Buy flow: complete a real purchase (you said this is done — re-confirm the email arrives within ~1 minute and the key in it activates on a second device).
- Key entry: paste with leading/trailing whitespace → still activates.
- Key entry: paste a wrong key → friendly error, modal stays open, can retry.
- Key entry: paste a valid key on a 4th device → device-limit error is clear.
- Reload after activation: padlocks stay unlocked, no re-prompt.
- iOS Safari private mode: localStorage may be ephemeral — confirm the "re-enter your key" path works after a reload that wipes storage.
- Cookie banner: appears once, dismisses, doesn't re-appear after reload.
- Footer links: Terms, Privacy, Support mailto, Recover license — all work.
- Print the Results page for a paid pattern — make sure the cutting diagram and shopping list render cleanly (this is what buyers actually take to the fabric store).
- Lighthouse mobile pass on `/` — flag anything red.

## Operational checklist (you, not code)

- **Support inbox**: confirm `quiltbutler@gmail.com` is monitored and you have the Freemius dashboard bookmarked. Your stated playbook ("look up their key in Freemius and email it") is the right one — no code needed.
- **Refund policy**: decide a default (e.g., "30-day no-questions refund — reply to your purchase email"). Either add one line to `/terms` or be ready to answer per-email.
- **OWNER_MASTER_KEY on Vercel**: confirm it's still set to a value only you know, and that you've used it once recently so you know it works. It's your break-glass for "I paid but nothing works."
- **Freemius webhook / email deliverability**: send the purchase-confirmation email to a Gmail and an iCloud address from the Freemius dashboard to confirm neither lands in spam.
- **Analytics**: GA is wired (`G-GXHEB0BRTY`). Decide whether you want a `purchase` event fired from `onSuccess` so you can see conversions in GA — small addition if yes, skip if you'll read Freemius dashboard instead.

## Out of scope

- No changes to yardage math, patterns, or the visualizer.
- No change to the Freemius product/plan/pricing IDs or to `FREEMIUS_MODE` (already `"live"`).
- No new backend or DB — license validation stays serverless + localStorage.

## Verification after the code changes

I'll re-run through the manual checklist above on the preview URL, focusing on: paste-with-whitespace, wrong-key, success-confirmation copy, and that the dev bypass string is gone from the production JS bundle (`rg "QBFREE" dist/` returns nothing after build).