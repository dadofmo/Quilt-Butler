## Diagnosis (confirmed by reading the files)

The 25.0 s LCP and 4,560 KiB payload come almost entirely from two images:

| File | Actual | Displayed | Weight |
|---|---|---|---|
| `src/assets/fat-quarter-badge.png` | 1920×1920 RGBA PNG | 70×70 px | 2,283 KiB |
| `src/assets/jelly-roll-badge.png` | 1920×1920 RGBA PNG | 70×70 px | 1,905 KiB |
| `src/assets/quilt-butler-logo.webp` | 512×512 WebP | 256×256 px | 60 KiB |

Those three are 4,246 KiB of the 4,399 KiB first-party payload. Everything else (JS 133 KiB, CSS 15 KiB) is already reasonable, and route code-splitting via `lazy()` is already in place in `src/App.tsx`.

## Changes (all zero-risk to functionality — same filenames/imports, same rendered sizes)

1. **Downscale + convert the two badges.** Resize both to 210×210 (3× the 70 px display box, covers high-DPR phones) and save as transparent WebP alongside the PNG import. Expected: ~4,190 KiB → under 20 KiB combined. Update the two `import` statements in `src/pages/PatternPickerPage.tsx` to the new `.webp` files, and add explicit `width={70} height={70}` plus `loading="lazy"` / `decoding="async"` on the badge `<img>`s (they sit below the logo, not the LCP element). Delete the old 1920 px PNGs.
2. **Downscale the logo** to 384×384 WebP (still sharp at 256 px on 1.5× displays; the element is `h-64/sm:h-80`). Keeps its `fetchPriority="high"` preload so it stays the fast LCP candidate.
3. **Trim head-blocking work.** Remove the `preconnect` hints for `googletagmanager.com` / `google-analytics.com` in `index.html` — GA is already deferred to `requestIdleCallback`, so the preconnects just open two sockets during the critical path for no benefit.
4. **Leave the render-blocking CSS as-is by default.** It's a single 15 KiB stylesheet worth ~410 ms on Lighthouse's throttled mobile profile; splitting or inlining it is the one change here that can cause a flash-of-unstyled-content regression. I'd rather not risk it for a small gain — say the word if you want me to attempt it separately.

## Verification

- `bun run build`, then confirm the emitted `dist/assets` badge/logo files are the small ones and no PNG over 100 KiB ships.
- Screenshot page 1 at mobile and desktop widths via a headless browser to confirm both badges still render crisply at the correct position/size over the Rail Fence and Simple Squares tiles.
- Run the existing test suite and `bun audit:math` to confirm nothing else moved.

## Expected result

First-party payload drops from ~4,400 KiB to ~200 KiB. LCP should fall from 25 s into the low single digits and the mobile Performance score should move from 71 into the 90s. No pattern, math, or UI behavior changes.
