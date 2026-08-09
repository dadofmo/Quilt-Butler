# Fix the lingering "30+ patterns" text

## What happened

The earlier edit only changed `index.html`. The home page also sets its own meta description through Helmet, and that copy still says "30+ patterns". Googlebot runs JavaScript, so it sees the Helmet version and keeps showing "30+". The AI-crawler file `public/llms.txt` also still says "30+".

## Changes

1. `src/pages/PatternPickerPage.tsx` — update all three occurrences of "30+ patterns" to "40+ patterns" (meta description, og:description, and the JSON-LD description).
2. `public/llms.txt` — change "30+ quilt patterns" to "40+ quilt patterns".
3. Confirm no other "30+" strings remain anywhere in the project.

## Note on timing

Even after publishing, Google shows a cached snippet until it re-crawls the page — that can take days to a few weeks. You can speed it up by requesting re-indexing for the homepage in Google Search Console.
