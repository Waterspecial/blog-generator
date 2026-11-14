# Industry Rankings: CSV-to-SEO-Blog Generator

Upload a CSV of companies and get a published, SEO-ready ranking page in about 30 seconds. Stats are calculated from the data, an LLM writes the copy, and every page uses the same Nuxt template.

**Live app:** https://blog-generator-sable-eight.vercel.app

- `/`: upload tool (not indexed)
- `/blog`: all generated pages
- `/blog/fintech`: example page

## How it works

```
CSV upload ──► detect columns ──► normalise rows ──► compute stats
                                                         │
                     page template ◄── save ◄── LLM copy (JSON, schema-checked)
                                                 └─ fallback copy if the LLM fails
```

1. **Upload (`/`)**: the browser parses the CSV with Papa Parse, auto-detects which column is the company name, amount, location and so on, and lets you correct the mapping.
2. **Stats (`shared/dataset`)**: rows are normalised (currency, numbers, ranks) and stats are computed: top-10 share, location split, company size, stage, founding year and tags.
3. **Copy (`server/ai`)**: the stats and top 10 are sent to Gemini with strict rules (UK English, use only the given numbers, title and meta description lengths, keyword placement). The reply must match a Zod schema. If it doesn't, or the call fails or times out (60s), deterministic template copy is used instead, so a page is always created.
4. **Save (`server/services/blogStore.ts`)**: the blog document and original CSV are stored through Nitro storage: local files in development, Upstash Redis in production.
5. **Render (`/blog/[slug]`)**: one template fills the title, meta tags, Open Graph, JSON-LD (Article, ItemList, FAQPage), stats, podium, top-10 chart, insight cards, FAQs and a searchable, sortable, paginated ranking table. Pages are added to `/sitemap.xml` automatically.

## Tech stack

| Area | Tools |
|---|---|
| Framework | Nuxt 4 (Vue 3, Nitro server routes), TypeScript |
| Styling | Tailwind CSS 4, daisyUI 5, Nuxt Icon (Lucide) |
| Data | Papa Parse, Zod |
| LLM | Google Gemini (`@google/genai`), Ollama supported for local use |
| Storage | unstorage: filesystem (dev), Upstash Redis (prod) |
| SEO | @nuxtjs/sitemap, @nuxtjs/robots, JSON-LD, `useSeoMeta` |
| Tests | Vitest |
| Hosting | Vercel |

## Run locally

Requires Node 22+.

```bash
git clone https://github.com/Waterspecial/blog-generator.git
cd blog-generator
npm install
cp .env.example .env
```

Add a free Gemini key from https://aistudio.google.com/apikey to `.env`:

```
NUXT_GEMINI_API_KEY=your-key
```

```bash
npm run dev
```

Open http://localhost:3000 and upload a CSV (try `data/seed/fintech.csv`). In development, blogs are saved to `data/blogs/`, so no database is needed.

No Gemini key? Set `NUXT_LLM_PROVIDER=none` and pages are created with template copy.

## Environment variables

| Variable | Needed | Purpose |
|---|---|---|
| `NUXT_LLM_PROVIDER` | optional | `gemini` (default), `ollama` or `none` |
| `NUXT_GEMINI_API_KEY` | for AI copy | Gemini API key |
| `NUXT_GEMINI_MODEL` | optional | defaults to `gemini-3.5-flash` |
| `NUXT_OLLAMA_URL`, `NUXT_OLLAMA_MODEL` | optional | local Ollama alternative |
| `NUXT_PUBLIC_SITE_URL` | production | canonical URLs, sitemap, JSON-LD |
| `NUXT_PUBLIC_SITE_NAME` | optional | site name in meta tags |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | production | blog storage |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm test` | run the test suite |
| `npm run seed` | generate the example fintech blog from `data/seed/fintech.csv` |
| `npm run push-blogs` | copy blogs from `data/blogs/` into Upstash (needs the Upstash variables in `.env`) |

## Deploying to Vercel

1. Import the repo into Vercel. It detects Nuxt automatically.
2. Storage → add **Upstash for Redis**, then add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` with the REST URL and token (no quotes).
3. Add `NUXT_GEMINI_API_KEY` and `NUXT_PUBLIC_SITE_URL`.
4. Deploy, then optionally run `npm run push-blogs` locally to copy existing blogs.

Vercel's filesystem is read-only, which is why production uses Redis instead of files.

## CSV format

One row per company. Only **name** and **amount** are required. Column names are detected automatically and can be changed on the upload page. Optional columns: rank, location, size, stage, founded, tags, description, website. Max 2 MB.

## Project structure

```
app/          pages (upload, blog list, blog page) and components
server/
  api/        generate, blogs and sitemap endpoints
  ai/         prompt, LLM client, fallback copy
  services/   buildBlog (CSV → document), blogStore (storage)
shared/       types, Zod schemas, column detection, stats, formatting (used by browser and server)
scripts/      seed and push-blogs
tests/        Vitest tests
```

## Known limitations

- One page per upload. There is no bulk import yet.
- Uploading the same industry again creates a new page (`fintech-2`) instead of updating it.
- LLM figures are constrained by the prompt but not automatically checked against the stats.
- The upload page is public on the demo deployment.
