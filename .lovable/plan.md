# Lighthouse Performance Improvements

The Lighthouse report flags three actionable buckets. Here's what to change.

## 1. Improve image delivery (saves ~57 KiB, fixes LCP)

The logo `quilt-butler-logo.webp` is 67 KiB at 512×512 but renders at 256×256 (`h-64`) / 320×320 (`sm:h-80`). It's also the LCP element on the home page but Lighthouse can't discover it from HTML (it's imported via JS).

**Changes:**
- Re-encode the logo to a 640×640 WebP at higher compression (~10–15 KiB) using `sharp` via a one-off script, overwriting `src/assets/quilt-butler-logo.webp`. 640 covers `sm:h-80` at 2× DPR.
- Set explicit `width`/`height` props on the `<img>` to match displayed size (256 / 320) so the intrinsic-vs-displayed mismatch warning goes away.
- Add a `<link rel="preload" as="image" href="/assets/quilt-butler-logo-[hash].webp" fetchpriority="high">` in `index.html`. Since Vite hashes the filename, do the preload from `PatternPickerPage.tsx` via `<Helmet>` using the imported URL — that gets the resolved hashed path injected on the home route only.

## 2. Reduce unused JavaScript (saves ~74 KiB first-party)

Right now `App.tsx` statically imports all four page components, so the home route ships size/fabrics/results code too.

**Change:** Convert routes to `React.lazy` + `<Suspense>`:

```tsx
const PatternPickerPage = lazy(() => import("./pages/PatternPickerPage"));
const SizePage = lazy(() => import("./pages/SizePage"));
// ...
<Suspense fallback={null}><Routes>...</Routes></Suspense>
```

Keep `PatternPickerPage` eager (it's the home/LCP route) by importing it normally, lazy-load only Size/Fabrics/Results. That trims the initial JS chunk noticeably.

## 3. Render-blocking & network dependency tree (saves ~300 ms)

- **Defer Google Tag Manager:** move the gtag `<script async>` and inline init to the end of `<body>`, or load it on `requestIdleCallback` / after first paint. Keep the two `<link rel="preconnect">` hints in `<head>`. This removes GTM from the critical path on first load.
- The render-blocking CSS warning is just the bundled Tailwind CSS — that's already minimal and required for first paint. No safe action there beyond what Vite already does.
- Network dependency tree warning resolves itself once GTM is deferred and the LCP image is preloaded.

## Out of scope / not worth chasing

- "Avoid long main-thread tasks (4 found)" — these are React hydration + GTM init. Lazy-loading routes + deferring GTM will reduce them; no further code change recommended.
- GTM's own 154 KiB unused JS — that's Google's bundle, can't shrink it. Deferring it is the only lever.

## Technical summary of files touched

- `src/assets/quilt-butler-logo.webp` — re-encoded smaller (one-off `sharp` script run via `code--exec`, no committed script).
- `src/components/StepShell.tsx`, `src/pages/PatternPickerPage.tsx` — add `width`/`height` attrs on the logo `<img>`.
- `src/pages/PatternPickerPage.tsx` — add `<Helmet>` `<link rel="preload" as="image" href={quiltButlerLogo} fetchpriority="high" />`.
- `src/App.tsx` — `React.lazy` + `Suspense` for Size/Fabrics/Results.
- `index.html` — move GTM script to end of `<body>`, keep preconnects in `<head>`.

Expected result: LCP image discoverable & ~10× smaller, initial JS chunk ~25–30% smaller, GTM off the critical path → mobile perf score should jump meaningfully.
