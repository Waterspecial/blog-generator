import { describe, expect, it } from 'vitest'
import { detectFields, missingRequiredFields } from '../shared/detectFields'

describe('detectFields', () => {
  it('maps the fintech headers by name', () => {
    const headers = ['Rank', 'Company', 'Region', 'Stage', 'Employees', 'Total Raised', 'Description', 'Website', 'Industries']
    expect(detectFields(headers, [])).toEqual({
      'Rank': 'rank',
      'Company': 'name',
      'Region': 'location',
      'Stage': 'stage',
      'Employees': 'size',
      'Total Raised': 'amount',
      'Description': 'description',
      'Website': 'website',
      'Industries': 'tags',
    })
  })

  it('maps different header names using synonyms', () => {
    const headers = ['Organisation', 'HQ', 'Funding to date', 'Headcount', 'Sectors', 'Founded']
    expect(detectFields(headers, [])).toEqual({
      'Organisation': 'name',
      'HQ': 'location',
      'Funding to date': 'amount',
      'Headcount': 'size',
      'Sectors': 'tags',
      'Founded': 'founded',
    })
  })

  it('guesses from values when headers give no clue', () => {
    const headers = ['A', 'B', 'C', 'D', 'E']
    const rows = [
      { A: 'Acme Ltd', B: '£1,200,000', C: 'https://acme.com', D: 'Health; AI', E: '2015' },
      { A: 'Beta plc', B: '£850,000', C: 'https://beta.io', D: 'Data; Health', E: '2019' },
      { A: 'Gamma', B: '£2,000,000', C: 'https://gamma.co.uk', D: 'AI', E: '2021' },
    ]
    expect(detectFields(headers, rows)).toEqual({
      B: 'amount',
      C: 'website',
      D: 'tags',
      E: 'founded',
    })
  })

  it('assigns each field to one column at most', () => {
    const mapping = detectFields(['Company', 'Company Name', 'Funding', 'Total Funding'], [])
    expect(Object.values(mapping).filter(f => f === 'name')).toHaveLength(1)
    expect(Object.values(mapping).filter(f => f === 'amount')).toHaveLength(1)
    expect(mapping['Company Name']).toBe('name')
    expect(mapping['Total Funding']).toBe('amount')
  })

  it('reports missing required fields', () => {
    expect(missingRequiredFields({ Company: 'name', Raised: 'amount' })).toEqual([])
    expect(missingRequiredFields({ Company: 'name' })).toEqual(['amount'])
    expect(missingRequiredFields({})).toEqual(['name', 'amount'])
  })
})
