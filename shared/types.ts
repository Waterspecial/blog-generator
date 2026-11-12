import type { STANDARD_FIELDS } from './constants'

export type StandardField = (typeof STANDARD_FIELDS)[number]

export type ColumnMapping = Record<string, StandardField>

export interface FieldDefinition {
  label: string
  required: boolean
  synonyms: string[]
}

export type Currency = 'GBP' | 'USD' | 'EUR'

export type RawRow = Record<string, string | undefined>

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

export type Count = [string, number]

export interface NamedValue {
  name: string
  value: number
}

export interface Stats {
  companyCount: number
  context: { location?: string, size?: string, stage?: string }
  amount: {
    total: number
    median: number
    mean: number
    min: NamedValue
    max: NamedValue
    top10Share: number
  }
  location?: { counts: Count[], topName: string, topShare: number, outsideTopCount: number }
  size?: { distribution: Count[], mostCommon: string, mostCommonShare: number }
  stage?: { counts: Count[] }
  founded?: { medianYear: number, oldest: NamedValue, newest: NamedValue, byDecade: Count[] }
  tags?: { top: Count[] }
}

export interface BlogSummary {
  slug: string
  industry: string
  title: string
  metaDescription: string
  createdAt: string
  companyCount: number
  amountTotal: number
  amountLabel: string
  currency: Currency | null
  topCompany: string
}

export interface SiteInfo {
  name: string
  url: string
}
