import * as cheerio from 'cheerio'
import {
  collectNutrientRows,
  extractPer100ml,
  nutrientNumber,
  parseNutrientValue,
} from './nutrition.js'

describe('parseNutrientValue', () => {
  it('kcal match', () => {
    const res = parseNutrientValue('43 kcal')
    expect(res).toBe(43)
  })

  it('kJ / kcal match takes the kcal value', () => {
    const res = parseNutrientValue('180 kJ / 43 kcal')
    expect(res).toBe(43)
  })

  it('grams with comma decimal', () => {
    const res = parseNutrientValue('10,5 g')
    expect(res).toBe(10.5)
  })

  it('milligrams', () => {
    const res = parseNutrientValue('32 mg')
    expect(res).toBe(32)
  })

  it('value without unit', () => {
    const res = parseNutrientValue('43')
    expect(res).toBe(43)
  })

  it('empty input', () => {
    const res = parseNutrientValue('')
    expect(res).toBe(null)
  })

  it('string does not match regex', () => {
    const res = parseNutrientValue('67 liters')
    expect(res).toBe(null)
  })
})

describe('extractPer100ml', () => {
  it('finds mg per 100ml right after the nutrient name', () => {
    const res = extractPer100ml('Koffein 32 mg / 100 ml', 'Koffein')
    expect(res).toBe(32)
  })

  it('matches case-insensitively', () => {
    const res = extractPer100ml('koffein 32 mg / 100 ml', 'Koffein')
    expect(res).toBe(32)
  })

  it('handles comma decimal values', () => {
    const res = extractPer100ml('Taurin 40,5mg/100ml', 'Taurin')
    expect(res).toBe(40.5)
  })

  it('skips text between the name and the number', () => {
    const res = extractPer100ml('Koffein: enthält 32 mg / 100 ml', 'Koffein')
    expect(res).toBe(32)
  })

  it('returns null when the nutrient name is not found', () => {
    const res = extractPer100ml('Taurin 40 mg / 100 ml', 'Koffein')
    expect(res).toBe(null)
  })

  it('returns null when the mg/100ml pattern is missing', () => {
    const res = extractPer100ml('Koffein 32 mg', 'Koffein')
    expect(res).toBe(null)
  })
})

describe('collectNutrientRows', () => {
  it('reads th/td rows (Edeka style)', () => {
    const html = `
      <table>
        <tr><th>Brennwert</th><td>180 kJ / 43 kcal</td></tr>
        <tr><th>Koffein</th><td>32 mg</td></tr>
      </table>
    `
    const $ = cheerio.load(html)
    const rows = collectNutrientRows($, 'tr', 'th', 'td')

    expect(rows).toEqual({
      brennwert: '180 kJ / 43 kcal',
      koffein: '32 mg',
    })
  })

  it('reads two td columns (Aldi style)', () => {
    const html = `
      <table>
        <tr><td>Zucker</td><td>10,5 g</td></tr>
      </table>
    `
    const $ = cheerio.load(html)
    const rows = collectNutrientRows($, 'tr', 'td', 'td')

    expect(rows).toEqual({ zucker: '10,5 g' })
  })

  it('lowercases labels and trims whitespace', () => {
    const html = `<table><tr><th>  Taurin  </th><td>  40 mg  </td></tr></table>`
    const $ = cheerio.load(html)
    const rows = collectNutrientRows($, 'tr', 'th', 'td')

    expect(rows).toEqual({ taurin: '40 mg' })
  })

  it('skips rows with an empty label', () => {
    const html = `<table><tr><th></th><td>40 mg</td></tr></table>`
    const $ = cheerio.load(html)
    const rows = collectNutrientRows($, 'tr', 'th', 'td')

    expect(rows).toEqual({})
  })

  it('returns an empty object when no rows match', () => {
    const $ = cheerio.load('<table></table>')
    const rows = collectNutrientRows($, 'tr', 'th', 'td')

    expect(rows).toEqual({})
  })
})

describe('nutrientNumber', () => {
  const nutrients = { koffein: '32 mg', zucker: '10,5 g' }

  it('parses the value for a known label', () => {
    expect(nutrientNumber(nutrients, 'koffein')).toBe(32)
  })

  it('is case-insensitive on the label', () => {
    expect(nutrientNumber(nutrients, 'Koffein')).toBe(32)
  })

  it('returns null for a missing label', () => {
    expect(nutrientNumber(nutrients, 'taurin')).toBe(null)
  })
})
