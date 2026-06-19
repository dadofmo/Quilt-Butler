The uploaded logo is 512×388 (not square) and contains text that is unreadable at favicon sizes — this is why Google falls back to the generic globe icon. To fix this we will:

1. **Square the logo** — Pad the 512×388 image to 512×512 so it meets favicon aspect-ratio requirements without cropping the brand mark.
2. **Generate multi-resolution favicon files** using the square image:
   - `favicon.ico` — multi-size ICO containing 16×16, 32×32, 48×48. Google specifically looks for 48×48 inside the ICO.
   - `favicon-16x16.png`
   - `favicon-32x32.png`
   - `favicon-96x96.png` (replaces existing)
   - `favicon-192x192.png`
   - `favicon-512x512.png`
   - `apple-touch-icon.png` — 180×180 (replaces existing)
3. **Update `index.html`** — Replace the existing favicon `<link>` tags with a complete set that explicitly advertises the 48×48 size Google expects.
4. **Add `site.webmanifest`** — A PWA manifest with the 192×192 and 512×512 icons. Google also reads the manifest `icons` array when deciding which image to display.

After deployment it will still take **a few days to a few weeks** for Google to recrawl and update the search-results icon; this is normal and unavoidable on their side.