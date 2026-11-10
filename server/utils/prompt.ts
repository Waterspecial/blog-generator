import type { CopyInput } from './fallbackCopy'

export function buildPrompt(input: CopyInput): string {
  const { industry, amountLabel, currency, stats, rows } = input
  const keyword = `UK ${industry} companies`
  const top10 = rows.slice(0, 10).map(({ rank, name, amount, location, description }) => ({ rank, name, amount, location, description }))

  return `Write an SEO ranking article about the top ${stats.companyCount} ${keyword}, ranked by ${amountLabel}.

Rules:
- UK English.
- Use only the numbers in the data. Do not invent facts.
- Write money like £622.3m or £850k (currency: ${currency ?? 'none'}).
- Include "${keyword}" in the title, h1, intro and one section heading.
- Title 50 to 65 characters, metaDescription 140 to 160 characters.
- 3 to 5 sections, each about one stats block, with statKey set to that block's name.
- 3 to 5 FAQs answered from the data.
- Return JSON only.

Stats: ${JSON.stringify(stats)}
Top 10: ${JSON.stringify(top10)}`
}
