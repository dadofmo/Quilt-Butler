## Assessment

Gemini's advice is essentially correct. These three findings (X-Frame-Options, X-Content-Type-Options, CSP) are **low-to-medium severity hardening recommendations**, not active vulnerabilities. They aren't "your site is broken" — they're "best-practice headers are missing." The "no WAF detected" note is a false alarm; Vercel's edge already provides DDoS and L3/4 protection, and Sucuri can't see it from the outside.

The fix is exactly what Gemini described: add a `vercel.json` with a `headers` block. Vercel applies it automatically on the next deploy, no code changes, no risk of breaking React/Vite.

**One important caveat about the proposed CSP.** Gemini's suggested policy:
```
default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';
```
is so permissive it barely qualifies as a CSP — it allows scripts from any HTTPS origin and permits inline/eval. It will pass the scanner but provides minimal real protection. That said, it is the **safest starter** for an app that loads Freemius checkout, Google Fonts, etc., and it won't break anything. I recommend we use it as-is now, then tighten later if you want.

## Plan

### 1. Update `vercel.json`

Your project already has a `vercel.json` (for SPA rewrites). I'll add a `headers` block to it — keeping the existing rewrites intact:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "github": { "autoAlias": false },
  "rewrites": [
    { "source": "/((?!.*\\.).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Content-Security-Policy", "value": "default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval'; frame-ancestors 'self'" }
      ]
    }
  ]
}
```

Notes on what I changed vs. Gemini's snippet:
- Merged into your existing `vercel.json` (don't replace — you'd lose the SPA rewrites and the site would 404).
- Added `frame-ancestors 'self'` so the CSP also covers clickjacking (modern equivalent of X-Frame-Options).
- Added `blob:` to default-src — Freemius / some bundlers occasionally need it.
- Added `Referrer-Policy` (small bonus, no risk).

### 2. Publish to `quiltbutler.com`

Headers only take effect after a Vercel deploy. Lovable preview won't show them.

### 3. Verify

After deploy, re-run the Sucuri scan or use https://securityheaders.com to confirm the three findings clear.

### What this does NOT do

- Doesn't add a WAF. You don't need one for a static SPA on Vercel; ignore that warning.
- Doesn't tighten CSP to a strict allowlist. That's a future polish task if you want a higher security grade.

### Risk

Very low. The CSP is intentionally permissive so it won't block Freemius, Stripe, fonts, analytics, or anything else currently loading. If anything does break after deploy, removing one line from `vercel.json` reverts it.
