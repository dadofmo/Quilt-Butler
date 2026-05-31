## Why Google shows a generic globe

Google's search result icon (the little circle to the left of your domain) is your site's **favicon** — not your og:image. Facebook uses og:image (which is why your logo shows there), but Google specifically looks for a `<link rel="icon">` in the homepage HTML pointing at a square icon at least 48×48px on the same domain.

Your project currently has:
- No favicon file in `public/`
- No `<link rel="icon">` in `index.html`

So Google falls back to the default globe. Once a favicon is in place and Google re-crawls the site, the logo will replace the globe (typically days to a few weeks — Google controls the timing).

## Plan

1. Generate favicon assets from `src/assets/quilt-butler-logo.webp`:
   - `public/favicon.ico` (multi-size: 16, 32, 48)
   - `public/favicon-96.png` (96×96, for higher-DPI)
   - `public/apple-touch-icon.png` (180×180, for iOS home-screen)
   The logo will be center-fit on a solid background so it reads clearly at tiny sizes (Google requires the icon be visible at 48×48; thin line art on transparent often fails this).

2. Reference them in `index.html` `<head>`:
   ```html
   <link rel="icon" href="/favicon.ico" sizes="any" />
   <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png" />
   <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
   ```

3. After deploy, request a recrawl in Google Search Console (URL Inspection → "Request indexing" on `https://quiltbutler.com/`) to speed things up.

## Notes

- This won't affect the Facebook preview — that still uses `og:image`, which is already working.
- The favicon must be served from the same domain Google indexes. Since Google currently indexes `quiltbutler.com` (your May 24 Vercel deploy), the new favicon won't show in Google results until you publish the updated build to `quiltbutler.com`. It will show in `quiltbutler.lovable.app` previews immediately.
- One question before I build: do you want the favicon to be the **logo on a white background**, the **logo on your brand color**, or **logo on transparent**? White usually reads best in Google's light-mode results; transparent can look washed out.