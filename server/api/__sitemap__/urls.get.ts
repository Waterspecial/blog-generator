import { listBlogs } from '../../services/blogStore'

export default defineSitemapEventHandler(async () => {
  const blogs = await listBlogs()
  return blogs.map(blog => ({ loc: `/blog/${blog.slug}`, lastmod: blog.createdAt }))
})
