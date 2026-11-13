import { createHash, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

const digest = (value: string) => createHash('sha256').update(value).digest()

export function checkUploadToken(event: H3Event) {
  const expected = useRuntimeConfig(event).uploadToken
  if (!expected) {
    if (import.meta.dev) return
    throw createError({ statusCode: 503, statusMessage: 'Uploads are disabled until NUXT_UPLOAD_TOKEN is set' })
  }
  const given = getHeader(event, 'x-upload-token') ?? ''
  if (!timingSafeEqual(digest(given), digest(expected))) {
    throw createError({ statusCode: 401, statusMessage: 'The upload token is wrong' })
  }
}
