/** "1,49 €" -> 1.49, "(5,96 €/1 l)" -> 5.96, "0,25 l" -> 0.25 */
export function parseGermanNumber(text: string): number | null {
  const match = text.match(/(\d+,\d+|\d+)/);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

/** Wie parseGermanNumber, aber 0 statt null - fuer Felder die immer eine Zahl brauchen. */
export function parseGermanPrice(text: string): number {
  return parseGermanNumber(text) ?? 0;
}

/** Preis + Grundpreis -> Dosengroesse in ml (z.B. 1,49 € bei 5,96 €/l -> 250 ml) */
export function canSizeFromPrices(
  price: number,
  pricePerLiter: number | null,
): number | null {
  if (!pricePerLiter) return null;
  return Math.round((price / pricePerLiter) * 1000);
}

/** "Red Bull Energy Drink 250ml" -> "red-bull-energy-drink-250ml" */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
