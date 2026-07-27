import type * as cheerio from "cheerio";

export function parseNutrientValue(text: string): number | null {
  // "180 kJ / 43 kcal" -> 43, "10,5 g" -> 10.5, "32 mg" -> 32
  const match = text.match(/([\d,]+)\s*(?:kcal|g|mg)?\s*$/);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

/**
 * Sucht z.B. "Koffein" gefolgt (irgendwo in der Naehe) von einer Zahl + "mg" + "/100 ml".
 */
export function extractPer100ml(
  text: string,
  nutrientName: string,
): number | null {
  const regex = new RegExp(
    `${nutrientName}[^\\d]*?([\\d,]+)\\s*mg\\s*/\\s*100\\s*ml`,
    "i", // case-insensitive
  );
  const match = text.match(regex);
  return match?.[1] ? Number(match[1].replace(",", ".")) : null;
}

/**
 * Liest eine Naehrwert-Tabelle in ein Objekt { label(lowercase): wert }.
 * Edeka nutzt th/td, Aldi zwei td-Spalten - deshalb sind die Selektoren konfigurierbar.
 */
export function collectNutrientRows(
  $: cheerio.CheerioAPI,
  rowSelector: string,
  labelSelector: string,
  valueSelector: string,
): Record<string, string> {
  const nutrients: Record<string, string> = {};

  $(rowSelector).each((_i, el) => {
    const $el = $(el);
    const label = $el.find(labelSelector).first().text().trim().toLowerCase();
    const value = $el.find(valueSelector).last().text().trim();
    if (label) nutrients[label] = value;
  });

  return nutrients;
}

/** Wert aus der Tabelle holen und direkt in eine Zahl umwandeln. */
export function nutrientNumber(
  nutrients: Record<string, string>,
  label: string,
): number | null {
  const value = nutrients[label.toLowerCase()];
  return value ? parseNutrientValue(value) : null;
}
