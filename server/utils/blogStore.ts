import { BlogDocumentSchema, type BlogDocument } from '#shared/schemas'

export interface BlogSummary {
  slug: string
  industry: string
  title: string
  metaDescription: string
  createdAt: string
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

function storage() {
  return useStorage('blogs')
}

export async function saveBlog(blog: BlogDocument): Promise<void> {
  await storage().setItem(`${blog.slug}.json`, blog)
}

export async function getBlog(slug: string): Promise<BlogDocument | null> {
  if (!SLUG_PATTERN.test(slug)) return null
  const raw = await storage().getItem(`${slug}.json`)
  if (!raw) return null
  const result = BlogDocumentSchema.safeParse(raw)
  if (!result.success) {
    console.error(`Blog "${slug}" failed validation`, result.error.issues)
    return null
  }
  return result.data
}

export async function blogExists(slug: string): Promise<boolean> {
  return SLUG_PATTERN.test(slug) && storage().hasItem(`${slug}.json`)
}

export async function listBlogs(): Promise<BlogSummary[]> {
  const keys = (await storage().getKeys()).filter(key => key.endsWith('.json'))
  const blogs = await Promise.all(keys.map(key => getBlog(key.replace(/\.json$/, ''))))
  return blogs
    .filter((blog): blog is BlogDocument => blog !== null)
    .map(blog => ({
      slug: blog.slug,
      industry: blog.industry,
      title: blog.content.title,
      metaDescription: blog.content.metaDescription,
      createdAt: blog.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
