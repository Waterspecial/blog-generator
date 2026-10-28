# Build Plan: AI-Powered SEO Blog Generator (Nuxt)

> Instructions for Claude Code: work through the phases in order. After each phase, run the checks listed under "Done when", commit with a clear message, and stop so the developer can review before continuing. Do not skip ahead.

---

## 1. Goal

Build a reusable Nuxt app that turns any company dataset (CSV) into a server-rendered, SEO-optimised industry blog page.

- One blog page per dataset (an industry ranking article), not one page per company.
- Numbers are computed in code. The LLM only writes the words.
- The app must work for datasets it has never seen (different headers, missing columns). Nothing is hardcoded for fintech.
- Free tools only.

The seed dataset is `data/seed/fintech.csv` (top 100 UK seed-stage fintechs by total raised).

---

## 2. Tech stack

| Purpose | Tool |
|---|---|
| Framework | Nuxt (latest, v4) with SSR enabled (default) |
| Styling | Tailwind CSS (`@nuxtjs/tailwindcss`) |
| CSV parsing | Papa Parse (`papaparse`) on client and server |
| Validation | Zod |
| LLM | Google Gemini via `@google/genai` (free tier), with Ollama as an optional alternative |
| Storage | Nitro `useStorage` with the `fs` driver (JSON files) |
| Sitemap | `@nuxtjs/sitemap` |
| Tests | Vitest |

No database. Each blog is one JSON document. The storage driver can be swapped for a hosted key-value store later without code changes.

---

## 3. Key concept: column mapping

Every dataset names its columns differently. The app defines a fixed set of **standard fields**, and each upload maps CSV columns onto them. All code after the mapping step uses standard fields only, never raw CSV header names.

### Standard fields

| Field | Type | Required | Meaning |
|---|---|---|---|
| `name` | string | yes | Company name |
| `amount` | number | yes | Primary ranking metric (for example total raised, revenue) |
| `rank` | integer | no | If missing, compute by sorting `amount` descending |
| `location` | string | no | Region or city |
| `size` | string (band) | no | Employee band such as `10-24`, `<5` |
| `stage` | string | no | Funding stage |
| `founded` | integer (year) | no | Year founded |
| `tags` | string[] | no | Multi-value sector or industry list |
| `description` | string | no | Short company description |
| `website` | string (URL) | no | Company website |

Unmapped columns are ignored.

### Column mapping shape

```json
{
  "Company": "name",
  "Total Raised": "amount",
  "Rank": "rank",
  "Region": "location",
  "Employees": "size",
  "Stage": "stage",
  "Industries": "tags",
  "Description": "description",
  "Website": "website"
}
```

### Field detection (auto-guessing the mapping)

Implement `detectFields(headers, sampleRows)` that returns a suggested mapping. Use, in order:

1. **Header synonyms** (case-insensitive, ignore punctuation):
   - `name`: company, company name, organisation, organization, business, name
   - `amount`: total raised, total funding, funding, amount raised, raised, investment, revenue, valuation
   - `rank`: rank, position, #
   - `location`: region, location, city, hq, headquarters, country, area
   - `size`: employees, headcount, staff, team size, company size
   - `stage`: stage, funding stage, round
   - `founded`: founded, year founded, founded year, incorporation year
   - `tags`: industries, industry, sectors, sector, categories, tags, verticals
   - `description`: description, about, summary, overview
   - `website`: website, url, site, web
2. **Value checks** when no synonym matches:
   - Currency or large numbers (contains `£ $ €`, or parses to a number with most values over 1000) suggest `amount`.
   - Values starting with `http` suggest `website`.
   - Values containing `; ` separators suggest `tags`.
   - Average length over 50 characters suggests `description`.
   - Integers between 1800 and the current year suggest `founded`.
   - Patterns like `10-24`, `<5`, `250+` suggest `size`.
3. Each field can be assigned to one column at most.

Optional (only if time allows): if `name` or `amount` cannot be detected, send the headers and 5 sample rows to the LLM and ask it to return a mapping.

The upload UI always shows the suggested mapping and lets the user correct it before generating.

---

