import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateCopy } from '../server/ai/llm'
import { fallbackCopy } from '../server/ai/fallbackCopy'
import { computeStats } from '../shared/dataset/computeStats'
import { normaliseRows } from '../shared/dataset/normalise'
import type { CopyInput, LlmConfig } from '../server/types'

const rows = normaliseRows([{ Company: 'Acme', Revenue: '1000' }, { Company: 'Beta', Revenue: '500' }], { Company: 'name', Revenue: 'amount' })
const input: CopyInput = { industry: 'AI', amountLabel: 'Revenue', currency: 'GBP', stats: computeStats(rows), rows }
const ollama: LlmConfig = { llmProvider: 'ollama', geminiApiKey: '', geminiModel: '', ollamaUrl: 'http://ollama.test', ollamaModel: 'test' }
const validContent = { ...fallbackCopy(input), title: 'The Top 2 UK AI Companies by Revenue in 2026' }

function replyWith(content: string, ok = true) {
  const fetch = vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => ({ message: { content } }) })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generateCopy', () => {
  it('uses the LLM copy when it passes the schema', async () => {
    replyWith(JSON.stringify(validContent))
    const result = await generateCopy(input, ollama)
    expect(result.source).toBe('llm')
    expect(result.content.title).toBe(validContent.title)
  })

  it('falls back when the reply is not JSON', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    replyWith('not json')
    expect((await generateCopy(input, ollama)).source).toBe('fallback')
  })

  it('falls back when the reply fails the schema', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    replyWith(JSON.stringify({ ...validContent, title: 'Too short' }))
    expect((await generateCopy(input, ollama)).source).toBe('fallback')
  })

  it('falls back when the provider returns an error', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    replyWith('', false)
    expect((await generateCopy(input, ollama)).source).toBe('fallback')
  })

  it('does not call any provider when it is set to none', async () => {
    const fetch = replyWith(JSON.stringify(validContent))
    const result = await generateCopy(input, { ...ollama, llmProvider: 'none' })
    expect(fetch).not.toHaveBeenCalled()
    expect(result).toEqual({ content: fallbackCopy(input), source: 'fallback' })
  })
})
