export const brands = [
  'Red Bull',
  'Monster',
  'Effect',
  'Gönrgy',
  'Rockstar',
  'Celsius',
  'Reign',
  'Flying Power',
]

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, '')
}

export function isKnownBrand(title: string): boolean {
  const normalizedTitle = normalize(title)
  return brands.some((brand) => normalizedTitle.includes(normalize(brand)))
}

/** Finds the known brand contained in the title, or null. */
export function matchBrand(title: string): string | null {
  const normalizedTitle = normalize(title)
  return brands.find((brand) => normalizedTitle.includes(normalize(brand))) ?? null
}

/** Keeps only products whose title contains a known brand. */
export function filterByBrand<T extends { title: string }>(products: T[]): T[] {
  return products.filter((product) => isKnownBrand(product.title))
}
