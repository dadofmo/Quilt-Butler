# The Butler Blog

Add a blog to QuiltButler with an SEO-first structure, publish the first article, and put a "The Butler Blog" pill next to the existing Tutorial pill on page 1.

## 1. Header pills

In the step-1 header, show two pills side by side, centered as a group between the "QuiltButler" wordmark (left) and "Step 1 of 4" (right):

```text
QuiltButler        [Tutorial]   [The Butler Blog]        Step 1 of 4
```

- Same size, shape, and sage-green styling as the current Tutorial pill.
- Gap between them at least the width of one pill (min-width driven, so it holds on small screens too).
- The "New to Quiltbutler?" caption stays above the Tutorial pill; the blog pill gets its own short caption ("Quilting tips") so the two align.
- Blog pill links internally to `/blog` (real `<Link>`, crawlable).

## 2. Blog structure

Two new routes:

- `/blog` — index listing every article: title, date, reading time, excerpt, all linking to the article.
- `/blog/:slug` — the article page.

Articles live in a typed content file (`src/content/blog/`), one file per article exporting title, slug, description, date, updated date, tags, excerpt, and the body as structured sections. Adding a future article = drop in one new file and add it to the index array. No backend needed, everything stays static and fast.

Article pages render with proper semantic HTML: single `<h1>`, `<h2>` per tip, real paragraphs and lists, breadcrumb back to home and blog.

## 3. SEO

- Per-page title, meta description, canonical, and og/twitter tags via Helmet on both `/blog` and each article.
- JSON-LD: `Blog` on the index, `Article` + `BreadcrumbList` on each post.
- Article body includes an internal link to the planner (home) from the "square up blocks" tip, plus a closing call-to-action card linking into the pattern picker.
- Add `/blog` and the article URL to `public/sitemap.xml`.
- Add the blog to `public/llms.txt` page list.
- Footer gets a "Blog" link so it is reachable from every page.

Note: this app is a client-rendered SPA, so Google will index these pages (it runs JS) but link-preview crawlers only see the static head. If per-page social previews matter later, that needs SSR — [what the upgrade gives you](https://lovable.dev/blog/building-apps-using-tanstack-start).

## 4. First article

"10 Quilting Tips Every Beginner Should Know Before Their First Project" — published at `/blog/10-quilting-tips-for-beginners`, using your text verbatim, formatted with numbered `<h2>` tips and the safety/tool notes as lists.

## Technical notes

- `src/content/blog/index.ts` — article registry + types; `src/content/blog/beginner-quilting-tips.tsx` — first post.
- `src/pages/BlogIndexPage.tsx` and `src/pages/BlogPostPage.tsx`, both lazy-loaded and registered in `src/App.tsx`.
- Unknown slug renders the existing 404 with `noindex`.
- Header change is confined to `src/components/StepShell.tsx`; no pattern, yardage, or planner logic is touched.
