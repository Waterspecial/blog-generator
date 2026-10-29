import type { ColumnMapping, StandardField } from './fields'

export type Currency = 'GBP' | 'USD' | 'EUR'

export interface NormalisedRow {
  rank: number
  name: string
  amount: number
  location: string | null
  size: string | null
  stage: string | null
  founded: number | null
  tags: string[]
  description: string | null
  website: string | null
}

export type RawRow = Record<string, string | undefined>

const EMPTY_VALUES = new Set(['', 'n/a', 'na', '-', '—', 'null', 'none', 'unknown'])

export function isEmptyValue(value: string | null | undefined): boolean {
  return value == null || EMPTY_VALUES.has(value.trim().toLowerCase())
}

export function parseText(value: string | null | undefined): string | null {
  return isEmptyValue(value) ? null : value!.trim()
}

const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  mn: 1_000_000,
  b: 1_000_000_000,
  bn: 1_000_000_000,
}

export function parseAmount(value: string | null | undefined): number | null {
  if (isEmptyValue(value)) return null
  const cleaned = value!.toLowerCase().replace(/[£$€,\s]/g, '')
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)(k|m|mn|bn|b)?$/)
  if (!match) return null
  const amount = Number(match[1]) * (match[2] ? MULTIPLIERS[match[2]]! : 1)
  return Number.isFinite(amount) ? Math.round(amount) : null
}

const CURRENCY_SYMBOLS: Record<string, Currency> = { '£': 'GBP', '$': 'USD', '€': 'EUR' }

export function detectCurrency(values: (string | null | undefined)[]): Currency | null {
  const counts = new Map<Currency, number>()
  for (const value of values) {
    if (!value) continue
    for (const [symbol, currency] of Object.entries(CURRENCY_SYMBOLS)) {
      if (value.includes(symbol)) counts.set(currency, (counts.get(currency) ?? 0) + 1)
    }
  }
  let best: Currency | null = null
  for (const [currency, count] of counts) {
    if (best === null || count > counts.get(best)!) best = currency
  }
  return best
}

export function parseTags(value: string | null | undefined): string[] {
  if (isEmptyValue(value)) return []
  return value!
    .split(';')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
}

export function parseYear(value: string | null | undefined): number | null {
  if (isEmptyValue(value)) return null
  const match = value!.match(/\b(1[89]\d{2}|2\d{3})\b/)
  if (!match) return null
  const year = Number(match[1])
  return year <= new Date().getFullYear() + 1 ? year : null
}

export function parseRank(value: string | null | undefined): number | null {
  if (isEmptyValue(value)) return null
  const rank = Number(value!.replace(/[#\s]/g, ''))
  return Number.isInteger(rank) && rank > 0 ? rank : null
}

export function parseSize(value: string | null | undefined): string | null {
  return parseText(value)
}

export function sizeSortKey(band: string): number {
  const trimmed = band.trim()
  if (trimmed.startsWith('<')) return 0
  const match = trimmed.replace(/,/g, '').match(/\d+/)
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY
}

export function parseWebsite(value: string | null | undefined): string | null {
  const text = parseText(value)
  if (!text) return null
  if (/^https?:\/\//i.test(text)) return text
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(text)) return `https://${text}`
  return null
}

export function invertMapping(mapping: ColumnMapping): Partial<Record<StandardField, string>> {
  const byField: Partial<Record<StandardField, string>> = {}
  for (const [header, field] of Object.entries(mapping)) {
    byField[field] = header
  }
  return byField
}

export function normaliseRows(rawRows: RawRow[], mapping: ColumnMapping): NormalisedRow[] {
  const col = invertMapping(mapping)
  const get = (row: RawRow, field: StandardField) => (col[field] ? row[col[field]!] : undefined)

  const rows: (Omit<NormalisedRow, 'rank'> & { rank: number | null })[] = []
  for (const raw of rawRows) {
    const name = parseText(get(raw, 'name'))
    const amount = parseAmount(get(raw, 'amount'))
    if (!name || amount === null) continue
    rows.push({
      rank: parseRank(get(raw, 'rank')),
      name,
      amount,
      location: parseText(get(raw, 'location')),
      size: parseSize(get(raw, 'size')),
      stage: parseText(get(raw, 'stage')),
      founded: parseYear(get(raw, 'founded')),
      tags: parseTags(get(raw, 'tags')),
      description: parseText(get(raw, 'description')),
      website: parseWebsite(get(raw, 'website')),
    })
  }

  const hasAllRanks = rows.length > 0 && rows.every(row => row.rank !== null)
  if (hasAllRanks) {
    return (rows as NormalisedRow[]).sort((a, b) => a.rank - b.rank)
  }

  return rows
    .sort((a, b) => b.amount - a.amount)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}
