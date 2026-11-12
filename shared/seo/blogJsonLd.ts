import type { BlogDocument } from '../schemas'
import type { SiteInfo } from '../types'

export function buildBlogJsonLd(blog: BlogDocument, site: SiteInfo, pageUrl: string) {
  const { content } = blog
  const organisation = { '@type': 'Organization', 'name': site.name, 'url': site.url }

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': content.title,
      'description': content.metaDescription,
      'datePublished': blog.createdAt,
      'dateModified': blog.createdAt,
      'author': organisation,
      'publisher': organisation,
      'mainEntityOfPage': pageUrl,
      'keywords': content.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': content.h1,
      'numberOfItems': blog.rows.length,
      'itemListElement': blog.rows.map(row => ({
        '@type': 'ListItem',
        'position': row.rank,
        'name': row.name,
        ...(row.website ? { url: row.website } : {}),
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': content.faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${site.url}/` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${site.url}/blog` },
        { '@type': 'ListItem', 'position': 3, 'name': content.title, 'item': pageUrl },
      ],
    },
  ]
}
