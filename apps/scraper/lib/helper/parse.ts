/** "1,49 €" -> 1.49, "(5,96 €/1 l)" -> 5.96, "0,25 l" -> 0.25 */
export function parseGermanNumber(text: string): number | null {
  const match = text.match(/(\d+,\d+|\d+)/)
  return match?.[1] ? Number(match[1].replace(',', '.')) : null
}

/** Like parseGermanNumber, but 0 instead of null - for fields that always need a number. */
export function parseGermanPrice(text: string): number {
  return parseGermanNumber(text) ?? 0
}

/** Price + unit price -> can size in ml (e.g. 1,49 € at 5,96 €/l -> 250 ml) */
export function canSizeFromPrices(price: number, pricePerLiter: number | null): number | null {
  if (!pricePerLiter) return null
  return Math.round((price / pricePerLiter) * 1000)
}

/** "Red Bull Energy Drink 250ml" -> "red-bull-energy-drink-250ml" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
