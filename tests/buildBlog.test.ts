import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildBlogDocument, slugify } from '../server/services/buildBlog'
import { BlogDocumentSchema } from '../shared/schemas'
import type { LlmConfig } from '../server/types'

const noLlm: LlmConfig = { llmProvider: 'none', geminiApiKey: '', geminiModel: '', ollamaUrl: '', ollamaModel: '' }
const fintechCsv = readFileSync('data/seed/fintech.csv', 'utf8')

describe('buildBlogDocument', () => {
  it('builds a valid document from the fintech seed', async () => {
    const blog = await buildBlogDocument({ csv: fintechCsv, fileName: 'fintech.csv', industry: 'Fintech' }, noLlm)
    expect(BlogDocumentSchema.safeParse(blog).success).toBe(true)
    expect(blog.slug).toBe('fintech')
    expect(blog.stats.companyCount).toBe(100)
    expect(blog.contentSource).toBe('fallback')
  })

  it('only lists fields that have data', async () => {
    const csv = 'Company,Revenue,Region\nAcme,"£1,000",\nBeta,£500,\n'
    const blog = await buildBlogDocument({ csv, fileName: 'ai.csv', industry: 'AI' }, noLlm)
    expect(blog.fieldsPresent).toEqual(['name', 'amount', 'rank'])
  })

  it('builds valid fallback copy from only a name and an amount', async () => {
    const csv = 'Company,Revenue\nAcme,1000\n'
    const blog = await buildBlogDocument({ csv, fileName: 'ai.csv', industry: 'AI' }, noLlm)
    expect(blog.content.sections.length).toBeGreaterThanOrEqual(3)
    expect(blog.content.faqs.length).toBeGreaterThanOrEqual(3)
  })

  it('uses the given slug and mapping', async () => {
    const csv = 'Org,Money\nAcme,1000\nBeta,500\n'
    const blog = await buildBlogDocument({ csv, fileName: 'x.csv', industry: 'AI', slug: 'ai-2', mapping: { Org: 'name', Money: 'amount' } }, noLlm)
    expect(blog.slug).toBe('ai-2')
    expect(blog.rows.map(row => row.name)).toEqual(['Acme', 'Beta'])
  })

  it('throws when a required column is missing', async () => {
    const csv = 'Company,Region\nAcme,London\n'
    await expect(buildBlogDocument({ csv, fileName: 'x.csv', industry: 'AI' }, noLlm)).rejects.toThrow('Missing required columns: amount')
  })

  it('throws when no row has both a name and an amount', async () => {
    const csv = 'Company,Revenue\nAcme,\n,500\n'
    await expect(buildBlogDocument({ csv, fileName: 'x.csv', industry: 'AI' }, noLlm)).rejects.toThrow('No rows have both a name and an amount')
  })
})

describe('slugify', () => {
  it('lowercases, strips accents and joins words with hyphens', () => {
    expect(slugify('Clean Tech & Énergie')).toBe('clean-tech-energie')
  })

  it('falls back to "blog" when nothing is left', () => {
    expect(slugify('!!!')).toBe('blog')
  })
})
