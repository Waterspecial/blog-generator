import { sizeSortKey, type NormalisedRow } from './normalise'

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

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

function countBy(values: string[]): Count[] {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
}

function amountStats(rows: NormalisedRow[]): Stats['amount'] {
  const byAmount = [...rows].sort((a, b) => b.amount - a.amount)
  const amounts = byAmount.map(row => row.amount)
  const total = amounts.reduce((sum, value) => sum + value, 0)
  const top10 = amounts.slice(0, 10).reduce((sum, value) => sum + value, 0)
  const biggest = byAmount[0]!
  const smallest = byAmount[byAmount.length - 1]!

  return {
    total,
    median: median(amounts),
    mean: total / amounts.length,
    min: { name: smallest.name, value: smallest.amount },
    max: { name: biggest.name, value: biggest.amount },
    top10Share: total > 0 ? top10 / total : 0,
  }
}

function knownValues(rows: NormalisedRow[], field: 'location' | 'size' | 'stage'): string[] {
  return rows.map(row => row[field]).filter((value): value is string => value !== null)
}

function locationStats(values: string[]): Stats['location'] {
  const counts = countBy(values)
  const [topName, topCount] = counts[0]!
  return {
    counts,
    topName,
    topShare: topCount / values.length,
    outsideTopCount: values.length - topCount,
  }
}

function sizeStats(values: string[]): Stats['size'] {
  const counts = countBy(values)
  const [mostCommon, mostCommonCount] = counts[0]!
  return {
    distribution: [...counts].sort((a, b) => sizeSortKey(a[0]) - sizeSortKey(b[0])),
    mostCommon,
    mostCommonShare: mostCommonCount / values.length,
  }
}

function foundedStats(rows: NormalisedRow[]): Stats['founded'] {
  const dated = rows.filter((row): row is NormalisedRow & { founded: number } => row.founded !== null)
  if (dated.length === 0) return undefined
  const byYear = [...dated].sort((a, b) => a.founded - b.founded)
  const oldest = byYear[0]!
  const newest = byYear[byYear.length - 1]!
  const decades = countBy(dated.map(row => `${Math.floor(row.founded / 10) * 10}s`))

  return {
    medianYear: Math.round(median(dated.map(row => row.founded))),
    oldest: { name: oldest.name, value: oldest.founded },
    newest: { name: newest.name, value: newest.founded },
    byDecade: decades.sort((a, b) => a[0].localeCompare(b[0])),
  }
}

const TAG_EXCLUDE_SHARE = 0.9
const TOP_TAG_LIMIT = 8

function tagStats(rows: NormalisedRow[]): Stats['tags'] {
  const counts = countBy(rows.flatMap(row => [...new Set(row.tags)]))
  const top = counts
    .filter(([, count]) => count / rows.length <= TAG_EXCLUDE_SHARE)
    .slice(0, TOP_TAG_LIMIT)
  return top.length > 0 ? { top } : undefined
}

export function computeStats(rows: NormalisedRow[]): Stats {
  if (rows.length === 0) throw new Error('Cannot compute stats for an empty dataset')

  const stats: Stats = {
    companyCount: rows.length,
    context: {},
    amount: amountStats(rows),
  }

  const locations = knownValues(rows, 'location')
  if (new Set(locations).size === 1) stats.context.location = locations[0]
  else if (locations.length > 0) stats.location = locationStats(locations)

  const sizes = knownValues(rows, 'size')
  if (new Set(sizes).size === 1) stats.context.size = sizes[0]
  else if (sizes.length > 0) stats.size = sizeStats(sizes)

  const stages = knownValues(rows, 'stage')
  if (new Set(stages).size === 1) stats.context.stage = stages[0]
  else if (stages.length > 0) stats.stage = { counts: countBy(stages) }

  const founded = foundedStats(rows)
  if (founded) stats.founded = founded

  const tags = tagStats(rows)
  if (tags) stats.tags = tags

  return stats
}
