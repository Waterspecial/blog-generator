import type { ColumnMapping, Currency, NormalisedRow, Stats } from '../shared/types'

export interface BuildBlogInput {
  csv: string
  fileName: string
  industry: string
  slug?: string
  mapping?: ColumnMapping
}

export interface LlmConfig {
  llmProvider: string
  geminiApiKey: string
  geminiModel: string
  ollamaUrl: string
  ollamaModel: string
}

export interface CopyInput {
  industry: string
  amountLabel: string
  currency: Currency | null
  stats: Stats
  rows: NormalisedRow[]
}
