import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { buildBlogDocument } from '../server/utils/buildBlog'

const blog = buildBlogDocument({
  csv: readFileSync('data/seed/fintech.csv', 'utf8'),
  fileName: 'fintech.csv',
  industry: 'Fintech',
})

mkdirSync('data/blogs', { recursive: true })
writeFileSync(`data/blogs/${blog.slug}.json`, JSON.stringify(blog, null, 2))

console.log(`Saved /blog/${blog.slug}: ${blog.stats.companyCount} companies, content from ${blog.contentSource}`)
