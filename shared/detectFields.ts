import { FIELD_DEFINITIONS, REQUIRED_FIELDS, STANDARD_FIELDS, type ColumnMapping, type StandardField } from './fields'
import { isEmptyValue, parseAmount, type RawRow } from './normalise'

export function normaliseHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9#]+/g, ' ')
    .trim()
}

function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `)
}

function headerScore(header: string, field: StandardField): number {
  const text = normaliseHeader(header)
  let best = 0
  for (const synonym of FIELD_DEFINITIONS[field].synonyms) {
    if (text === synonym) best = Math.max(best, 1000 + synonym.length)
    else if (containsPhrase(text, synonym)) best = Math.max(best, synonym.length)
  }
  return best
}

function columnValues(header: string, sampleRows: RawRow[]): string[] {
  return sampleRows
    .map(row => row[header])
    .filter((value): value is string => !isEmptyValue(value))
    .map(value => value.trim())
}

function mostly(values: string[], test: (value: string) => boolean): boolean {
  return values.length > 0 && values.filter(test).length / values.length > 0.5
}

const SIZE_BAND = /^(<\s*\d[\d,]*|\d[\d,]*\s*[-–]\s*\d[\d,]*|\d[\d,]*\s*\+)$/

function guessFromValues(values: string[]): StandardField[] {
  if (values.length === 0) return []
  const currentYear = new Date().getFullYear()
  const guesses: StandardField[] = []

  if (mostly(values, v => /^https?:\/\//i.test(v))) guesses.push('website')
  if (mostly(values, v => /[£$€]/.test(v) && parseAmount(v) !== null)) guesses.push('amount')
  if (values.some(v => v.includes('; '))) guesses.push('tags')
  if (values.reduce((sum, v) => sum + v.length, 0) / values.length > 50) guesses.push('description')
  if (mostly(values, v => /^\d{4}$/.test(v) && Number(v) >= 1800 && Number(v) <= currentYear)) guesses.push('founded')
  if (mostly(values, v => SIZE_BAND.test(v))) guesses.push('size')
  if (mostly(values, v => (parseAmount(v) ?? 0) > 1000)) guesses.push('amount')

  return guesses
}

export function detectFields(headers: string[], sampleRows: RawRow[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const usedFields = new Set<StandardField>()

  const candidates: { header: string, field: StandardField, score: number }[] = []
  for (const header of headers) {
    for (const field of STANDARD_FIELDS) {
      const score = headerScore(header, field)
      if (score > 0) candidates.push({ header, field, score })
    }
  }
  candidates.sort((a, b) => b.score - a.score)

  for (const { header, field } of candidates) {
    if (mapping[header] || usedFields.has(field)) continue
    mapping[header] = field
    usedFields.add(field)
  }

  for (const header of headers) {
    if (mapping[header]) continue
    const field = guessFromValues(columnValues(header, sampleRows)).find(f => !usedFields.has(f))
    if (!field) continue
    mapping[header] = field
    usedFields.add(field)
  }

  return mapping
}

export function missingRequiredFields(mapping: ColumnMapping): StandardField[] {
  const mapped = new Set(Object.values(mapping))
  return REQUIRED_FIELDS.filter(field => !mapped.has(field))
}
