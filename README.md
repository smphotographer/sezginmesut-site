# Sezgin Mesut — Türkçe / English

Eleventy + Sveltia CMS. Cloudflare builds and publishes `main`.

## Content

- Turkish articles: `src/blog/yazilar/`; English articles: `src/en/blog/posts/`.
- Turkish video cards: `src/videolar/`; English video cards: `src/en/videos/`.
- Article translations use `translationOf`, the exact Turkish URL including its trailing slash. Keep this field current when renaming a Turkish article. It powers the language switch and reciprocal hreflang links.
- English categories live in `src/en/categories.json`. Each `trSlug` matches a Turkish category in `src/_data/kategoriler.json`.
- The shared layouts and UI dictionaries provide both languages. `/` is Turkish; `/en/` is English. Existing Turkish addresses are preserved.
- English articles and video cards have separate CMS collections. Editing one language does not automatically translate or replace the other. Video audio remains in its original language.
- Latest articles on each homepage include small cover thumbnails. New published content enters that language’s homepage, feed, category archive and search index on the next build.
- The personal biography lives at `/hakkimda/` and `/en/about/`, and can be edited in the CMS under **Hakkımda / About**. Both pages use ProfilePage markup with the same Person identifier as the homepage and article authors.
- `src/_data/profile.json` contains the visible personal profile links. Keep its URLs in sync with `sameAs` in `src/_data/site.json`; topic channels remain ordinary channel links rather than alternate identities for the person.

## Search

The header links to `/arama/` or `/en/search/`. Search runs in the browser against a generated index of published article and video titles, descriptions, categories and tags. It ignores case and accents, including Turkish I variants. Drafts are excluded. Results are inserted as text and safe links, without interpreting query or CMS strings as HTML. The query is shareable through `?q=`. Search pages are noindex and omitted from the sitemap.

## Brand assets

`src/gorseller/sezgin-mesut-transparent.png` and `favicon.png` are the user-supplied original PNGs, copied without modification. The header logo has genuine alpha transparency and uses no contrast, brightness or blending workaround.

## Validation

```sh
npm ci
npm run build
npm run check:seo
python scripts/check-bilingual.py
npm start
```

The checks validate one H1, canonical URLs, structured data, tracking, route coverage, reciprocal language pairs, image paths, search-index language isolation and homepage discovery. For a stale output directory, generate a clean build before checking. Confirm search, language switching and the header at desktop and mobile widths in a browser before publishing.
