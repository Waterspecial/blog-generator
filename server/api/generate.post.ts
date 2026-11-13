import { z } from 'zod'
import { MAX_UPLOAD_BYTES, STANDARD_FIELDS } from '#shared/constants'
import { blogExists, saveBlog } from '../services/blogStore'
import { buildBlogDocument, slugify } from '../services/buildBlog'

const MappingSchema = z.record(z.string(), z.enum(STANDARD_FIELDS))

function parseJson(text: string): unknown {
  try { return JSON.parse(text) }
  catch { return null }
}

export default defineEventHandler(async (event) => {
  checkUploadToken(event)
  const form = await readMultipartFormData(event)
  const part = (name: string) => form?.find(item => item.name === name)

  const file = part('file')
  const industry = part('industry')?.data.toString().trim()
  const mappingText = part('mapping')?.data.toString()
  const mapping = MappingSchema.optional().safeParse(mappingText === undefined ? undefined : parseJson(mappingText))

  if (!file?.filename?.toLowerCase().endsWith('.csv')) throw createError({ statusCode: 400, statusMessage: 'Please upload a .csv file' })
  if (file.data.length > MAX_UPLOAD_BYTES) throw createError({ statusCode: 400, statusMessage: `The file must be under ${MAX_UPLOAD_BYTES / 1024 / 1024} MB` })
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
