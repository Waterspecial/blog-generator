import Papa from 'papaparse'
import { computeStats } from '../../shared/dataset/computeStats'
import { detectFields, missingRequiredFields } from '../../shared/dataset/detectFields'
import { STANDARD_FIELDS } from '../../shared/constants'
import { detectCurrency, invertMapping, normaliseRows } from '../../shared/dataset/normalise'
import type { RawRow } from '../../shared/types'
import { BlogDocumentSchema, type BlogDocument } from '../../shared/schemas'
import type { BuildBlogInput, LlmConfig } from '../types'
import { generateCopy } from '../ai/llm'

export class CsvError extends Error {}

export function parseCsv(csv: string): { headers: string[], rows: RawRow[] } {
  const result = Papa.parse<RawRow>(csv, { header: true, skipEmptyLines: true })
  return { headers: result.meta.fields ?? [], rows: result.data }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'blog'
}

export async function buildBlogDocument(input: BuildBlogInput, llm: LlmConfig): Promise<BlogDocument> {
  const industry = input.industry.trim()
  const { headers, rows: rawRows } = parseCsv(input.csv)
  const mapping = input.mapping ?? detectFields(headers, rawRows.slice(0, 5))

  const missing = missingRequiredFields(mapping)
  if (missing.length > 0) throw new CsvError(`Missing required columns: ${missing.join(', ')}`)

  const rows = normaliseRows(rawRows, mapping)
  if (rows.length === 0) throw new CsvError('No rows have both a name and an amount')

  const stats = computeStats(rows)
  const amountLabel = invertMapping(mapping).amount!
  const currency = detectCurrency(rawRows.map(row => row[amountLabel]))
  const fieldsPresent = STANDARD_FIELDS.filter((field) => {
    if (field === 'rank' || field === 'name' || field === 'amount') return true
    return rows.some((row) => {
      const value = row[field]
      return Array.isArray(value) ? value.length > 0 : value !== null
    })
  })

  const copy = await generateCopy({ industry, amountLabel, currency, stats, rows }, llm)

  return BlogDocumentSchema.parse({
    slug: input.slug ?? slugify(industry),
    industry,
    createdAt: new Date().toISOString(),
    source: { fileName: input.fileName, rowCount: rawRows.length },
    mapping,
    fieldsPresent,
    amountLabel,
    currency,
    stats,
    content: copy.content,
    contentSource: copy.source,
    rows,
  })
}
