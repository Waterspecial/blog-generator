import type { Currency } from '../types'

const SYMBOLS: Record<Currency, string> = { GBP: '£', USD: '$', EUR: '€' }

function oneDecimal(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '')
}

export function formatCurrency(value: number, currency: Currency | null): string {
  const symbol = currency ? SYMBOLS[currency] : ''
  const abs = Math.abs(value)
  if (abs >= 999_950_000) return `${symbol}${oneDecimal(value / 1_000_000_000)}bn`
  if (abs >= 999_500) return `${symbol}${oneDecimal(value / 1_000_000)}m`
  if (abs >= 1_000) return `${symbol}${Math.round(value / 1_000)}k`
  return `${symbol}${Math.round(value)}`
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`
}

const FILE_NAME_NOISE = /\b(top|\d+|uk|companies|company|startups?|seed|series [a-z]|stage|list|ranking|dataset|data|final|copy)\b/gi

export function industryFromFileName(fileName: string): string {
  const base = fileName.replace(/\.csv$/i, '').replace(/[-_]+/g, ' ')
  const cleaned = base.replace(FILE_NAME_NOISE, ' ').replace(/\s+/g, ' ').trim()
  return (cleaned || base).replace(/\b\w/g, c => c.toUpperCase())
}
