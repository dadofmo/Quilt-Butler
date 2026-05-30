## Goal
Add the approved legal pages, a site-wide footer, a one-time cookie banner, and a Freemius license-recovery link in both the unlock modal and the footer. No refund policy or refund language anywhere.

## What gets built

1. **Two legal pages**, using the exact wording approved in chat
   - `/terms` — Terms of Service (8 sections; §2 includes the email-consent paragraph)
   - `/privacy` — Privacy Policy (includes "Occasional emails from QuiltButler"; no refund references)
   - Centered prose, semantic headings, "Last updated: May 29, 2026"
   - Each page sets its own `<title>` and meta description

2. **Site-wide footer** (mounted once in the shared layout)
   - Links: Terms · Privacy · Support (`mailto:quiltbutler@gmail.com`) · Recover license
   - "© QuiltButler" line, no personal name, no Refunds link
   - "Recover license" opens `https://dashboard.freemius.com/license-recovery/30617/quilt-butler/` in a new tab

3. **License-recovery link in the Unlock modal**
   - New small secondary link directly under the existing "Already purchased? Enter your license key" row
   - Label: *"Lost your license key? Recover it"*
   - Opens the same Freemius recovery URL in a new tab (`target="_blank"`, `rel="noopener noreferrer"`)

4. **One-time cookie banner**
   - Bottom-of-screen, single "Got it" dismiss button
   - Stores acknowledgment in `localStorage`; never shown again on that device
   - Copy: "We use a few cookies for analytics and to remember your license on this device. See our Privacy Policy."
   - Disclosure only — does not gate analytics

5. **Routing**
   - Register `/terms` and `/privacy` in the existing router as public routes

## Technical details

- **New files**
  - `src/pages/TermsPage.tsx`
  - `src/pages/PrivacyPage.tsx`
  - `src/components/SiteFooter.tsx`
  - `src/components/CookieBanner.tsx`
- **Edited files**
  - `src/App.tsx` — add the two routes, mount `<SiteFooter />` and `<CookieBanner />` in the shared layout
  - `src/components/UnlockModal.tsx` — add the "Lost your license key? Recover it" link
  - `public/sitemap.xml` — add `/terms` and `/privacy`
- **Recovery URL constant** — hardcoded once (e.g., in `src/lib/freemius-config.ts`) so the modal and footer share it
- **Styling** — Tailwind + existing semantic tokens only (no hardcoded colors)
- **Identity** — generic ("QuiltButler" / "a personal project" / `quiltbutler@gmail.com`); no personal name
- No backend changes, no new dependencies, no changes to checkout/Freemius send flow

## Out of scope
- No Refund Policy page and no refund language anywhere
- No email capture or marketing opt-in UI
