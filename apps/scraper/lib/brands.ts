export const brands = [
  "Red Bull",
  "Monster",
  "Effect",
  "Gönrgy",
  "Rockstar",
  "Celsius",
  "Reign",
  "Flying Power",
];

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

export function isKnownBrand(title: string): boolean {
  const normalizedTitle = normalize(title);
  return brands.some((brand) => normalizedTitle.includes(normalize(brand)));
}

/** Behaelt nur Produkte, deren Titel eine bekannte Marke enthaelt. */
export function filterByBrand<T extends { title: string }>(products: T[]): T[] {
  return products.filter((product) => isKnownBrand(product.title));
}
