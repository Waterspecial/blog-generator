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

export type StandardField = (typeof STANDARD_FIELDS)[number]

export type ColumnMapping = Record<string, StandardField>

export const REQUIRED_FIELDS: StandardField[] = ['name', 'amount']

export interface FieldDefinition {
  label: string
  required: boolean
  synonyms: string[]
}

export const FIELD_DEFINITIONS: Record<StandardField, FieldDefinition> = {
  name: {
    label: 'Company name',
    required: true,
    synonyms: ['company', 'company name', 'organisation', 'organization', 'business', 'name'],
  },
  amount: {
    label: 'Amount (ranking metric)',
    required: true,
    synonyms: ['total raised', 'total funding', 'funding', 'amount raised', 'raised', 'investment', 'revenue', 'valuation', 'funding to date'],
  },
  rank: {
    label: 'Rank',
    required: false,
    synonyms: ['rank', 'position', '#'],
  },
  location: {
    label: 'Location',
    required: false,
    synonyms: ['region', 'location', 'city', 'hq', 'headquarters', 'country', 'area'],
  },
  size: {
    label: 'Company size',
    required: false,
    synonyms: ['employees', 'headcount', 'staff', 'team size', 'company size'],
  },
  stage: {
    label: 'Stage',
    required: false,
    synonyms: ['stage', 'funding stage', 'round'],
  },
  founded: {
    label: 'Year founded',
    required: false,
    synonyms: ['founded', 'year founded', 'founded year', 'incorporation year'],
  },
  tags: {
    label: 'Tags / sectors',
    required: false,
    synonyms: ['industries', 'industry', 'sectors', 'sector', 'categories', 'tags', 'verticals'],
  },
  description: {
    label: 'Description',
    required: false,
    synonyms: ['description', 'about', 'summary', 'overview'],
  },
  website: {
    label: 'Website',
    required: false,
    synonyms: ['website', 'url', 'site', 'web'],
  },
}
