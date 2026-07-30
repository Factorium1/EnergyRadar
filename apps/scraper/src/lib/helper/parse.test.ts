import { canSizeFromPrices, parseGermanNumber, parseGermanPrice, slugify } from './parse.js'

describe('parseGermanNumber', () => {
  it('parses a plain price', () => {
    expect(parseGermanNumber('1,49 €')).toBe(1.49)
  })

  it('parses a price per liter in parentheses', () => {
    expect(parseGermanNumber('(5,96 €/1 l)')).toBe(5.96)
  })

  it('parses a volume', () => {
    expect(parseGermanNumber('0,25 l')).toBe(0.25)
  })

  it('parses an integer without a comma', () => {
    expect(parseGermanNumber('43')).toBe(43)
  })

  it('returns null when there is no number', () => {
    expect(parseGermanNumber('kein Preis')).toBe(null)
  })

  it('returns null for an empty string', () => {
    expect(parseGermanNumber('')).toBe(null)
  })
})

describe('parseGermanPrice', () => {
  it('parses a plain price', () => {
    expect(parseGermanPrice('1,49 €')).toBe(1.49)
  })

  it('falls back to 0 when there is no number', () => {
    expect(parseGermanPrice('kein Preis')).toBe(0)
  })

  it('falls back to 0 for an empty string', () => {
    expect(parseGermanPrice('')).toBe(0)
  })
})

describe('canSizeFromPrices', () => {
  it('calculates the can size in ml', () => {
    expect(canSizeFromPrices(1.49, 5.96)).toBe(250)
  })

  it('returns null when pricePerLiter is null', () => {
    expect(canSizeFromPrices(1.49, null)).toBe(null)
  })

  it('returns null when pricePerLiter is 0', () => {
    expect(canSizeFromPrices(1.49, 0)).toBe(null)
  })

  it('rounds to the nearest ml', () => {
    expect(canSizeFromPrices(1, 3)).toBe(333)
  })
})

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Red Bull Energy Drink 250ml')).toBe('red-bull-energy-drink-250ml')
  })

  it('strips accents', () => {
    expect(slugify('Gönrgy')).toBe('gonrgy')
  })

  it('collapses repeated non-alphanumeric characters', () => {
    expect(slugify('Foo  --  Bar!!')).toBe('foo-bar')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  !Foo Bar! ')).toBe('foo-bar')
  })

  it('handles an empty string', () => {
    expect(slugify('')).toBe('')
  })
})
