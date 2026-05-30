## Plan

1. Reproduce the issue on each live URL separately
- Test the full incognito flow on `quiltbutler.com`, the Vercel deployment, and `quiltbutler.lovable.app`.
- Confirm which exact domain still locks scroll after closing Freemius with the hosted X.

2. Compare what code each domain is actually serving
- Check the built JS/CSS asset filenames and bundle contents on each domain.
- Verify whether `quiltbutler.com` is still serving an older checkout bundle or cached HTML that misses the latest cleanup code.
- If the domains differ, stop changing app code and fix the deployment/caching mismatch instead.

3. If the latest bundle is already live, patch the remaining close path
- Inspect the live DOM after close for leftover fixed overlays, scroll-lock attributes, or a locked app container.
- Tighten the cleanup so it restores scroll even if Freemius closes through an unreported path or leaves a hidden fullscreen wrapper behind.
- Keep the change limited to checkout close handling only.

4. Validate the exact user scenario before finishing
- Re-run the incognito flow on the affected domain after the change.
- Confirm the page scrolls immediately after clicking the Freemius X.

## Technical details
- Most likely causes now are: stale deployment/cached bundle, domain mismatch between environments, or one remaining DOM wrapper outside the current cleanup selectors.
- I will avoid more speculative code changes until I verify which bundle is live on the failing domain.