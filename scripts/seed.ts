import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { buildBlogDocument } from '../server/utils/buildBlog'

if (existsSync('.env')) process.loadEnvFile('.env')

const blog = await buildBlogDocument({
  csv: readFileSync('data/seed/fintech.csv', 'utf8'),
  fileName: 'fintech.csv',
  industry: 'Fintech',
}, {
  llmProvider: process.env.NUXT_LLM_PROVIDER ?? 'gemini',
  geminiApiKey: process.env.NUXT_GEMINI_API_KEY ?? '',
  geminiModel: process.env.NUXT_GEMINI_MODEL ?? 'gemini-3.5-flash',
  ollamaUrl: process.env.NUXT_OLLAMA_URL ?? 'http://localhost:11434',
  ollamaModel: process.env.NUXT_OLLAMA_MODEL ?? 'llama3.1',
})

mkdirSync('data/blogs', { recursive: true })
writeFileSync(`data/blogs/${blog.slug}.json`, JSON.stringify(blog, null, 2))

console.log(`Saved /blog/${blog.slug}: ${blog.stats.companyCount} companies, content from ${blog.contentSource}`)
