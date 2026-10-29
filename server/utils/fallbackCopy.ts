import type { Stats } from '../../shared/computeStats'
import { formatCurrency, formatPercent } from '../../shared/format'
import type { Currency, NormalisedRow } from '../../shared/normalise'
import type { BlogContent } from '../../shared/schemas'

export interface CopyInput {
  industry: string
  amountLabel: string
  currency: Currency | null
  stats: Stats
  rows: NormalisedRow[]
}

type Section = BlogContent['sections'][number]
type Faq = BlogContent['faqs'][number]

function fitLength(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`
}

function stageLabel(stats: Stats): string {
  const stage = stats.context.stage
  if (!stage) return ''
  return /^\w+$/.test(stage) ? `${stage.toLowerCase()}-stage ` : `${stage} `
}

function capitalise(text: string): string {
  return text.replace(/\b\w/g, letter => letter.toUpperCase())
}

function listCounts(counts: [string, number][], limit: number): string {
  return counts.slice(0, limit).map(([label, count]) => `${label} (${count})`).join(', ')
}

function headline(input: CopyInput) {
  const { industry, amountLabel, currency, stats } = input
  const n = stats.companyCount
  const stage = stageLabel(stats)
  const year = new Date().getFullYear()
  const money = (value: number) => formatCurrency(value, currency)

  const title = fitLength(`Top ${n} UK ${capitalise(stage)}${industry} Companies by ${amountLabel} (${year})`, 70)
  const h1 = `The Top ${n} UK ${capitalise(stage)}${industry} Companies by ${amountLabel}`

  const baseMeta = `Explore the top ${n} UK ${stage}${industry} companies ranked by ${amountLabel}. Together they account for ${money(stats.amount.total)}, led by ${stats.amount.max.name}.`
  const metaDescription = fitLength(baseMeta.length >= 120 ? baseMeta : `${baseMeta} See the full ranking and key insights.`, 170)

  const where = stats.location ? ` ${formatPercent(stats.location.topShare)} of them are based in ${stats.location.topName}.` : ''
  const intro = [
    `This ranking lists the top ${n} UK ${stage}${industry} companies by ${amountLabel}. Combined, they account for ${money(stats.amount.total)}, with a median of ${money(stats.amount.median)} per company.`,
    `${stats.amount.max.name} leads the list with ${money(stats.amount.max.value)}, and the top 10 companies hold ${formatPercent(stats.amount.top10Share)} of the total.${where}`,
  ].join('\n\n')

  return { title, h1, metaDescription, intro }
}

function sections(input: CopyInput): Section[] {
  const { industry, amountLabel, currency, stats } = input
  const money = (value: number) => formatCurrency(value, currency)
  const result: Section[] = [{
    heading: `${amountLabel} across UK ${industry} companies`,
    body: `The ${stats.companyCount} companies account for ${money(stats.amount.total)} in total. The median is ${money(stats.amount.median)} and the mean is ${money(stats.amount.mean)}. ${stats.amount.max.name} has the highest figure at ${money(stats.amount.max.value)}, while the lowest in the list is ${money(stats.amount.min.value)}.`,
    statKey: 'amount',
  }]

  if (stats.location) {
    const [second, secondCount] = stats.location.counts[1] ?? ['', 0]
    result.push({
      heading: `Where UK ${industry} companies are based`,
      body: `${stats.location.topName} is home to ${formatPercent(stats.location.topShare)} of the companies in this ranking. ${stats.location.outsideTopCount} companies are based elsewhere${second ? `, with ${second} next (${secondCount})` : ''}.`,
      statKey: 'location',
    })
  }

  if (stats.size) {
    result.push({
      heading: `How big are UK ${industry} companies?`,
      body: `The most common team size is ${stats.size.mostCommon} employees, covering ${formatPercent(stats.size.mostCommonShare)} of companies with a known headcount. The full breakdown is ${listCounts(stats.size.distribution, 8)}.`,
      statKey: 'size',
    })
  }

  if (stats.stage) {
    result.push({
      heading: `Funding stages of UK ${industry} companies`,
      body: `The companies in this ranking are spread across several stages: ${listCounts(stats.stage.counts, 6)}.`,
      statKey: 'stage',
    })
  }

  if (stats.founded) {
    result.push({
      heading: `When UK ${industry} companies were founded`,
      body: `The median founding year is ${stats.founded.medianYear}. The oldest company is ${stats.founded.oldest.name} (${stats.founded.oldest.value}) and the newest is ${stats.founded.newest.name} (${stats.founded.newest.value}).`,
      statKey: 'founded',
    })
  }

  if (stats.tags) {
    result.push({
      heading: `The most common sectors among UK ${industry} companies`,
      body: `The most frequent sectors in this ranking are ${listCounts(stats.tags.top, 3)}. Companies often appear in more than one sector.`,
      statKey: 'tags',
    })
  }

  if (result.length < 3) {
    const top3 = input.rows.slice(0, 3).map(row => row.name).join(', ')
    result.push({
      heading: `The leading UK ${industry} companies`,
      body: `The top three companies in this ranking are ${top3}. Together, the top 10 account for ${formatPercent(stats.amount.top10Share)} of the total ${amountLabel}.`,
      statKey: null,
    })
  }

  if (result.length < 3) {
    result.push({
      heading: 'How this ranking was compiled',
      body: `Companies are ranked by ${amountLabel}, using the figures in the source dataset. All numbers on this page are calculated directly from that data.`,
      statKey: null,
    })
  }

  return result.slice(0, 5)
}

function faqs(input: CopyInput): Faq[] {
  const { industry, amountLabel, currency, stats, rows } = input
  const money = (value: number) => formatCurrency(value, currency)
  const top3 = rows.slice(0, 3).map(row => `${row.name} (${money(row.amount)})`).join(', ')

  const result: Faq[] = [
    {
      question: `What are the top UK ${industry} companies by ${amountLabel}?`,
      answer: `The top three are ${top3}.`,
    },
    {
      question: `What is the total ${amountLabel} of these UK ${industry} companies?`,
      answer: `The ${stats.companyCount} companies account for ${money(stats.amount.total)} in total, with a median of ${money(stats.amount.median)} per company.`,
    },
  ]

  if (stats.location) {
    result.push({
      question: `Where are most UK ${industry} companies based?`,
      answer: `${formatPercent(stats.location.topShare)} of the companies in this ranking are based in ${stats.location.topName}.`,
    })
  }

  if (stats.size) {
    result.push({
      question: `How many employees do UK ${industry} companies have?`,
      answer: `The most common team size is ${stats.size.mostCommon} employees (${formatPercent(stats.size.mostCommonShare)} of companies with a known headcount).`,
    })
  }

  result.push({
    question: 'How was this ranking compiled?',
    answer: `Companies are ranked by ${amountLabel} using the source dataset of ${stats.companyCount} companies. Every figure is calculated directly from that data.`,
  })

  return result.slice(0, 5)
}

function keywords(input: CopyInput): string[] {
  const industry = input.industry.toLowerCase()
  const stage = stageLabel(input.stats).trim()
  const list = [
    `UK ${industry} companies`,
    `top ${industry} companies UK`,
    `${industry} companies by ${input.amountLabel.toLowerCase()}`,
    `largest UK ${industry} companies`,
    stage ? `${stage} ${industry} companies` : `${industry} startups UK`,
    ...(input.stats.tags?.top.slice(0, 2).map(([tag]) => `${tag.toLowerCase()} ${industry}`) ?? []),
  ]
  return [...new Set(list)].slice(0, 8)
}

export function fallbackCopy(input: CopyInput): BlogContent {
  return {
    ...headline(input),
    sections: sections(input),
    tableIntro: `The table below ranks all ${input.stats.companyCount} UK ${stageLabel(input.stats)}${input.industry} companies by ${input.amountLabel}.`,
    faqs: faqs(input),
    keywords: keywords(input),
  }
}