## 4. Project structure

```
/
├─ app/
│  ├─ pages/
│  │  ├─ index.vue              # redirects or links to /blog
│  │  ├─ blog/index.vue         # list of all generated blogs
│  │  ├─ blog/[slug].vue        # THE reusable blog template
│  │  └─ admin/upload.vue       # CSV upload + preview + mapping
│  ├─ components/
│  │  ├─ blog/StatCards.vue
│  │  ├─ blog/InsightSection.vue
│  │  ├─ blog/RankingTable.vue
│  │  ├─ blog/FaqList.vue
│  │  └─ upload/MappingTable.vue
│  └─ app.vue
├─ server/
│  ├─ api/
│  │  ├─ generate.post.ts       # CSV in, blog JSON saved, slug out
│  │  ├─ blogs/index.get.ts     # list blogs (slug, title, industry, createdAt)
│  │  └─ blogs/[slug].get.ts    # one blog document
│  ├─ api/__sitemap__/urls.get.ts
│  └─ utils/                    # auto-imported in Nitro
│     ├─ llm.ts                 # generateCopy(): Gemini or Ollama
│     ├─ prompt.ts              # buildPrompt()
│     ├─ fallbackCopy.ts        # template copy if LLM fails
│     └─ blogStore.ts           # save/get/list via useStorage('blogs')
├─ shared/                      # pure functions used by client AND server
│  ├─ fields.ts                 # standard field definitions + synonyms
│  ├─ detectFields.ts
│  ├─ normalise.ts
│  ├─ computeStats.ts
│  ├─ schemas.ts                # Zod schemas: BlogDocument, BlogContent
│  └─ format.ts                 # formatCurrency (£622.3m), formatPercent
├─ data/
│  ├─ seed/fintech.csv
│  └─ blogs/                    # generated blog JSON (+ raw CSV copies)
├─ tests/
│  ├─ fixtures/healthtech_sample.csv
│  ├─ detectFields.test.ts
│  ├─ normalise.test.ts
│  └─ computeStats.test.ts
├─ scripts/seed.ts              # runs the full pipeline on data/seed/fintech.csv
├─ .env.example
└─ README.md
```

---

## 5. Data shapes

### Blog document (what gets stored, one per slug)

```ts
{
  slug: string,                  // "fintech"
  industry: string,              // "Fintech"
  createdAt: string,             // ISO date
  source: { fileName: string, rowCount: number },
  mapping: Record<string, StandardField>,
  fieldsPresent: StandardField[],   // drives what the template renders
  amountLabel: string,           // original header, e.g. "Total Raised"
  currency: "GBP" | "USD" | "EUR" | null,
  stats: Stats,
  content: BlogContent,          // LLM or fallback output
  contentSource: "llm" | "fallback",
  rows: NormalisedRow[]          // all rows, sorted by rank
}
```

### Stats (only include a block when its field is present)

```ts
{
  companyCount: number,
  context: { stage?: string },             // fields with one distinct value
  amount: { total, median, mean, min, max: { name, value }, top10Share },
  location?: { counts: [name, count][], topName, topShare, outsideTopCount },
  size?: { distribution: [band, count][], mostCommon, mostCommonShare },
  stage?: { counts: [name, count][] },      // only if more than one distinct value
  founded?: { medianYear, oldest: { name, year }, newest: { name, year }, byDecade: [decade, count][] },
  tags?: { top: [tag, count][] }            // top 8, after excluding tags on more than 90% of rows
}
```

### Blog content (LLM output, validated with Zod)

```ts
{
  title: string,               // 50 to 65 chars, includes primary keyword
  metaDescription: string,     // 140 to 160 chars
  h1: string,
  intro: string,               // 2 short paragraphs
  sections: {                  // 3 to 5
    heading: string,           // H2, descriptive, keyword-aware
    body: string,              // 1 to 2 paragraphs
    statKey: "amount" | "location" | "size" | "stage" | "founded" | "tags" | null
  }[],
  tableIntro: string,          // one sentence above the ranking table
  faqs: { question: string, answer: string }[],   // 3 to 5
  keywords: string[]           // 5 to 8
}
```

