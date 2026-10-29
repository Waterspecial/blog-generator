import type { Currency } from './normalise'

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
