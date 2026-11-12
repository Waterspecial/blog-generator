export const STANDARD_FIELDS = [
  'name',
  'amount',
  'rank',
  'location',
  'size',
  'stage',
  'founded',
  'tags',
  'description',
  'website',
] as const

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const LLM_TIMEOUT_MS = 60_000

export const TOP_TAG_LIMIT = 8

export const TAG_EXCLUDE_SHARE = 0.9