---

## 6. Phases

### Phase 1: Project setup

- Create the Nuxt app (`npm create nuxt@latest`), TypeScript on.
- Install: `@nuxtjs/tailwindcss`, `@nuxtjs/sitemap`, `papaparse`, `@types/papaparse`, `zod`, `@google/genai`, `vitest`.
- Configure Nitro storage in `nuxt.config.ts`:
  ```ts
  nitro: { storage: { blogs: { driver: 'fs', base: './data/blogs' } } }
  ```
- Add `runtimeConfig` keys: `llmProvider` (`gemini` | `ollama` | `none`), `geminiApiKey`, `geminiModel` (default `gemini-2.5-flash`, check AI Studio for the current free model), `ollamaUrl` (default `http://localhost:11434`), `ollamaModel` (default `llama3.1`). Public: `siteUrl`, `siteName`.
- Create `.env.example` with these keys.
- Copy the provided CSV to `data/seed/fintech.csv`.

**Done when:** `npm run dev` serves a page, `npm run test` runs (even with zero tests), and the repo is pushed to GitHub.

---

### Phase 2: Core data utilities (no UI, no AI)

Build everything in `shared/` as pure, framework-free TypeScript.

**`normalise.ts`**
- `parseAmount("£30,314,247")` returns `30314247`. Handle `£ $ €`, commas, spaces, and suffixes `k`, `m`, `bn` (`"£1.2m"` returns `1200000`). Return `null` for `N/A`, `-`, empty.
- `detectCurrency(values)` returns `GBP`, `USD`, `EUR` or `null` from symbols.
- `parseTags("A; B; C")` returns `["A","B","C"]` (split on `;`, trim, drop empty).
- `parseYear` returns an integer or `null`.
- `parseSize` keeps the band string, returns `null` for `N/A`. Add `sizeSortKey(band)` using the lower bound (`<5` = 0, `250+` = 250).
- `normaliseRows(rawRows, mapping)` returns `NormalisedRow[]`. Drop rows with no `name` or no `amount`. If `rank` is not mapped, sort by `amount` descending and assign ranks.

**`detectFields.ts`**: as described in section 3.

**`computeStats.ts`**
- Compute the stats shape from section 5.
- A categorical field (`location`, `stage`, `size`) with exactly one distinct value goes into `context` and gets no chart or section.
- `tags`: count occurrences, exclude any tag present on more than 90% of rows, keep the top 8.
- `top10Share` = sum of top 10 amounts / total.

**Tests (Vitest), using `data/seed/fintech.csv`. These are the real expected values:**

| Check | Expected |
|---|---|
| Row count | 100 |
| Total raised | 622,301,270 (£622.3m) |
| Median | 4,146,786 (£4.1m) |
| Max | Nevis, 30,314,247 |
| Top 10 share | about 0.33 |
| Top location | London, 78 |
| Second location | North West, 6 |
| Stage | constant "Seed", so it goes into `context` |
| Most common size | `10-24`, 49 |
| "Application software" tag | excluded (98 of 100 rows) |
| Top tag after exclusion | "Data provision and analysis", 35 |
| Currency | GBP |

Also create `tests/fixtures/healthtech_sample.csv`: about 15 rows, headers `Organisation, HQ, Funding to date, Headcount, Sectors, Founded`, **no rank column**, amounts written like `£1.2m` and `£850k`. Test that `detectFields` maps it correctly and that ranks are computed.

**Done when:** all tests pass.

---

### Phase 3: Blog template (using a hand-made blog document)

