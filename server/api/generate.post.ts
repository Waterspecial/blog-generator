import { z } from 'zod'
import { STANDARD_FIELDS } from '#shared/fields'

const MappingSchema = z.record(z.string(), z.enum(STANDARD_FIELDS))

function parseJson(text: string): unknown {
  try { return JSON.parse(text) }
  catch { return null }
}

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  const part = (name: string) => form?.find(item => item.name === name)

  const file = part('file')
  const industry = part('industry')?.data.toString().trim()
  const mapping = MappingSchema.safeParse(parseJson(part('mapping')?.data.toString() ?? ''))

  if (!file?.filename?.toLowerCase().endsWith('.csv')) throw createError({ statusCode: 400, statusMessage: 'Please upload a .csv file' })
  if (file.data.length > 2 * 1024 * 1024) throw createError({ statusCode: 400, statusMessage: 'The file must be under 2 MB' })
  if (!industry) throw createError({ statusCode: 400, statusMessage: 'Please enter an industry name' })
  if (!mapping.success) throw createError({ statusCode: 400, statusMessage: 'The column mapping is invalid' })

  const base = slugify(industry)
  let slug = base
  for (let n = 2; await blogExists(slug); n++) slug = `${base}-${n}`

  const csv = file.data.toString('utf8')
  try {
    const blog = await buildBlogDocument({ csv, fileName: file.filename, industry, slug, mapping: mapping.data }, useRuntimeConfig(event))
    await saveBlog(blog)
    await useStorage('blogs').setItemRaw(`${slug}.csv`, csv)
    return { slug, url: `/blog/${slug}`, contentSource: blog.contentSource }
  }
  catch (error) {
    throw createError({ statusCode: 400, statusMessage: error instanceof Error ? error.message : 'Could not build the blog' })
  }
})
