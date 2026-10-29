import { z } from 'zod'
import { STANDARD_FIELDS } from './fields'
import type { Stats } from './computeStats'
import type { NormalisedRow } from './normalise'

export const STAT_KEYS = ['amount', 'location', 'size', 'stage', 'founded', 'tags'] as const

export const BlogContentSchema = z.object({
  title: z.string().min(30).max(70),
  metaDescription: z.string().min(120).max(170),
  h1: z.string().min(10),
  intro: z.string().min(50),
  sections: z.array(z.object({
    heading: z.string().min(5),
    body: z.string().min(50),
    statKey: z.enum(STAT_KEYS).nullable(),
  })).min(3).max(5),
  tableIntro: z.string().min(10),
  faqs: z.array(z.object({
    question: z.string().min(10),
    answer: z.string().min(20),
  })).min(3).max(5),
  keywords: z.array(z.string().min(2)).min(5).max(8),
})

export type BlogContent = z.infer<typeof BlogContentSchema>

const CountSchema = z.tuple([z.string(), z.number()])
const NamedValueSchema = z.object({ name: z.string(), value: z.number() })

export const StatsSchema: z.ZodType<Stats> = z.object({
  companyCount: z.number().int().positive(),
  context: z.object({
    location: z.string().optional(),
    size: z.string().optional(),
    stage: z.string().optional(),
  }),
  amount: z.object({
    total: z.number(),
    median: z.number(),
    mean: z.number(),
    min: NamedValueSchema,
    max: NamedValueSchema,
    top10Share: z.number(),
  }),
  location: z.object({ counts: z.array(CountSchema), topName: z.string(), topShare: z.number(), outsideTopCount: z.number() }).optional(),
  size: z.object({ distribution: z.array(CountSchema), mostCommon: z.string(), mostCommonShare: z.number() }).optional(),
  stage: z.object({ counts: z.array(CountSchema) }).optional(),
  founded: z.object({ medianYear: z.number(), oldest: NamedValueSchema, newest: NamedValueSchema, byDecade: z.array(CountSchema) }).optional(),
  tags: z.object({ top: z.array(CountSchema) }).optional(),
})

export const RowSchema: z.ZodType<NormalisedRow> = z.object({
  rank: z.number().int().positive(),
  name: z.string(),
  amount: z.number(),
  location: z.string().nullable(),
  size: z.string().nullable(),
  stage: z.string().nullable(),
  founded: z.number().int().nullable(),
  tags: z.array(z.string()),
  description: z.string().nullable(),
  website: z.string().nullable(),
})

export const BlogDocumentSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  industry: z.string().min(1),
  createdAt: z.iso.datetime(),
  source: z.object({
    fileName: z.string(),
    rowCount: z.number().int().nonnegative(),
  }),
  mapping: z.record(z.string(), z.enum(STANDARD_FIELDS)),
  fieldsPresent: z.array(z.enum(STANDARD_FIELDS)),
  amountLabel: z.string(),
  currency: z.enum(['GBP', 'USD', 'EUR']).nullable(),
  stats: StatsSchema,
  content: BlogContentSchema,
  contentSource: z.enum(['llm', 'fallback']),
  rows: z.array(RowSchema).min(1),
})

export type BlogDocument = z.infer<typeof BlogDocumentSchema>
