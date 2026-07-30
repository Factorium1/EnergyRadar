import { filterByBrand, isKnownBrand, matchBrand } from './brands.js'

describe('isKnownBrand', () => {
  it('finds a known brand at the start of the title', () => {
    expect(isKnownBrand('Red Bull Energy Drink 250ml')).toBe(true)
  })

  it('finds a known brand anywhere in the title', () => {
    expect(isKnownBrand('Energy Drink Monster 500ml')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isKnownBrand('red bull energy drink')).toBe(true)
  })

  it('ignores extra whitespace between words', () => {
    expect(isKnownBrand('Flying   Power  Energy Drink')).toBe(true)
  })

  it('returns false for an unknown brand', () => {
    expect(isKnownBrand('No Name Energy Drink')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isKnownBrand('')).toBe(false)
  })
})

describe('matchBrand', () => {
  it('returns the matched brand name', () => {
    expect(matchBrand('Monster Energy Drink 500ml')).toBe('Monster')
  })

  it('returns the first matching brand when multiple could apply', () => {
    expect(matchBrand('Red Bull Energy Drink 250ml')).toBe('Red Bull')
  })

  it('returns null when no brand matches', () => {
    expect(matchBrand('No Name Energy Drink')).toBe(null)
  })
})

describe('filterByBrand', () => {
  it('keeps only products with a known brand', () => {
    const products = [
      { title: 'Red Bull Energy Drink 250ml' },
      { title: 'No Name Energy Drink' },
      { title: 'Monster Energy 500ml' },
    ]

    expect(filterByBrand(products)).toEqual([
      { title: 'Red Bull Energy Drink 250ml' },
      { title: 'Monster Energy 500ml' },
    ])
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterByBrand([{ title: 'No Name Energy Drink' }])).toEqual([])
  })

  it('returns an empty array for empty input', () => {
    expect(filterByBrand([])).toEqual([])
  })
})
