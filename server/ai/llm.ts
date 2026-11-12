import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { LLM_TIMEOUT_MS } from '../../shared/constants'
import { BlogContentSchema, type BlogContent } from '../../shared/schemas'
import type { CopyInput, LlmConfig } from '../types'
import { fallbackCopy } from './fallbackCopy'
import { buildPrompt } from './prompt'

const jsonSchema = z.toJSONSchema(BlogContentSchema)

async function callGemini(prompt: string, config: LlmConfig): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: config.geminiApiKey })
  const response = await ai.models.generateContent({
    model: config.geminiModel,
    contents: prompt,
    config: { responseMimeType: 'application/json', responseJsonSchema: jsonSchema, abortSignal: AbortSignal.timeout(LLM_TIMEOUT_MS) },
  })
  return response.text ?? ''
}

async function callOllama(prompt: string, config: LlmConfig): Promise<string> {
  const response = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.ollamaModel, messages: [{ role: 'user', content: prompt }], format: jsonSchema, stream: false }),
    signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Ollama returned ${response.status}`)
  const data = await response.json() as { message: { content: string } }
  return data.message.content
}

export async function generateCopy(input: CopyInput, config: LlmConfig): Promise<{ content: BlogContent, source: 'llm' | 'fallback' }> {
  const call = config.llmProvider === 'gemini' ? callGemini : config.llmProvider === 'ollama' ? callOllama : null
  if (call) {
    try {
      const result = BlogContentSchema.safeParse(JSON.parse(await call(buildPrompt(input), config)))
      if (result.success) return { content: result.data, source: 'llm' }
      console.warn('LLM copy failed validation, using fallback:', result.error.message)
    }
    catch (error) {
      console.warn('LLM copy failed, using fallback:', error)
    }
  }
  return { content: fallbackCopy(input), source: 'fallback' }
}