- `scripts/seed.ts` runs parse, detect, normalise and computeStats on the fintech CSV, uses `fallbackCopy()` for content (write that function now, see phase 4), and saves `fintech` to storage. Add `npm run seed`.
- `server/utils/blogStore.ts`: `saveBlog`, `getBlog`, `listBlogs`.
- API routes: `GET /api/blogs` and `GET /api/blogs/[slug]` (return 404 via `createError` if missing).
- `app/pages/blog/[slug].vue`:
  - `useFetch` the blog on the server. Throw a 404 page if not found.
  - `useSeoMeta`: title, description, `ogTitle`, `ogDescription`, `ogType: 'article'`, `twitterCard`.
  - `useHead`: canonical link (`siteUrl + /blog/slug`), `lang="en-GB"`.
  - JSON-LD script tags: `Article` (headline, description, datePublished, author/publisher = site name), `ItemList` of all companies (position, name, url = website), `FAQPage` from FAQs, `BreadcrumbList` (Home > Blog > title).
  - Layout, in order: breadcrumb, H1, intro, `StatCards`, `InsightSection` for each section (show the related mini stat or bar list when `statKey` is set), `tableIntro`, `RankingTable`, `FaqList`, a "Data source and methodology" note (row count, file name, date generated).
- `StatCards`: render only cards whose data exists. Fintech example: £622.3m total raised, £4.1m median, 78% based in London, top 10 hold 33% of funding.
- `RankingTable`:
  - Semantic `<table>` with `<caption>`, `<thead>`, `<th scope="col">`.
  - Columns come from `fieldsPresent`, in this order: rank, name (linked to website with `rel="nofollow noopener"` and `target="_blank"`), location, size, stage (only if not constant), founded, amount (formatted), tags (chips).
  - All rows rendered in the server HTML. No pagination that hides rows.
  - Responsive: wrapper with horizontal scroll, sticky rank and name columns on small screens.
  - Optional client-side sort by clicking headers (progressive enhancement only).
- `app/pages/blog/index.vue`: list all blogs with title, industry, meta description and a link (internal linking).

**Done when:** `npm run seed` then visiting `/blog/fintech` shows the full page. "View source" contains the title, meta tags, JSON-LD and all 100 company names. The page works at 375px wide with no horizontal page scroll.

---

### Phase 4: LLM copy generation

**`prompt.ts`: `buildPrompt(blogInput)`**
- Input: industry, amount label, currency, `companyCount`, `context`, `stats`, and the top 10 rows (rank, name, amount, location, description). Never send all rows.
- Rules in the prompt:
  - Use UK English.
  - Use only the numbers provided. Do not invent statistics, dates, investors or facts.
  - Primary keyword: "UK {industry} companies". Include it in the title, H1, intro and at least one H2.
  - If `context.stage` exists, reflect it (for example "seed-stage").
  - Title 50 to 65 characters, meta description 140 to 160 characters.
  - 3 to 5 sections, each based on one stats block, with the matching `statKey`.
  - 3 to 5 FAQs that a searcher would actually ask, answered from the data.
  - Return JSON only, matching the schema.

**`llm.ts`: `generateCopy(input): Promise<{ content, source }>`**
- Gemini: use `@google/genai` with `responseMimeType: 'application/json'` and a `responseSchema` matching `BlogContent`.
- Ollama: POST to `/api/chat` with `format: 'json'`.
- `none`: skip straight to the fallback.
- Validate with the Zod `BlogContent` schema. On failure, retry once with the validation error appended to the prompt. If it still fails, or the API errors or times out (20 seconds), use `fallbackCopy()` and set `source: 'fallback'`. Log the reason server-side.

**`fallbackCopy.ts`**: deterministic template copy built from stats only, for example title "Top {count} UK {industry} Companies by {amountLabel} ({year})". It must produce valid `BlogContent` for any dataset.

**Done when:** with a valid key, `npm run seed` produces LLM copy for fintech that passes validation. With `LLM_PROVIDER=none` or an invalid key, it produces fallback copy and the page still renders.

---

### Phase 5: Upload workflow

**`POST /api/generate`**
- Read multipart form data (`readMultipartFormData`): `file` (CSV), `industry` (string), `mapping` (JSON string), `overwrite` (optional boolean).
- Validate: file present, under 2 MB, `.csv`. Mapping must include `name` and `amount`. Return a 400 with a clear message otherwise.
- Pipeline: Papa Parse (`header: true`, `skipEmptyLines: true`), normaliseRows, computeStats, generateCopy, build the blog document, validate with Zod, save it. Also save the raw CSV as `{slug}.csv` so it can be regenerated later.
- Slug: slugify the industry. If it exists and `overwrite` is false, append `-2`, `-3` and so on.
- Response: `{ slug, url, contentSource }`.

