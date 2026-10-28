import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import type { ColumnMapping } from '../shared/fields'
import {
  detectCurrency,
  normaliseRows,
  parseAmount,
  parseSize,
  parseTags,
  parseWebsite,
  parseYear,
  sizeSortKey,
  type RawRow,
} from '../shared/normalise'

const fintechMapping: ColumnMapping = {
  'Rank': 'rank',
  'Company': 'name',
  'Region': 'location',
  'Stage': 'stage',
  'Employees': 'size',
  'Total Raised': 'amount',
  'Description': 'description',
  'Website': 'website',
  'Industries': 'tags',
}

function loadCsv(path: string): RawRow[] {
  return Papa.parse<RawRow>(readFileSync(path, 'utf8'), { header: true, skipEmptyLines: true }).data
}

describe('parseAmount', () => {
  it('parses currency with commas', () => {
    expect(parseAmount('£30,314,247')).toBe(30314247)
    expect(parseAmount('$1,000')).toBe(1000)
    expect(parseAmount('€ 2 500')).toBe(2500)
  })

  it('parses k, m and bn suffixes', () => {
    expect(parseAmount('£1.2m')).toBe(1200000)
    expect(parseAmount('£850k')).toBe(850000)
    expect(parseAmount('$2bn')).toBe(2000000000)
    expect(parseAmount('3.5M')).toBe(3500000)
  })

  it('returns null for empty or placeholder values', () => {
    expect(parseAmount('N/A')).toBeNull()
    expect(parseAmount('-')).toBeNull()
    expect(parseAmount('')).toBeNull()
    expect(parseAmount(undefined)).toBeNull()
    expect(parseAmount('undisclosed')).toBeNull()
  })
})

describe('detectCurrency', () => {
  it('finds the most common symbol', () => {
    expect(detectCurrency(['£1', '£2', '$3'])).toBe('GBP')
    expect(detectCurrency(['$1', '$2'])).toBe('USD')
    expect(detectCurrency(['€1'])).toBe('EUR')
  })

  it('returns null without symbols', () => {
    expect(detectCurrency(['100', '200'])).toBeNull()
  })
})

describe('other parsers', () => {
  it('splits tags on semicolons', () => {
    expect(parseTags('A; B; C')).toEqual(['A', 'B', 'C'])
    expect(parseTags('A;; B ;')).toEqual(['A', 'B'])
    expect(parseTags('N/A')).toEqual([])
  })

  it('parses years', () => {
    expect(parseYear('2019')).toBe(2019)
    expect(parseYear('Founded 1998')).toBe(1998)
    expect(parseYear('3000')).toBeNull()
    expect(parseYear('N/A')).toBeNull()
  })

  it('keeps size bands and sorts them by lower bound', () => {
    expect(parseSize('10-24')).toBe('10-24')
    expect(parseSize('N/A')).toBeNull()
    expect(sizeSortKey('<5')).toBe(0)
    expect(sizeSortKey('10-24')).toBe(10)
    expect(sizeSortKey('250+')).toBe(250)
  })

  it('cleans websites', () => {
    expect(parseWebsite('https://nevis.com/')).toBe('https://nevis.com/')
    expect(parseWebsite('example.co.uk')).toBe('https://example.co.uk')
    expect(parseWebsite('not a url')).toBeNull()
  })
})

describe('normaliseRows', () => {
  it('normalises the fintech seed dataset', () => {
    const rows = normaliseRows(loadCsv('data/seed/fintech.csv'), fintechMapping)
    expect(rows).toHaveLength(100)
    expect(rows[0]).toMatchObject({ rank: 1, name: 'Nevis', amount: 30314247, location: 'London', stage: 'Seed' })
    expect(rows[0]!.tags).toContain('Application software')
    expect(rows.map(r => r.rank)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1))
  })

  it('drops rows without a name or amount', () => {
    const rows = normaliseRows(
      [
        { Company: 'A', Raised: '£1m' },
        { Company: '', Raised: '£2m' },
        { Company: 'C', Raised: 'N/A' },
      ],
      { Company: 'name', Raised: 'amount' },
    )
    expect(rows.map(r => r.name)).toEqual(['A'])
  })

  it('computes ranks by amount when there is no rank column', () => {
    const rows = normaliseRows(
      [
        { Company: 'Small', Raised: '£850k' },
        { Company: 'Big', Raised: '£1.2m' },
        { Company: 'Huge', Raised: '£3m' },
      ],
      { Company: 'name', Raised: 'amount' },
    )
    expect(rows.map(r => [r.rank, r.name])).toEqual([
      [1, 'Huge'],
      [2, 'Big'],
      [3, 'Small'],
    ])
  })
})
