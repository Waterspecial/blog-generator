import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createStorage } from 'unstorage'
import upstashDriver from 'unstorage/drivers/upstash'
import { BlogDocumentSchema } from '../shared/schemas'

if (existsSync('.env')) process.loadEnvFile('.env')

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.error('Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env first')
  process.exit(1)
}

const dir = 'data/blogs'
const storage = createStorage({ driver: upstashDriver({ url, token, base: 'blogs' }) })

for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
  const blog = BlogDocumentSchema.parse(JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')))
  await storage.setItem(file, blog)
  const csv = `${dir}/${blog.slug}.csv`
  if (existsSync(csv)) await storage.setItemRaw(`${blog.slug}.csv`, readFileSync(csv, 'utf8'))
  console.log(`Pushed /blog/${blog.slug}`)
}