**`app/pages/admin/upload.vue`**
1. File input (drag and drop if quick).
2. On select, Papa Parse in the browser reads the headers and first 5 rows.
3. Run `detectFields` and show `MappingTable`: each CSV header, sample values, and a dropdown of standard fields (plus "Ignore"), preselected with the guess.
4. Industry name input (prefill from the file name if possible).
5. "Generate blog" button with a loading state ("Generating copy with AI...").
6. On success, redirect to `/blog/{slug}`. On error, show the message.
7. Show a small notice if `contentSource` was `fallback`.

Add `noindex` to the upload page via `useSeoMeta({ robots: 'noindex, nofollow' })`.

**Done when:** uploading `data/seed/fintech.csv` through the UI produces `/blog/fintech` with no manual steps, and uploading `tests/fixtures/healthtech_sample.csv` produces `/blog/healthtech` correctly (ranks computed, missing fields simply not shown).

---

### Phase 6: Technical SEO finishing

- `@nuxtjs/sitemap` with a dynamic source `server/api/__sitemap__/urls.get.ts` that lists `/blog` and every `/blog/{slug}` with `lastmod`.
- `public/robots.txt`: allow all, disallow `/admin`, point to the sitemap.
- Every page has a unique title and meta description. One H1 per page. Logical H2 order.
- Open Graph defaults for site name and locale `en_GB`.
- Check with Lighthouse (SEO and accessibility should be 90 or above).

**Done when:** `/sitemap.xml` lists all blogs, and Lighthouse SEO is 90 or above on `/blog/fintech`.

---

### Phase 7: Generalisation test

Create two more test CSVs and run them through the upload flow:
1. Different headers and no rank (the healthtech fixture).
2. A minimal dataset with only a name and an amount column.

Both must generate a valid page with no code changes. Fix anything that breaks. This simulates the interview demo.

---

### Phase 8: README and deployment

README sections:
1. **Overview:** what it does, with a screenshot.
2. **Approach:** the pipeline (parse, map, normalise, stats, LLM, store, render); "numbers from code, words from the LLM"; column mapping as the reusability layer.
3. **Setup:** clone, `npm install`, copy `.env.example` to `.env`, add a free Gemini key from Google AI Studio, `npm run seed`, `npm run dev`.
4. **Using it:** go to `/admin/upload`, choose a CSV, confirm the mapping, generate.
5. **SEO implementation:** SSR, meta tags, JSON-LD types, sitemap, robots, semantic table, internal linking.
6. **Tools used.**
7. **Trade-offs and next steps:** JSON storage instead of a database (swap the Nitro driver for Upstash or Netlify Blobs in production, since serverless filesystems are not persistent); SSR rather than static generation so new pages need no rebuild; possible additions such as company detail pages, LLM-assisted column mapping, multiple charts, regeneration from the stored CSV, authentication on `/admin`.

Deployment: deploy in SSR mode (Vercel or Netlify free tier). Note in the README that generated blogs persist locally; for persistence in production, switch the storage driver.

---

## 7. Coding rules

- TypeScript throughout. No `any` in shared utilities.
- Never reference raw CSV header names after the mapping step.
- Keep `shared/` free of Nuxt or Vue imports so it can be unit tested and used on both client and server.
- The LLM never calculates numbers. Every figure on the page comes from `stats` or `rows`.
- Format numbers with one helper (`formatCurrency`: £622.3m, £4.1m, £850k).
- Small, focused components. No inline giant templates.
- Commit at the end of each phase.

## 8. Demo checklist (for the interview)

- [ ] `npm run dev` running, Gemini key working, fallback tested.
- [ ] `/blog/fintech` live and correct.
- [ ] Upload the new dataset they provide, check the mapping, adjust a dropdown if needed, generate.
- [ ] Open the new page, then "view source" to show SSR content and JSON-LD.
- [ ] Show `/sitemap.xml` now includes the new page.
- [ ] Explain the column mapping and "numbers from code, words from the LLM".
