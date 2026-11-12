import { describe, expect, it } from 'vitest'
import { industryFromFileName } from '../shared/utils/format'

describe('industryFromFileName', () => {
  it('strips dataset words from the file name', () => {
    expect(industryFromFileName('healthcare_companies_seed.csv')).toBe('Healthcare')
    expect(industryFromFileName('top-100-uk-fintech-2026.csv')).toBe('Fintech')
    expect(industryFromFileName('clean_energy_series_a_startups.CSV')).toBe('Clean Energy')
  })

  it('falls back to the original name when everything is stripped', () => {
    expect(industryFromFileName('companies.csv')).toBe('Companies')
  })

  it('keeps words that only contain a noise word', () => {
    expect(industryFromFileName('datacentre-operators.csv')).toBe('Datacentre Operators')
  })
})
